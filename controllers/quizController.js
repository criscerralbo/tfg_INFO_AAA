const db = require('../db');

// Obtener todos los quizzes del profesor (se supone que el id del profesor está en la sesión)
exports.getQuizzes = (req, res) => {
  const idProfesor = req.session.usuarioId; // o reemplazar con valor fijo para pruebas
  const sql = 'SELECT * FROM quizzes WHERE id_profesor = ?';
  db.query(sql, [idProfesor], (err, results) => {
    if (err) {
      console.error('Error al obtener quizzes:', err);
      return res.status(500).json({ error: 'Error al obtener los quizzes' });
    }
    res.json(results);
  });
};

// Crear un nuevo quiz
exports.createQuiz = (req, res) => {
  const { titulo, descripcion } = req.body;
  const idProfesor = req.session.usuarioId;
  if (!titulo) {
    return res.status(400).json({ error: 'El título es obligatorio' });
  }
  const sql = 'INSERT INTO quizzes (titulo, descripcion, id_profesor) VALUES (?, ?, ?)';
  db.query(sql, [titulo, descripcion, idProfesor], (err, result) => {
    if (err) {
      console.error('Error al crear quiz:', err);
      return res.status(500).json({ error: 'Error al crear el quiz' });
    }
    res.status(201).json({ success: 'Quiz creado', id: result.insertId });
  });
};

// Obtener un quiz con sus preguntas y opciones
exports.getQuizById = (req, res) => {
  const quizId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const sqlQuiz = 'SELECT * FROM quizzes WHERE id = ? AND id_profesor = ?';
  db.query(sqlQuiz, [quizId, idProfesor], (err, quizResults) => {
    if (err || quizResults.length === 0) {
      console.error('Error al obtener el quiz:', err);
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    const quiz = quizResults[0];
    const sqlPreguntas = 'SELECT * FROM preguntas WHERE id_quiz = ?';
    db.query(sqlPreguntas, [quizId], (err, preguntasResults) => {
      if (err) {
        console.error('Error al obtener preguntas:', err);
        return res.status(500).json({ error: 'Error al obtener preguntas' });
      }
      // Para cada pregunta, obtener las opciones
      let preguntasCompletas = [];
      let contador = 0;
      if (preguntasResults.length === 0) {
        quiz.preguntas = [];
        return res.json(quiz);
      }
      preguntasResults.forEach(pregunta => {
        const sqlOpciones = 'SELECT * FROM opciones WHERE id_pregunta = ?';
        db.query(sqlOpciones, [pregunta.id], (err, opcionesResults) => {
          if (err) {
            console.error('Error al obtener opciones:', err);
            return res.status(500).json({ error: 'Error al obtener opciones' });
          }
          pregunta.opciones = opcionesResults;
          preguntasCompletas.push(pregunta);
          contador++;
          if (contador === preguntasResults.length) {
            quiz.preguntas = preguntasCompletas;
            res.json(quiz);
          }
        });
      });
    });
  });
};

// Actualizar datos de un quiz
exports.updateQuiz = (req, res) => {
  const quizId = req.params.id;
  const { titulo, descripcion } = req.body;
  const idProfesor = req.session.usuarioId;
  const sql = 'UPDATE quizzes SET titulo = ?, descripcion = ? WHERE id = ? AND id_profesor = ?';
  db.query(sql, [titulo, descripcion, quizId, idProfesor], (err, result) => {
    if (err) {
      console.error('Error al actualizar quiz:', err);
      return res.status(500).json({ error: 'Error al actualizar el quiz' });
    }
    res.json({ success: 'Quiz actualizado correctamente' });
  });
};

// Eliminar un quiz (y sus preguntas y opciones por cascada)
exports.deleteQuiz = (req, res) => {
  const quizId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const sql = 'DELETE FROM quizzes WHERE id = ? AND id_profesor = ?';
  db.query(sql, [quizId, idProfesor], (err, result) => {
    if (err) {
      console.error('Error al eliminar quiz:', err);
      return res.status(500).json({ error: 'Error al eliminar el quiz' });
    }
    res.json({ success: 'Quiz eliminado correctamente' });
  });
};
