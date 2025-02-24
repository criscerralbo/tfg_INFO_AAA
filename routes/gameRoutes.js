const express = require('express');
const gameController = require('../controllers/gameController'); // Asegúrate de crear este controlador
const router = express.Router();

// Ruta para la página de juegos para alumnos
router.get('/juegos', gameController.juegosAlumnos);

// Ruta para la página de gestión de juegos para profesores
router.get('/gestionar-juegos', gameController.gestionarJuegos);

module.exports = router;
