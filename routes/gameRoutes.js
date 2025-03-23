const express = require('express');
const router = express.Router();
const gameController = require('../controllers/GameController');

// Obtener todos los quizzes del profesor
router.get('/quizzes', gameController.getQuizzes);

// Crear un nuevo quiz
router.post('/quizzes', gameController.createQuiz);

// Obtener detalles de un quiz (incluye preguntas y opciones)
router.get('/quizzes/:id', gameController.getQuizById);

// Actualizar un quiz
router.put('/quizzes/:id', gameController.updateQuiz);

module.exports = router;
