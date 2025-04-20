document.addEventListener('DOMContentLoaded', () => {
  // -- Manejo del modal de logout (igual que en adm_quizzes.js) --
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
  // ----------------------------------------------

  // Obtener el ID del quiz desde la URL
  const params = new URLSearchParams(window.location.search);
  const quizId = params.get('id');
  if (!quizId) {
    mostrarMensaje('No se ha especificado un ID de quiz', 'error');
    return;
  }

  // Referencias a elementos del DOM
  const tituloInput = document.getElementById('titulo-quiz');
  const descripcionInput = document.getElementById('descripcion-quiz');
  const formEditQuiz = document.getElementById('form-edit-quiz');
  const btnEliminarQuiz = document.getElementById('btn-eliminar-quiz');

  const contenedorPreguntas = document.getElementById('contenedor-preguntas');
  const formNuevaPregunta = document.getElementById('form-nueva-pregunta');

  // Cargar datos del quiz al inicio
  cargarQuiz();
  // Cargar preguntas de este quiz
  cargarPreguntas();

  // Listener para actualizar el Quiz
  formEditQuiz.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nuevoTitulo = tituloInput.value.trim();
    const nuevaDesc = descripcionInput.value.trim();

    if (!nuevoTitulo) {
      mostrarMensaje('El título es obligatorio', 'error');
      return;
    }

    try {
      const resp = await fetch(`/api/quizzes/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: nuevoTitulo, descripcion: nuevaDesc })
      });
      if (resp.ok) {
        mostrarMensaje('Quiz actualizado correctamente', 'success');
        // Si quieres recargar, hazlo. O vuelve a cargar los datos...
        // cargarQuiz();
      } else {
        const data = await resp.json();
        mostrarMensaje(data.error, 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    }
  });

  // Listener para eliminar el Quiz
  btnEliminarQuiz.addEventListener('click', async () => {
    if (!confirm('¿Seguro que deseas eliminar este quiz?')) return;
    try {
      const resp = await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
      if (resp.ok) {
        mostrarMensaje('Quiz eliminado', 'success');
        // Redirigir a la lista de quizzes
        window.location.href = 'adm_quizzes.html';
      } else {
        const data = await resp.json();
        mostrarMensaje(data.error, 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    }
  });

  // Listener para añadir nueva pregunta
  formNuevaPregunta.addEventListener('submit', async (e) => {
    e.preventDefault();
    const enunciado = document.getElementById('enunciado').value.trim();
    const opcionA = document.getElementById('opcionA').value.trim();
    const opcionB = document.getElementById('opcionB').value.trim();
    const opcionC = document.getElementById('opcionC').value.trim();
    const opcionD = document.getElementById('opcionD').value.trim();
    const respuesta_correcta = document.getElementById('respuesta').value;

    if (!enunciado) {
      mostrarMensaje('El enunciado es obligatorio', 'error');
      return;
    }

    // -- Podemos verificar el número actual de preguntas en el front (Opcional) --
    const totalPreguntasActual = contenedorPreguntas.querySelectorAll('.pregunta-item').length;
    if (totalPreguntasActual >= 10) {
      mostrarMensaje('Ya hay 10 preguntas, no puedes agregar más.', 'error');
      return;
    }

    const body = {
      quiz_id: quizId,
      enunciado,
      opcionA,
      opcionB,
      opcionC,
      opcionD,
      respuesta_correcta
    };

    try {
      const resp = await fetch('/api/preguntas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (resp.ok) {
        mostrarMensaje('Pregunta creada', 'success');
        formNuevaPregunta.reset();
        cargarPreguntas(); // Recargar la lista
      } else {
        const data = await resp.json();
        mostrarMensaje(data.error || 'Error al crear pregunta', 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    }
  });

  // Función para cargar datos del quiz
  async function cargarQuiz() {
    try {
      const resp = await fetch(`/api/quizzes/${quizId}`);
      if (resp.ok) {
        const quiz = await resp.json();
        tituloInput.value = quiz.titulo;
        descripcionInput.value = quiz.descripcion || '';
      } else {
        const data = await resp.json();
        mostrarMensaje(data.error, 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    }
  }

  // Función para cargar las preguntas
  async function cargarPreguntas() {
    contenedorPreguntas.innerHTML = '';
    try {
      const resp = await fetch(`/api/preguntas?quizId=${quizId}`);
      if (resp.ok) {
        const preguntas = await resp.json();
        preguntas.forEach(pregunta => {
          // Crear HTML para cada pregunta
          const div = document.createElement('div');
          div.classList.add('pregunta-item');
          div.innerHTML = `
            <p><strong>Enunciado:</strong> ${pregunta.enunciado}</p>
            <p>A) ${pregunta.opcionA || ''}</p>
            <p>B) ${pregunta.opcionB || ''}</p>
            <p>C) ${pregunta.opcionC || ''}</p>
            <p>D) ${pregunta.opcionD || ''}</p>
            <p><strong>Respuesta Correcta:</strong> ${pregunta.respuesta_correcta}</p>
            <button class="btn-editar-pregunta">Editar</button>
            <button class="btn-eliminar-pregunta">Eliminar</button>
          `;

          // Botón editar pregunta
          div.querySelector('.btn-editar-pregunta').addEventListener('click', () => {
            editarPregunta(pregunta);
          });

          // Botón eliminar pregunta
          div.querySelector('.btn-eliminar-pregunta').addEventListener('click', async () => {
            if (confirm('¿Eliminar esta pregunta?')) {
              try {
                const r = await fetch(`/api/preguntas/${pregunta.id}`, { method: 'DELETE' });
                if (r.ok) {
                  mostrarMensaje('Pregunta eliminada', 'success');
                  cargarPreguntas();
                } else {
                  const data = await r.json();
                  mostrarMensaje(data.error, 'error');
                }
              } catch (err) {
                console.error(err);
                mostrarMensaje('Error al conectar con el servidor', 'error');
              }
            }
          });

          contenedorPreguntas.appendChild(div);
        });
      } else {
        const data = await resp.json();
        mostrarMensaje(data.error, 'error');
      }
    } catch (error) {
      console.error(error);
      mostrarMensaje('Error al conectar con el servidor', 'error');
    }
  }

  // Función para editar una pregunta (muestra un pequeño formulario)
  function editarPregunta(pregunta) {
    // Creamos un formulario inline para editar
    const divEdicion = document.createElement('div');
    divEdicion.innerHTML = `
      <h4>Editar pregunta</h4>
      <label>Enunciado:</label>
      <input type="text" id="editEnunciado" value="${pregunta.enunciado}">
      <br>
      <label>Opción A:</label>
      <input type="text" id="editA" value="${pregunta.opcionA || ''}">
      <br>
      <label>Opción B:</label>
      <input type="text" id="editB" value="${pregunta.opcionB || ''}">
      <br>
      <label>Opción C:</label>
      <input type="text" id="editC" value="${pregunta.opcionC || ''}">
      <br>
      <label>Opción D:</label>
      <input type="text" id="editD" value="${pregunta.opcionD || ''}">
      <br>
      <label>Respuesta Correcta:</label>
      <select id="editRespuesta">
        <option value="A" ${pregunta.respuesta_correcta === 'A' ? 'selected' : ''}>A</option>
        <option value="B" ${pregunta.respuesta_correcta === 'B' ? 'selected' : ''}>B</option>
        <option value="C" ${pregunta.respuesta_correcta === 'C' ? 'selected' : ''}>C</option>
        <option value="D" ${pregunta.respuesta_correcta === 'D' ? 'selected' : ''}>D</option>
      </select>
      <br>
      <button id="btn-guardar-cambios">Guardar</button>
      <button id="btn-cancelar-cambios">Cancelar</button>
    `;
    // Insertarlo en la página
    const oldDiv = contenedorPreguntas.querySelector('.pregunta-item');
    // O, mejor, creamos un popup. Pero para simplicidad, lo insertamos al final.
    contenedorPreguntas.appendChild(divEdicion);

    // Listeners
    divEdicion.querySelector('#btn-guardar-cambios').addEventListener('click', async () => {
      const enunciado = divEdicion.querySelector('#editEnunciado').value.trim();
      const opcionA = divEdicion.querySelector('#editA').value.trim();
      const opcionB = divEdicion.querySelector('#editB').value.trim();
      const opcionC = divEdicion.querySelector('#editC').value.trim();
      const opcionD = divEdicion.querySelector('#editD').value.trim();
      const respuesta_correcta = divEdicion.querySelector('#editRespuesta').value;

      if (!enunciado) {
        mostrarMensaje('El enunciado es obligatorio', 'error');
        return;
      }

      try {
        const r = await fetch(`/api/preguntas/${pregunta.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enunciado, opcionA, opcionB, opcionC, opcionD, respuesta_correcta })
        });
        if (r.ok) {
          mostrarMensaje('Pregunta actualizada', 'success');
          // Recargar preguntas y quitar el formulario
          cargarPreguntas();
          divEdicion.remove();
        } else {
          const data = await r.json();
          mostrarMensaje(data.error, 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al conectar con el servidor', 'error');
      }
    });

    divEdicion.querySelector('#btn-cancelar-cambios').addEventListener('click', () => {
      divEdicion.remove();
    });
  }

  // Función para mostrar mensajes
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    div.textContent = mensaje;
    div.className = (tipo === 'success') ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => {
      div.style.display = 'none';
    }, 4000);
  }
});
