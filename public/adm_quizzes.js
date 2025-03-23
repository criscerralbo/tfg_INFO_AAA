document.addEventListener('DOMContentLoaded', () => {
  // Configuración de listeners para el modal de logout
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
  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }
  const confirmLogout = document.getElementById('confirmLogout');
  if (confirmLogout) {
    confirmLogout.addEventListener('click', () => {
      fetch('/usuarios/logout')
        .then(() => window.location.href = '/');
    });
  }

 //document.addEventListener('DOMContentLoaded', () => {
    cargarQuizzes();
  
    document.getElementById('form-nuevo-quiz').addEventListener('submit', async (e) => {
      e.preventDefault();
      const titulo = document.getElementById('titulo').value.trim();
      const descripcion = document.getElementById('descripcion').value.trim();
      if (!titulo) {
        mostrarMensaje('El título es obligatorio', 'error');
        return;
      }
      try {
        const res = await fetch('/api/quizzes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descripcion })
        });
        if (res.ok) {
          mostrarMensaje('Quiz creado correctamente', 'success');
          document.getElementById('form-nuevo-quiz').reset();
          cargarQuizzes();
        } else {
          const data = await res.json();
          mostrarMensaje(data.error, 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al conectar con el servidor', 'error');
      }
    });
  });
  
  async function cargarQuizzes() {
    try {
      const res = await fetch('/api/quizzes');
      if (res.ok) {
        const quizzes = await res.json();
        const lista = document.getElementById('quiz-list');
        lista.innerHTML = '';
        quizzes.forEach(quiz => {
          const li = document.createElement('li');
          li.innerHTML = `
            <strong>${quiz.titulo}</strong> - ${quiz.descripcion || ''}<br>
            <button onclick="location.href='edit_quiz.html?id=${quiz.id}'">Editar</button>
            <button onclick="location.href='play_quiz.html?id=${quiz.id}'">Jugar</button>
            <button onclick="eliminarQuiz(${quiz.id})">Eliminar</button>
          `;
          lista.appendChild(li);
        });
      } else {
        mostrarMensaje('Error al cargar los quizzes', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  }
  
  async function eliminarQuiz(id) {
    if (confirm('¿Eliminar este quiz?')) {
      try {
        const res = await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
        if (res.ok) {
          mostrarMensaje('Quiz eliminado', 'success');
          cargarQuizzes();
        } else {
          const data = await res.json();
          mostrarMensaje(data.error, 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al eliminar', 'error');
      }
    }
  }
  
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    div.textContent = mensaje;
    div.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
  }
  

