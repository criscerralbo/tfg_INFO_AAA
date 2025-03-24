// routes/quizRoutes.js

const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

// GET /api/quizzes
// Obtiene la lista de quizzes de un profesor (según req.session.usuarioId)
router.get('/', quizController.getQuizzes);

// POST /api/quizzes
// Crea un nuevo quiz (con sus preguntas/opciones, si vienen en el body)
router.post('/', quizController.createQuiz);

// GET /api/quizzes/:id
// Obtiene un quiz en particular con sus preguntas y opciones
router.get('/:id', quizController.getQuizById);

// PUT /api/quizzes/:id
// Actualiza un quiz existente (título, descripción) y sus preguntas/opciones
router.put('/:id', quizController.updateQuiz);

// DELETE /api/quizzes/:id
// Elimina un quiz (y todo su contenido por cascada)
router.delete('/:id', quizController.deleteQuiz);

module.exports = router;
