const db = require('../db');

// GET /api/emparejamientos/:actividadId/multiple
// Devuelve todas las imágenes y las opciones (sin duplicados) + la respuesta correcta
exports.getMultiple = (req, res) => {
  const actividadId = req.params.actividadId;

  // 1) Obtenemos las opciones únicas (palabras)
  const sqlOpts = `
    SELECT DISTINCT palabra
    FROM pares_emparejamiento
    WHERE actividad_id = ?
  `;
  db.query(sqlOpts, [actividadId], (err, optsRows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar opciones' });
    const opciones = optsRows.map(r => r.palabra);

    // 2) Obtenemos las imágenes y su palabra correcta
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
// Devuelve las imágenes y la palabra correcta para el modo “rellenar”
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
    // cada fila: id, imagen, palabra
    res.json({ questions: rows });
  });
};
