const express = require('express');
const router  = express.Router();
const stats   = require('../controllers/estadisticasController');

// Estadísticas de un grupo (quizzes + emparejamientos)
router.get(
  '/api/grupos/:grupoId/estadisticas',
  stats.getGroupStats
);

module.exports = router;
