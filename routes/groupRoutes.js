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
