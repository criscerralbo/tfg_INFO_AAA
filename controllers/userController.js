const db = require('../models/userModel');
const bcrypt = require('bcrypt');
const postmark = require('postmark');

// Conectar con Postmark usando tu API Key
const client = new postmark.ServerClient('1c87cd46-32dc-4b31-a451-92175549348f');

// Registrar usuario
exports.registrarUsuario = (req, res) => {
    const { nombre, email, password, rol } = req.body;

    if (!nombre || !email || !password || !rol) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@ucm\.es$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Debe usar un correo institucional (@ucm.es)');
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const token = Math.floor(100000 + Math.random() * 900000);

    // Obtener el rol_id basado en el rol proporcionado
    db.query(`SELECT id FROM roles WHERE nombre = ?`, [rol], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('Rol inválido');
        }

        const rol_id = results[0].id;

        db.query(
            `INSERT INTO usuarios (nombre, email, password, rol_id, verificado) VALUES (?, ?, ?, ?, 0)`,
            [nombre, email, hashedPassword, rol_id],
            (err) => {
                if (err) {
                    if (err.code === 'ER_DUP_ENTRY') {
                        return res.status(400).send('El correo ya está registrado.');
                    }
                    return res.status(500).send('Error al registrar usuario');
                }

                client.sendEmail({
                    "From": "ccerralb@ucm.es",
                    "To": email,
                    "Subject": "Verificación de correo - Gestión de Usuarios",
                    "TextBody": `Gracias por registrarte. Tu código de verificación es: ${token}`
                });

                db.query(`INSERT INTO tokens (email, token, tipo) VALUES (?, ?, 'verificacion')`, [email, token]);
                res.status(200).send('Se ha enviado un correo de verificación a su email.');
            }
        );
    });
};

// Recuperar contraseña
exports.recuperarContrasena = (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'El campo de correo es obligatorio' });
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@ucm\.es$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Debe usar un correo institucional (@ucm.es)' });
    }

    db.query(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Correo no registrado' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000);

        db.query(
            `INSERT INTO tokens (email, token, tipo) VALUES (?, ?, 'recuperacion')`,
            [email, verificationCode],
            (err) => {
                if (err) {
                    return res.status(500).json({ error: 'Error al generar el código de verificación' });
                }

                client.sendEmail({
                    "From": "ccerralb@ucm.es",
                    "To": email,
                    "Subject": "Código de Verificación - Recuperación de Contraseña",
                    "TextBody": `Tu código de verificación es: ${verificationCode}.`
                });
                res.status(200).json({ message: 'Se ha enviado un código de verificación a tu correo.' });
            }
        );
    });
};

// Verificar código de recuperación de contraseña
exports.verificarCodigo = (req, res) => {
    const { email, token } = req.body;

    db.query(`SELECT * FROM tokens WHERE email = ? AND token = ? AND tipo = 'recuperacion'`, [email, token], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ error: 'Código de verificación incorrecto o expirado.' });
        }

        res.status(200).json({ message: 'Código de verificación correcto. Puedes restablecer tu contraseña.' });
    });
};

// Resetear contraseña
exports.resetearContrasena = (req, res) => {
    const { email, newPassword, token } = req.body;

    db.query(`SELECT * FROM tokens WHERE email = ? AND token = ? AND tipo = 'recuperacion'`, [email, token], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).json({ error: 'Código de verificación incorrecto o expirado.' });
        }

        db.query(`DELETE FROM tokens WHERE email = ? AND tipo = 'recuperacion'`, [email]);

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        db.query(`UPDATE usuarios SET password = ? WHERE email = ?`, [hashedPassword, email], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Error al actualizar la contraseña' });
            }
            res.status(200).json({ message: 'Contraseña actualizada con éxito. Ahora puedes iniciar sesión.' });
        });
    });
};

// Verificar usuario
exports.verificarUsuario = (req, res) => {
    const { email, token } = req.body;

    db.query(`SELECT * FROM tokens WHERE email = ? AND token = ? AND tipo = 'verificacion'`, [email, token], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('Código de verificación incorrecto.');
        }

        db.query(`UPDATE usuarios SET verificado = 1 WHERE email = ?`, [email], (err) => {
            if (err) {
                return res.status(500).send('Error al verificar el usuario.');
            }
            res.status(200).send('Usuario verificado con éxito.');
        });
    });
};

// Iniciar sesión
exports.iniciarSesion = (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error_message: 'Todos los campos son obligatorios' });
    }

    db.query(
        `SELECT usuarios.*, roles.nombre AS rol FROM usuarios 
         JOIN roles ON usuarios.rol_id = roles.id 
         WHERE email = ?`, 
        [email], 
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(400).json({ error_message: 'El usuario no existe.' });
            }

            const user = results[0];
            if (!bcrypt.compareSync(password, user.password)) {
                return res.status(400).json({ error_message: 'Contraseña incorrecta.' });
            }

            if (!user.verificado) {
                return res.status(400).json({ error_message: 'El usuario no ha sido verificado.' });
            }

            req.session.nombreUsuario = user.nombre;
            req.session.emailUsuario = user.email;
            req.session.rol = user.rol;

            res.status(200).json({ success: true, rol: user.rol });
        }
    );
};

// Obtener datos del perfil del usuario
exports.obtenerPerfil = (req, res) => {
    if (!req.session.emailUsuario) {
        return res.status(401).json({ mensaje: 'No ha iniciado sesión' });
    }

    db.query(
        `SELECT usuarios.nombre, usuarios.email, roles.nombre AS rol FROM usuarios 
         JOIN roles ON usuarios.rol_id = roles.id 
         WHERE usuarios.email = ?`, 
        [req.session.emailUsuario], 
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).send('Usuario no encontrado');
            }
            res.json(results[0]);
        }
    );
};

// Actualizar datos del perfil del usuario
exports.actualizarPerfil = (req, res) => {
    const { nombre, currentPassword, newPassword } = req.body;

    if (!req.session.emailUsuario) {
        return res.status(401).send('No ha iniciado sesión');
    }

    db.query(`SELECT * FROM usuarios WHERE email = ?`, [req.session.emailUsuario], (err, results) => {
        if (err || results.length === 0) {
            return res.status(400).send('Error al encontrar el usuario');
        }

        const user = results[0];
        if (!bcrypt.compareSync(currentPassword, user.password)) {
            return res.status(400).send('Contraseña incorrecta');
        }

        const hashedPassword = newPassword ? bcrypt.hashSync(newPassword, 10) : user.password;

        db.query(`UPDATE usuarios SET nombre = ?, password = ? WHERE email = ?`,
            [nombre, hashedPassword, user.email],
            (err) => {
                if (err) {
                    return res.status(500).send('Error al actualizar el perfil');
                }
                res.send('Perfil actualizado con éxito');
            }
        );
    });
};

// Cerrar sesión
exports.cerrarSesion = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Error al cerrar la sesión');
        }
        res.redirect('/');
    });
};
