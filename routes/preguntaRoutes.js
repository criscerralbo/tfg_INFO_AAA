// routes/preguntasRoutes.js
const express = require('express');
const router  = express.Router();
const pc      = require('../controllers/preguntaController');
const upload = require('../utils/upload'); // <- Asegúrate de que el path sea correcto

router.get   ('/',                    pc.getPreguntasByQuiz);
router.delete('/:id',                pc.deletePregunta);
router.post   ('/', upload.single('imagen'), pc.createPregunta);
router.put('/:id', upload.single('imagen'), pc.updatePregunta);
module.exports = router;
