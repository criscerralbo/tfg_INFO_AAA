const db = require('../db');

// Obtener los quizzes propios del profesor
exports.getMisQuizzes = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const sql = 'SELECT * FROM quizzes WHERE id_profesor = ?';
  db.query(sql, [idProfesor], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener mis quizzes' });
    }
    res.json(results);
  });
};

// Obtener los quizzes públicos de otros profesores
exports.getPublicQuizzes = (req, res) => {
  const idProfesor = req.session.usuarioId;
  // Se asume que la columna "publico" (1 o 0) marca si un quiz se hizo público
  const sql = 'SELECT * FROM quizzes WHERE publico = 1 AND id_profesor != ?';
  db.query(sql, [idProfesor], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener quizzes públicos' });
    }
    res.json(results);
  });
};

// Duplicar (publicar) un quiz en el repertorio del profesor actual
exports.publicarQuiz = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { quizId } = req.body;
  if (!quizId) {
    return res.status(400).json({ error: 'Falta el ID del quiz' });
  }

  // Obtener el quiz original (asegurarse de que no es del mismo profesor)
  const sqlGetQuiz = 'SELECT * FROM quizzes WHERE id = ?';
  db.query(sqlGetQuiz, [quizId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    const quizOriginal = results[0];
    if (quizOriginal.id_profesor === idProfesor) {
      return res.status(400).json({ error: 'No puedes duplicar tu propio quiz' });
    }

    // Duplicar el registro del quiz
    const sqlInsertQuiz = 'INSERT INTO quizzes (titulo, descripcion, id_profesor, publico) VALUES (?, ?, ?, ?)';
    // Al duplicar, se puede establecer el quiz como no público (0)
    db.query(sqlInsertQuiz, [quizOriginal.titulo, quizOriginal.descripcion, idProfesor, 0], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al duplicar el quiz' });
      }
      const nuevoQuizId = result.insertId;
      // Duplicar las preguntas del quiz original
      const sqlPreguntas = 'SELECT * FROM preguntas WHERE id_quiz = ?';
      db.query(sqlPreguntas, [quizId], (err, preguntas) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al obtener preguntas del quiz original' });
        }
        if (preguntas.length === 0) {
          return res.status(201).json({ success: 'Quiz duplicado sin preguntas', id: nuevoQuizId });
        }
        let preguntasProcesadas = 0;
        preguntas.forEach(preg => {
          const sqlInsertPreg = 'INSERT INTO preguntas (id_quiz, texto) VALUES (?, ?)';
          db.query(sqlInsertPreg, [nuevoQuizId, preg.texto], (err, resultPreg) => {
            if (err) {
              console.error(err);
            }
            const nuevaPreguntaId = resultPreg.insertId;
            // Duplicar las opciones de la pregunta
            const sqlOpciones = 'SELECT * FROM opciones WHERE id_pregunta = ?';
            db.query(sqlOpciones, [preg.id], (err, opciones) => {
              if (err) {
                console.error(err);
              }
              if (opciones.length === 0) {
                preguntasProcesadas++;
                if (preguntasProcesadas === preguntas.length) {
                  return res.status(201).json({ success: 'Quiz duplicado correctamente', id: nuevoQuizId });
                }
              }
              opciones.forEach(opcion => {
                const sqlInsertOpcion = 'INSERT INTO opciones (id_pregunta, texto, correcta) VALUES (?, ?, ?)';
                db.query(sqlInsertOpcion, [nuevaPreguntaId, opcion.texto, opcion.correcta || opcion.es_correcta ? 1 : 0], (err) => {
                  if (err) {
                    console.error(err);
                  }
                });
              });
              preguntasProcesadas++;
              if (preguntasProcesadas === preguntas.length) {
                return res.status(201).json({ success: 'Quiz duplicado correctamente', id: nuevoQuizId });
              }
            });
          });
        });
      });
    });
  });
};

// Asignar un quiz a un grupo de clases
exports.asignarQuiz = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { quizId, grupo } = req.body;
  if (!quizId || !grupo) {
    return res.status(400).json({ error: 'Faltan datos para asignar el quiz' });
  }
  // Se asume que existe una tabla "quiz_asignaciones" con las columnas: id, id_quiz, id_grupo, id_profesor
  const sqlAsignar = 'INSERT INTO quiz_asignaciones (id_quiz, id_grupo, id_profesor) VALUES (?, ?, ?)';
  db.query(sqlAsignar, [quizId, grupo, idProfesor], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al asignar el quiz' });
    }
    res.status(201).json({ success: 'Quiz asignado correctamente' });
  });
};

// Hacer público un quiz propio para que sea visible para otros profesores
exports.hacerPublico = (req, res) => {
    const idProfesor = req.session.usuarioId;
    const { quizId } = req.body;
    if (!quizId) {
      return res.status(400).json({ error: 'ID de quiz no especificado' });
    }
    // Actualiza el quiz, marcándolo como público (publico = 1)
    const sqlActualizar = 'UPDATE quizzes SET publico = 1 WHERE id = ? AND id_profesor = ?';
    db.query(sqlActualizar, [quizId, idProfesor], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al hacer público el quiz' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Quiz no encontrado o no pertenece al profesor' });
      }
      res.json({ success: 'Quiz publicado correctamente' });
    });
  };
  