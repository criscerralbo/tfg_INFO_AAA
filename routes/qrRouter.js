const express = require('express');
const router  = express.Router();
const qrCtrl  = require('../controllers/qrController');

// PNG del QR (200×200) apuntando a tu túnel o a localhost si no hay túnel
router.get('/api/qr',       qrCtrl.getQrPng);
// JSON con la URL pública de ngrok (por si quieres usarla en texto)
router.get('/api/ngrok-url', qrCtrl.getNgrokUrl);

module.exports = router;
