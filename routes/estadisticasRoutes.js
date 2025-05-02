const express = require('express');
const router  = express.Router();
const stats   = require('../controllers/estadisticasController');

// Panel del profesor
router.get('/api/grupos/:grupoId/estadisticas', stats.getGroupStats);

module.exports = router;
