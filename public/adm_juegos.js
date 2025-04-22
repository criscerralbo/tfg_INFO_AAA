document.addEventListener('DOMContentLoaded', () => {
  // --- Lógica para el modal de cierre de sesión ---
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
  }

  const cancelLogout = document.getElementById('cancelLogout');
  if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }

  const closeLogoutBtn = document.getElementById('closeModal');
  if (closeLogoutBtn) {
    closeLogoutBtn.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }

  const confirmLogout = document.getElementById('confirmLogout');
  if (confirmLogout) {
    confirmLogout.addEventListener('click', () => {
      fetch('/usuarios/logout')
        .then(() => {
          window.location.href = '/'; // Redirige a la página de inicio de sesión
        });
    });
  }

  
  
});



/**
 * Muestra un mensaje en pantalla con un color según el tipo (success o error).
 */
function mostrarMensaje(mensaje, tipo) {
  const mensajeEstado = document.getElementById('mensaje-estado');
  if (mensajeEstado) {
    mensajeEstado.textContent = mensaje;
    mensajeEstado.className = (tipo === 'success') ? 'mensaje-success' : 'mensaje-error';
    mensajeEstado.style.display = 'block';

    // Ocultar el mensaje después de 4 segundos
    setTimeout(() => {
      mensajeEstado.style.display = 'none';
    }, 4000);
  } else {
    // Si no existe el contenedor, mostramos en consola
    console.log(`${tipo.toUpperCase()}: ${mensaje}`);
  }
}
