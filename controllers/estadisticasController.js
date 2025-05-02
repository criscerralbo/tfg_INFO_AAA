const db = require('../db');

exports.getGroupStats = async (req, res) => {
  const { grupoId } = req.params;
  const profId      = req.session.usuarioId;

  try {
    // 1) Validar que el prof. tiene al menos un quiz o emparejamiento en el grupo
    const [[hasAny]] = await db.promise().query(
      `SELECT 
         (SELECT COUNT(*) 
            FROM quiz_asignaciones 
           WHERE id_grupo=? AND id_profesor=?
         ) +
         (SELECT COUNT(*) 
            FROM emparejamientos_asignaciones 
           WHERE id_grupo=? AND id_profesor=?
         ) AS total`,
      [grupoId, profId, grupoId, profId]
    );
    if (hasAny.total === 0) {
      return res.status(403).json({ error: 'No tienes asignado nada en este grupo.' });
    }

    // 2) Listar quizzes asignados
    const [quizzes] = await db.promise().query(
      `SELECT q.id, q.titulo
         FROM quizzes q
         JOIN quiz_asignaciones qa
           ON qa.id_quiz=q.id
        WHERE qa.id_grupo=? AND qa.id_profesor=?`,
      [grupoId, profId]
    );

    // 3) Listar emparejamientos asignados
    const [matches] = await db.promise().query(
      `SELECT e.id, e.nombre AS titulo
         FROM emparejamientos e
         JOIN emparejamientos_asignaciones ea
           ON ea.id_emparejamiento=e.id
        WHERE ea.id_grupo=? AND ea.id_profesor=?`,
      [grupoId, profId]
    );

    // 4) Para cada quiz, calcular estadísticas
    const quizStats = await Promise.all(quizzes.map(async q => {
      const [[sum]] = await db.promise().query(
        `SELECT
           COUNT(*)            AS total,
           ROUND(AVG(score),2) AS avgScore,
           ROUND(AVG(duracion_segundos),0) AS avgTime
         FROM quiz_attempts
         WHERE quiz_id=? AND state='finished'`,
        [q.id]
      );
      return {
        id:           q.id,
        titulo:       q.titulo,
        totalIntentos: sum.total || 0,
        mediaScore:   sum.avgScore || 0,
        mediaTime:    sum.avgTime || 0
      };
    }));

    // 5) Para cada emparejamiento, estadísticas
    const matchStats = await Promise.all(matches.map(async m => {
      const [[sum]] = await db.promise().query(
        `SELECT
           COUNT(*)            AS total,
           ROUND(AVG(score),2) AS avgScore,
           ROUND(AVG(duracion_segundos),0) AS avgTime
         FROM emparejamiento_attempts
         WHERE actividad_id=? AND state='finished'`,
        [m.id]
      );
      return {
        id:             m.id,
        titulo:         m.titulo,
        totalIntentos:  sum.total || 0,
        mediaScore:     sum.avgScore || 0,
        mediaTime:      sum.avgTime || 0
      };
    }));

    res.json({
      quizzes:        quizStats,
      emparejamientos: matchStats
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener estadísticas de grupo' });
  }
};
