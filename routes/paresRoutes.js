const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/paresController');

// — Rutas específicas de juego —
router.get('/:actividadId(\\d+)/multiple',      ctrl.getMultiple);
router.get('/:actividadId(\\d+)/fill',          ctrl.getFill);

// — Intentos y falladas — 
router.get('/:actividadId(\\d+)/attempts',      ctrl.listAttempts);
router.post('/:actividadId(\\d+)/attempts',     ctrl.submitAttempt);
router.get('/:actividadId(\\d+)/falladas',      ctrl.getFalladas);
router.delete('/:actividadId(\\d+)/falladas',   ctrl.deleteFallada);

// — Detalle de un intento concreto — 
router.get('/attempts/:attemptId(\\d+)',        ctrl.getAttemptDetail);

// — Ruta genérica para cargar nombre/descr. de la actividad —  
router.get('/:actividadId(\\d+)',                ctrl.getActividad);

module.exports = router;
