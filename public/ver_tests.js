document.addEventListener('DOMContentLoaded', () => {
  // --- CONFIGURACIÓN DEL HEADER: LOGOUT, MODAL, ETC. ---
  const logoutButton = document.getElementById('logout-button');
  const cancelLogout = document.getElementById('cancelLogout');
  const closeModal = document.getElementById('closeModal');
  const confirmLogout = document.getElementById('confirmLogout');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
  }
  if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }
  if (confirmLogout) {
    confirmLogout.addEventListener('click', () => {
      fetch('/usuarios/logout')
        .then(() => window.location.href = '/');
    });
  }
  
  fetch('/api/tests/mis-tests')  // <--- OJO: /api/tests en lugar de /api/quizzes
    .then(res => res.json())
    .then(tests => {
      const ul = document.getElementById('lista-tests-asignados'); 
      // O el ID que uses en tu HTML
      if (!Array.isArray(tests) || tests.length === 0) {
        ul.innerHTML = '<li>No tienes tests asignados.</li>';
        return;
      }
      tests.forEach(t => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>${t.titulo}</strong>
          <button onclick="irARealizarTest(${t.id})">Realizar</button>
        `;
        ul.appendChild(li);
      });
    })
    .catch(err => {
      console.error(err);
      mostrarMensaje('Error al cargar tests', 'error');
    });
});

function irARealizarTest(testId) {
  window.location.href = `realizar_test.html?testId=${testId}`;
}

function mostrarMensaje(mensaje, tipo) {
  const div = document.getElementById('mensaje-estado');
  div.textContent = mensaje;
  div.className = (tipo === 'success') ? 'mensaje-success' : 'mensaje-error';
  div.style.display = 'block';
  setTimeout(() => {
    div.style.display = 'none';
  }, 4000);
}
