const express = require('express');
const router  = express.Router();
const controller = require('../controllers/emparejamientosController');
const upload = require('../utils/upload');   // Multer para gestionar archivos

// --------- Ruta de subida de imagen ---------
router.post(
  '/profesor/emparejamientos/:id/upload',
  upload.single('imagen'),
  controller.subirImagen
);

// --------- Rutas CRUD de emparejamientos ---------
// Crear una nueva actividad con pares
router.post(
  '/profesor/emparejamientos',
  controller.crearActividad
);

// Obtener todas las actividades del profesor
router.get(
  '/profesor/emparejamientos',
  controller.obtenerTodosDelProfesor
);

// Obtener detalle de una actividad y sus pares
router.get(
  '/profesor/emparejamientos/:id',
  controller.obtenerEmparejamientoPorId
);

// Actualizar actividad y sus pares
router.put(
  '/profesor/emparejamientos/:id',
  controller.actualizarEmparejamiento
);

// Eliminar actividad y sus pares
router.delete(
  '/profesor/emparejamientos/:id',
  controller.eliminarEmparejamiento
);

// --------- Ruta de solo lectura para alumnos ---------
router.get(
  '/alumno/emparejamientos/:id',
  controller.obtenerEmparejamientoPorId
);

module.exports = router;
