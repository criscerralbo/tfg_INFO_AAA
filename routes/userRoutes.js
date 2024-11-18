// userRoutes.js
//falta actualizar
const express = require('express');
const router = express.Router();

const { 
    registrarUsuario, 
    iniciarSesion, 
    verificarUsuario, 
    obtenerPerfil, 
    actualizarPerfil, 
    cerrarSesion, 
    obtenerNombreYRol,
    registrarAdm,
    verificarUsuarioAdm,
    recuperarContrasena,
    eliminarCuenta,
    resetearContrasena, 
    verificarCodigo,
    obtenerTodosLosUsuarios, // Nuevo: Obtener todos los usuarios
    actualizarUsuario,       // Nuevo: Actualizar un usuario
    eliminarUsuario          // Nuevo: Eliminar un usuario
} = require('../controllers/userController');

// Ruta para registrar un usuario
router.post('/registrar', registrarUsuario);

// Ruta para iniciar sesión
router.post('/login', iniciarSesion);

// Ruta para verificar el código de verificación
router.post('/verificar', verificarUsuario);

// Ruta para obtener el nombre del usuario desde la sesión
/*
router.get('/nombre', (req, res) => {
    if (!req.session.nombreUsuario) {
        return res.status(401).json({ mensaje: 'No ha iniciado sesión' });
    }
    res.json({ 
        nombreUsuario: req.session.nombreUsuario, 
        rol: req.session.rol // Enviar el rol
    });
});



*/// Ruta para obtener el nombre y rol del usuario desde la sesión
router.get('/nombre', obtenerNombreYRol);

router.delete('/eliminarCuenta', eliminarCuenta);

// Ruta para obtener datos del perfil del usuario (usando el método del controlador)
router.get('/perfil', obtenerPerfil);

// Ruta para actualizar datos del perfil (usando el método del controlador)
router.post('/actualizarPerfil', actualizarPerfil);

// Ruta para cerrar sesión (usando el método del controlador)
router.get('/logout', cerrarSesion);

// Nueva ruta para la recuperación de contraseña
router.post('/recuperarContrasena', recuperarContrasena);

router.post('/verificarCodigo', verificarCodigo);

router.post('/resetearContrasena', resetearContrasena);

// *** Nuevas rutas para administración de usuarios ***

// Ruta para obtener todos los usuarios (vista de administración)
router.get('/', obtenerTodosLosUsuarios);

// Ruta para actualizar un usuario específico (para cambiar nombre, rol, etc.)
router.put('/:id', actualizarUsuario);

// Ruta para eliminar un usuario específico
router.delete('/:id', eliminarUsuario);

// Nueva ruta para registrar usuarios por el administrador sin verificación de correo
router.post('/registrarAdm', registrarAdm);
// Ruta para el administrador verificar el usuario
router.put('/:id/verificar', verificarUsuarioAdm);

module.exports = router;