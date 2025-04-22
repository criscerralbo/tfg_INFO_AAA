const express = require('express');
const router = express.Router();
const controller = require('../controllers/pubEmparejamientosController');

// Obtener emparejamientos propios del profesor
router.get('/mis', controller.getMisEmparejamientos);

// Obtener emparejamientos públicos
router.get('/publicos', controller.getPublicEmparejamientos);

// Guardar una copia de un emparejamiento público
router.post('/publicar', controller.publicarEmparejamiento);

// Asignar emparejamiento a grupo
router.post('/asignar', controller.asignarEmparejamiento);

// Obtener asignaciones de emparejamientos
router.get('/asignaciones', controller.getAsignaciones);
router.post('/hacerPublico', controller.hacerPublico);


module.exports = router;
