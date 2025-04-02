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
  // 1) Obtener el ID del test desde la URL (revisa que la URL sea ?testId=15)
  const testId = getParam('testId');  // <--- OJO: 'testId'
  if (!testId) {
    mostrarMensaje('No se recibió quizId', 'error');
    return;
  }

  // 2) Cargar el detalle del test
  fetch(`/api/tests/${testId}`)
    .then(res => res.json())
    .then(test => {
      if (test.error) {
        mostrarMensaje(test.error, 'error');
        return;
      }
      document.getElementById('test-titulo').textContent = test.titulo;
      document.getElementById('test-descripcion').textContent = test.descripcion || '';
    })
    .catch(err => {
      console.error(err);
      mostrarMensaje('Error al cargar el test', 'error');
    });

  // 3) Cargar intentos del usuario y determinar si hay un intento “in_progress”
  fetch(`/api/tests/${testId}/mis-intentos`)
    .then(res => res.json())
    .then(intentos => {
      if (!Array.isArray(intentos)) {
        return;
      }
      pintarIntentos(intentos);
      const enCurso = intentos.find(i => i.state === 'in_progress');
      if (enCurso) {
        // Mostrar botón "Reanudar", ocultar "Iniciar"
        document.getElementById('btn-reanudar').style.display = 'inline-block';
        document.getElementById('btn-iniciar').style.display = 'none';
      } else {
        document.getElementById('btn-reanudar').style.display = 'none';
        document.getElementById('btn-iniciar').style.display = 'inline-block';
      }
    })
    .catch(err => {
      console.error(err);
      mostrarMensaje('Error al cargar intentos', 'error');
    });

  // 4) Listeners para los botones “Reanudar” e “Iniciar”
  document.getElementById('btn-reanudar').addEventListener('click', () => {
    mostrarMensaje('Reanudar test (pendiente de implementación)', 'success');
    // Aquí podrías hacer fetch a un endpoint para cargar preguntas 
    // del attempt en curso, etc.
    document.getElementById('zona-preguntas').style.display = 'block';
    cargarPreguntas(testId);
  });

  document.getElementById('btn-iniciar').addEventListener('click', () => {
    mostrarMensaje('Iniciar un nuevo intento', 'success');
    // Aquí podrías crear un nuevo attempt en la BD o simplemente mostrar preguntas
    document.getElementById('zona-preguntas').style.display = 'block';
    cargarPreguntas(testId);
  });

  // 5) Botón para enviar respuestas
  document.getElementById('btn-enviar').addEventListener('click', () => {
    enviarRespuestas(testId);
  });
});

// FUNCIONES AUXILIARES

function pintarIntentos(intentos) {
  const tbody = document.getElementById('tabla-intentos');
  tbody.innerHTML = '';
  intentos.forEach(i => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i.id}</td>
      <td>${formatearFecha(i.start_time)}</td>
      <td>${i.end_time ? formatearFecha(i.end_time) : ''}</td>
      <td>${i.score}</td>
      <td>${i.state}</td>
    `;
    tbody.appendChild(tr);
  });
}

function cargarPreguntas(testId) {
  fetch(`/api/tests/${testId}/preguntas`)
    .then(res => res.json())
    .then(preguntas => {
      if (!Array.isArray(preguntas)) {
        mostrarMensaje('Error al cargar preguntas', 'error');
        return;
      }
      const contenedor = document.getElementById('preguntas-container');
      contenedor.innerHTML = '';
      preguntas.forEach((p, idx) => {
        const div = document.createElement('div');
        div.classList.add('pregunta');
        let opcionesHTML = '';
        p.opciones.forEach(op => {
          opcionesHTML += `
            <label>
              <input type="radio" name="pregunta_${p.preguntaId}" value="${op.opcionId}">
              ${op.texto}
            </label><br>
          `;
        });
        div.innerHTML = `
          <p><strong>${idx + 1}.</strong> ${p.texto}</p>
          ${opcionesHTML}
        `;
        contenedor.appendChild(div);
      });
    })
    .catch(err => {
      console.error(err);
      mostrarMensaje('Error al cargar las preguntas', 'error');
    });
}

function enviarRespuestas(testId) {
  const contenedor = document.getElementById('preguntas-container');
  const preguntasDivs = contenedor.querySelectorAll('.pregunta');

  const answers = [];
  preguntasDivs.forEach(div => {
    const radioSel = div.querySelector('input[type="radio"]:checked');
    if (radioSel) {
      const name = radioSel.name;  // por ej. "pregunta_5"
      const preguntaId = parseInt(name.split('_')[1]);
      const opcionIdSeleccionada = parseInt(radioSel.value);
      answers.push({ preguntaId, opcionIdSeleccionada });
    }
  });

  fetch(`/api/tests/${testId}/enviar-respuestas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        mostrarMensaje(data.error, 'error');
        return;
      }
      // Mostramos mensaje con la nota
      mostrarMensaje(`Test finalizado. Score: ${data.score}%`, 'success');

      // 1) Ocultamos la zona de preguntas
      document.getElementById('zona-preguntas').style.display = 'none';

      // 2) Recargamos la tabla de intentos para ver el nuevo
      fetch(`/api/tests/${testId}/mis-intentos`)
        .then(res => res.json())
        .then(intentos => {
          if (!Array.isArray(intentos)) return;
          pintarIntentos(intentos);
        })
        .catch(err => {
          console.error(err);
          mostrarMensaje('Error al recargar intentos', 'error');
        });
    })
    .catch(err => {
      console.error(err);
      mostrarMensaje('Error al enviar respuestas', 'error');
    });
}


function getParam(name) {
  const search = new URLSearchParams(window.location.search);
  return search.get(name);
}

function formatearFecha(fechaStr) {
  if (!fechaStr) return '';
  return new Date(fechaStr).toLocaleString();
}

function mostrarMensaje(msg, tipo) {
  const div = document.getElementById('mensaje-estado');
  div.textContent = msg;
  div.className = (tipo === 'success') ? 'mensaje-success' : 'mensaje-error';
  div.style.display = 'block';
  setTimeout(() => {
    div.style.display = 'none';
  }, 4000);
}