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

  // Cerrar el modal de logout al hacer clic fuera de él
  window.addEventListener('click', (event) => {
    const logoutModal = document.getElementById('logoutModal');
    if (event.target === logoutModal) {
      logoutModal.style.display = 'none';
    }
  });

  // Cerrar el modal de administración de juegos al hacer clic fuera de él
  window.addEventListener('click', (event) => {
    const admGameModal = document.getElementById('adm-game-modal');
    if (event.target === admGameModal) {
      closeAdminModal();
    }
  });
});

/**
 * Inicia la administración del tipo de juego seleccionado.
 * Muestra el modal y carga un pequeño prototipo en el contenedor.
 */
function startAdminGame(gameType) {
  const admGameContentDiv = document.getElementById('adm-game-content');
  admGameContentDiv.innerHTML = ''; // Limpia el contenido previo

  switch (gameType) {
    case 'quiz':
      admGameContentDiv.innerHTML = `
        <h2>Administrar Quiz</h2>
        <p>Aquí podrías crear, editar o eliminar quizzes.</p>
        <button onclick="mostrarMensaje('Creando nuevo quiz...', 'success')">
          Crear Nuevo Quiz
        </button>
        <button onclick="verQuizzes()" style="margin-left: 10px;">
          Ver Quizzes
        </button>
      `;
      break;

    case 'caso-clinico':
      admGameContentDiv.innerHTML = `
        <h2>Administrar Caso Clínico</h2>
        <p>Aquí podrías crear, editar o eliminar casos clínicos.</p>
        <button onclick="mostrarMensaje('Creando nuevo caso clínico...', 'success')">
          Crear Caso Clínico
        </button>
      `;
      break;

    case 'memoria':
      admGameContentDiv.innerHTML = `
        <h2>Administrar Juego de Memoria</h2>
        <p>Aquí podrías subir imágenes y crear tableros de memoria.</p>
        <button onclick="mostrarMensaje('Creando nuevo tablero de memoria...', 'success')">
          Crear Juego de Memoria
        </button>
      `;
      break;

    default:
      admGameContentDiv.innerHTML = `<p>Opción de administración no disponible.</p>`;
  }

  // Muestra el modal de administración
  document.getElementById('adm-game-modal').style.display = 'block';
}

/** 
 * Redirige a la pantalla donde se listan los quizzes y se pueden crear preguntas 
 * (nuevo archivo adm_quizzes.html).
 */
function verQuizzes() {
  window.location.href = 'adm_quizzes.html';
}

/** Cierra el modal de administración de juegos. */
function closeAdminModal() {
  document.getElementById('adm-game-modal').style.display = 'none';
}

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
