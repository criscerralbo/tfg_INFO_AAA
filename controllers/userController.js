const db = require('../models/userModel');
const bcrypt = require('bcrypt');
const postmark = require('postmark');
const dbo = require('../db'); // Conexión a la base de datos
// Conectar con Postmark usando tu API Key
const client = new postmark.ServerClient('1c87cd46-32dc-4b31-a451-92175549348f');

exports.getRol = (req, res) => {
    const usuarioId = req.session.usuarioId;

    db.query(
        `SELECT r.nombre AS rol FROM usuarios u 
         JOIN roles r ON u.rol_id = r.id
         WHERE u.id = ?`,
        [usuarioId],
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(500).json({ error: 'Error al obtener el rol' });
            }

            res.json({ rol: results[0].rol });
        }
    );
};


// Registrar usuario
exports.registrarUsuario = (req, res) => {
    const { nombre, email, password, rol } = req.body;
  
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ error_message: 'Todos los campos son obligatorios' });
    }
  
    const emailRegex = /^[a-zA-Z0-9._%+-]+@ucm\.es$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error_message: 'Debe usar un correo institucional (@ucm.es)' });
    }
  
    const hashedPassword = bcrypt.hashSync(password, 10);
    const token = Math.floor(100000 + Math.random() * 900000);
  
    db.query(`SELECT id FROM roles WHERE nombre = ?`, [rol], (err, results) => {
      if (err || results.length === 0) {
        return res.status(400).json({ error_message: 'Rol inválido' });
      }
  
      const rol_id = results[0].id;
  
      db.query(
        `INSERT INTO usuarios (nombre, email, password, rol_id, verificado) VALUES (?, ?, ?, ?, 0)`,
        [nombre, email, hashedPassword, rol_id],
        (err) => {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              return res.status(400).json({ error_message: 'El correo ya está registrado.' });
            }
            return res.status(500).json({ error_message: 'Error al registrar usuario' });
          }
  
          client.sendEmail({
            "From": "ccerralb@ucm.es",
            "To": email,
            "Subject": "Verificación de correo - Gestión de Usuarios",
            "TextBody": `Gracias por registrarte. Tu código de verificación es: ${token}`
          });
  
          db.query(`INSERT INTO tokens (email, token, tipo) VALUES (?, ?, 'verificacion')`, [email, token]);
          res.status(200).json({ success_message: 'Registro exitoso. Por favor, revisa tu correo para verificar tu cuenta, habrá llegado en el spam.' });
        }
      );
    });
  };
  


exports.registrarAdm = async (req, res) => {
    try {
        const { nombre, email, rol } = req.body;
        const password = '12345678'; // Contraseña predeterminada
        const verificado = true; // Usuarios creados por el administrador estarán verificados

        // Validación básica de datos
        if (!nombre || !email || !rol) {
            return res.status(400).json({ error_message: 'Todos los campos son obligatorios.' });
        }

        // Verificar si el usuario ya existe
        dbo.query(`SELECT * FROM usuarios WHERE email = ?`, [email], (err, results) => {
            if (err) {
                console.error('Error al verificar el usuario:', err);
                return res.status(500).json({ error_message: 'Hubo un error al verificar el usuario.' });
            }

            if (results && results.length > 0) {
                // Si el usuario ya existe
                return res.status(400).json({ error_message: 'El correo ya está registrado.' });
            } else {
                // Obtener rol_id desde la tabla roles
                dbo.query(`SELECT id FROM roles WHERE nombre = ?`, [rol], (err, rolResults) => {
                    if (err || rolResults.length === 0) {
                        console.error('Error al obtener el rol_id:', err);
                        return res.status(500).json({ error_message: 'Error al obtener el rol_id para el usuario.' });
                    }

                    const rol_id = rolResults[0].id; // Asignar el id correcto de roles

                    // Hashear la contraseña predeterminada
                    const hashedPassword = bcrypt.hashSync(password, 10);

                    // Crear el usuario sin enviar correo de verificación
                    dbo.query(
                        `INSERT INTO usuarios (nombre, email, password, rol_id, verificado) VALUES (?, ?, ?, ?, ?)`,
                        [nombre, email, hashedPassword, rol_id, verificado],
                        (err) => {
                            if (err) {
                                console.error('Error al crear el usuario:', err);
                                return res.status(500).json({ error_message: 'Hubo un error al crear el usuario.' });
                            }
                            res.status(201).json({ success_message: 'Usuario creado exitosamente.' });
                        }
                    );
                });
            }
        });
    } catch (error) {
        console.error('Error al registrar usuario por el administrador:', error);
        res.status(500).json({ error_message: 'Hubo un error al crear el usuario.' });
    }
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
        return res.status(400).json({ error: 'Código de verificación incorrecto o expirado.' });
      }
  
      db.query(`UPDATE usuarios SET verificado = 1 WHERE email = ?`, [email], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Error al verificar el usuario.' });
        }
        res.status(200).json({ message: 'Usuario verificado con éxito.' });
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
            req.session.rol = user.rol_id;
            req.session.usuarioId = user.id;
            console.log('Sesión iniciada:', req.session);

            res.status(200).json({ success: true, rol: user.rol });
        }
    );
};
exports.obtenerNombreYRol = (req, res) => {
    if (!req.session.emailUsuario) {
        return res.status(401).json({ mensaje: 'No ha iniciado sesión' });
    }

    db.query(
        `SELECT usuarios.nombre, roles.nombre AS rol FROM usuarios
         JOIN roles ON usuarios.rol_id = roles.id
         WHERE usuarios.email = ?`, 
        [req.session.emailUsuario], 
        (err, results) => {
            if (err || results.length === 0) {
                return res.status(404).json({ mensaje: 'Usuario no encontrado' });
            }
            res.json({
                nombreUsuario: results[0].nombre,
                rol: results[0].rol
            });
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

exports.actualizarPerfil = (req, res) => {
    const { nombre, email, currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!req.session.emailUsuario) {
        return res.status(401).send('No ha iniciado sesión');
    }

    // Verificar si el usuario quiere cambiar la contraseña
    if (newPassword || confirmNewPassword) {
        if (newPassword !== confirmNewPassword) {
            return res.status(400).json({ error: 'La nueva contraseña y la confirmación no coinciden' });
        }

        // Verificar que se introdujo la contraseña actual
        if (!currentPassword) {
            return res.status(400).json({ error: 'Debe introducir la contraseña actual para cambiar la contraseña' });
        }

        // Consultar el usuario en la base de datos para verificar la contraseña actual
        db.query(`SELECT * FROM usuarios WHERE email = ?`, [req.session.emailUsuario], (err, results) => {
            if (err || results.length === 0) {
                return res.status(400).send('Error al encontrar el usuario');
            }

            const user = results[0];
            if (!bcrypt.compareSync(currentPassword, user.password)) {
                return res.status(400).send('Contraseña actual incorrecta');
            }

            const hashedPassword = bcrypt.hashSync(newPassword, 10);

            // Actualizar nombre, correo y contraseña
            db.query(`UPDATE usuarios SET nombre = ?, email = ?, password = ? WHERE email = ?`,
                [nombre, email, hashedPassword, user.email],
                (err) => {
                    if (err) {
                        return res.status(500).send('Error al actualizar el perfil');
                    }
                    req.session.emailUsuario = email; // Actualizar el email en la sesión
                    res.send('Perfil actualizado con éxito');
                }
            );
        });
    } else {
        // Si no se va a cambiar la contraseña, solo actualiza el nombre y correo sin pedir la contraseña
        db.query(`UPDATE usuarios SET nombre = ?, email = ? WHERE email = ?`,
            [nombre, email, req.session.emailUsuario],
            (err) => {
                if (err) {
                    return res.status(500).send('Error al actualizar el perfil');
                }
                req.session.emailUsuario = email; // Actualizar el email en la sesión
                res.send('Perfil actualizado con éxito');
            }
        );
    }
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

exports.obtenerTodosLosUsuarios = (req, res) => {
    db.query(`
        SELECT usuarios.id, usuarios.nombre, usuarios.email, usuarios.verificado, roles.nombre AS rol 
        FROM usuarios 
        JOIN roles ON usuarios.rol_id = roles.id
    `, (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al obtener los usuarios' });
        res.json(results);
    });
};

// Actualizar el usuario con nombre, email y rol
exports.actualizarUsuario = (req, res) => {
    const { id } = req.params;
    const { nombre, email, rol } = req.body;

    // Obtener el rol_id correspondiente al nombre del rol proporcionado
    db.query('SELECT id FROM roles WHERE nombre = ?', [rol], (err, results) => {
        if (err || results.length === 0) {
            return res.status(500).json({ error: 'Error al obtener el rol' });
        }

        const rol_id = results[0].id;

        // Actualizar el usuario con el nuevo nombre, email y rol_id
        db.query('UPDATE usuarios SET nombre = ?, email = ?, rol_id = ? WHERE id = ?', [nombre, email, rol_id, id], (err, results) => {
            if (err) return res.status(500).json({ error: 'Error al actualizar usuario' });
            res.json({ message: 'Usuario actualizado' });
        });
    });
};
exports.verificarUsuarioAdm = (req, res) => {
    const { id } = req.params;

    db.query('UPDATE usuarios SET verificado = 1 WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al verificar usuario' });
        res.json({ message: 'Usuario verificado' });
    });
};

exports.eliminarUsuario= (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Error al eliminar usuario' });
        res.json({ message: 'Usuario eliminado' });
    });
};

exports.eliminarCuenta = (req, res) => {
    if (!req.session.emailUsuario) {
        return res.status(401).json({ error: 'No ha iniciado sesión' });
    }

    const email = req.session.emailUsuario;

    // Eliminar usuario de la base de datos
    db.query('DELETE FROM usuarios WHERE email = ?', [email], (err, result) => {
        if (err) {
            console.error('Error al eliminar la cuenta:', err);
            return res.status(500).json({ error: 'Error al eliminar la cuenta' });
        }

        // Comprobar si la cuenta fue realmente eliminada
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Destruir la sesión tras eliminar la cuenta
        req.session.destroy(err => {
            if (err) {
                console.error('Error al cerrar sesión:', err);
                return res.status(500).json({ error: 'Error al cerrar sesión después de eliminar la cuenta' });
            }
            res.status(200).json({ message: 'Cuenta eliminada con éxito' });
        });
    });
};

