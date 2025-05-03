const axios  = require('axios');
const QRCode = require('qrcode');

// Lee la API local de ngrok para extraer public_url
async function fetchNgrokUrl() {
  try {
    const { data } = await axios.get('http://127.0.0.1:4040/api/tunnels');
    // buscamos un túnel HTTP o HTTPS
    const tun = data.tunnels.find(t => t.proto==='https' || t.proto==='http');
    return tun ? tun.public_url : null;
  } catch (err) {
    console.warn('ngrok API no disponible:', err.message);
    return null;
  }
}

// /api/ngrok-url → { url: "https://xxxx.ngrok.io" }
exports.getNgrokUrl = async (req, res) => {
  const url = await fetchNgrokUrl();
  if (!url) return res.status(500).json({ error:'ngrok no arrancado' });
  res.json({ url });
};

// /api/qr → image/png del QR apuntando a la URL correcta
exports.getQrPng = async (req, res) => {
  try {
    let destino = await fetchNgrokUrl();
    if (!destino) {
      // fallback a localhost
      destino = `${req.protocol}://${req.get('host')}/`;
    }
    // generamos buffer PNG
    const pngBuffer = await QRCode.toBuffer(destino, {
      type:   'png',
      width:  200,
      margin: 2
    });
    res.set('Content-Type','image/png');
    res.send(pngBuffer);
  } catch (err) {
    console.error('Error generando QR:', err);
    res.status(500).send('Error en QR');
  }
};
