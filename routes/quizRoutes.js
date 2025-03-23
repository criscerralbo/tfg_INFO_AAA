const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// Rutas para gestionar quizzes
router.get('/', quizController.getQuizzes);            // Listar quizzes
router.post('/', quizController.createQuiz);             // Crear quiz
router.get('/:id', quizController.getQuizById);            // Obtener quiz con preguntas y opciones
router.put('/:id', quizController.updateQuiz);           // Actualizar quiz
router.delete('/:id', quizController.deleteQuiz);        // Eliminar quiz

module.exports = router;
