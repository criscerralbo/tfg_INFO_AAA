const db = require('../db');

// Agregar una pregunta a un quiz
exports.createPregunta = (req, res) => {
  const quizId = req.params.quizId;
  const { texto } = req.body;
  if (!texto) {
    return res.status(400).json({ error: 'El texto de la pregunta es obligatorio' });
  }
  const sql = 'INSERT INTO preguntas (id_quiz, texto) VALUES (?, ?)';
  db.query(sql, [quizId, texto], (err, result) => {
    if (err) {
      console.error('Error al crear pregunta:', err);
      return res.status(500).json({ error: 'Error al crear la pregunta' });
    }
    res.status(201).json({ success: 'Pregunta creada', id: result.insertId });
  });
};

// Actualizar una pregunta
exports.updatePregunta = (req, res) => {
  const preguntaId = req.params.id;
  const { texto } = req.body;
  if (!texto) {
    return res.status(400).json({ error: 'El texto es obligatorio' });
  }
  const sql = 'UPDATE preguntas SET texto = ? WHERE id = ?';
  db.query(sql, [texto, preguntaId], (err, result) => {
    if (err) {
      console.error('Error al actualizar pregunta:', err);
      return res.status(500).json({ error: 'Error al actualizar la pregunta' });
    }
    res.json({ success: 'Pregunta actualizada' });
  });
};

// Eliminar una pregunta
exports.deletePregunta = (req, res) => {
  const preguntaId = req.params.id;
  const sql = 'DELETE FROM preguntas WHERE id = ?';
  db.query(sql, [preguntaId], (err, result) => {
    if (err) {
      console.error('Error al eliminar pregunta:', err);
      return res.status(500).json({ error: 'Error al eliminar la pregunta' });
    }
    res.json({ success: 'Pregunta eliminada' });
  });
};
