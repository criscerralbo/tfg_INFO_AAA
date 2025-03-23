const express = require('express');
const router = express.Router();
const preguntaController = require('../controllers/preguntaController');

// Rutas para preguntas
router.post('/:quizId', preguntaController.createPregunta);
router.put('/:id', preguntaController.updatePregunta);
router.delete('/:id', preguntaController.deletePregunta);

module.exports = router;
