const express       = require('express');
const router        = express.Router();
const groupController = require('../controllers/actGroupController');

// 1) GET /api/grupos
//    Listar todos los grupos del usuario logueado
router.get('/', groupController.getUserGroups);

// 2) GET /api/grupos/:grupoId/recursos
//    Obtener los tests y emparejamientos asignados a ese grupo
router.get('/:grupoId/recursos', groupController.getGroupResources);

module.exports = router;
