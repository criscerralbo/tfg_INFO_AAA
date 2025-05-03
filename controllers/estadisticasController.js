// controllers/estadisticasController.js
// -------------------------------------
const ExcelJS = require('exceljs');
const db      = require('../db');
const q       = (sql, p = []) => db.promise().query(sql, p).then(r => r[0]);

/* ───────────────────────── utilidades ───────────────────── */
const EMPTY = [];                           // array inmutable
const card  = ({ id, titulo, total = 0, avgScore = 0, avgTime = 0 }) => ({
  id, titulo, totalIntentos: total, mediaScore: avgScore, mediaTime: avgTime
});

const unionMatchScores = (condAct, condAlum) => `
  SELECT score FROM emparejamiento_attempts
   WHERE ${condAct} AND state='finished' AND ${condAlum}
  UNION ALL
  SELECT score FROM emparejamiento_fill_attempts
   WHERE ${condAct} AND state='finished' AND ${condAlum}
`;

const unionMatchAttempts = (condAct, condAlum) => `
  SELECT score, duracion_segundos, start_time
    FROM emparejamiento_attempts
   WHERE ${condAct} AND state='finished' AND ${condAlum}
  UNION ALL
  SELECT score, duracion_segundos, start_time
    FROM emparejamiento_fill_attempts
   WHERE ${condAct} AND state='finished' AND ${condAlum}
`;

/* ────────────── función core: reúne todas las métricas ──── */
async function collectStats (grupoId, profId) {

  /* 1 · alumnos del grupo ------------------------------------------------ */
  const alumnos = await q(
    `SELECT usuario_id FROM grupo_miembros
      WHERE grupo_id=? AND estado='aprobado' AND rol_id=1`,
    [grupoId]
  );
  if (!alumnos.length) {                      // grupo vacío
    return {
      activos: 0, intentosTotales: 0, mediaGlobal: 0,
      actividad: EMPTY, topPreguntas: EMPTY,
      quizzes: EMPTY, emparejamientos: EMPTY,
      quizzesRaw: EMPTY, matchesRaw: EMPTY,
      inQuiz: '0', inMatch: '0', alumCond: '1=0'   // para re‑uso
    };
  }
  const alumIds  = alumnos.map(a => a.usuario_id);
  const alumCond = `user_id IN (${alumIds.join(',')})`;

  /* 2 · actividades asignadas al grupo (sin filtrar por profesor) -------- */  const quizzes = await q(
      `SELECT q.id, q.titulo
         FROM quizzes q
         JOIN quiz_asignaciones qa ON qa.id_quiz = q.id
        WHERE qa.id_grupo = ?`,
      [grupoId]
    );
    const matches = await q(
      `SELECT e.id, e.nombre AS titulo
         FROM emparejamientos e
         JOIN emparejamientos_asignaciones ea ON ea.id_emparejamiento = e.id
        WHERE ea.id_grupo = ?`,
      [grupoId]
    );
   
     const inQuiz  = quizzes.length ? quizzes.map(q => q.id).join(',') : '0';
     const inMatch = matches.length ? matches.map(m => m.id).join(',') : '0';
  /* 3 · stats por tarjeta ---------------------------------------------- */
  const quizStats = await Promise.all(
    quizzes.map(async qz => {
      const [s] = await q(
        `SELECT COUNT(*) total,
                ROUND(AVG(score),1)            avgScore,
                ROUND(AVG(duracion_segundos),0) avgTime
           FROM quiz_attempts
          WHERE quiz_id=? AND state='finished' AND ${alumCond}`, [qz.id]);
      return card({ ...qz, ...s });
    })
  );

  const matchStats = await Promise.all(
    matches.map(async em => {
      const [s] = await q(
        `SELECT COUNT(*) total,
                ROUND(AVG(score),1)            avgScore,
                ROUND(AVG(duracion_segundos),0) avgTime
           FROM (${unionMatchAttempts(`actividad_id=${em.id}`, alumCond)}) a`);
      return card({ ...em, ...s });
    })
  );

  /* 4 · métricas globales ---------------------------------------------- */
  const [glob] = await q(
    `SELECT ROUND(AVG(score),1) media FROM (
       SELECT score FROM quiz_attempts
        WHERE quiz_id IN (${inQuiz}) AND state='finished' AND ${alumCond}
       UNION ALL
       ${unionMatchScores(`actividad_id IN (${inMatch})`, alumCond)}
     ) z`
  );

  const [tot] = await q(
    `SELECT COUNT(*) n FROM (
       SELECT id FROM quiz_attempts
        WHERE quiz_id IN (${inQuiz}) AND ${alumCond}
       UNION ALL
       SELECT id FROM emparejamiento_attempts
        WHERE actividad_id IN (${inMatch}) AND ${alumCond}
       UNION ALL
       SELECT id FROM emparejamiento_fill_attempts
        WHERE actividad_id IN (${inMatch}) AND ${alumCond}
     ) t`
  );

  /* 5 · actividad últimos 30 d ---------------------------------------- */
  const actividad = await q(
    `SELECT DATE(start_time) dia, COUNT(*) intentos FROM (
       SELECT start_time FROM quiz_attempts
        WHERE quiz_id IN (${inQuiz}) AND ${alumCond}
       UNION ALL
       SELECT start_time FROM emparejamiento_attempts
        WHERE actividad_id IN (${inMatch}) AND ${alumCond}
       UNION ALL
       SELECT start_time FROM emparejamiento_fill_attempts
        WHERE actividad_id IN (${inMatch}) AND ${alumCond}
     ) a
     WHERE start_time >= CURDATE() - INTERVAL 30 DAY
     GROUP BY dia ORDER BY dia`
  );

  /* 6 · top preguntas (solo si hay quizzes) ---------------------------- */
  const topPreguntas = quizzes.length ? await q(
    `SELECT p.id, p.texto,
            SUM(qa.correct = 0)/COUNT(*) ratio_error
       FROM preguntas p
       JOIN quiz_attempt_answers qa ON qa.question_id=p.id
       JOIN quiz_attempts at ON at.id=qa.attempt_id
      WHERE at.quiz_id IN (${inQuiz}) AND at.state='finished' AND ${alumCond}
      GROUP BY p.id
      HAVING COUNT(*)>0
      ORDER BY ratio_error DESC
      LIMIT 10`
  ) : EMPTY;
  const distribucionNotas = await q(
    `SELECT 
       CONCAT(FLOOR(score/10)*10,'-',FLOOR(score/10)*10+9) AS tramo,
       COUNT(*) AS n
     FROM (
       SELECT score FROM quiz_attempts
        WHERE quiz_id IN (${inQuiz}) AND state='finished' AND ${alumCond}
       UNION ALL
       ${unionMatchScores(`actividad_id IN (${inMatch})`, alumCond)}
     ) z
     GROUP BY FLOOR(score/10)
     ORDER BY FLOOR(score/10)`
  );

  /* ---- resultado completo para reutilizar en los exports ---- */
  return {
    activos: alumnos.length,
    intentosTotales: tot.n,
    mediaGlobal: glob.media || 0,
    actividad,
    topPreguntas,
    distribucionNotas,      // quitada de la UI
    quizzes: quizStats,
    emparejamientos: matchStats,

    /* crudos / refs (para otros métodos) */
    quizzesRaw: quizzes,
    matchesRaw: matches,
    inQuiz, inMatch, alumCond
  };
}

/* ─────────────────────────── RUTA 1: JSON pantalla ─────── */
exports.getGroupStats = async (req, res) => {
  try {
    const data = await collectStats(req.params.grupoId, req.session.usuarioId);
    res.json(data);
  } catch (e) {
    console.error('getGroupStats →', e);
    res.status(500).json({ error:'Error al obtener estadísticas' });
  }
};

/* ──────────────────── RUTA 2: Excel de resumen ──────────── */
exports.exportGroupStatsExcel = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const data = await collectStats(grupoId, req.session.usuarioId);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ODON-App';
    wb.created = new Date();

    // ─── HOJA Resumen ────────────────────────────────────────
    const wsResumen = wb.addWorksheet('Resumen');
    wsResumen.addRow(['Alumnos activos',   data.activos]);
    wsResumen.addRow(['Intentos totales',  data.intentosTotales]);
    wsResumen.addRow(['Media global (%)',  data.mediaGlobal]);

    // ─── HOJA Quizzes ───────────────────────────────────────
    const hQuiz = wb.addWorksheet('Quizzes');
    hQuiz.columns = [
      { header: 'ID',               key: 'id',            width: 9  },
      { header: 'Título',           key: 'titulo',        width: 40 },
      { header: 'Intentos',         key: 'totalIntentos', width: 11 },
      { header: 'Media %',          key: 'mediaScore',    width: 10 },
      { header: 'Tiempo medio (s)', key: 'mediaTime',     width: 17 }
    ];
    // rellenamos con los objetos de data.quizzes
    hQuiz.addRows(data.quizzes);

    // ─── HOJA Emparejamientos ───────────────────────────────
    const hMatch = wb.addWorksheet('Emparejamientos');
    // mismas keys que Quizzes
    hMatch.columns = hQuiz.columns;
    hMatch.addRows(data.emparejamientos);

    // ─── HOJA Actividad30d ──────────────────────────────────
    const hAct = wb.addWorksheet('Actividad30d');
    hAct.columns = [
      { header: 'Día',      key: 'dia',     width: 14 },
      { header: 'Intentos', key: 'intentos',width: 11 }
    ];
    hAct.addRows(data.actividad);

    // ─── HOJA TopPreguntasFalladas ─────────────────────────
    const hTop = wb.addWorksheet('TopPreguntasFalladas');
    hTop.columns = [
      { header: 'Pregunta ID', key: 'id',          width: 12 },
      { header: 'Texto',       key: 'texto',       width: 70 },
      { header: 'Ratio error', key: 'ratio_error', width: 13 }
    ];
    hTop.addRows(data.topPreguntas);

    // ─── Enviamos el fichero al cliente ────────────────────
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=estadisticas_grupo_${grupoId}.xlsx`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    await wb.xlsx.write(res);
    res.end();

  } catch (e) {
    console.error('exportGroupStatsExcel →', e);
    res.status(500).json({ error: 'Error al generar el Excel' });
  }
};
//─────────────── RUTA 3: Excel detalle intentos ────────── */
exports.exportGroupAttemptsExcel = async (req, res) => {
  try {
    const { grupoId } = req.params;
    const ctx = await collectStats(grupoId, req.session.usuarioId);

    // Si no hay actividades asignadas, devolvemos 400
    if (!ctx.quizzesRaw.length && !ctx.matchesRaw.length) {
      return res.status(400).json({ error: 'No hay actividades asignadas' });
    }

    // Traemos los intentos junto al email del alumno y nombre de la actividad
    const attempts = await q(`
      SELECT
        a.attemptId,
        a.user_id                    AS alumnoId,
        u.email                      AS alumnoEmail,
        a.tipo,
        a.actividadId,
        CASE WHEN a.tipo = 'quiz' THEN q.titulo
             ELSE e.nombre END        AS actividadNombre,
        a.score,
        a.duracion_segundos         AS tiempoSegundos,
        DATE(a.start_time)          AS fechaInicio
      FROM (
        SELECT
          id               AS attemptId,
          user_id,
          'quiz'           AS tipo,
          quiz_id          AS actividadId,
          score,
          duracion_segundos,
          start_time
        FROM quiz_attempts
        WHERE quiz_id     IN (${ctx.inQuiz})
          AND state        = 'finished'
          AND ${ctx.alumCond}

        UNION ALL

        SELECT
          id,
          user_id,
          'match_multiple' AS tipo,
          actividad_id     AS actividadId,
          score,
          duracion_segundos,
          start_time
        FROM emparejamiento_attempts
        WHERE actividad_id IN (${ctx.inMatch})
          AND state        = 'finished'
          AND ${ctx.alumCond}

        UNION ALL

        SELECT
          id,
          user_id,
          'match_fill'     AS tipo,
          actividad_id     AS actividadId,
          score,
          duracion_segundos,
          start_time
        FROM emparejamiento_fill_attempts
        WHERE actividad_id IN (${ctx.inMatch})
          AND state        = 'finished'
          AND ${ctx.alumCond}
      ) AS a
      LEFT JOIN usuarios u ON u.id = a.user_id
      LEFT JOIN quizzes q ON q.id = a.actividadId
      LEFT JOIN emparejamientos e ON e.id = a.actividadId
      ORDER BY a.user_id, a.actividadId, a.start_time
    `);

    // Construcción del Excel
    const wb = new ExcelJS.Workbook();
    wb.creator = 'ODON-App';
    wb.created = new Date();

    const ws = wb.addWorksheet('DetalleIntentos');
    ws.columns = [
      { header: 'Attempt ID',        width: 12 },
      { header: 'Alumno ID',         width: 11 },
      { header: 'Email alumno',      width: 30 },
      { header: 'Tipo',              width: 15 },
      { header: 'Actividad ID',      width: 13 },
      { header: 'Actividad nombre',  width: 40 },
      { header: 'Score',             width: 8  },
      { header: 'Tiempo (s)',        width: 11 },
      { header: 'Fecha inicio',      width: 14 }
    ];

    attempts.forEach(r => {
      ws.addRow([
        r.attemptId,
        r.alumnoId,
        r.alumnoEmail,
        r.tipo,
        r.actividadId,
        r.actividadNombre,
        r.score,
        r.tiempoSegundos,
        r.fechaInicio
      ]);
    });

    res.setHeader(
      'Content-Disposition',
      `attachment; filename=intentos_grupo_${grupoId}.xlsx`
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );

    await wb.xlsx.write(res);
    res.end();

  } catch (e) {
    console.error('exportGroupAttemptsExcel →', e);
    res.status(500).json({ error: 'Error al generar el Excel' });
  }
};

