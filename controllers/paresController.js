// controllers/paresController.js

const db = require('../db');

function normalize(text) {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
// GET /api/emparejamientos/:actividadId/multiple
// Devuelve todas las imágenes y las opciones (sin duplicados) + la respuesta correcta
exports.getMultiple = (req, res) => {
  const actividadId = req.params.actividadId;

  // 1) Opciones únicas
  const sqlOpts = `
    SELECT DISTINCT palabra
    FROM pares_emparejamiento
    WHERE actividad_id = ?
  `;
  db.query(sqlOpts, [actividadId], (err, optsRows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar opciones' });
    const opciones = optsRows.map(r => r.palabra);

    // 2) Todas las imágenes con su palabra
    const sqlQ = `
      SELECT id, imagen, palabra
      FROM pares_emparejamiento
      WHERE actividad_id = ?
      ORDER BY id
    `;
    db.query(sqlQ, [actividadId], (err2, qRows) => {
      if (err2) return res.status(500).json({ error: 'Error al cargar preguntas' });

      const questions = qRows.map(r => ({
        id: r.id,
        imagen: r.imagen,
        opciones,
        respuestaCorrecta: r.palabra
      }));
      res.json({ questions });
    });
  });
};

// GET /api/emparejamientos/:actividadId/fill
// Devuelve las imágenes y la palabra correcta para “rellenar”
exports.getFill = (req, res) => {
  const actividadId = req.params.actividadId;
  const sql = `
    SELECT id, imagen, palabra
    FROM pares_emparejamiento
    WHERE actividad_id = ?
    ORDER BY id
  `;
  db.query(sql, [actividadId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar preguntas' });
    res.json({ questions: rows.map(r => ({
      id: r.id,
      imagen: r.imagen,
      respuestaCorrecta: r.palabra
    })) });
  });
};

//POST /api/emparejamientos/:actividadId/attempts
// Guarda un intento normal, maneja emparejamientos_falladas
exports.submitAttempt = (req, res) => {
  const actividadId      = req.params.actividadId;
  const usuarioId        = req.session.usuarioId;
  const { answers, duracionSegundos } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Formato de respuestas inválido' });
  }

  // 1) Crear intento
  const sqlInsAtt = `
    INSERT INTO emparejamiento_attempts
      (actividad_id, user_id, start_time, end_time, duracion_segundos, score, state)
    VALUES (?, ?, NOW(), NOW(), ?, 0, 'finished')
  `;
  db.query(sqlInsAtt, [actividadId, usuarioId, duracionSegundos], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear intento' });
    const attemptId = result.insertId;

    // 2) Leer respuestas correctas
    const pairIds = answers.map(a => a.pairId);
    const sqlCorrect = `
      SELECT id, palabra
      FROM pares_emparejamiento
      WHERE id IN (?)
    `;
    db.query(sqlCorrect, [pairIds], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'Error al consultar respuestas' });
      const correctMap = Object.fromEntries(rows.map(r => [r.id, r.palabra]));
      let aciertos = 0;

      // 3) Guardar respuestas del intento (normalizando antes de comparar)
      const answersData = answers.map(a => {
        const userNorm    = normalize(a.palabra);
        const correctNorm = normalize(correctMap[a.pairId]);
        const isCorrect   = userNorm === correctNorm ? 1 : 0;
        if (isCorrect) aciertos++;
        return [attemptId, a.pairId, a.palabra, isCorrect];
      });
      const sqlInsAns = `
        INSERT INTO emparejamiento_attempt_answers
          (attempt_id, pair_id, palabra, correct)
        VALUES ?
      `;
      db.query(sqlInsAns, [answersData], err3 => {
        if (err3) return res.status(500).json({ error: 'Error al guardar respuestas' });

        // 4) Actualizar puntuación en el intento
        const score = Math.round((aciertos / answers.length) * 100);
        const sqlUpdScore = `
          UPDATE emparejamiento_attempts
          SET score = ?
          WHERE id = ?
        `;
        db.query(sqlUpdScore, [score, attemptId], err4 => {
          if (err4) return res.status(500).json({ error: 'Error al actualizar score' });

          // 5) Banco de falladas: insertar las incorrectas, eliminar las ahora correctas
          const falladas  = [];
          const acertadas = [];
          answers.forEach(a => {
            const userNorm    = normalize(a.palabra);
            const correctNorm = normalize(correctMap[a.pairId]);
            if (userNorm === correctNorm) {
              acertadas.push(a.pairId);
            } else {
              falladas.push([usuarioId, actividadId, a.pairId]);
            }
          });

          if (falladas.length) {
            db.query(
              `INSERT IGNORE INTO emparejamientos_falladas
                 (usuario_id, emparejamiento_id, pair_id) VALUES ?`,
              [falladas],
              () => {}
            );
          }
          if (acertadas.length) {
            db.query(
              `DELETE FROM emparejamientos_falladas
                 WHERE usuario_id = ? AND emparejamiento_id = ? AND pair_id IN (?)`,
              [usuarioId, actividadId, acertadas],
              () => {}
            );
          }

          // 6) Devolver resultado al cliente
          res.json({ attemptId, score });
        });
      });
    });
  });
};
// GET /api/emparejamientos/:actividadId
// Devuelve los datos (nombre, descripción, ...) de la actividad
// controllers/paresController.js

// GET /api/emparejamientos/:actividadId
exports.getActividad = (req, res) => {
  const actividadId = req.params.actividadId;
  const sql = `
    SELECT nombre, descripcion
    FROM emparejamientos       /* ← aquí usamos la tabla correcta */
    WHERE id = ?
  `;
  db.query(sql, [actividadId], (err, rows) => {
    if (err) {
      console.error('getActividad error:', err);
      return res.status(500).json({ error: 'Error al cargar la actividad' });
    }
    if (!rows.length) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    res.json({
      nombre:      rows[0].nombre,
      descripcion: rows[0].descripcion
    });
  });
};


// GET /api/emparejamientos/:actividadId/attempts
// Lista los intentos del usuario para ese emparejamiento
exports.listAttempts = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const sql = `
    SELECT id, start_time, end_time, duracion_segundos, score
    FROM emparejamiento_attempts
    WHERE actividad_id = ? AND user_id = ?
    ORDER BY start_time DESC
  `;
  db.query(sql, [actividadId, usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al listar intentos' });
    res.json(rows);
  });
};

// GET /api/emparejamientos/attempts/:attemptId
// Detalle de un intento específico
exports.getAttemptDetail = (req, res) => {
  const attemptId = req.params.attemptId;
  const usuarioId = req.session.usuarioId;

  // Cabecera
  const sqlHead = `
    SELECT actividad_id, start_time, end_time, duracion_segundos, score
    FROM emparejamiento_attempts
    WHERE id = ? AND user_id = ?
  `;
  db.query(sqlHead, [attemptId, usuarioId], (err1, heads) => {
    if (err1) return res.status(500).json({ error: 'Error al leer intento' });
    if (!heads.length) return res.status(404).json({ error: 'Intento no encontrado' });
    const intento = heads[0];

    // Respuestas
    const sqlAns = `
      SELECT a.pair_id, a.palabra AS elegida, a.correct,
             p.imagen, p.palabra AS correcta
      FROM emparejamiento_attempt_answers a
      JOIN pares_emparejamiento p ON a.pair_id = p.id
      WHERE a.attempt_id = ?
    `;
    db.query(sqlAns, [attemptId], (err2, answers) => {
      if (err2) return res.status(500).json({ error: 'Error al leer respuestas' });
      res.json({ intento, answers });
    });
  });
};
// controllers/paresController.js

// GET /api/emparejamientos/:actividadId/falladas
exports.getFalladas = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const sql = `
    SELECT p.id           AS id,
           p.imagen       AS imagen,
           p.palabra      AS palabra
    FROM emparejamientos_falladas ef
    JOIN pares_emparejamiento p
      ON p.id = ef.pair_id
    WHERE ef.usuario_id = ?
      AND ef.emparejamiento_id = ?
    ORDER BY ef.id
  `;
  db.query(sql, [usuarioId, actividadId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar falladas' });
    // Ahora r.palabra existe
    const questions = rows.map(r => ({
      id: r.id,
      imagen: r.imagen,
      palabra: r.palabra
    }));
    res.json({ questions });
  });
};

// DELETE /api/emparejamientos/:actividadId/falladas?pairId=123
exports.deleteFallada = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const pairId      = req.query.pairId;
  if (!pairId) return res.status(400).json({ error: 'Falta pairId' });

  const sql = `
    DELETE FROM emparejamientos_falladas
    WHERE usuario_id = ? AND emparejamiento_id = ? AND pair_id = ?
  `;
  db.query(sql, [usuarioId, actividadId, pairId], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error eliminando fallada' });
    res.sendStatus(204);
  });
};

