// controllers/preguntaController.js
const db = require('../db');

exports.getPreguntasByQuiz = (req, res) => {
  const quizId = req.query.quizId;
  if (!quizId) return res.status(400).json({ error: 'Falta quizId' });

  const sqlPreguntas = 'SELECT id, texto, imagen FROM preguntas WHERE quiz_id = ? ORDER BY id';
  db.query(sqlPreguntas, [quizId], (err, preguntas) => {
    if (err) return res.status(500).json({ error: 'Error al leer preguntas' });
    if (preguntas.length === 0) return res.json([]);

    let done = 0, output = [];

    preguntas.forEach((p) => {
      const sqlOpciones = 'SELECT id, texto, es_correcta FROM opciones WHERE id_pregunta = ? ORDER BY id';
      db.query(sqlOpciones, [p.id], (err2, ops) => {
        if (err2) return res.status(500).json({ error: 'Error al leer opciones' });

        const opciones = ops.map((o, i) => ({
          id: o.id,
          texto: o.texto,
          es_correcta: o.es_correcta === 1
        }));

        const idxCorrecta = ops.findIndex(o => o.es_correcta === 1);
        const letraDecorada = idxCorrecta >= 0 ? String.fromCharCode(65 + idxCorrecta) : '';

        output.push({
          id: p.id,
          enunciado: p.texto,
          imagen: p.imagen || null,
          opciones,
          respuesta_correcta_idx: idxCorrecta,
          respuesta_correcta: letraDecorada
        });

        if (++done === preguntas.length) res.json(output);
      });
    });
  });
};


//const path = require('path');
const fs = require('fs');

exports.createPregunta = (req, res) => {
  console.log('------ CREANDO PREGUNTA -------');
console.log('REQ BODY:', req.body);
console.log('RESPUESTA_IDX:', req.body.respuesta_correcta_idx);
console.log('OPCIONES (RAW):', req.body.opciones);
console.log('PARSED:', JSON.parse(req.body.opciones));

  const { quiz_id, enunciado, respuesta_correcta_idx } = req.body;
  let opciones = [];

  try {
    opciones = JSON.parse(req.body.opciones);
  } catch {
    return res.status(400).json({ error: 'Formato inválido en opciones' });
  }

  if (!quiz_id || !enunciado || !Array.isArray(opciones) || opciones.length < 2) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const imagen = req.file?.filename ? `/uploads/${req.file.filename}` : null;

  db.query(
    'INSERT INTO preguntas (quiz_id, texto, imagen) VALUES (?, ?, ?)',
    [quiz_id, enunciado, imagen],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear pregunta' });

      const pid = result.insertId;
      const values = opciones.map((texto, i) => [pid, texto, i === +respuesta_correcta_idx ? 1 : 0]);

      db.query('INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES ?', [values], (err2) => {
        if (err2) return res.status(500).json({ error: 'Error al guardar opciones' });
        res.status(201).json({ success: 'Pregunta creada' });
      });
    }
  );
};


exports.updatePregunta = (req, res) => {
  const pid = req.params.id;
  const { enunciado, respuesta_correcta_idx, eliminar_imagen } = req.body;
  let opciones = [];

  try {
    opciones = JSON.parse(req.body.opciones);
  } catch {
    return res.status(400).json({ error: 'Formato inválido en opciones' });
  }

  if (!enunciado || !Array.isArray(opciones) || opciones.length < 2) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // Imagen nueva si fue subida
  const nuevaImagen = req.file?.filename ? `/uploads/${req.file.filename}` : null;

  // Si hay nueva imagen o se pide eliminar imagen
  const handleImagen = (callback) => {
    db.query('SELECT imagen FROM preguntas WHERE id = ?', [pid], (err, rows) => {
      if (err) return res.status(500).json({ error: 'Error al obtener imagen actual' });
      const imagenAntigua = rows[0]?.imagen;

      // Si hay nueva imagen o se quiere eliminar
      if (nuevaImagen || eliminar_imagen === '1') {
        if (imagenAntigua) {
          const imgPath = path.join(__dirname, '..', 'public', imagenAntigua);
          fs.unlink(imgPath, err => {
            if (err && err.code !== 'ENOENT') console.warn('Error al borrar imagen:', err.message);
          });
        }
      }

      const sql = nuevaImagen
        ? 'UPDATE preguntas SET texto = ?, imagen = ? WHERE id = ?'
        : eliminar_imagen === '1'
          ? 'UPDATE preguntas SET texto = ?, imagen = NULL WHERE id = ?'
          : 'UPDATE preguntas SET texto = ? WHERE id = ?';

      const args = nuevaImagen
        ? [enunciado, nuevaImagen, pid]
        : [enunciado, pid];

      db.query(sql, args, callback);
    });
  };

  handleImagen(err => {
    if (err) return res.status(500).json({ error: 'Error al actualizar pregunta' });

    db.query('DELETE FROM opciones WHERE id_pregunta = ?', [pid], (err2) => {
      if (err2) return res.status(500).json({ error: 'Error al limpiar opciones' });

      const values = opciones.map((txt, i) => [pid, txt, i === +respuesta_correcta_idx ? 1 : 0]);

      db.query('INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES ?', [values], (err3) => {
        if (err3) return res.status(500).json({ error: 'Error al guardar nuevas opciones' });
        res.json({ success: 'Pregunta actualizada' });
      });
    });
  });
};




const path = require('path');

exports.deletePregunta = (req, res) => {
  const pid = req.params.id;

  // Obtener la imagen antes de eliminar
  db.query('SELECT imagen FROM preguntas WHERE id = ?', [pid], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al buscar pregunta' });
    if (rows.length === 0) return res.status(404).json({ error: 'No encontrada' });

    const imagen = rows[0].imagen;

    // Eliminar la pregunta
    db.query('DELETE FROM preguntas WHERE id = ?', [pid], (e, r) => {
      if (e) return res.status(500).json({ error: 'Error al eliminar' });

      if (imagen) {
        const filePath = path.join(__dirname, '..', 'public', imagen);
        fs.unlink(filePath, err => {
          if (err && err.code !== 'ENOENT') {
            console.warn('Error al borrar imagen:', err.message);
          }
        });
      }

      res.json({ success: 'Pregunta eliminada' });
    });
  });
};
