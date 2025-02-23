// controllers/groupController.js

const Group = require('../models/groupModel');

const db = require('../db');


exports.createGroup = (req, res) => {
    console.log('Solicitud recibida para crear grupo:', req.body);

    const { nombre } = req.body;
    const propietarioId = req.session.usuarioId;

    if (!nombre || !propietarioId) {
        return res.status(400).json({ error: 'Faltan datos para crear el grupo' });
    }

    // Verificar si el nombre del grupo ya existe (puedes decidir si es global o solo del profesor)
    db.query(`SELECT id FROM grupos WHERE nombre = ?`, [nombre], (err, rows) => {
        if (err) {
            console.error('Error al comprobar nombre de grupo:', err);
            return res.status(500).json({ error: 'Error interno al comprobar nombre de grupo' });
        }

        if (rows.length > 0) {
            // Ya existe un grupo con ese nombre
            return res.status(400).json({ error: 'El nombre del grupo ya existe. Elige otro nombre.' });
        }

        // Si el nombre no existe, proceder a crearlo
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

                db.query(
                    `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado)
                     VALUES (?, ?, 2, 'aprobado')`,
                    [grupoId, propietarioId],
                    (err) => {
                        if (err) {
                            console.error('Error al agregar al propietario como miembro:', err);
                            return res
                              .status(500)
                              .json({ error: 'Grupo creado, pero no se pudo asignar al propietario' });
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

    if (!grupoId || !usuarioId) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
    }

    db.query(
        `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado)
         VALUES (?, ?, ?, 'aprobado')`,
        [grupoId, usuarioId, rolId],
        (err) => {
            if (err) {
                console.error('Error al añadir miembro:', err);
                return res.status(500).json({ error: 'No se pudo añadir el miembro al grupo' });
            }
            res.status(200).json({ success: 'Usuario añadido correctamente' });
        }
    );
};


exports.buscarUsuarios = (req, res) => {
    const { query } = req.query; // Parámetro de búsqueda

    if (!query) {
        return res.status(400).json({ error: 'Se requiere un término de búsqueda' });
    }

    db.query(
        `SELECT u.id, u.nombre, u.email, r.nombre AS rol
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

exports.getJoinRequests = (req, res) => {
    const grupoId = req.params.grupoId;
    db.query(
       `SELECT u.id as usuario_id, u.nombre, r.nombre as rol
        FROM grupo_miembros gm
        JOIN usuarios u ON gm.usuario_id = u.id
        JOIN roles r ON gm.rol_id = r.id
        WHERE gm.grupo_id = ? AND gm.estado = 'pendiente'`,
       [grupoId],
       (err, results) => {
           if (err) {
               console.error('Error al obtener solicitudes:', err);
               return res.status(500).json({ error: 'Error al obtener solicitudes' });
           }
           res.status(200).json(results);
       }
    );
};


// Aceptar solicitud
exports.acceptRequest = (req, res) => {
    const { grupoId, usuarioId } = req.body;

    db.query(
        `UPDATE grupo_miembros SET estado = 'aprobado' WHERE grupo_id = ? AND usuario_id = ?`,
        [grupoId, usuarioId],
        (err) => {
            if (err) {
                console.error('Error al aceptar solicitud:', err);
                return res.status(500).json({ error: 'Error al aceptar solicitud' });
            }
            res.status(200).json({ success: 'Solicitud aceptada correctamente' });
        }
    );
};

// Eliminar miembro
exports.removeMember = (req, res) => {
    const { grupoId, usuarioId } = req.body;
    const userSessionId = req.session.usuarioId;  // ID del usuario logueado

    // Evitar que el profesor se elimine a sí mismo
    if (userSessionId === usuarioId) {
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
/*

// Añadir profesor
exports.addTeacher = (req, res) => {
    const { grupoId, usuarioId } = req.body;

    db.query(
        `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado) VALUES (?, ?, (SELECT id FROM roles WHERE nombre = 'profesor'), 'aprobado')`,
        [grupoId, usuarioId],
        (err) => {
            if (err) {
                console.error('Error al añadir profesor:', err);
                return res.status(500).json({ error: 'Error al añadir profesor' });
            }
            res.status(200).json({ success: 'Profesor añadido correctamente' });
        }
    );
};
*/
exports.eliminarGrupo = (req, res) => {
    const { grupoId } = req.body;
    const usuarioId = req.session.usuarioId; // el ID del usuario en sesión

    if (!grupoId || !usuarioId) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    db.query(`SELECT propietario_id FROM grupos WHERE id = ?`, [grupoId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ error: 'Grupo no encontrado' });
        }

        // Ajuste: comparar como número para evitar discrepancias de tipo
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

    // Verificar si el usuarioId está presente (solo por seguridad)
    if (!propietarioId) {
        return res.status(500).json({ error: 'Error interno: Propietario no definido.' });
    }

    // Consulta para obtener grupos por propietario
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


