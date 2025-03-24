const db = require('../db');

// Obtener todas las preguntas de un Quiz (con sus 4 opciones)
exports.getPreguntasByQuiz = (req, res) => {
  const quizId = req.query.quizId; 
  if (!quizId) {
    return res.status(400).json({ error: 'Falta quizId en la consulta' });
  }

  // 1) Obtener todas las filas de la tabla preguntas que pertenezcan a este quiz
  const sqlPreguntas = 'SELECT * FROM preguntas WHERE quiz_id = ?';
  db.query(sqlPreguntas, [quizId], (err, preguntas) => {
    if (err) {
      console.error('Error al obtener preguntas:', err);
      return res.status(500).json({ error: 'Error interno al obtener preguntas' });
    }
    if (preguntas.length === 0) {
      return res.json([]); // Sin preguntas
    }

    // Iremos consultando opciones para cada pregunta y construyendo su objeto final
    let contador = 0;
    const resultadoFinal = [];

    preguntas.forEach((preg) => {
      const preguntaId = preg.id;
      // Para la respuesta final al front, llamaremos "enunciado" a preg.texto
      const objPregunta = {
        id: preg.id,
        enunciado: preg.texto
      };

      // 2) Obtener las opciones asociadas
      const sqlOpciones = 'SELECT * FROM opciones WHERE id_pregunta = ?';
      db.query(sqlOpciones, [preguntaId], (err, filasOpciones) => {
        if (err) {
          console.error('Error al obtener opciones:', err);
          return res.status(500).json({ error: 'Error interno al obtener opciones' });
        }

        // Vamos a mapear hasta 4 opciones: A, B, C, D
        // y si es_correcta=1, guardamos la letra en respuesta_correcta
        // Asumimos que las opciones vienen en cierto orden (o que hay max 4).
        // Ajusta si necesitas un orden específico.
        let letraActual = ['A', 'B', 'C', 'D'];
        let respuestaCorrecta = null;

        filasOpciones.forEach((opcion, idx) => {
          const letra = letraActual[idx] || '?';
          // Por ejemplo: objPregunta.opcionA = textoOpcion
          objPregunta[`opcion${letra}`] = opcion.texto;
          // Si es_correcta = 1 => la respuesta correcta es esa letra
          if (opcion.es_correcta === 1) {
            respuestaCorrecta = letra;
          }
        });

        objPregunta.respuesta_correcta = respuestaCorrecta || 'A'; 
        // (Por si acaso, si ninguna es_correcta=1, asumimos 'A')

        resultadoFinal.push(objPregunta);
        contador++;
        if (contador === preguntas.length) {
          return res.json(resultadoFinal);
        }
      });
    });
  });
};

// Crear una nueva pregunta
exports.createPregunta = (req, res) => {
  const { quiz_id, enunciado, opcionA, opcionB, opcionC, opcionD, respuesta_correcta } = req.body;

  if (!quiz_id || !enunciado || !respuesta_correcta) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // 1) Verificar cuántas preguntas hay ya (por si quieres máximo 10)
  db.query('SELECT COUNT(*) AS total FROM preguntas WHERE quiz_id = ?', [quiz_id], (err, countResult) => {
    if (err) {
      console.error('Error al contar preguntas:', err);
      return res.status(500).json({ error: 'Error interno al contar preguntas' });
    }

    const totalPreguntas = countResult[0].total;
    if (totalPreguntas >= 10) {
      return res.status(400).json({ error: 'Este quiz ya tiene el máximo de 10 preguntas' });
    }

    // 2) Insertar en 'preguntas' (usando "texto" para el enunciado)
    const sqlPreg = 'INSERT INTO preguntas (quiz_id, texto) VALUES (?, ?)';
    db.query(sqlPreg, [quiz_id, enunciado], (err, result) => {
      if (err) {
        console.error('Error al crear pregunta:', err);
        return res.status(500).json({ error: 'Error interno al crear pregunta' });
      }
      const nuevaPreguntaId = result.insertId;

      // 3) Insertar las 4 opciones en la tabla 'opciones'
      //    (puedes usar un array para no repetir código)
      const opciones = [
        { texto: opcionA, letra: 'A' },
        { texto: opcionB, letra: 'B' },
        { texto: opcionC, letra: 'C' },
        { texto: opcionD, letra: 'D' },
      ];

      opciones.forEach((op) => {
        if (!op.texto) return; // Si viene vacía, podrías omitir la inserción

        const esCorrecta = (op.letra === respuesta_correcta) ? 1 : 0;
        const sqlOpc = 'INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES (?, ?, ?)';
        db.query(sqlOpc, [nuevaPreguntaId, op.texto, esCorrecta], (err) => {
          if (err) {
            console.error('Error al insertar opción:', err);
          }
          // No devolvemos nada por cada opción
        });
      });

      // Finalmente
      return res.status(201).json({ success: 'Pregunta creada correctamente' });
    });
  });
};

// Actualizar una pregunta existente (reinsertando sus 4 opciones)
exports.updatePregunta = (req, res) => {
  const preguntaId = req.params.id;
  const { enunciado, opcionA, opcionB, opcionC, opcionD, respuesta_correcta } = req.body;

  if (!preguntaId || !enunciado || !respuesta_correcta) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  // 1) Actualizar la pregunta (columna "texto")
  const sqlUpdPreg = 'UPDATE preguntas SET texto = ? WHERE id = ?';
  db.query(sqlUpdPreg, [enunciado, preguntaId], (err, result) => {
    if (err) {
      console.error('Error al actualizar pregunta:', err);
      return res.status(500).json({ error: 'Error interno al actualizar la pregunta' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la pregunta a actualizar' });
    }

    // 2) Borrar las opciones anteriores
    const sqlDelOps = 'DELETE FROM opciones WHERE id_pregunta = ?';
    db.query(sqlDelOps, [preguntaId], (err) => {
      if (err) {
        console.error('Error al eliminar opciones viejas:', err);
      }

      // 3) Insertar las nuevas 4 opciones
      const opciones = [
        { texto: opcionA, letra: 'A' },
        { texto: opcionB, letra: 'B' },
        { texto: opcionC, letra: 'C' },
        { texto: opcionD, letra: 'D' },
      ];

      opciones.forEach((op) => {
        if (!op.texto) return;
        const esCorrecta = (op.letra === respuesta_correcta) ? 1 : 0;
        const sqlInsOp = 'INSERT INTO opciones (id_pregunta, texto, es_correcta) VALUES (?, ?, ?)';
        db.query(sqlInsOp, [preguntaId, op.texto, esCorrecta], (err2) => {
          if (err2) {
            console.error('Error al insertar opción:', err2);
          }
        });
      });

      return res.json({ success: 'Pregunta actualizada correctamente' });
    });
  });
};

// Eliminar una pregunta (las opciones se borran por ON DELETE CASCADE o manual)
exports.deletePregunta = (req, res) => {
  const preguntaId = req.params.id;
  if (!preguntaId) {
    return res.status(400).json({ error: 'Falta el ID de la pregunta' });
  }

  db.query('DELETE FROM preguntas WHERE id = ?', [preguntaId], (err, result) => {
    if (err) {
      console.error('Error al eliminar la pregunta:', err);
      return res.status(500).json({ error: 'Error interno al eliminar la pregunta' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'No se encontró la pregunta a eliminar' });
    }
    res.json({ success: 'Pregunta eliminada correctamente' });
  });
};
