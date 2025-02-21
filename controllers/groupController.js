// controllers/groupController.js

const Group = require('../models/groupModel');

const db = require('../db');


exports.createGroup = (req, res) => {
    console.log('Solicitud recibida para crear grupo:', req.body);

    const { nombre } = req.body;
    const propietarioId = req.session.usuarioId;

    if (!nombre || !propietarioId) {
        console.error('Datos faltantes:', { nombre, propietarioId });
        return res.status(400).json({ error: 'Faltan datos para crear el grupo' });
    }

    const identificador = Math.random().toString(36).substring(2, 8);

    db.query(
        `INSERT INTO grupos (nombre, identificador, propietario_id) VALUES (?, ?, ?)`,
        [nombre, identificador, propietarioId],
        (err, result) => {
            if (err) {
                console.error('Error al crear el grupo:', err);
                return res.status(500).json({ error: 'Error al crear el grupo' });
            }

            console.log('Grupo creado con éxito, ID:', result.insertId);

            const grupoId = result.insertId;

            db.query(
                `INSERT INTO grupo_miembros (grupo_id, usuario_id, rol_id, estado) VALUES (?, ?, ?, 'aprobado')`,
                [grupoId, propietarioId, 2],
                (err) => {
                    if (err) {
                        console.error('Error al agregar al propietario como miembro:', err);
                        return res.status(500).json({ error: 'Grupo creado, pero no se pudo asignar al propietario' });
                    }
                    res.status(201).json({ success: 'Grupo creado con éxito', codigo: identificador });
                }
            );
        }
    );
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
        `SELECT id, nombre, email 
         FROM usuarios 
         WHERE nombre LIKE ? OR email LIKE ? 
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

        if (results[0].propietario_id !== usuarioId) {
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


