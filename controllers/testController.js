const db = require('../db');

// 1. Tests asignados al alumno
exports.getTestsForStudent = (req, res) => {
  const usuarioId = req.session.usuarioId;
  if (!usuarioId) return res.status(401).json({ error: 'No se ha iniciado sesión.' });

  const sql = `
    SELECT q.id, q.titulo, q.descripcion, q.publico, q.creado_en, gm.grupo_id
    FROM quizzes AS q
    JOIN quiz_asignaciones AS qa ON q.id = qa.id_quiz
    JOIN grupo_miembros AS gm ON qa.id_grupo = gm.grupo_id
    WHERE gm.usuario_id = ? AND gm.estado = 'aprobado'
    ORDER BY q.creado_en DESC
  `;

  db.query(sql, [usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error interno al obtener tests.' });
    res.json(rows);
  });
};

// 2. Info básica del test
exports.getTestDetail = (req, res) => {
  const testId = req.params.testId;
  const sql = `SELECT id, titulo, descripcion, publico, creado_en FROM quizzes WHERE id = ?`;
  db.query(sql, [testId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error interno' });
    if (!rows.length) return res.status(404).json({ error: 'Quiz no encontrado' });
    res.json(rows[0]);
  });
};

// 3. Preguntas + opciones (con imagen)
exports.getTestQuestions = (req, res) => {
  const testId = req.params.testId;
  const sql = `
    SELECT p.id AS preguntaId, p.texto AS preguntaTexto, p.imagen,
           o.id AS opcionId, o.texto AS opcionTexto, o.es_correcta
    FROM preguntas p
    JOIN opciones o ON p.id = o.id_pregunta
    WHERE p.quiz_id = ?
    ORDER BY p.id
  `;

  db.query(sql, [testId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error interno' });
    const preguntasMap = {};
    rows.forEach(row => {
      if (!preguntasMap[row.preguntaId]) {
        preguntasMap[row.preguntaId] = {
          preguntaId: row.preguntaId,
          texto: row.preguntaTexto,
          imagen: row.imagen,
          opciones: []
        };
      }
      preguntasMap[row.preguntaId].opciones.push({
        opcionId: row.opcionId,
        texto: row.opcionTexto
      });
    });
    res.json(Object.values(preguntasMap));
  });
};


/// 4. Enviar respuestas (normal o falladas)
exports.submitAnswers = (req, res) => {
  const testId = req.params.testId;
  const usuarioId = req.session.usuarioId;
  const { answers, esRepeticionFalladas, duracionSegundos } = req.body;

  if (!answers || !Array.isArray(answers)) {
    return res.status(400).json({ error: 'Faltan respuestas' });
  }

  const opcionIds = answers.map(a => a.opcionIdSeleccionada).filter(Boolean);
  const sqlOpciones = `SELECT id, es_correcta FROM opciones WHERE id IN (?)`;

  db.query(sqlOpciones, [opcionIds], (err, opciones) => {
    if (err) return res.status(500).json({ error: 'Error al consultar opciones' });

    const correctMap = Object.fromEntries(opciones.map(o => [o.id, o.es_correcta]));
    let aciertos = 0;

    const answersData = answers.map(ans => {
      const isCorrect = correctMap[ans.opcionIdSeleccionada] === 1 ? 1 : 0;
      if (isCorrect) aciertos++;
      return [null, ans.preguntaId, ans.opcionIdSeleccionada, isCorrect];
    });

    const score = Math.round((aciertos / answers.length) * 100);

    const falladas = answersData
      .filter(a => a[3] === 0)
      .map(a => [usuarioId, testId, a[1]]);

    const acertadas = answersData
      .filter(a => a[3] === 1)
      .map(a => a[1]);

    // Repetir preguntas falladas
    if (esRepeticionFalladas) {
      if (falladas.length > 0) {
        db.query(
          `INSERT IGNORE INTO preguntas_falladas (usuario_id, quiz_id, pregunta_id) VALUES ?`,
          [falladas]
        );
      }

      if (acertadas.length > 0) {
        db.query(
          `DELETE FROM preguntas_falladas WHERE usuario_id = ? AND quiz_id = ? AND pregunta_id IN (?)`,
          [usuarioId, testId, acertadas]
        );
      }

      const sqlInsertFalladas = `
        INSERT INTO quiz_attempts (quiz_id, user_id, start_time, end_time, duracion_segundos, score, state, es_falladas)
        VALUES (?, ?, NOW() - INTERVAL ? SECOND, NOW(), ?, ?, 1)
      `;
      db.query(sqlInsertFalladas, [testId, usuarioId, duracionSegundos, duracionSegundos, score], err2 => {
        if (err2) return res.status(500).json({ error: 'Error al registrar intento de falladas' });
        return res.json({ score });
      });
    } else {
      // Intento normal
      const sqlInsertAttempt = `
        INSERT INTO quiz_attempts (quiz_id, user_id, start_time, state, es_falladas)
        VALUES (?, ?, NOW(), 'in_progress', 0)
      `;
      db.query(sqlInsertAttempt, [testId, usuarioId], (err3, result) => {
        if (err3) return res.status(500).json({ error: 'Error al crear intento' });

        const attemptId = result.insertId;
        const fullAnswers = answersData.map(a => [attemptId, a[1], a[2], a[3]]);

        db.query(
          `INSERT INTO quiz_attempt_answers (attempt_id, question_id, option_id, correct) VALUES ?`,
          [fullAnswers],
          err4 => {
            if (err4) return res.status(500).json({ error: 'Error al guardar respuestas' });

            if (falladas.length > 0) {
              db.query(
                `INSERT IGNORE INTO preguntas_falladas (usuario_id, quiz_id, pregunta_id) VALUES ?`,
                [falladas]
              );
            }

            if (acertadas.length > 0) {
              db.query(
                `DELETE FROM preguntas_falladas WHERE usuario_id = ? AND quiz_id = ? AND pregunta_id IN (?)`,
                [usuarioId, testId, acertadas]
              );
            }

            finishAttempt(attemptId, score, duracionSegundos, res);
          }
        );
      });
    }
  });
};

function finishAttempt(attemptId, score, duracionSegundos, res) {
  const sql = `
    UPDATE quiz_attempts
    SET end_time = NOW(),
        duracion_segundos = ?,
        score = ?, state = 'finished'
    WHERE id = ?
  `;
  db.query(sql, [duracionSegundos, score, attemptId], err => {
    if (err) return res.status(500).json({ error: 'Error al finalizar intento' });
    res.json({ score });
  });
}


// 5. Listar intentos previos
exports.getUserAttempts = (req, res) => {
  const testId = req.params.testId;
  const usuarioId = req.session.usuarioId;
  const sql = `
    SELECT id, start_time, end_time, score, state, duracion_segundos

    FROM quiz_attempts
    WHERE quiz_id = ? AND user_id = ? AND es_falladas = 0
    ORDER BY start_time DESC
  `;
  db.query(sql, [testId, usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error interno' });
    res.json(rows);
  });
};

// 6. Detalle de intento
exports.getAttemptDetail = (req, res) => {
  const attemptId = req.params.attemptId;
  const usuarioId = req.session.usuarioId;

  const sql = `
    SELECT p.id AS preguntaId, p.texto, p.imagen,
           o.id AS opcionId, o.texto AS opcionTexto,
           a.option_id AS seleccionadaId, o.es_correcta
    FROM quiz_attempt_answers a
    JOIN preguntas p ON a.question_id = p.id
    JOIN opciones o ON o.id_pregunta = p.id
    WHERE a.attempt_id = ?
  `;
  db.query(sql, [attemptId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener intento' });

    const preguntasMap = {};
    rows.forEach(row => {
      if (!preguntasMap[row.preguntaId]) {
        preguntasMap[row.preguntaId] = {
          preguntaId: row.preguntaId,
          texto: row.texto,
          imagen: row.imagen,
          seleccionadaId: row.seleccionadaId,
          opciones: []
        };
      }
      preguntasMap[row.preguntaId].opciones.push({
        opcionId: row.opcionId,
        texto: row.opcionTexto,
        correcta: row.es_correcta === 1
      });
    });

    res.json(Object.values(preguntasMap));
  });
};

// 7. Cargar preguntas falladas
exports.getFalladas = (req, res) => {
  const testId = req.params.testId;
  const usuarioId = req.session.usuarioId;

  const sql = `
    SELECT p.id AS preguntaId, p.texto, p.imagen,
           o.id AS opcionId, o.texto AS opcionTexto
    FROM preguntas_falladas pf
    JOIN preguntas p ON pf.pregunta_id = p.id
    JOIN opciones o ON o.id_pregunta = p.id
    WHERE pf.usuario_id = ? AND pf.quiz_id = ?
  `;
  db.query(sql, [usuarioId, testId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener falladas' });

    const preguntasMap = {};
    rows.forEach(row => {
      if (!preguntasMap[row.preguntaId]) {
        preguntasMap[row.preguntaId] = {
          preguntaId: row.preguntaId,
          texto: row.texto,
          imagen: row.imagen,
          opciones: []
        };
      }
      preguntasMap[row.preguntaId].opciones.push({
        opcionId: row.opcionId,
        texto: row.opcionTexto
      });
    });

    res.json(Object.values(preguntasMap));
  });
};
// 8. Revisar intento
exports.revisarIntento = (req, res) => {
  const attemptId = req.params.attemptId;
  const usuarioId = req.session.usuarioId;

  const sqlIntento = `SELECT * FROM quiz_attempts WHERE id = ? AND user_id = ?`;
  db.query(sqlIntento, [attemptId, usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al buscar intento' });
    if (!rows.length) return res.status(404).json({ error: 'Intento no encontrado' });

    const intento = rows[0];

    const sqlRespuestas = `
      SELECT qa.question_id, qa.option_id AS opcionMarcada, qa.correct,
             p.texto, p.imagen,
             o.id AS opcionId, o.texto AS opcionTexto, o.es_correcta
      FROM quiz_attempt_answers qa
      JOIN preguntas p ON qa.question_id = p.id
      JOIN opciones o ON o.id_pregunta = p.id
      WHERE qa.attempt_id = ?
    `;

    db.query(sqlRespuestas, [attemptId], (err2, rows2) => {
      if (err2) return res.status(500).json({ error: 'Error al cargar respuestas' });

      const preguntasMap = new Map();
      rows2.forEach(row => {
        if (!preguntasMap.has(row.question_id)) {
          preguntasMap.set(row.question_id, {
            preguntaId: row.question_id,
            texto: row.texto,
            imagen: row.imagen,
            opcionMarcada: row.opcionMarcada,
            opcionCorrecta: null,
            opciones: []
          });
        }

        const pregunta = preguntasMap.get(row.question_id);
        pregunta.opciones.push({
          id: row.opcionId,
          texto: row.opcionTexto
        });

        if (row.es_correcta === 1) {
          pregunta.opcionCorrecta = row.opcionId;
        }
      });

      res.json({
        intento,
        preguntas: Array.from(preguntasMap.values())
      });
    });
  });
};
