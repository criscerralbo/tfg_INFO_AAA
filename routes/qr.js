// routes/qr.js
const express = require('express');
const QRCode = require('qrcode');
const router  = express.Router();

router.get('/api/grupos/:grupoId/qr', async (req, res) => {
  try {
    // La URL que quieres que el móvil abra al escanear
    const urlParaConectar = `${req.protocol}://${req.get('host')}/connect?grupoId=${req.params.grupoId}`;
    // Genera un PNG en base64
    const dataUrl = await QRCode.toDataURL(urlParaConectar, { width: 300 });
    // Manda sólo la imagen
    const img = Buffer.from(dataUrl.split(',')[1], 'base64');
    res.type('png');
    res.send(img);
  } catch (e) {
    console.error('Error generando QR:', e);
    res.status(500).send('Error generando QR');
  }
});

module.exports = router;
