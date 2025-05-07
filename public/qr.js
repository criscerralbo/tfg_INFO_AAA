document.addEventListener('DOMContentLoaded', () => {
  const img  = document.getElementById('qrImg');
  const link = document.getElementById('directLink');
    // --- Logout modal ---
  const logoutButton = document.getElementById('logout-button');
  const cancelLogout = document.getElementById('cancelLogout');
  const closeModal = document.getElementById('closeModal');
  const confirmLogout = document.getElementById('confirmLogout');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
  }
  cancelLogout?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
  });
  closeModal?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
  });
  confirmLogout?.addEventListener('click', () => {
    fetch('/usuarios/logout').then(() => window.location.href = '/');
  });

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
