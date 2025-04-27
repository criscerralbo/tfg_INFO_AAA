const express = require('express');
const router = express.Router();
const empController = require('../controllers/paresController');

// Modo múltiple
router.get('/:actividadId/multiple', empController.getMultiple);
// Modo rellenar
router.get('/:actividadId/fill', empController.getFill);

module.exports = router;
