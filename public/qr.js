document.addEventListener('DOMContentLoaded', () => {
  const img  = document.getElementById('qrImg');
  const link = document.getElementById('directLink');

  // 1) carga el QR (el PNG codifica la URL correcta)
  img.src = '/api/qr';

  // 2) pide la URL pública para mostrarla en texto
  fetch('/api/ngrok-url')
    .then(r => r.json())
    .then(json => {
      link.href        = json.url;
      link.textContent = json.url;
    })
    .catch(() => {
      const root = `${location.protocol}//${location.host}/`;
      link.href        = root;
      link.textContent = root;
    });
});
