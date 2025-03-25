const db = require('../db');  // Tu conexión a MySQL, adaptada a tu proyecto

// 1) Obtener la lista de tests asignados a un alumno
exports.getTestsForStudent = (req, res) => {
  const usuarioId = req.session.usuarioId;

  // Asegúrate de que el usuario está en sesión
  if (!usuarioId) {
    return res.status(401).json({ error: 'No se ha iniciado sesión.' });
  }

  // Consulta para obtener todos los quizzes asignados a los grupos del alumno
  const sql = `
    SELECT q.id, q.titulo, q.descripcion, q.publico, q.creado_en, 
           gm.grupo_id
    FROM quizzes AS q
    JOIN quiz_asignaciones AS qa 
      ON q.id = qa.id_quiz
    JOIN grupo_miembros AS gm 
      ON qa.id_grupo = gm.grupo_id
    WHERE gm.usuario_id = ?
      AND gm.estado = 'aprobado'
    ORDER BY q.creado_en DESC
  `;

  db.query(sql, [usuarioId], (err, rows) => {
    if (err) {
      console.error('Error getTestsForStudent:', err);
      return res.status(500).json({ error: 'Error interno al obtener tests.' });
    }
    // Devolvemos el array de quizzes
    res.json(rows);
  });
};

// 2) Obtener detalles básicos de un test
exports.getTestDetail = (req, res) => {
  const testId = req.params.testId;  // <-- clave: 'testId' en vez de 'quizId'
  console.log('Llega a getTestDetail con testId =', testId);

  const sql = `
    SELECT id, titulo, descripcion, publico, creado_en
    FROM quizzes
    WHERE id = ?
  `;
  db.query(sql, [testId], (err, rows) => {
    if (err) {
      console.error('Error getTestDetail:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Quiz no encontrado' });
    }
    return res.json(rows[0]);
  });
};

// 3) Obtener las preguntas y opciones de un test
exports.getTestQuestions = (req, res) => {
  const testId = req.params.testId;  // <-- usamos testId

  const sql = `
    SELECT p.id AS preguntaId, p.texto AS preguntaTexto,
           o.id AS opcionId, o.texto AS opcionTexto, o.es_correcta
    FROM preguntas p
    JOIN opciones o ON p.id = o.id_pregunta
    WHERE p.quiz_id = ?
    ORDER BY p.id
  `;

  db.query(sql, [testId], (err, rows) => {
    if (err) {
      console.error('Error getTestQuestions:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
    if (rows.length === 0) {
      // Puede que el test no tenga preguntas
      return res.json([]);
    }

    // Agrupar las opciones por pregunta
    const preguntasMap = {};
    rows.forEach((row) => {
      if (!preguntasMap[row.preguntaId]) {
        preguntasMap[row.preguntaId] = {
          preguntaId: row.preguntaId,
          texto: row.preguntaTexto,
          opciones: []
        };
      }
      preguntasMap[row.preguntaId].opciones.push({
        opcionId: row.opcionId,
        texto: row.opcionTexto
        // No devolvemos es_correcta
      });
    });

    const preguntas = Object.values(preguntasMap);
    return res.json(preguntas);
  });
};

// 4) Guardar un intento de test y sus respuestas
exports.submitAnswers = (req, res) => {
  const testId = req.params.testId;  // <-- testId
  const usuarioId = req.session.usuarioId;
  const { answers } = req.body;  // [{ preguntaId, opcionIdSeleccionada }, ...]

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Faltan respuestas en el body' });
  }

  // 1) Crear un nuevo registro en quiz_attempts
  // 2) Insertar respuestas en quiz_attempt_answers
  // 3) Calcular score
  // 4) Actualizar state = 'finished'

  const sqlInsertAttempt = `
    INSERT INTO quiz_attempts (quiz_id, user_id, start_time, state)
    VALUES (?, ?, NOW(), 'finished')
  `;
  db.query(sqlInsertAttempt, [testId, usuarioId], (err, result) => {
    if (err) {
      console.error('Error al crear quiz_attempt:', err);
      return res.status(500).json({ error: 'Error al crear intento' });
    }
    const attemptId = result.insertId;

    // Revisamos las opciones marcadas
    const opcionIds = answers.map(a => a.opcionIdSeleccionada).filter(Boolean);
    if (opcionIds.length === 0) {
      // Si no se seleccionó nada => 0
      finishAttempt(attemptId, 0, res);
      return;
    }

    const sqlOpciones = `
      SELECT id, es_correcta
      FROM opciones
      WHERE id IN (?)
    `;
    db.query(sqlOpciones, [opcionIds], (err2, rowOpciones) => {
      if (err2) {
        console.error('Error al consultar opciones:', err2);
        return res.status(500).json({ error: 'Error al consultar opciones' });
      }

      // Map { opcionId => es_correcta }
      const correctMap = {};
      rowOpciones.forEach(o => {
        correctMap[o.id] = o.es_correcta;
      });

      let aciertos = 0;
      const answersData = answers.map(ans => {
        const isCorrect = correctMap[ans.opcionIdSeleccionada] === 1 ? 1 : 0;
        if (isCorrect) aciertos++;
        return [attemptId, ans.preguntaId, ans.opcionIdSeleccionada, isCorrect];
      });

      const sqlInsertAnswers = `
        INSERT INTO quiz_attempt_answers (attempt_id, question_id, option_id, correct)
        VALUES ?
      `;
      db.query(sqlInsertAnswers, [answersData], (err3) => {
        if (err3) {
          console.error('Error al guardar respuestas:', err3);
          return res.status(500).json({ error: 'Error al guardar respuestas' });
        }

        // Calcula la nota final
        const totalPreguntas = answers.length;
        const score = Math.round((aciertos / totalPreguntas) * 100);

        // Actualiza el attempt con la puntuación
        finishAttempt(attemptId, score, res);
      });
    });
  });
};

// Función auxiliar para terminar el attempt
function finishAttempt(attemptId, score, res) {
  const sqlFinish = `
    UPDATE quiz_attempts
    SET end_time = NOW(), score = ?, state = 'finished'
    WHERE id = ?
  `;
  db.query(sqlFinish, [score, attemptId], (err) => {
    if (err) {
      console.error('Error al finalizar el intento:', err);
      return res.status(500).json({ error: 'Error al finalizar el intento' });
    }
    // Devolvemos la puntuación al frontend
    return res.json({ score });
  });
}

// 5) Obtener los intentos previos del usuario en un test
exports.getUserAttempts = (req, res) => {
  const testId = req.params.testId; // testId
  const usuarioId = req.session.usuarioId;

  const sql = `
    SELECT id, start_time, end_time, score, state
    FROM quiz_attempts
    WHERE quiz_id = ? AND user_id = ?
    ORDER BY start_time DESC
  `;
  db.query(sql, [testId, usuarioId], (err, rows) => {
    if (err) {
      console.error('Error getUserAttempts:', err);
      return res.status(500).json({ error: 'Error interno' });
    }
    return res.json(rows);
  });
};
