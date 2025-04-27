const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const gameRoutes = require('./routes/gameRoutes');
// Rutas de la API
const quizRoutes = require('./routes/quizRoutes');
const preguntaRoutes = require('./routes/preguntaRoutes');
const pubQuizzesRoutes = require('./routes/pubQuizzesRoutes');
const testRoutes = require('./routes/testRoutes');
const emparejamientosRoutes = require('./routes/emparejamientosRoutes');
const pubEmparejamientosRouter = require('./routes/pubEmparejamientosRouter');
const actGroupRoutes    = require('./routes/actGroupRoutes');   // <-- tus rutas "actividades por grupo"
const paresRoutes = require('./routes/paresRoutes');

const app = express();


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


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

// ==============================
// Middleware para JSON y formularios
// ==============================
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==============================
// Servir archivos estáticos
// ==============================
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// Middleware para depuración de sesión
// ==============================
app.use((req, res, next) => {
    console.log('Sesión actual en middleware:', req.session);
    next();
});


// ==============================
// Rutas
// ==============================
// Rutas de usuarios (registro, login, etc.)
app.use('/usuarios', userRoutes);
app.use('/api/emparejamientos', paresRoutes);

// Rutas de grupos (gestión de grupos)
app.use('/api/groups', groupRoutes);

app.use('/api/games', gameRoutes);

// Para las rutas de los grupos de los alumnos, mantén el prefijo '/api/alumno'
app.use('/api/alumno', groupRoutes);
app.use('/api/grupos', actGroupRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/preguntas', preguntaRoutes);
app.use('/api/pubQuizzes', pubQuizzesRoutes);
app.use('/api/tests', testRoutes);
app.use('/api', emparejamientosRoutes);
app.use('/api/emparejamientos', pubEmparejamientosRouter);
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
