document.addEventListener('DOMContentLoaded', () => {
    // Configuración del header: logout, modal, etc.
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
  
    // Cargar las listas de quizzes y grupos
    cargarMisQuizzes();
    cargarPublicQuizzes();
    cargarQuizSelect();
    cargarGrupos();
    cargarAsignaciones();
  
    // Asignación de quiz a grupo (usando input con datalist)
    const formAsignar = document.getElementById('form-asignar-quiz');
    formAsignar.addEventListener('submit', async (e) => {
      e.preventDefault();
      const quizId = document.getElementById('quiz-select').value;
      const grupo = document.getElementById('grupo-input').value.trim();
      if (!quizId || !grupo) {
        mostrarMensaje('Completa todos los campos para asignar el quiz.', 'error');
        return;
      }
      try {
        const res = await fetch('/api/pubQuizzes/asignar', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ quizId, grupo })
        });
        const data = await res.json();
        if (res.ok) {
          mostrarMensaje('Quiz asignado correctamente.', 'success');
          cargarAsignaciones();
          formAsignar.reset();
        } else {
          mostrarMensaje(data.error || 'Error al asignar el quiz.', 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al conectar con el servidor.', 'error');
      }
    });
  });
  
  // Función para mostrar mensajes de estado
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    div.textContent = mensaje;
    div.className = (tipo === 'success') ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => {
      div.style.display = 'none';
    }, 4000);
  }
  
  // Cargar los quizzes propios del profesor
  async function cargarMisQuizzes() {
    try {
      const res = await fetch('/api/pubQuizzes/mis');
      if (res.ok) {
        const quizzes = await res.json();
        const lista = document.getElementById('lista-mis-quizzes');
        lista.innerHTML = '';
        quizzes.forEach(quiz => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${quiz.titulo}</strong> - ${quiz.descripcion || ''}`;
          // Si el quiz no es público, se muestra un botón para hacerlo público
          if (!quiz.publico) {
            const btnHacerPublico = document.createElement('button');
            btnHacerPublico.textContent = 'Hacer público';
            btnHacerPublico.addEventListener('click', () => hacerPublico(quiz.id));
            li.appendChild(btnHacerPublico);
          } else {
            li.innerHTML += ' <em>(Público)</em>';
          }
          lista.appendChild(li);
        });
      } else {
        mostrarMensaje('Error al cargar mis quizzes.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor.', 'error');
    }
  }
  
  // Cargar los quizzes públicos (de otros profesores)
  async function cargarPublicQuizzes() {
    try {
      const res = await fetch('/api/pubQuizzes/publicos');
      if (res.ok) {
        const quizzes = await res.json();
        const lista = document.getElementById('lista-public-quizzes');
        lista.innerHTML = '';
        quizzes.forEach(quiz => {
          const li = document.createElement('li');
          li.innerHTML = `<strong>${quiz.titulo}</strong> - ${quiz.descripcion || ''} 
            <button onclick="publicarQuiz(${quiz.id})">Guardar en mi repertorio</button>`;
          lista.appendChild(li);
        });
      } else {
        mostrarMensaje('Error al cargar quizzes públicos.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor.', 'error');
    }
  }
  
  // Función para duplicar (publicar) un quiz en el repertorio del profesor
  async function publicarQuiz(quizId) {
    if (!confirm('¿Deseas guardar este quiz en tu repertorio?')) return;
    try {
      const res = await fetch('/api/pubQuizzes/publicar', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ quizId })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('Quiz guardado en tu repertorio.', 'success');
        // Actualizar las listas
        cargarMisQuizzes();
        cargarPublicQuizzes();
        cargarQuizSelect();
       
      } else {
        mostrarMensaje(data.error || 'Error al guardar el quiz.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor.', 'error');
    }
  }
  
  // Función para cargar las opciones del select para asignar un quiz a un grupo
  async function cargarQuizSelect() {
    try {
      const res = await fetch('/api/pubQuizzes/mis');
      if (res.ok) {
        const quizzes = await res.json();
        const select = document.getElementById('quiz-select');
        select.innerHTML = '';
        quizzes.forEach(quiz => {
          const option = document.createElement('option');
          option.value = quiz.id;
          option.textContent = quiz.titulo;
          select.appendChild(option);
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
  
  /// Función para cargar los grupos (usando el endpoint de tus grupos)
async function cargarGrupos() {
  try {
    const res = await fetch('/api/groups/mis-grupos', {
      method: 'GET',
      credentials: 'include'
    });
    if (res.ok) {
      const grupos = await res.json();
      const datalist = document.getElementById('grupo-list');
      datalist.innerHTML = '';
      grupos.forEach(grupo => {
        const option = document.createElement('option');
        option.value = grupo.id;  // Se usa el id como valor
        option.label = `${grupo.identificador} - ${grupo.nombre}${grupo.descripcion ? ' (' + grupo.descripcion + ')' : ''}`;
        datalist.appendChild(option);
      });
    } else {
      console.error('Error al cargar grupos.');
    }
  } catch (err) {
    console.error(err);
  }
}
async function cargarAsignaciones() {
  try {
    const res = await fetch('/api/pubQuizzes/asignaciones');
    if (res.ok) {
      const grupos = await res.json(); 
      // Estructura: [ { id, nombre, quizzes: [ { id, titulo }, ... ] }, ... ]

      const contenedor = document.getElementById('contenedor-asignaciones');
      contenedor.innerHTML = '';

      grupos.forEach(grupo => {
        // Creamos un div para cada grupo
        const grupoDiv = document.createElement('div');
        grupoDiv.classList.add('grupo-asignado');

        // Título del grupo
        const tituloGrupo = document.createElement('h3');
        tituloGrupo.textContent = `Grupo: ${grupo.nombre}`;
        grupoDiv.appendChild(tituloGrupo);

        // Lista de quizzes
        const ul = document.createElement('ul');
        grupo.quizzes.forEach(q => {
          const li = document.createElement('li');
          li.textContent = q.titulo;
          ul.appendChild(li);
        });
        grupoDiv.appendChild(ul);

        contenedor.appendChild(grupoDiv);
      });
    } else {
      mostrarMensaje('Error al cargar las asignaciones.', 'error');
    }
  } catch (err) {
    console.error(err);
    mostrarMensaje('Error al conectar con el servidor.', 'error');
  }
}
  
  // Función para hacer público un quiz propio
  async function hacerPublico(quizId) {
    try {
      const res = await fetch('/api/pubQuizzes/hacerPublico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('Quiz publicado correctamente.', 'success');
        cargarMisQuizzes();
        cargarQuizSelect();
      } else {
        mostrarMensaje(data.error || 'Error al hacer público el quiz.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor.', 'error');
    }
  }
  