const express = require('express');
const router  = express.Router();
const ec   = require('../controllers/estadisticasController');

// JSON:
router.get('/api/grupos/:grupoId/estadisticas', ec.getGroupStats);

// Excel resumen:
router.get('/api/grupos/:grupoId/estadisticas/excel', ec.exportGroupStatsExcel);

// Excel intentos:
router.get('/api/grupos/:grupoId/estadisticas/intentos/excel', ec.exportGroupAttemptsExcel);
module.exports = router;
