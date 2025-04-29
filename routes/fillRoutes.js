// routes/fillRoutes.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/fillController');

// Carga de preguntas
router.get('/:actividadId/fill',                ctrl.getFill);
// Intentos
router.post('/:actividadId/fill/attempts',      ctrl.submitFillAttempt);
router.get ('/:actividadId/fill/attempts',      ctrl.listFillAttempts);
router.get ('/fill/attempts/:attemptId',        ctrl.getFillAttemptDetail);
// Falladas
router.get ('/:actividadId/fill/falladas',      ctrl.getFillFalladas);
router.delete('/:actividadId/fill/falladas',     ctrl.deleteFillFallada);

module.exports = router;
