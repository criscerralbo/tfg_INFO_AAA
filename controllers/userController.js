// userController.js
const db = require('../models/userModel');
const bcrypt = require('bcrypt');
const postmark = require('postmark');

// Conectar con Postmark usando tu API Key
const client = new postmark.ServerClient('1c87cd46-32dc-4b31-a451-92175549348f');

// Registrar usuario
exports.registrarUsuario = (req, res) => {
    const { nombre, email, password, rol } = req.body;

    // Validar que todos los campos estén presentes
    if (!nombre || !email || !password) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    // Validar que el correo sea institucional (debe terminar con @ucm.es)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@ucm\.es$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Debe usar un correo institucional (@ucm.es)');
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Generar un token de verificación (número de 6 dígitos)
    const token = Math.floor(100000 + Math.random() * 900000);

    // Insertar usuario en la base de datos (verificado en 0 por defecto)
    db.run(
        `INSERT INTO usuarios (nombre, email, password, rol, verificado) VALUES (?, ?, ?, ?, 0)`,
        [nombre, email, hashedPassword, rol || 'alumno'],
        function (err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(400).send('El correo ya está registrado.');
                }
                return res.status(500).send('Error al registrar usuario');
            }

            // Enviar el correo de verificación
            client.sendEmail({
                "From": "ccerralb@ucm.es",  // Dirección que has verificado en Postmark
                "To": email,
                "Subject": "Verificación de correo - Gestión de Usuarios",
                "TextBody": `Gracias por registrarte. Tu código de verificación es: ${token}`
            }, (error, result) => {
                if (error) {
                    console.error('Error al enviar el correo de verificación:', error);
                    return res.status(500).send('Error al enviar el correo de verificación');
                }
                console.log('Correo de verificación enviado:', result);
                res.status(200).send('Se ha enviado un correo de verificación a su email.');
            });

            // Guardar el token de verificación en la base de datos
            db.run(
                `INSERT INTO tokens (email, token) VALUES (?, ?)`,
                [email, token],
                function (err) {
                    if (err) {
                        console.error('Error al guardar el token:', err);
                    }
                }
            );
        }
    );
};

// Verificar usuario (cuando el usuario introduce el código de verificación)
exports.verificarUsuario = (req, res) => {
    const { email, token } = req.body;

    // Verificar el token en la base de datos
    db.get(`SELECT * FROM tokens WHERE email = ? AND token = ?`, [email, token], (err, row) => {
        if (err || !row) {
            return res.status(400).send('Código de verificación incorrecto.');
        }

        // Si el token es correcto, actualizamos el usuario como verificado
        db.run(`UPDATE usuarios SET verificado = 1 WHERE email = ?`, [email], (err) => {
            if (err) {
                return res.status(500).send('Error al verificar el usuario.');
            }
            res.status(200).send('Usuario verificado con éxito.');
        });
    });
};
/*
// Iniciar Sesión
exports.iniciarSesion = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, row) => {
        if (err || !row) {
            return res.status(400).send('El usuario no existe.');
        }

        const passwordIsValid = bcrypt.compareSync(password, row.password);
        if (!passwordIsValid) {
            return res.status(400).send('Contraseña incorrecta.');
        }

        if (row.verificado === 0) {
            return res.status(400).send('El usuario no ha sido verificado.');
        }

        // Guardar el nombre y el email del usuario en la sesión
        req.session.nombreUsuario = row.nombre;
        req.session.emailUsuario = row.email;

        // Redirigir a la página de inicio
        res.redirect('/inicio');
    });
};
*/
exports.iniciarSesion = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error_message: 'Todos los campos son obligatorios' });
    }

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, row) => {
        if (err || !row) {
            // Enviar respuesta JSON en lugar de redirigir
            return res.status(400).json({ error_message: 'El usuario no existe.' });
        }

        const passwordIsValid = bcrypt.compareSync(password, row.password);
        if (!passwordIsValid) {
            return res.status(400).json({ error_message: 'Contraseña incorrecta.' });
        }

        if (row.verificado === 0) {
            return res.status(400).json({ error_message: 'El usuario no ha sido verificado.' });
        }

        // Guardar el nombre y el email del usuario en la sesión
        req.session.nombreUsuario = row.nombre;
        req.session.emailUsuario = row.email;

        // Responder con éxito
        res.status(200).json({ success: true });
    });
};


// Obtener datos del perfil del usuario
exports.obtenerPerfil = (req, res) => {
    if (!req.session.emailUsuario) {
        console.log("Sesión no encontrada: No se ha iniciado sesión.");
        return res.status(401).json({ mensaje: 'No ha iniciado sesión' });
    }

    console.log("Email en la sesión:", req.session.emailUsuario);

    db.get(`SELECT nombre, email FROM usuarios WHERE email = ?`, [req.session.emailUsuario], (err, row) => {
        if (err) {
            console.error('Error al obtener datos del perfil:', err);
            return res.status(500).send('Error al obtener datos del perfil');
        }
        if (!row) {
            console.log("Usuario no encontrado en la base de datos.");
            return res.status(404).send('Usuario no encontrado');
        }
        console.log("Datos del perfil encontrados:", row);
        res.json(row);
    });
};

// Actualizar datos del perfil del usuario
exports.actualizarPerfil = (req, res) => {
    const { nombre, currentPassword, newPassword } = req.body;

    if (!req.session.emailUsuario) {
        return res.status(401).send('No ha iniciado sesión');
    }

    db.get(`SELECT * FROM usuarios WHERE email = ?`, [req.session.emailUsuario], (err, row) => {
        if (err || !row) {
            return res.status(400).send('Error al encontrar el usuario');
        }

        // Verificar la contraseña actual antes de actualizar
        const passwordIsValid = bcrypt.compareSync(currentPassword, row.password);
        if (!passwordIsValid) {
            return res.status(400).send('Contraseña incorrecta');
        }

        // Actualizar datos del usuario
        const hashedPassword = newPassword ? bcrypt.hashSync(newPassword, 10) : row.password;

        db.run(`UPDATE usuarios SET nombre = ?, password = ? WHERE email = ?`,
            [nombre, hashedPassword, row.email],
            (err) => {
                if (err) {
                    return res.status(500).send('Error al actualizar el perfil');
                }
                res.send('Perfil actualizado con éxito');
            }
        );
    });
};

// Cerrar Sesión
exports.cerrarSesion = (req, res) => {
    console.log("Intentando cerrar sesión...");
    req.session.destroy(err => {
        if (err) {
            console.error('Error al cerrar la sesión:', err);
            return res.status(500).send('Error al cerrar la sesión');
        }
        console.log("Sesión cerrada con éxito");
        res.redirect('/'); // Redirigir a la página de inicio de sesión
    });
};
