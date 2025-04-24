const express = require('express');
const router = express.Router();
const pubQuizzesController = require('../controllers/pubQuizzesController');

// Rutas para obtener quizzes
router.get('/mis', pubQuizzesController.getMisQuizzes);
router.get('/publicos', pubQuizzesController.getPublicQuizzes);

// Ruta para duplicar (publicar) un quiz en el repertorio del profesor
router.post('/publicar', pubQuizzesController.publicarQuiz);

// Ruta para asignar un quiz a un grupo de clases
router.post('/asignar', pubQuizzesController.asignarQuiz);

// Endpoint para hacer público un quiz propio
router.post('/hacerPublico', pubQuizzesController.hacerPublico);

router.get('/asignaciones', pubQuizzesController.getAsignaciones);
router.delete('/desasignar', pubQuizzesController.desasignarQuiz);
module.exports = router;
