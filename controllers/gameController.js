const db = require('../db');  // Asegúrate de tener la conexión a la base de datos

// Página de juegos para alumnos
exports.juegosAlumnos = (req, res) => {
    const usuarioId = req.session.usuarioId;
    // Comprobar el rol del usuario, si es alumno o no
    db.query(
        `SELECT r.nombre AS rol FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id
         WHERE u.id = ?`,
        [usuarioId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).json({ error: 'Error al obtener el rol del usuario' });
            }

            const rol = results[0].rol;

            if (rol === 'Alumno') {
                // Redirigir a la plataforma de juegos para alumnos
                res.render('juegos-alumno.html');  // Renderiza la página de juegos para el alumno
            } else {
                res.status(403).json({ error: 'No tienes permisos para acceder a esta página' });
            }
        }
    );
};

// Página de gestión de juegos para profesores
exports.gestionarJuegos = (req, res) => {
    const usuarioId = req.session.usuarioId;
    // Comprobar el rol del usuario, si es profesor
    db.query(
        `SELECT r.nombre AS rol FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id
         WHERE u.id = ?`,
        [usuarioId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).json({ error: 'Error al obtener el rol del usuario' });
            }

            const rol = results[0].rol;

            if (rol === 'Profesor') {
                // Redirigir a la página de gestión de juegos
                res.render('gestionar-juegos.html');  // Renderiza la página de gestión de juegos para el profesor
            } else {
                res.status(403).json({ error: 'No tienes permisos para acceder a esta página' });
            }
        }
    );
}
// Crear un juego para el profesor
exports.crearJuego = (req, res) => {
    const { nombreJuego, descripcion } = req.body;

    if (!nombreJuego || !descripcion) {
        return res.status(400).json({ error: 'Faltan datos del juego' });
    }

    // Insertar juego en la base de datos
    db.query(
        `INSERT INTO juegos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)`,
        [nombreJuego, descripcion, req.session.usuarioId],
        (err, result) => {
            if (err) {
                console.error('Error al crear juego:', err);
                return res.status(500).json({ error: 'Error al crear el juego' });
            }
            res.status(201).json({ success: 'Juego creado con éxito' });
        }
    );
};

// Agregar un caso clínico
exports.agregarCasoClinico = (req, res) => {
    const { juegoId, nombreCaso, descripcionCaso } = req.body;

    if (!juegoId || !nombreCaso || !descripcionCaso) {
        return res.status(400).json({ error: 'Faltan datos del caso clínico' });
    }

    db.query(
        `INSERT INTO casos_clinicos (juego_id, nombre, descripcion) VALUES (?, ?, ?)`,
        [juegoId, nombreCaso, descripcionCaso],
        (err, result) => {
            if (err) {
                console.error('Error al agregar caso clínico:', err);
                return res.status(500).json({ error: 'Error al agregar el caso clínico' });
            }
            res.status(201).json({ success: 'Caso clínico agregado con éxito' });
        }
    );
};
