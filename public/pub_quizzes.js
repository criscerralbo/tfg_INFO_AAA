////////////copia sec
  // === Modal genérico ===
  function mostrarModalConfirmacion(texto, onConfirm) {
    const modal = document.getElementById('actionConfirmModal');
    const textoElem = document.getElementById('actionConfirmText');
    const btnConfirmar = document.getElementById('confirmActionButton');
    const btnCancelar = document.getElementById('cancelActionButton');
    const btnCerrar = document.getElementById('closeActionModal');
  
    textoElem.textContent = texto;
    modal.style.display = 'block';
  
    const cerrarModal = () => {
      modal.style.display = 'none';
      btnConfirmar.onclick = null;
    };
  
    btnCancelar.onclick = cerrarModal;
    btnCerrar.onclick = cerrarModal;
    btnConfirmar.onclick = () => {
      cerrarModal();
      onConfirm();
    };
  }
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
    
    const formAsignar = document.getElementById('form-asignar-quiz');
    formAsignar?.addEventListener('submit', (e) => {
      e.preventDefault();
      const quizId = document.getElementById('quiz-select').value;
      const grupo = document.getElementById('grupo-input').value.trim();
      if (!quizId || !grupo) return mostrarMensaje('Completa todos los campos.', 'error');
  
      mostrarModalConfirmacion('Asignar este quiz al grupo seleccionado?', async () => {
        try {
          const res = await fetch('/api/pubQuizzes/asignar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quizId, grupo })
          });
          const data = await res.json();
          if (res.ok) {
            mostrarMensaje('Quiz asignado correctamente.', 'success');
            cargarAsignaciones();
            formAsignar.reset();
          } else mostrarMensaje(data.error || 'Error al asignar.', 'error');
        } catch (err) {
          console.error(err);
          mostrarMensaje('Error al conectar.', 'error');
        }
      });
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
    
   // === Quizzes ===
   async function cargarMisQuizzes() {
    try {
      const res = await fetch('/api/pubQuizzes/mis');
      const lista = document.getElementById('lista-mis-quizzes');
      lista.innerHTML = '';
      const quizzes = await res.json();
      quizzes.forEach(q => {
        const li = document.createElement('li');
        li.className = 'quiz-card';
        li.innerHTML = `
          <div class="quiz-card-title"><strong>${q.titulo}</strong></div>
          <div class="quiz-card-description">
            ${q.descripcion || ''} ${q.publico ? '<em>(Público)</em>' : ''}
          </div>
          <div class="quiz-card-actions">
            <button type="button" class="edit-button" onclick="mostrarModalConfirmacion('Editar este quiz?', () => window.location.href='edit_quiz.html?id=${q.id}')">Editar</button>
            ${
              q.publico
                ? `<button class="public-button" type="button" onclick="mostrarModalConfirmacion('¿Hacer privado este quiz?', () => hacerPrivado(${q.id}))">Hacer privado</button>`
                : `<button class="public-button" type="button" onclick="mostrarModalConfirmacion('¿Hacer público este quiz?', () => hacerPublico(${q.id}))">Hacer público</button>`
            }
          </div>
        `;
        lista.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar.', 'error');
    }
  }
  
    
  async function hacerPrivado(quizId) {
    try {
      const res = await fetch('/api/pubQuizzes/hacerPrivado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('Quiz marcado como privado.', 'success');
        cargarMisQuizzes();
        cargarQuizSelect();
      } else {
        mostrarMensaje(data.error || 'Error al actualizar visibilidad.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor.', 'error');
    }
  }
  
  async function cargarPublicQuizzes() {
    try {
      const res = await fetch('/api/pubQuizzes/publicos');
      const lista = document.getElementById('lista-public-quizzes');
      lista.innerHTML = '';
      const quizzes = await res.json();
      quizzes.forEach(q => {
        const li = document.createElement('li');
        li.className = 'quiz-card';
        li.innerHTML = `
          <div class="quiz-card-title"><strong>${q.titulo}</strong></div>
          <div class="quiz-card-description">${q.descripcion || ''}</div>
          <div class="quiz-card-actions">
            <button class="save-button" type="button" onclick="mostrarModalConfirmacion('Guardar este quiz en tu repertorio?', () => publicarQuiz(${q.id}))">Guardar en mi repertorio</button>
          </div>
        `;
        lista.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al cargar quizzes.', 'error');
    }
  }
    
    // Función para duplicar (publicar) un quiz en el repertorio del profesor
    async function publicarQuiz(quizId) {
      
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
        const contenedor = document.getElementById('contenedor-asignaciones');
        contenedor.innerHTML = '';
  
        grupos.forEach(grupo => {
          const grupoDiv = document.createElement('div');
          grupoDiv.classList.add('grupo-asignado');
  
          const tituloGrupo = document.createElement('h3');
          tituloGrupo.textContent = `Grupo: ${grupo.nombre}`;
          grupoDiv.appendChild(tituloGrupo);
  
          const ul = document.createElement('ul');
          grupo.quizzes.forEach(q => {
            const li = document.createElement('li');
            li.innerHTML = `
              ${q.titulo}
              <button onclick="mostrarModalConfirmacion('¿Desasignar este quiz?', () => desasignarQuiz(${q.id}, ${grupo.id}))">
                Desasignar
              </button>
            `;
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
  async function desasignarQuiz(quizId, grupoId) {
    try {
      const res = await fetch('/api/pubQuizzes/desasignar', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, grupoId })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('Quiz desasignado.', 'success');
        cargarAsignaciones();
      } else {
        mostrarMensaje(data.error || 'Error al desasignar.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar.', 'error');
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
    
   