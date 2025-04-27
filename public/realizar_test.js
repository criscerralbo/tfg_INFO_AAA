document.addEventListener('DOMContentLoaded', () => {
  const testId = getParam('testId');
  if (!testId) {
    mostrarMensaje('No se recibió testId', 'error');
    return;
  }

  const btnIniciar = document.getElementById('btn-iniciar');
  const btnReanudar = document.getElementById('btn-reanudar');
  const btnFalladas = document.getElementById('btn-falladas');
  const btnEnviar = document.getElementById('btn-enviar');
  const zonaPreguntas = document.getElementById('zona-preguntas');
  const cronometro = document.getElementById('cronometro');

  fetch(`/api/tests/${testId}`)
    .then(res => res.json())
    .then(test => {
      if (test.error) return mostrarMensaje(test.error, 'error');
      document.getElementById('test-titulo').textContent = test.titulo;
      document.getElementById('test-descripcion').textContent = test.descripcion || '';
    });

  fetch(`/api/tests/${testId}/mis-intentos`)
    .then(res => res.json())
    .then(intentos => {
      pintarIntentos(intentos);
      const hayIntentos = intentos.length > 0;
      const enCurso = intentos.find(i => i.state === 'in_progress');
      toggleBotones(hayIntentos, enCurso);
    });
  fetch(`/api/tests/${testId}/falladas`)
    .then(res => res.json())
    .then(falladas => {
      const btnFalladas = document.getElementById('btn-falladas');
      btnFalladas.style.display = falladas.length > 0 ? 'inline-block' : 'none';
  });


  btnIniciar.addEventListener('click', () => iniciarTest(testId, false));
  btnReanudar.addEventListener('click', () => iniciarTest(testId, false));
  btnFalladas.addEventListener('click', () => iniciarTest(testId, true));

  btnEnviar.addEventListener('click', () => {
    // Contamos cuántas preguntas han respuesta marcada
    const totalContestadas = document
      .querySelectorAll('#preguntas-container input[type="radio"]:checked')
      .length;
  
    if (totalContestadas === 0) {
      // Si no ha contestado ninguna, mostramos mensaje y salimos
      mostrarMensaje('Tu test está completamente en blanco, no has respondido nada.', 'error');
      return;
    }
  
    // Si hay al menos una respuesta, abrimos el modal
    document.getElementById('modal-confirmacion').style.display = 'block';
  });
  
  
  document.getElementById('confirmar-envio').addEventListener('click', () => {
    enviarRespuestas(testId, window._soloFalladas ?? false);
    document.getElementById('modal-confirmacion').style.display = 'none';
  });
  
  
  document.getElementById('cancelar-envio').addEventListener('click', () => {
    document.getElementById('modal-confirmacion').style.display = 'none';
  });
  

  // --- Logout modal ---
  const logoutButton = document.getElementById('logout-button');
  const cancelLogout = document.getElementById('cancelLogout');
  const closeModal = document.getElementById('closeModal');
  const confirmLogout = document.getElementById('confirmLogout');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
  }
  cancelLogout?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
  });
  closeModal?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
  });
  confirmLogout?.addEventListener('click', () => {
    fetch('/usuarios/logout').then(() => window.location.href = '/');
  });
});

let timerInterval;

function iniciarTest(testId, soloFalladas = false) {
  window._soloFalladas = soloFalladas; // <- Guardamos para luego usar
  document.getElementById('zona-preguntas').style.display = 'block';
  document.querySelector('.intentos-col').style.display = 'none';
  cargarPreguntas(testId, soloFalladas);
  iniciarCronometro();
}



function cargarPreguntas(testId, soloFalladas) {
  const endpoint = soloFalladas ? `/api/tests/${testId}/falladas` : `/api/tests/${testId}/preguntas`;
  fetch(endpoint)
    .then(res => res.json())
    .then(preguntas => {
      const contenedor = document.getElementById('preguntas-container');
      contenedor.innerHTML = '';
      preguntas = preguntas.sort(() => Math.random() - 0.5);
      preguntas.forEach((p, idx) => {
        const div = document.createElement('div');
        div.classList.add('pregunta');
        let opcionesHTML = '';
        p.opciones.forEach(op => {
          opcionesHTML += `
            <label>
              <input type="radio" name="pregunta_${p.preguntaId}" value="${op.opcionId}">
              ${op.texto}
            </label><br>`;
        });
        div.innerHTML = `
        <p class="pregunta-texto"><strong>${idx + 1}.</strong> ${p.texto}</p>
        ${p.imagen ? `<img src="${p.imagen.startsWith('/') ? p.imagen : '/' + p.imagen}" class="pregunta-img">` : ''}
        <div class="opciones">${opcionesHTML}</div>`;      
        contenedor.appendChild(div);
      });
    });
}
const tiempoTranscurrido = document.getElementById('cronometro').textContent;
const [min, seg] = tiempoTranscurrido.split(':').map(Number);
const duracionSegundos = min * 60 + seg;

function enviarRespuestas(testId, soloFalladas = false) {
  const tiempoTranscurrido = document.getElementById('cronometro').textContent;
  const [min, seg] = tiempoTranscurrido.split(':').map(Number);
  const duracionSegundos = min * 60 + seg;

  const contenedor = document.getElementById('preguntas-container');
  const preguntasDivs = contenedor.querySelectorAll('.pregunta');
  const answers = [];

  preguntasDivs.forEach(div => {
       // Obtenemos el nombre de la pregunta a partir del primer radio
       const primerRadio = div.querySelector('input[type="radio"]');
       const name       = primerRadio.name;                 // ej. "pregunta_3"
       const preguntaId = parseInt(name.split('_')[1], 10);
      // Vemos si hay alguno marcado
        const radioSel = div.querySelector('input[type="radio"]:checked');
        const opcionIdSeleccionada = radioSel
          ? parseInt(radioSel.value, 10)
          : null;  // si es null, lo contamos luego como incorrecto
    
        answers.push({ preguntaId, opcionIdSeleccionada });
      });

  fetch(`/api/tests/${testId}/enviar-respuestas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      answers,
      duracionSegundos,
      esRepeticionFalladas: soloFalladas
    })
  })
  .then(res => res.json())
  .then(data => {
    if (!soloFalladas) {
      mostrarMensaje(`Score: ${data.score}%`, 'success');
    }    
    detenerCronometro();

    document.getElementById('zona-preguntas').style.display = 'none';
    document.querySelector('.intentos-col').style.display = 'block';
    recargarIntentos(testId);
  });
}


function pintarIntentos(intentos) {
  const tbody = document.getElementById('tabla-intentos');
  tbody.innerHTML = '';
  intentos.forEach(i => {
    const mins = Math.floor(i.duracion_segundos / 60);
    const secs = i.duracion_segundos % 60;
    const duracionFormateada = `${mins}m ${secs}s`;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatearFecha(i.start_time)}</td>
      <td>${i.score}</td>
      <td>${duracionFormateada}</td>
      <td><button onclick="revisarIntento(${i.id})">Revisar</button></td>`;
    tbody.appendChild(tr);
  });
}


function revisarIntento(idIntento) {
  const testId = getParam('testId');
  window.location.href = `/revisar.html?testId=${testId}&attemptId=${idIntento}`;
}


function recargarIntentos(testId) {
  fetch(`/api/tests/${testId}/mis-intentos`)
    .then(res => res.json())
    .then(pintarIntentos);
}

function toggleBotones(hayIntentos, enCurso) {
  document.getElementById('btn-iniciar').style.display = (!hayIntentos || !enCurso) ? 'inline-block' : 'none';
  document.getElementById('btn-reanudar').style.display = enCurso ? 'inline-block' : 'none';
  document.getElementById('btn-falladas').style.display = hayIntentos ? 'inline-block' : 'none';
}

function iniciarCronometro() {
  const crono = document.getElementById('cronometro');
  let segs = 0;
  timerInterval = setInterval(() => {
    segs++;
    const min = String(Math.floor(segs / 60)).padStart(2, '0');
    const sec = String(segs % 60).padStart(2, '0');
    crono.textContent = `${min}:${sec}`;
  }, 1000);
}

function detenerCronometro() {
  clearInterval(timerInterval);
}

function formatearFecha(fechaStr) {
  return new Date(fechaStr).toLocaleString();
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function mostrarMensaje(msg, tipo) {
  const div = document.getElementById('mensaje-estado');
  div.textContent = msg;
  div.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
  div.style.display = 'block';
  setTimeout(() => div.style.display = 'none', 4000);
}
