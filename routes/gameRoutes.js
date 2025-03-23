const express = require('express');
const gameController = require('../controllers/gameController');
const router = express.Router();

// Obtener todos los quizzes
router.get('/quizzes', gameController.getQuizzes);

// Crear un nuevo quiz
router.post('/quizzes', gameController.createQuiz);

// Agregar una pregunta a un quiz (se envían las opciones en el body)
router.post('/quizzes/:quizId/questions', gameController.addQuestion);

// Obtener las preguntas (con sus opciones) de un quiz
router.get('/quizzes/:quizId/questions', gameController.getQuestions);

module.exports = router;
