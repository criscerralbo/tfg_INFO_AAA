// userRoutes.js
const express = require('express');
const router = express.Router();
const { registrarUsuario, iniciarSesion, verificarUsuario, obtenerPerfil, actualizarPerfil, cerrarSesion } = require('../controllers/userController');

// Ruta para registrar un usuario
router.post('/registrar', registrarUsuario);

// Ruta para iniciar sesión
router.post('/login', iniciarSesion);

// Ruta para verificar el código de verificación
router.post('/verificar', verificarUsuario);

// Ruta para obtener el nombre del usuario desde la sesión
router.get('/nombre', (req, res) => {
    if (!req.session.nombreUsuario) {
        return res.status(401).json({ mensaje: 'No ha iniciado sesión' });
    }
    res.json({ nombreUsuario: req.session.nombreUsuario });
});

// Ruta para obtener datos del perfil del usuario (usando el método del controlador)
router.get('/perfil', obtenerPerfil);

// Ruta para actualizar datos del perfil (usando el método del controlador)
router.post('/actualizarPerfil', actualizarPerfil);

// Ruta para cerrar sesión (usando el método del controlador)
router.get('/logout', cerrarSesion);

module.exports = router;