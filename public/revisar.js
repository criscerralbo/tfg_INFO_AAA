// revisar.js
console.log('revisar.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  const testId    = getParam('testId');
  const attemptId = getParam('attemptId');
  if (!testId || !attemptId) {
    alert('Parámetros testId o attemptId faltantes');
    return;
  }

  // Modal de logout (igual que antes)…
  const logoutButton  = document.getElementById('logout-button');
  const logoutModal   = document.getElementById('logoutModal');
  const closeModal    = document.getElementById('closeModal');
  const cancelLogout  = document.getElementById('cancelLogout');
  const confirmLogout = document.getElementById('confirmLogout');
  logoutButton?.addEventListener('click', () => logoutModal.style.display = 'block');
  closeModal?.addEventListener('click',  () => logoutModal.style.display = 'none');
  cancelLogout?.addEventListener('click',() => logoutModal.style.display = 'none');
  confirmLogout?.addEventListener('click',() => {
    fetch('/usuarios/logout').then(() => window.location.href = '/');
  });

  // Petición al backend
  fetch(`/api/tests/${testId}/attempts/${attemptId}/revisar`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data.error) {
        alert(data.error);
      } else {
        mostrarRevision(data);
      }
    })
    .catch(err => {
      alert('Error al cargar la revisión: ' + err.message);
    });
});

function mostrarRevision({ intento, preguntas }) {
  console.log('Revisión recibida:', preguntas);
  // Cabecera
  const info = document.getElementById('info-intento');
  info.innerHTML = `
    <strong>Intento #${intento.id}</strong>
    &nbsp;| Fecha: ${formatearFecha(intento.start_time)}
    &nbsp;| Nota: ${intento.score}%
  `;

  // Contenedor de preguntas
  const cont = document.getElementById('contenedor-revision');
  cont.innerHTML = '';

  preguntas.forEach((p, idx) => {
    // Wrapper de pregunta
    const wrapper = document.createElement('div');
    wrapper.classList.add('pregunta-revision');

    // Título + icono
    const title = document.createElement('p');
    const icono = p.opcionMarcada === p.opcionCorrecta ? '✅' : '❌';
    title.innerHTML = `<strong>${idx+1}.</strong> ${p.texto} ${icono}`;
    wrapper.appendChild(title);

    // Imagen si existe
    if (p.imagen) {
      const img = document.createElement('img');
      img.src = p.imagen;
      img.classList.add('pregunta-img');
      wrapper.appendChild(img);
    }

    // Para evitar duplicados
    const seen = new Set();
    // Opciones
    p.opciones.forEach(op => {
      if (seen.has(op.id)) return;
      seen.add(op.id);

      const div = document.createElement('div');
      div.classList.add('opcion');

      // Marcar clases
      if (op.id === p.opcionMarcada && op.id === p.opcionCorrecta) {
        div.classList.add('correcta');  // respondió correctamente
      } else if (op.id === p.opcionMarcada) {
        div.classList.add('incorrecta'); // respondió mal
      } else if (op.id === p.opcionCorrecta) {
        div.classList.add('resaltada');  // mostrar cuál era la correcta
      }
      div.textContent = op.texto;
      wrapper.appendChild(div);
    });

    cont.appendChild(wrapper);
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatearFecha(fechaStr) {
  return new Date(fechaStr).toLocaleString();
}
