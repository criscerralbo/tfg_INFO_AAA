const express = require('express');
const router = express.Router();
const empController = require('../controllers/paresController');

// Modo múltiple
router.get('/:actividadId/multiple', empController.getMultiple);
// Modo rellenar
router.get('/:actividadId/fill', empController.getFill);

// después de tus GET /:actividadId/multiple y /:actividadId/fill...
router.post('/:actividadId/attempts', empController.submitAttempt);
router.get('/:actividadId/attempts', empController.listAttempts);
router.get('/attempts/:attemptId', empController.getAttemptDetail);
router.get('/:actividadId/falladas', empController.getFalladas);
router.delete('/:actividadId/falladas', empController.deleteFallada);
module.exports = router;
