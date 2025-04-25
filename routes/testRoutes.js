const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');

// 1. Listar tests asignados al alumno logueado
router.get('/mis-tests', testController.getTestsForStudent);

// 2. Obtener info básica del test
router.get('/:testId', testController.getTestDetail);

// 3. Obtener preguntas completas de un test
router.get('/:testId/preguntas', testController.getTestQuestions);

// 4. Obtener preguntas falladas del test
router.get('/:testId/falladas', testController.getFalladas);

// 5. Enviar respuestas (con o sin intento real)
router.post('/:testId/enviar-respuestas', testController.submitAnswers);

// 6. Obtener todos los intentos del usuario en el test
router.get('/:testId/mis-intentos', testController.getUserAttempts);

// 7. Revisar intento específico (modo resumen)
router.get('/revisar/:attemptId', testController.getAttemptDetail);

// 8. Revisar intento detallado con respuesta + correcto
router.get('/attempts/:attemptId/revisar', testController.revisarIntento);

module.exports = router;
