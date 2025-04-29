const db = require('../db');
// helpers dentro de este archivo:
function normalizeText(str) {
  return str
    .normalize('NFD')                   // Separar letras de acentos
    .replace(/[\u0300-\u036f]/g, '')    // Eliminar marcas diacríticas
    .trim()                             // Quitar espacios al inicio/fin
    .toLowerCase();                     // Minúsculas
}

// GET /api/emparejamientos/:actividadId/fill
// Devuelve todas las imágenes y la palabra correcta
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
    res.json({
      questions: rows.map(r => ({
        id: r.id,
        imagen: r.imagen,
        respuestaCorrecta: r.palabra
      }))
    });
  });
};

// POST /api/emparejamientos/:actividadId/fill/attempts
// Guarda un intento de fill (con banco de falladas)
exports.submitFillAttempt = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const { answers, duracionSegundos } = req.body;

  if (!Array.isArray(answers)) {
    return res.status(400).json({ error: 'Formato de respuestas inválido' });
  }

  // 1) Insertar intento
  const sqlIns = `
    INSERT INTO emparejamiento_fill_attempts
      (actividad_id, user_id, start_time, end_time, duracion_segundos, score, state)
    VALUES (?, ?, NOW(), NOW(), ?, 0, 'finished')
  `;
  db.query(sqlIns, [actividadId, usuarioId, duracionSegundos], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear intento' });
    const attemptId = result.insertId;

    // 2) Leemos las palabras correctas de todos los pairId
    const pairIds = answers.map(a => a.pairId);
    const sqlCorr = `
      SELECT id, palabra
      FROM pares_emparejamiento
      WHERE id IN (?)
    `;
    db.query(sqlCorr, [pairIds], (err2, rows) => {
      if (err2) return res.status(500).json({ error: 'Error al consultar respuestas' });
      const correctMap = Object.fromEntries(rows.map(r => [r.id, r.palabra]));
      let aciertos = 0;

      // 3) Insertar cada respuesta
      const ansData = answers.map(a => {
        const correctRaw = correctMap[a.pairId];
        const userRaw    = a.respuesta;
        const ok = normalizeText(correctRaw) === normalizeText(userRaw);
        if (ok) aciertos++;
        return [attemptId, a.pairId, a.respuesta, ok ? 1 : 0];
      });
      const sqlInsAns = `
        INSERT INTO emparejamiento_fill_attempt_answers
          (attempt_id, pair_id, respuesta, correct)
        VALUES ?
      `;
      db.query(sqlInsAns, [ansData], err3 => {
        if (err3) return res.status(500).json({ error: 'Error al guardar respuestas' });

        // 4) Actualizar score
        const score = Math.round((aciertos / answers.length) * 100);
        const sqlUpd = `UPDATE emparejamiento_fill_attempts SET score = ? WHERE id = ?`;
        db.query(sqlUpd, [score, attemptId], err4 => {
          if (err4) return res.status(500).json({ error: 'Error al actualizar score' });

          // 5) Banco de falladas
          const toInsert = [], toDelete = [];
          answers.forEach(a => {
            if ( normalizeText(correctMap[a.pairId]) === normalizeText(a.respuesta) ) {
              toDelete.push(a.pairId);
            } else {
              toInsert.push([usuarioId, actividadId, a.pairId]);
            }
          });

          if (toInsert.length) {
            db.query(
              `INSERT IGNORE INTO emparejamientos_fill_falladas
                 (usuario_id, emparejamiento_id, pair_id) VALUES ?`,
              [toInsert], () => {}
            );
          }
          if (toDelete.length) {
            db.query(
              `DELETE FROM emparejamientos_fill_falladas
                 WHERE usuario_id = ? AND emparejamiento_id = ? AND pair_id IN (?)`,
              [usuarioId, actividadId, toDelete], () => {}
            );
          }

          res.json({ attemptId, score });
        });
      });
    });
  });
};

// GET /api/emparejamientos/:actividadId/fill/attempts
exports.listFillAttempts = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const sql = `
    SELECT id, start_time, duracion_segundos, score
    FROM emparejamiento_fill_attempts
    WHERE actividad_id = ? AND user_id = ?
    ORDER BY start_time DESC
  `;
  db.query(sql, [actividadId, usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error listando intentos' });
    res.json(rows);
  });
};

// GET /api/emparejamientos/fill/attempts/:attemptId
exports.getFillAttemptDetail = (req, res) => {
  const attemptId = req.params.attemptId;
  const usuarioId = req.session.usuarioId;
  const sqlHead = `
    SELECT actividad_id, start_time, duracion_segundos, score
    FROM emparejamiento_fill_attempts
    WHERE id = ? AND user_id = ?
  `;
  db.query(sqlHead, [attemptId, usuarioId], (err1, heads) => {
    if (err1) return res.status(500).json({ error: 'Error leyendo intento' });
    if (!heads.length) return res.status(404).json({ error: 'Intento no encontrado' });
    const intento = heads[0];

    const sqlAns = `
      SELECT a.pair_id, a.respuesta AS elegida, a.correct,
             p.imagen, p.palabra AS correcta
      FROM emparejamiento_fill_attempt_answers a
      JOIN pares_emparejamiento p ON p.id = a.pair_id
      WHERE a.attempt_id = ?
    `;
    db.query(sqlAns, [attemptId], (err2, answers) => {
      if (err2) return res.status(500).json({ error: 'Error leyendo respuestas' });
      res.json({ intento, answers });
    });
  });
};

// GET /api/emparejamientos/:actividadId/fill/falladas
exports.getFillFalladas = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const sql = `
    SELECT p.id, p.imagen, p.palabra
    FROM emparejamientos_fill_falladas ef
    JOIN pares_emparejamiento p ON p.id = ef.pair_id
    WHERE ef.usuario_id = ? AND ef.emparejamiento_id = ?
    ORDER BY ef.id
  `;
  db.query(sql, [usuarioId, actividadId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar falladas' });
    res.json({
      questions: rows.map(r => ({
        id: r.id,
        imagen: r.imagen,
        respuestaCorrecta: r.palabra
      }))
    });
  });
};

// DELETE /api/emparejamientos/:actividadId/fill/falladas?pairId=XX
exports.deleteFillFallada = (req, res) => {
  const actividadId = req.params.actividadId;
  const usuarioId   = req.session.usuarioId;
  const pairId      = req.query.pairId;
  if (!pairId) return res.status(400).json({ error: 'Falta pairId' });

  const sql = `
    DELETE FROM emparejamientos_fill_falladas
    WHERE usuario_id = ? AND emparejamiento_id = ? AND pair_id = ?
  `;
  db.query(sql, [usuarioId, actividadId, pairId], err => {
    if (err) return res.status(500).json({ error: 'Error eliminando fallada' });
    res.sendStatus(204);
  });
};
