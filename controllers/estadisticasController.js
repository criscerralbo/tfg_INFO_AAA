// controllers/estadisticasController.js
// -------------------------------------
const db = require('../db');
const q  = (sql, p = []) => db.promise().query(sql, p).then(r => r[0]);

exports.getGroupStats = async (req, res) => {
  const { grupoId } = req.params;
  const profId      = req.session.usuarioId;

  try {
    /* 0 ─ permiso: ¿tiene algo asignado el profesor? */
    const [perm] = await q(
      `SELECT COUNT(*) AS n FROM (
         SELECT 1 FROM quiz_asignaciones
          WHERE id_grupo=? AND id_profesor=?
         UNION ALL
         SELECT 1 FROM emparejamientos_asignaciones
          WHERE id_grupo=? AND id_profesor=?
       ) x`,
      [grupoId, profId, grupoId, profId]
    );
    if (!perm.n)
      return res.status(403).json({ error: 'No tienes asignaciones en este grupo' });

    /* 1 ─ alumnos aprobados */
    const alumnos   = await q(
      `SELECT usuario_id FROM grupo_miembros
        WHERE grupo_id=? AND estado='aprobado' AND rol_id=1`,
      [grupoId]
    );
    const alumIds   = alumnos.map(r => r.usuario_id);
    const inAlum    = alumIds.length ? alumIds.join(',') : 'NULL';
    const activos   = alumIds.length;                       // nº alumnos

    /* 2 ─ quizzes / emparejamientos asignados */
    const quizzes = await q(
      `SELECT q.id, q.titulo
         FROM quizzes q
         JOIN quiz_asignaciones qa ON qa.id_quiz=q.id
        WHERE qa.id_grupo=? AND qa.id_profesor=?`,
      [grupoId, profId]
    );
    const matches = await q(
      `SELECT e.id, e.nombre AS titulo
         FROM emparejamientos e
         JOIN emparejamientos_asignaciones ea ON ea.id_emparejamiento=e.id
        WHERE ea.id_grupo=? AND ea.id_profesor=?`,
      [grupoId, profId]
    );
    const idsQuiz  = quizzes.map(o => o.id);
    const idsMatch = matches.map(o => o.id);
    const inQuiz   = idsQuiz .length ? idsQuiz .join(',')  : 'NULL';
    const inMatch  = idsMatch.length ? idsMatch.join(',') : 'NULL';

    /* util para cada tarjeta ---------------*/
    const card = ({ id, titulo, total = 0, avgScore = 0, avgTime = 0 }) => ({
      id, titulo,
      totalIntentos: total,
      mediaScore:    avgScore,
      mediaTime:     avgTime
    });

    /* 3 ─ tarjetas QUIZ */
    const quizStats = await Promise.all(
      quizzes.map(async qz => {
        const [s] = await q(
          `SELECT COUNT(*) total,
                  ROUND(AVG(score),1)            avgScore,
                  ROUND(AVG(duracion_segundos),0) avgTime
             FROM quiz_attempts
            WHERE quiz_id=? AND state='finished' AND user_id IN (${inAlum})`,
          [qz.id]
        );
        return card({ ...qz, ...s });
      })
    );

    /* 4 ─ tarjetas EMPAREJAMIENTO */
    const matchStats = await Promise.all(
      matches.map(async em => {
        const [s] = await q(
          `SELECT COUNT(*) total,
                  ROUND(AVG(score),1)            avgScore,
                  ROUND(AVG(duracion_segundos),0) avgTime
             FROM emparejamiento_attempts
            WHERE actividad_id=? AND state='finished' AND user_id IN (${inAlum})`,
          [em.id]
        );
        return card({ ...em, ...s });
      })
    );

    /* 5 ─ métricas globales */
    const [glob] = await q(
      `SELECT ROUND(AVG(score),1) AS media
         FROM (
           SELECT score FROM quiz_attempts
            WHERE quiz_id IN (${inQuiz})     AND state='finished' AND user_id IN (${inAlum})
           UNION ALL
           SELECT score FROM emparejamiento_attempts
            WHERE actividad_id IN (${inMatch}) AND state='finished' AND user_id IN (${inAlum})
         ) z`
    );
    const mediaGlobal = glob.media || 0;

    const [tot] = await q(
      `SELECT COUNT(*) AS n
         FROM (
           SELECT id FROM quiz_attempts
            WHERE quiz_id IN (${inQuiz})     AND user_id IN (${inAlum})
           UNION ALL
           SELECT id FROM emparejamiento_attempts
            WHERE actividad_id IN (${inMatch}) AND user_id IN (${inAlum})
         ) t`
    );
    const intentosTotales = tot.n;

    /* 6 ─ actividad 30 días */
    const actividad = await q(
      `SELECT DATE(start_time) dia, COUNT(*) intentos
         FROM (
           SELECT start_time FROM quiz_attempts
            WHERE quiz_id IN (${inQuiz})     AND user_id IN (${inAlum})
           UNION ALL
           SELECT start_time FROM emparejamiento_attempts
            WHERE actividad_id IN (${inMatch}) AND user_id IN (${inAlum})
         ) a
        WHERE start_time >= CURDATE() - INTERVAL 30 DAY
        GROUP BY dia ORDER BY dia`
    );

    /* 7 ─ distribución de notas */
    const distribucionNotas = await q(
      `SELECT rango, COUNT(*) n FROM (
         SELECT FLOOR(score/10)*10 AS rango
           FROM (
             SELECT score FROM quiz_attempts
              WHERE quiz_id IN (${inQuiz})     AND state='finished' AND user_id IN (${inAlum})
             UNION ALL
             SELECT score FROM emparejamiento_attempts
              WHERE actividad_id IN (${inMatch}) AND state='finished' AND user_id IN (${inAlum})
           ) s
       ) b
       GROUP BY rango ORDER BY rango`
    );

    /* 8 ─ top preguntas falladas */
    const topPreguntas = await q(
      `SELECT p.id, p.texto,
              SUM(qa.correct = 0)/COUNT(*) AS ratio_error
         FROM preguntas p
         JOIN quiz_attempt_answers qa ON qa.question_id = p.id
         JOIN quiz_attempts       at ON at.id = qa.attempt_id
        WHERE at.quiz_id IN (${inQuiz})
          AND at.state   = 'finished'
          AND at.user_id IN (${inAlum})
        GROUP BY p.id
        HAVING COUNT(*) > 0
        ORDER BY ratio_error DESC
        LIMIT 10`
    );

    /* 9 ─ respuesta */
    res.json({
      activos,
      intentosTotales,
      mediaGlobal,
      actividad,
      distribucionNotas,
      topPreguntas,
      quizzes:         quizStats,
      emparejamientos: matchStats
    });

  } catch (err) {
    console.error('getGroupStats error →', err);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};
