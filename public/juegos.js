//creo que lo tenemos que borrar
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

  const closeModalBtn = document.getElementById('closeModal');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
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

  // --- Lógica para cerrar el modal de juegos al hacer clic fuera de él ---
  window.addEventListener('click', (event) => {
    const gameModal = document.getElementById('game-modal');
    if (event.target === gameModal) {
      closeGameModal();
    }
  });
});

// --- Función para iniciar el juego según el prototipo seleccionado ---
function startGame(gameType) {
  const gameContentDiv = document.getElementById('game-content');
  gameContentDiv.innerHTML = ''; // Limpiar contenido previo

  switch (gameType) {
    case 'quiz':
      gameContentDiv.innerHTML = `
        <h2>Quiz Interactivo</h2>
        <p>Prototipo de Quiz: Responde preguntas sobre odontología.</p>
         <button onclick="window.location.href='ver_tests.html'">  VER MIS QUIZS
        </button>
      `;
      break;
    case 'caso-clinico':
      gameContentDiv.innerHTML = `
        <h2>Caso Clínico</h2>
        <p>Prototipo de Caso Clínico: Resuelve un caso clínico simulado.</p>
        <button onclick="mostrarMensaje('Iniciando Caso Clínico...', 'success')">
          Iniciar Caso Clínico
        </button>
      `;
      break;
    case 'memoria':
      gameContentDiv.innerHTML = `
        <h2>Juego de Memoria</h2>
        <p>Prototipo de Memoria: Pon a prueba tu capacidad para recordar imágenes y términos.</p>
        <button onclick="mostrarMensaje('Iniciando Juego de Memoria...', 'success')">
          Iniciar Juego de Memoria
        </button>
      `;
      break;
    default:
      gameContentDiv.innerHTML = `<p>Juego no disponible.</p>`;
  }

  // Mostrar el modal del juego
  document.getElementById('game-modal').style.display = 'block';
}

// --- Función para cerrar el modal de juegos ---
function closeGameModal() {
  document.getElementById('game-modal').style.display = 'none';
}

// --- IMPORTANTE: esta función coincide con el onclick de la “X” en tu HTML ---
function closeModal() {
  // Llama internamente a la misma función que cierra el modal de juegos
  closeGameModal();
}

// --- Función para mostrar mensajes en la aplicación con colores ---
function mostrarMensaje(mensaje, tipo) {
  const mensajeEstado = document.getElementById('mensaje-estado');
  if (mensajeEstado) {
    mensajeEstado.textContent = mensaje;
    // Asigna la clase CSS según el tipo: 'mensaje-success' para éxito, 'mensaje-error' para error
    mensajeEstado.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    mensajeEstado.style.display = 'block';

    setTimeout(() => {
      mensajeEstado.style.display = 'none';
    }, 4000);
  } else {
    console.log(mensaje);
  }
}
