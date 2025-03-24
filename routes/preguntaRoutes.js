const express = require('express');
const router = express.Router();
const preguntaController = require('../controllers/preguntaController');

// Rutas para preguntas
router.get('/', preguntaController.getPreguntasByQuiz); // /api/preguntas?quizId=...
router.post('/', preguntaController.createPregunta);     // POST /api/preguntas
router.put('/:id', preguntaController.updatePregunta);   // PUT /api/preguntas/:id
router.delete('/:id', preguntaController.deletePregunta); // DELETE /api/preguntas/:id

module.exports = router;
