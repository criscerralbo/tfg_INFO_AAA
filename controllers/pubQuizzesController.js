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

exports.publicarQuiz = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { quizId } = req.body;
  if (!quizId) {
    return res.status(400).json({ error: 'Falta el ID del quiz' });
  }

  // Obtener el quiz original
  const sqlGetQuiz = 'SELECT * FROM quizzes WHERE id = ?';
  db.query(sqlGetQuiz, [quizId], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    const quizOriginal = results[0];

    // (Opcional) Impedir duplicar un quiz propio:
    if (quizOriginal.id_profesor === idProfesor) {
      return res.status(400).json({ error: 'No puedes duplicar tu propio quiz' });
    }

    // 1) Buscar cuántas copias existen con el mismo título base
    //    Asumimos que el quiz base se llama, por ejemplo, "Mi Quiz".
    //    Las copias se llamarán "Mi Quiz (copia 1)", "Mi Quiz (copia 2)", etc.
    const tituloBase = quizOriginal.titulo;
    const pattern = `${tituloBase} (copia%`;  // Usaremos LIKE con "Mi Quiz (copia%"
    const sqlCheckCopies = `
      SELECT COUNT(*) AS total 
      FROM quizzes 
      WHERE titulo LIKE ? 
        AND id_profesor = ?
    `;
    db.query(sqlCheckCopies, [pattern, idProfesor], (err, rowsCheck) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Error al comprobar copias' });
      }
      // Calculamos el número de la siguiente copia
      const copiaNum = rowsCheck[0].total + 1;
      const nuevoTitulo = `${tituloBase} (copia ${copiaNum})`;

      // 2) Insertar el quiz duplicado, con nuevo título
      const sqlInsertQuiz = `
        INSERT INTO quizzes (titulo, descripcion, id_profesor, publico) 
        VALUES (?, ?, ?, ?)
      `;
      db.query(sqlInsertQuiz, [nuevoTitulo, quizOriginal.descripcion, idProfesor, 0], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Error al duplicar el quiz' });
        }
        const nuevoQuizId = result.insertId;

        // 3) Duplicar las preguntas
        const sqlPreguntas = 'SELECT * FROM preguntas WHERE quiz_id = ?';  // ¡Ojo con quiz_id en tu BD!
        db.query(sqlPreguntas, [quizId], (err, preguntas) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Error al obtener preguntas' });
          }
          if (preguntas.length === 0) {
            return res.status(201).json({ success: 'Quiz duplicado sin preguntas', id: nuevoQuizId });
          }

          let preguntasProcesadas = 0;
          preguntas.forEach(preg => {
            const sqlInsertPreg = 'INSERT INTO preguntas (quiz_id, texto) VALUES (?, ?)';
            db.query(sqlInsertPreg, [nuevoQuizId, preg.texto], (err, resultPreg) => {
              if (err) {
                console.error(err);
              }
              const nuevaPreguntaId = resultPreg.insertId;

              // 4) Duplicar las opciones
              const sqlOpciones = 'SELECT * FROM opciones WHERE id_pregunta = ?'; // "id_pregunta" en tu BD
              db.query(sqlOpciones, [preg.id], (err, opciones) => {
                if (err) {
                  console.error(err);
                }
                if (!opciones || opciones.length === 0) {
                  preguntasProcesadas++;
                  if (preguntasProcesadas === preguntas.length) {
                    return res.status(201).json({ success: 'Quiz duplicado correctamente', id: nuevoQuizId });
                  }
                  return;
                }

                let opcionesProcesadas = 0;
                opciones.forEach(op => {
                  const sqlInsertOpcion = `
                    INSERT INTO opciones (id_pregunta, texto, es_correcta)
                    VALUES (?, ?, ?)
                  `;
                  db.query(sqlInsertOpcion, [
                    nuevaPreguntaId,
                    op.texto,
                    op.es_correcta ? 1 : 0
                  ], (err2) => {
                    if (err2) {
                      console.error(err2);
                    }
                    opcionesProcesadas++;
                    if (opcionesProcesadas === opciones.length) {
                      preguntasProcesadas++;
                      if (preguntasProcesadas === preguntas.length) {
                        return res.status(201).json({
                          success: 'Quiz duplicado correctamente',
                          id: nuevoQuizId
                        });
                      }
                    }
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};


exports.getAsignaciones = (req, res) => {
  const idProfesor = req.session.usuarioId;

  // Consulta para unir grupos y quizzes asignados y filtrar los grupos en los que el profesor es propietario
  // o es miembro aprobado (aunque el quiz haya sido asignado por otro profesor)
  const sql = `
    SELECT ga.id AS id_asignacion,
           ga.id_grupo,
           g.nombre AS nombre_grupo,
           ga.id_quiz,
           q.titulo AS titulo_quiz
    FROM quiz_asignaciones ga
    JOIN grupos g ON g.id = ga.id_grupo
    JOIN quizzes q ON q.id = ga.id_quiz
    WHERE (g.propietario_id = ? 
      OR g.id IN (
            SELECT gm.grupo_id 
            FROM grupo_miembros gm 
            WHERE gm.usuario_id = ? AND gm.estado = 'aprobado'
          ))
    ORDER BY g.nombre
  `;

  db.query(sql, [idProfesor, idProfesor], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al obtener asignaciones' });
    }

    // Agrupar por grupo
    const gruposMap = {};
    rows.forEach(row => {
      if (!gruposMap[row.id_grupo]) {
        gruposMap[row.id_grupo] = {
          id: row.id_grupo,
          nombre: row.nombre_grupo,
          quizzes: []
        };
      }
      gruposMap[row.id_grupo].quizzes.push({
        id: row.id_quiz,
        titulo: row.titulo_quiz
      });
    });

    const resultado = Object.values(gruposMap);
    res.json(resultado);
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
  