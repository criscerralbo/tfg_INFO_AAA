// app.js
const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const path = require('path');
const session = require('express-session');

const app = express();

// Middleware para analizar datos JSON y datos del formulario (URL-encoded)
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, 'public')));

// Middleware de sesión
app.use(session({
    secret: 'mi_secreto',  // Usa una clave segura en producción
    resave: false,
    saveUninitialized: false,  // Evitar guardar sesiones vacías
    cookie: {
        httpOnly: true,
        secure: false,  // Cambiar a true si se utiliza HTTPS
        maxAge: 1000 * 60 * 60 // 1 hora de duración de la sesión
    }
}));

// Rutas de usuarios (registro, verificación, inicio de sesión, etc.)
app.use('/usuarios', userRoutes);

// Ruta para la pantalla de inicio (luego de iniciar sesión)
app.get('/inicio', (req, res) => {
    if (!req.session.nombreUsuario) {
        return res.redirect('/');  // Redirigir si no hay usuario en sesión
    }
    res.sendFile(path.join(__dirname, 'public', 'inicio.html'));
});

// Ruta principal para manejar errores 404 (si intentan acceder a rutas no definidas)
app.use((req, res) => {
    res.status(404).send('Página no encontrada');
});

// Iniciar el servidor
app.listen(3000, () => {
    console.log('Servidor corriendo en el puerto 3000');
});
