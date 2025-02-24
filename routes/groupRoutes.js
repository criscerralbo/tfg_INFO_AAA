const express = require('express');
const groupController = require('../controllers/groupController');
const db = require('../db'); // IMPORTANTE: Importar la conexión a la base de datos

const router = express.Router();

// Crear un nuevo grupo
router.post('/create', groupController.createGroup);

// Añadir miembro al grupo
router.post('/add-member', groupController.anadirMiembro);

// Añadir una ruta para buscar usuarios
router.get('/buscar-usuarios', groupController.buscarUsuarios);

// Ver solicitudes de unirse a un grupo
router.get('/join-requests/:grupoId', groupController.getJoinRequests);

// Aceptar solicitud de unirse
router.post('/accept-request', groupController.acceptRequest);

// Ruta para rechazar una solicitud de unión
router.post('/rechazar-solicitud', groupController.rechazarSolicitud);

// Eliminar miembro del grupo
router.delete('/remove-member', groupController.removeMember);

// Eliminar un grupo
router.delete('/delete-group', groupController.eliminarGrupo);

// Obtener los grupos creados por el propietario
router.get('/mis-grupos', groupController.getGroupsByOwner);

// Buscar grupos por nombre o identificador
router.get('/buscar-grupos', groupController.buscarGrupos);

// Solicitar unirse a un grupo
router.post('/solicitar-unirse', groupController.solicitarUnirse);

// Obtener los grupos en los que un alumno está matriculado
router.get('/grupos-matriculados', groupController.getGroupsForStudent);

// Ver detalles de un grupo
router.get('/detalles/:id', groupController.getGroupDetails);

module.exports = router;
/*
router.get('/detalles/:id', (req, res) => {
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

            if (results.length === 0 || !results[0].nombre) {
                return res.status(404).json({ error: 'Grupo no encontrado' });
            }

            // Si no hay miembros, incluir al propietario del grupo
            if (!results.some(row => row.miembro_nombre)) {
                db.query(
                    `SELECT u.nombre AS miembro_nombre, u.id as miembro_id, 'Propietario' AS rol
                     FROM usuarios u
                     JOIN grupos g ON g.propietario_id = u.id
                     WHERE g.id = ?`,
                    [grupoId],
                    (err, propietarioResults) => {
                        if (err) {
                            console.error('Error al obtener propietario:', err.message);
                            return res.status(500).json({ error: 'Error interno al obtener propietario' });
                        }

                        const grupo = {
                            // Agregamos id para usarlo en el frontend
                            id: parseInt(grupoId),
                            nombre: results[0].nombre,
                            identificador: results[0].identificador,
                            creado_en: results[0].creado_en,
                            miembros: propietarioResults.map(row => ({
                                nombre: row.miembro_nombre,
                                rol: row.rol,
                                id: row.miembro_id
                            }))
                        };

                        return res.status(200).json(grupo);
                    }
                );
            } else {
                // Construir el objeto del grupo con los miembros existentes
                const grupo = {
                    id: parseInt(grupoId), // IMPORTANTE
                    nombre: results[0].nombre,
                    identificador: results[0].identificador,
                    creado_en: results[0].creado_en,
                    miembros: results
                        .filter(row => row.miembro_nombre)
                        .map(row => ({
                            nombre: row.miembro_nombre,
                            rol: row.rol,
                            id: row.miembro_id
                        }))
                };

                res.status(200).json(grupo);
            }
        }
    );
});
*/