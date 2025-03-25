const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// 1) Listar tests asignados al usuario (alumno) que está logueado
router.get('/mis-tests', testController.getTestsForStudent);

// 2) Obtener la info básica de un test (titulo, descripcion, etc.)
router.get('/:testId', testController.getTestDetail);

// 3) Obtener las preguntas y opciones de un test
router.get('/:testId/preguntas', testController.getTestQuestions);

// 4) Enviar respuestas y terminar (o guardar) el intento
router.post('/:testId/enviar-respuestas', testController.submitAnswers);

// 5) Ver intentos del alumno en ese test
router.get('/:testId/mis-intentos', testController.getUserAttempts);

module.exports = router;
