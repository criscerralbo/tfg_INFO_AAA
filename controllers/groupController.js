const Group = require('../models/groupModel');
const db = require('../db');

exports.createGroup = (req, res) => {
    console.log('Solicitud recibida para crear grupo:', req.body);

    const { nombre } = req.body;
    const propietarioId = req.session.usuarioId;

    if (!nombre || !propietarioId) {
        return res.status(400).json({ error: 'Faltan datos para crear el grupo' });
    }

    // Verificar si el nombre del grupo ya existe
    db.query(`SELECT id FROM grupos WHERE nombre = ?`, [nombre], (err, rows) => {
        if (err) {
            console.error('Error al comprobar nombre de grupo:', err);
            return res.status(500).json({ error: 'Error interno al comprobar nombre de grupo' });
        }

        if (rows.length > 0) {
            // Ya existe un grupo con ese nombre
            return res.status(400).json({ error: 'El nombre del grupo ya existe. Elige otro nombre.' });
        }

        // Crear el grupo
        const identificador = Math.random().toString(36).substring(2, 8);

        db.query(
            `INSERT INTO grupos (nombre, identificador, propietario_id) VALUES (?, ?, ?)`,
            [nombre, identificador, propietarioId],
            (err, result) => {
                if (err) {
                    console.error('Error al crear el grupo:', err);
                    return res.status(500).json({ error: 'Error al crear el grupo' });
                }

                const grupoId = result.insertId;

                // Añadir al propietario como miembro automáticamente
                db.query(
                    `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado) VALUES (?, ?, 2, 'aprobado')`,
                    [grupoId, propietarioId],
                    (err) => {
                        if (err) {
                            console.error('Error al agregar al propietario como miembro:', err);
                            return res.status(500).json({ error: 'Grupo creado, pero no se pudo asignar al propietario' });
                        }
                        res.status(201).json({
                            success: 'Grupo creado con éxito',
                            codigo: identificador
                        });
                    }
                );
            }
        );
    });
};

exports.anadirMiembro = (req, res) => {
    const { grupoId, usuarioId, rolId } = req.body;
    console.log("Datos recibidos:", grupoId, usuarioId, rolId);

    if (!grupoId || !usuarioId || !rolId) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    // Comprobar si el usuario ya está en el grupo
    db.query(
        `SELECT * FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?`,
        [grupoId, usuarioId],
        (err, rows) => {
            if (err) {
                console.error('Error al comprobar si el usuario está en el grupo:', err);
                return res.status(500).json({ error: 'Error al comprobar miembro' });
            }

            // Si el usuario ya está en el grupo, devolver un error
            if (rows.length > 0) {
                return res.status(400).json({ error: 'El usuario ya está en el grupo' });
            }

            // Si no está, añadir al usuario
            db.query(
                `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado) VALUES (?, ?, ?, 'aprobado')`,
                [grupoId, usuarioId, rolId],
                (err) => {
                    if (err) {
                        console.error('Error al añadir miembro:', err);
                        return res.status(500).json({ error: 'No se pudo añadir el miembro al grupo' });
                    }
                    res.status(200).json({ success: 'Usuario añadido correctamente' });
                }
            );
        }
    );
};

exports.getJoinRequests = (req, res) => {
    const grupoId = req.params.grupoId;
    db.query(
        `SELECT u.id as usuario_id, u.nombre, r.nombre as rol
         FROM solicitudes_grupo sg
         JOIN usuarios u ON sg.usuario_id = u.id
         JOIN roles r ON u.rol_id = r.id
         WHERE sg.grupo_id = ? AND sg.estado = 'pendiente'`,
        [grupoId],
        (err, results) => {
            if (err) {
                console.error('Error al obtener solicitudes:', err);
                return res.status(500).json({ error: 'Error al obtener solicitudes' });
            }
            res.status(200).json(results); // Devolver los resultados de la consulta
        }
    );
    
};
exports.rechazarSolicitud = (req, res) => {
    const { grupoId, usuarioId } = req.body;

    // Iniciar una transacción para asegurar que todo se ejecute correctamente
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar la transacción:', err);
            return res.status(500).json({ error: 'Error al iniciar la transacción' });
        }

        // 1. Eliminar la solicitud de la tabla 'solicitudes_grupo'
        db.query(
            `DELETE FROM solicitudes_grupo WHERE grupo_id = ? AND usuario_id = ? AND estado = 'pendiente'`,
            [grupoId, usuarioId],
            (err) => {
                if (err) {
                    console.error('Error al eliminar solicitud:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error al rechazar solicitud' });
                    });
                }

                // Si todo ha ido bien, confirmar la transacción
                db.commit((err) => {
                    if (err) {
                        console.error('Error al confirmar la transacción:', err);
                        return db.rollback(() => {
                            res.status(500).json({ error: 'Error al rechazar la solicitud' });
                        });
                    }

                    res.status(200).json({ success: 'Solicitud rechazada correctamente' });
                });
            }
        );
    });
};

  

exports.acceptRequest = (req, res) => {
    const { grupoId, usuarioId } = req.body;

    // Iniciar una transacción para asegurar que todo se ejecute correctamente
    db.beginTransaction((err) => {
        if (err) {
            console.error('Error al iniciar la transacción:', err);
            return res.status(500).json({ error: 'Error al iniciar la transacción' });
        }

        // 1. Obtener el rol del usuario desde la tabla 'usuarios'
        db.query(
            `SELECT rol_id FROM usuarios WHERE id = ?`,
            [usuarioId],
            (err, results) => {
                if (err) {
                    console.error('Error al obtener el rol del usuario:', err);
                    return db.rollback(() => {
                        res.status(500).json({ error: 'Error al obtener el rol del usuario' });
                    });
                }

                if (results.length === 0) {
                    return db.rollback(() => {
                        res.status(404).json({ error: 'Usuario no encontrado' });
                    });
                }

                const rolId = results[0].rol_id;

                // 2. Añadir al usuario como miembro en la tabla 'grupo_miembros'
                db.query(
                    `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado)
                     VALUES (?, ?, ?, 'aprobado')`,
                    [grupoId, usuarioId, rolId],
                    (err) => {
                        if (err) {
                            console.error('Error al agregar miembro:', err);
                            return db.rollback(() => {
                                res.status(500).json({ error: 'Error al agregar miembro al grupo' });
                            });
                        }

                        // 3. Eliminar la solicitud de la tabla 'solicitudes_grupo'
                        db.query(
                            `DELETE FROM solicitudes_grupo WHERE grupo_id = ? AND usuario_id = ?`,
                            [grupoId, usuarioId],
                            (err) => {
                                if (err) {
                                    console.error('Error al eliminar solicitud:', err);
                                    return db.rollback(() => {
                                        res.status(500).json({ error: 'Error al eliminar solicitud' });
                                    });
                                }

                                // Confirmar la transacción si todo ha ido bien
                                db.commit((err) => {
                                    if (err) {
                                        console.error('Error al confirmar la transacción:', err);
                                        return db.rollback(() => {
                                            res.status(500).json({ error: 'Error al aceptar la solicitud' });
                                        });
                                    }

                                    res.status(200).json({ success: 'Solicitud aceptada correctamente' });
                                });
                            }
                        );
                    }
                );
            }
        );
    });
};


exports.removeMember = (req, res) => {
    const { grupoId, usuarioId } = req.body;
    const userSessionId = req.session.usuarioId;  // ID del usuario logueado

    // Evitar que el profesor se elimine a sí mismo
    if (Number(userSessionId) === Number(usuarioId)) {
        return res.status(403).json({ error: 'No puedes eliminarte a ti mismo.' });
    }

    db.query(
        `DELETE FROM grupo_miembros WHERE grupo_id = ? AND usuario_id = ?`,
        [grupoId, usuarioId],
        (err) => {
            if (err) {
                console.error('Error al eliminar miembro:', err);
                return res.status(500).json({ error: 'Error al eliminar miembro' });
            }
            res.status(200).json({ success: 'Miembro eliminado correctamente' });
        }
    );
};

exports.eliminarGrupo = (req, res) => {
    const { grupoId } = req.body;
    const usuarioId = req.session.usuarioId;

    if (!grupoId || !usuarioId) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    db.query(`SELECT propietario_id FROM grupos WHERE id = ?`, [grupoId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        if (Number(results[0].propietario_id) !== Number(usuarioId)) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar este grupo.' });
        }

        db.query(`DELETE FROM grupos WHERE id = ?`, [grupoId], (err) => {
            if (err) {
                console.error('Error al eliminar el grupo:', err);
                return res.status(500).json({ error: 'Error al eliminar el grupo.' });
            }
            res.status(200).json({ success: 'Grupo eliminado correctamente.' });
        });
    });
};

exports.getGroupsByOwner = (req, res) => {
    const propietarioId = req.session.usuarioId;

    if (!propietarioId) {
        return res.status(500).json({ error: 'Error interno: Propietario no definido.' });
    }

    db.query(
        `SELECT id, nombre, identificador, creado_en 
         FROM grupos 
         WHERE propietario_id = ?`, 
        [propietarioId],
        (err, results) => {
            if (err) {
                console.error('Error al obtener grupos:', err);
                return res.status(500).json({ error: 'Error al obtener grupos' });
            }
            res.status(200).json(results);
        }
    );
};
exports.buscarUsuarios = (req, res) => {
    const { query } = req.query; // Parámetro de búsqueda

    if (!query) {
        return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }

    db.query(
        `SELECT u.id, u.nombre, u.email, r.id AS rolId, r.nombre AS rol
         FROM usuarios u
         JOIN roles r ON u.rol_id = r.id
         WHERE u.nombre LIKE ? OR u.email LIKE ? 
         LIMIT 10`,
        [`%${query}%`, `%${query}%`],
        (err, results) => {
            if (err) {
                console.error('Error al buscar usuarios:', err);
                return res.status(500).json({ error: 'Error al buscar usuarios' });
            }
            res.status(200).json(results);
        }
    );
};

exports.buscarGrupos = (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }

    db.query(
        `SELECT id, nombre, identificador FROM grupos WHERE nombre LIKE ? OR identificador LIKE ? LIMIT 10`,
        [`%${query}%`, `%${query}%`],
        (err, results) => {
            if (err) {
                console.error('Error al buscar grupos:', err);
                return res.status(500).json({ error: 'Error al buscar grupos' });
            }
            res.status(200).json(results);
        }
    );
};

exports.solicitarUnirse = (req, res) => {
    const { grupoId } = req.body;
    const usuarioId = req.session.usuarioId;

    if (!grupoId || !usuarioId) {
        return res.status(400).json({ error: 'Datos incompletos para la solicitud' });
    }

    db.query(
        `INSERT INTO solicitudes_grupo (grupo_id, usuario_id, estado) VALUES (?, ?, 'pendiente')`,
        [grupoId, usuarioId],
        (err) => {
            if (err) {
                console.error('Error al solicitar unirse al grupo:', err);
                return res.status(500).json({ error: 'Error al enviar la solicitud' });
            }
            res.status(200).json({ success: 'Solicitud enviada correctamente' });
        }
    );
};

exports.getGroupsForStudent = (req, res) => {
    const usuarioId = req.session.usuarioId;

    db.query(
        `SELECT g.id, g.nombre, g.identificador 
         FROM grupos g
         JOIN grupo_miembros gm ON g.id = gm.grupo_id
         WHERE gm.usuario_id = ? AND gm.estado = 'aprobado'`,
        [usuarioId],
        (err, results) => {
            if (err) {
                console.error('Error al obtener los grupos matriculados:', err);
                return res.status(500).json({ error: 'Error interno al obtener grupos' });
            }

            res.status(200).json(results);
        }
    );
};

exports.getGroupDetails = (req, res) => {
    const grupoId = req.params.id;

    db.query(
        `SELECT g.nombre, g.identificador, g.creado_en, 
                u.nombre AS miembro_nombre, u.id as miembro_id, r.nombre AS rol
         FROM grupos g
         LEFT JOIN grupo_miembros gm ON g.id = gm.grupo_id
         LEFT JOIN usuarios u ON gm.usuario_id = u.id
         LEFT JOIN roles r ON gm.rol_id = r.id
         WHERE g.id = ?`,
        [grupoId],
        (err, results) => {
            if (err) {
                console.error('Error en la consulta SQL:', err.message);
                return res.status(500).json({ error: 'Error interno del servidor' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Grupo no encontrado' });
            }

            const grupo = {
                id: parseInt(grupoId),
                nombre: results[0].nombre,
                identificador: results[0].identificador,
                creado_en: results[0].creado_en,
                miembros: results.map(row => ({
                    nombre: row.miembro_nombre,
                    rol: row.rol,
                    id: row.miembro_id
                }))
            };

            res.status(200).json(grupo);
        }
    );
};
