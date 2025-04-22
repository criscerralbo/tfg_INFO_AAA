// controllers/preguntaController.js
const db = require('../db');

// GET /api/preguntas?quizId=...
exports.getPreguntasByQuiz = (req, res) => {
  const quizId = req.query.quizId;
  if (!quizId) return res.status(400).json({ error: 'Falta quizId' });

  db.query('SELECT * FROM preguntas WHERE quiz_id = ?', [quizId], (err, preguntas) => {
    if (err) return res.status(500).json({ error: 'Error al leer preguntas' });
    if (preguntas.length === 0) return res.json([]);

    let done = 0, out = [];
    preguntas.forEach(p => {
      db.query('SELECT * FROM opciones WHERE id_pregunta = ?', [p.id], (e, ops) => {
        if (e) return res.status(500).json({ error: 'Error al leer opciones' });
        // construyo la pregunta con array de opciones y respuesta_correcta
        const opciones = ops.map(o => ({ id: o.id, texto: o.texto, es_correcta: o.es_correcta===1 }));
        const respLetra = ['A','B','C','D'][ops.findIndex(o=>o.es_correcta===1)] || null;
        out.push({
          id:            p.id,
          enunciado:     p.texto,
          opciones,
          respuesta_correcta: respLetra
        });
        if (++done === preguntas.length) res.json(out);
      });
    });
  });
};

// POST /api/preguntas
exports.createPregunta = (req, res) => {
  const { quiz_id, enunciado, opciones, respuesta_correcta } = req.body;
  if (!quiz_id||!enunciado||!Array.isArray(opciones)||!respuesta_correcta) {
    return res.status(400).json({ error:'Faltan campos' });
  }
  // inserto pregunta
  db.query('INSERT INTO preguntas (quiz_id,texto) VALUES (?,?)', [quiz_id,enunciado], (e,r) => {
    if (e) return res.status(500).json({ error:'Error al crear pregunta' });
    const pid = r.insertId;
    // inserto opciones
    const stm = 'INSERT INTO opciones (id_pregunta,texto,es_correcta) VALUES ?';
    const vals = opciones.map((txt,i)=>[
      pid,
      txt,
      ('ABCD'[i]===respuesta_correcta)?1:0
    ]);
    db.query(stm, [vals], err2 => {
      if (err2) console.error(err2);
      res.status(201).json({ success:'Pregunta creada' });
    });
  });
};

// PUT /api/preguntas/:id
exports.updatePregunta = (req, res) => {
  const pid = req.params.id;
  const { enunciado, opciones, respuesta_correcta } = req.body;
  if (!enunciado||!Array.isArray(opciones)||!respuesta_correcta) {
    return res.status(400).json({ error:'Faltan campos' });
  }
  db.query('UPDATE preguntas SET texto=? WHERE id=?', [enunciado,pid], (e) => {
    if (e) return res.status(500).json({ error:'Error al actualizar pregunta' });
    // borro viejas
    db.query('DELETE FROM opciones WHERE id_pregunta=?', [pid], () => {
      // inserto nuevas
      const stm = 'INSERT INTO opciones (id_pregunta,texto,es_correcta) VALUES ?';
      const vals = opciones.map((txt,i)=>[
        pid,
        txt,
        ('ABCD'[i]===respuesta_correcta)?1:0
      ]);
      db.query(stm, [vals], err2 => {
        if (err2) console.error(err2);
        res.json({ success:'Pregunta actualizada' });
      });
    });
  });
};

// DELETE /api/preguntas/:id
exports.deletePregunta = (req, res) => {
  const pid = req.params.id;
  db.query('DELETE FROM preguntas WHERE id=?', [pid], (e,r) => {
    if (e) return res.status(500).json({ error:'Error al eliminar' });
    if (r.affectedRows===0) return res.status(404).json({ error:'No encontrada' });
    res.json({ success:'Pregunta eliminada' });
  });
};
