const db = require('../db');

// Obtener todos los quizzes de un profesor:
exports.getQuizzes = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const sql = 'SELECT * FROM quizzes WHERE id_profesor = ?';
  db.query(sql, [idProfesor], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener quizzes' });
    }
    res.json(results);
  });
};

// Crear un quiz nuevo (con preguntas)
exports.createQuiz = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { titulo, descripcion, preguntas } = req.body;

  if (!titulo) {
    return res.status(400).json({ error: 'El título es obligatorio' });
  }

  // 1) Insertar el quiz
  const sqlQuiz = 'INSERT INTO quizzes (titulo, descripcion, id_profesor) VALUES (?, ?, ?)';
  db.query(sqlQuiz, [titulo, descripcion, idProfesor], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al crear el quiz' });
    }
    const quizId = result.insertId;

    if (!preguntas || !Array.isArray(preguntas)) {
      return res.status(201).json({ success: 'Quiz creado', id: quizId });
    }

    // 2) Insertar cada pregunta + opciones
    const sqlPregunta = 'INSERT INTO preguntas (quiz_id, texto) VALUES (?, ?)';
    const sqlOpcion = 'INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES (?, ?, ?)';

    preguntas.forEach((pregunta) => {
      db.query(sqlPregunta, [quizId, pregunta.texto], (err, resultPregunta) => {
        if (err) console.error(err);
        const preguntaId = resultPregunta.insertId;

        (pregunta.opciones || []).forEach((op) => {
          db.query(sqlOpcion, [preguntaId, op.texto, op.es_correcta ? 1 : 0], (err) => {
            if (err) console.error(err);
          });
        });
      });
    });

    return res.status(201).json({ success: 'Quiz creado con preguntas', id: quizId });
  });
};

// Obtener un quiz con sus preguntas y opciones
exports.getQuizById = (req, res) => {
  const quizId = req.params.id;
  const idProfesor = req.session.usuarioId; // asumiendo login
  const sqlQuiz = 'SELECT * FROM quizzes WHERE id = ? AND id_profesor = ?';

  db.query(sqlQuiz, [quizId, idProfesor], (err, quizResults) => {
    if (err || quizResults.length === 0) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    const quiz = quizResults[0];

    // Obtener preguntas
    const sqlPreguntas = 'SELECT * FROM preguntas WHERE quiz_id = ?';
    db.query(sqlPreguntas, [quizId], (err, preguntasResults) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener preguntas Q' });
      }
      if (preguntasResults.length === 0) {
        quiz.preguntas = [];
        return res.json(quiz);
      }

      let contador = 0;
      const preguntasCompletas = [];

      preguntasResults.forEach((pregunta) => {
        const sqlOpciones = 'SELECT * FROM opciones WHERE id_pregunta = ?';
        db.query(sqlOpciones, [pregunta.id], (err, opcionesResults) => {
          if (err) console.error(err);
          pregunta.opciones = opcionesResults || [];
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

// Actualizar quiz y sus preguntas/opciones
exports.updateQuiz = (req, res) => {
  const quizId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const { titulo, descripcion, preguntas } = req.body;

  // 1) Actualizar título/descr
  const sqlUpdateQuiz = 'UPDATE quizzes SET titulo = ?, descripcion = ? WHERE id = ? AND id_profesor = ?';
  db.query(sqlUpdateQuiz, [titulo, descripcion, quizId, idProfesor], (err, quizResult) => {
    if (err) {
      return res.status(500).json({ error: 'Error al actualizar el quiz' });
    }
    if (!preguntas || !Array.isArray(preguntas)) {
      return res.json({ success: 'Quiz actualizado (sin cambios en preguntas)' });
    }

    // 2) Manejar las preguntas:
    //    Obtener las preguntas existentes en DB para "diferenciar" qué insertar, actualizar, eliminar
    const sqlGetPreguntas = 'SELECT id FROM preguntas WHERE quiz_id = ?';
    db.query(sqlGetPreguntas, [quizId], (err, rowsPreg) => {
      if (err) {
        return res.status(500).json({ error: 'Error al obtener preguntas 33' });
      }
      const existentesIds = rowsPreg.map(r => r.id);

      // IDs que llegan en el body (excluyendo null)
      const idsEnviados = preguntas.map(p => p.id).filter(Boolean);

      // Preguntas a eliminar
      const preguntasAEliminar = existentesIds.filter(id => !idsEnviados.includes(id));
      if (preguntasAEliminar.length > 0) {
        const sqlDel = `DELETE FROM preguntas WHERE id IN (${preguntasAEliminar.join(',')})`;
        db.query(sqlDel, (err) => {
          if (err) console.error('Error al eliminar preguntas:', err);
        });
      }

      // Para cada pregunta en el body => insertar o actualizar
      preguntas.forEach((preg) => {
        if (!preg.id) {
          // Insertar pregunta
          const sqlInsertPreg = 'INSERT INTO preguntas (quiz_id, texto) VALUES (?, ?)';
          db.query(sqlInsertPreg, [quizId, preg.texto], (err, resultPreg) => {
            if (err) console.error(err);
            const newPregId = resultPreg.insertId;
            // Insertar opciones
            insertOrUpdateOpciones(newPregId, preg.opciones || []);
          });
        } else if (existentesIds.includes(preg.id)) {
          // Actualizar texto
          const sqlUpdPreg = 'UPDATE preguntas SET texto = ? WHERE id = ?';
          db.query(sqlUpdPreg, [preg.texto, preg.id], (err) => {
            if (err) console.error(err);
          });
          // Manejar opciones
          insertOrUpdateOpciones(preg.id, preg.opciones || []);
        }
      });

      return res.json({ success: 'Quiz actualizado con sus preguntas/opciones' });
    });
  });

  // Función auxiliar para insertar/actualizar opciones
  function insertOrUpdateOpciones(preguntaId, opciones) {
    // Obtener las existentes:
    const sqlGetOps = 'SELECT id FROM opciones WHERE id_pregunta = ?';
    db.query(sqlGetOps, [preguntaId], (err, rowsOps) => {
      if (err) console.error(err);
      const opsExistentesIds = rowsOps.map(r => r.id);
      const opsEnviadasIds = opciones.map(o => o.id).filter(Boolean);

      // Eliminar las que sobran
      const aEliminar = opsExistentesIds.filter(id => !opsEnviadasIds.includes(id));
      if (aEliminar.length > 0) {
        const sqlDelOps = `DELETE FROM opciones WHERE id IN (${aEliminar.join(',')})`;
        db.query(sqlDelOps, err => { if (err) console.error(err); });
      }

      // Insertar o actualizar
      opciones.forEach((op) => {
        if (!op.id) {
          // Insertar
          const sqlInsOp = 'INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES (?, ?, ?)';
          db.query(sqlInsOp, [preguntaId, op.texto, op.es_correcta ? 1 : 0], (err) => {
            if (err) console.error(err);
          });
        } else if (opsExistentesIds.includes(op.id)) {
          // Update
          const sqlUpdOp = 'UPDATE opciones SET texto = ?, es_correcta = ? WHERE id = ?';
          db.query(sqlUpdOp, [op.texto, op.es_correcta ? 1 : 0, op.id], (err) => {
            if (err) console.error(err);
          });
        }
      });
    });
  }
};

// Eliminar un quiz (y sus preguntas/opciones por cascada)
exports.deleteQuiz = (req, res) => {
  const quizId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const sql = 'DELETE FROM quizzes WHERE id = ? AND id_profesor = ?';
  db.query(sql, [quizId, idProfesor], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al eliminar el quiz' });
    }
    res.json({ success: 'Quiz eliminado correctamente' });
  });
};
// controllers/quizController.js
exports.getPreguntasPorQuiz = (req, res) => {
  const quizId = req.query.quizId;
  const sqlPreg = `
      SELECT id,
             texto                       AS enunciado
      FROM preguntas
      WHERE quiz_id = ?
      ORDER BY id
  `;

  db.query(sqlPreg, [quizId], (err, preguntas) => {
    if (err) return res.status(500).json({ error: 'Error al obtener preguntas' });
    if (preguntas.length === 0) return res.json([]);

    let hechas = 0;
    preguntas.forEach((p, idx) => {
      const sqlOps = `
          SELECT texto,
                 es_correcta
          FROM opciones
          WHERE id_pregunta = ?
          ORDER BY id
      `;
      db.query(sqlOps, [p.id], (e, ops) => {
        if (e) console.error(e);

        // array de textos y letra correcta («A», «B», …)
        p.opciones = ops.map(o => o.texto);
        const indexCorrecta = ops.findIndex(o => o.es_correcta === 1);
        p.respuesta_correcta = indexCorrecta >= 0 ? 'ABCDEFGHIJ'[indexCorrecta] : '';

        if (++hechas === preguntas.length) res.json(preguntas);
      });
    });
  });
};
