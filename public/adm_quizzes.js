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
// =====================
  // QUIZZES
  // =====================

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
          li.className = "quiz-card"; // Asigna la clase para aplicar los estilos de card
          li.innerHTML = `
            <div class="quiz-card-title">${quiz.titulo}</div>
            <div class="quiz-card-description">${quiz.descripcion || ''}</div>
            <div class="quiz-card-actions">
              <button class="edit-button" onclick="location.href='edit_quiz.html?id=${quiz.id}'">Editar</button>
              
              <button class="delete-button" onclick="eliminarQuiz(${quiz.id})">Eliminar</button>
            </div>
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
  // Obtén referencias al modal
const confirmModal    = document.getElementById('confirmModal');
const confirmMsg      = document.getElementById('confirmMessage');
const btnConfirmOk    = document.getElementById('confirmAccept');
const btnConfirmNo    = document.getElementById('confirmDecline');
const btnConfirmClose = document.getElementById('confirmClose');

// Función que muestra el modal de confirmación y devuelve una Promise<boolean>
function showConfirm(message) {
  return new Promise(resolve => {
    confirmMsg.textContent = message;
    confirmModal.style.display = 'block';

    // al hacer clic en Aceptar
    btnConfirmOk.onclick = () => {
      confirmModal.style.display = 'none';
      resolve(true);
    };
    // en Cancelar o la X
    btnConfirmNo.onclick = btnConfirmClose.onclick = () => {
      confirmModal.style.display = 'none';
      resolve(false);
    };
  });
}

async function eliminarQuiz(id) {
  const ok = await showConfirm('¿Eliminar este quiz?');
  if (!ok) return;

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
  // =====================
  // EMPAREJAMIENTOS
  // =====================

  cargarEmparejamientos();

  document.getElementById('form-nuevo-emparejamiento').addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('nombreEmp').value.trim();
    const descripcion = document.getElementById('descripcionEmp').value.trim();
    // ya no usamos pares aquí...
  
    try {
      const res = await fetch('/api/profesor/emparejamientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, descripcion, pares: [] })
      });
  
      if (res.ok) {
        mostrarMensaje('Actividad creada con éxito', 'success');
  
        // 1) reseteamos el formulario
        document.getElementById('form-nuevo-emparejamiento').reset();
  
        // 2) recargamos la lista
        cargarEmparejamientos();
      } else {
        const data = await res.json();
        mostrarMensaje(data.error || 'Error al crear la actividad', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    }
  });
  

  async function eliminarEmparejamiento(id) {
    const ok = await showConfirm('¿Eliminar esta actividad?');
    if (!ok) return;
  
    try {
      const res = await fetch(`/api/profesor/emparejamientos/${id}`, { method: 'DELETE' });
      if (res.ok) {
        mostrarMensaje('Actividad eliminada', 'success');
        cargarEmparejamientos();
      } else {
        const data = await res.json();
        mostrarMensaje(data.error, 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al eliminar', 'error');
    }
  }
  

  async function cargarEmparejamientos() {
    try {
      const res = await fetch('/api/profesor/emparejamientos');
      if (!res.ok) throw new Error('Error al obtener emparejamientos');
      const actividades = await res.json();
      const lista = document.getElementById('emparejamientos-list');
      lista.innerHTML = '';
      actividades.forEach(act => {
        const li = document.createElement('li');
        li.innerHTML = `
          <div class="emparejamiento-card-title">${act.nombre}</div>
          <div class="emparejamiento-card-description">${act.descripcion || ''}</div>
          <div class="emparejamiento-card-actions">
            <button onclick="window.location.href='edit_emparejamiento.html?id=${act.id}'">Editar</button>
            <button class="delete-button" onclick="eliminarEmparejamiento(${act.id})">Eliminar</button>
          </div>`;
        lista.appendChild(li);
      }
      );
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al cargar emparejamientos', 'error');
    }
  }

  // =====================
  // MENSAJES
  // =====================
  
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    div.textContent = mensaje;
    div.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
  }
  

