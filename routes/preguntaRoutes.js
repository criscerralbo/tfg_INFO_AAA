// routes/preguntasRoutes.js
const express = require('express');
const router  = express.Router();
const pc      = require('../controllers/preguntaController');

// /api/preguntas?quizId=123
router.get   ('/',      pc.getPreguntasByQuiz);
router.post  ('/',      pc.createPregunta);
router.put   ('/:id',   pc.updatePregunta);
router.delete('/:id',   pc.deletePregunta);

module.exports = router;
