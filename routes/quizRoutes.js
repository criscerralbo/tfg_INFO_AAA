// routes/quizRoutes.js
const express   = require('express');
const router    = express.Router();
const quizCtrl  = require('../controllers/quizController');

// Listar todos los quizzes del profesor
router.get   ('/',      quizCtrl.getQuizzes);
// Crear uno nuevo
router.post  ('/',      quizCtrl.createQuiz);
// Ver uno con sus preguntas/opciones
router.get   ('/:id',   quizCtrl.getQuizById);
// Actualizar quiz + preguntas/opciones
router.put   ('/:id',   quizCtrl.updateQuiz);
// Eliminar quiz
router.delete('/:id',   quizCtrl.deleteQuiz);

module.exports = router;
