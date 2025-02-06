const express = require('express');
const groupController = require('../controllers/groupController');
const db = require('../db'); // IMPORTANTE: Importar la conexión a la base de datos

const router = express.Router();

// Crear grupo (sin middleware de autenticación)
router.post('/create', groupController.createGroup);



// Ruta protegida para obtener grupos del profesor
router.get('/mis-grupos', groupController.getGroupsByOwner);

// Nuevas rutas
router.post('/add-member', groupController.addMember);           // Añadir miembro manualmente
router.put('/accept-request', groupController.acceptRequest);    // Aceptar solicitud de alumno
router.delete('/remove-member', groupController.removeMember);   // Eliminar miembro del grupo
router.post('/add-teacher', groupController.addTeacher);         // Añadir profesor al grupo

router.get('/buscar-usuarios', groupController.buscarUsuarios);
router.post('/add-member', groupController.anadirMiembro);

module.exports = router;

router.get('/detalles/:id', (req, res) => {
    const grupoId = req.params.id;

    db.query(
        `SELECT g.nombre, g.identificador, g.creado_en, 
                u.nombre AS miembro_nombre, r.nombre AS rol
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
                    `SELECT u.nombre AS miembro_nombre, 'Propietario' AS rol
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
                            nombre: results[0].nombre,
                            identificador: results[0].identificador,
                            creado_en: results[0].creado_en,
                            miembros: propietarioResults.map(row => ({
                                nombre: row.miembro_nombre,
                                rol: row.rol
                            }))
                        };

                        return res.status(200).json(grupo);
                    }
                );
            } else {
                // Construir el objeto del grupo con los miembros existentes
                const grupo = {
                    nombre: results[0].nombre,
                    identificador: results[0].identificador,
                    creado_en: results[0].creado_en,
                    miembros: results
                        .filter(row => row.miembro_nombre)
                        .map(row => ({
                            nombre: row.miembro_nombre,
                            rol: row.rol
                        }))
                };

                res.status(200).json(grupo);
            }
        }
    );
});
