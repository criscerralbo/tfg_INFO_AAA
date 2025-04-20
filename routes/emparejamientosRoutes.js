const express = require('express');
const router = express.Router();
const controller = require('../controllers/emparejamientosController');

// Crear nueva actividad
router.post('/profesor/emparejamientos', controller.crearActividad);

// Listar todas las del profesor
router.get('/profesor/emparejamientos', controller.obtenerTodosDelProfesor);

// Obtener una para edición
router.get('/profesor/emparejamientos/:id', controller.obtenerEmparejamientoPorId);

// Editar
router.put('/profesor/emparejamientos/:id', controller.actualizarEmparejamiento);

// Eliminar
router.delete('/profesor/emparejamientos/:id', controller.eliminarEmparejamiento);

// Ver como alumno
router.get('/alumno/emparejamientos/:id', controller.obtenerEmparejamientoPorId);

module.exports = router;
