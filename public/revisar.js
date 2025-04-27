// revisar.js
console.log('revisar.js cargado');

document.addEventListener('DOMContentLoaded', () => {
  const testId    = getParam('testId');
  const attemptId = getParam('attemptId');

  if (!testId || !attemptId) {
    alert('Parámetros testId o attemptId faltantes');
    return;
  }
  console.log('📘 revisar.js cargado'); 

  // Logout modal
  const logoutButton = document.getElementById('logout-button');
  const logoutModal  = document.getElementById('logoutModal');
  const closeModal   = document.getElementById('closeModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout= document.getElementById('confirmLogout');

  logoutButton?.addEventListener('click', () => logoutModal.style.display = 'block');
  closeModal?.addEventListener('click', () => logoutModal.style.display   = 'none');
  cancelLogout?.addEventListener('click', () => logoutModal.style.display = 'none');
  confirmLogout?.addEventListener('click', () => {
    fetch('/usuarios/logout').then(() => window.location.href = '/');
  });
  console.log('🔍 Fetching revisión:', testId, attemptId);

  // Carga la revisión
  fetch(`/api/tests/${testId}/attempts/${attemptId}/revisar`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      mostrarRevision(data);
    })
    .catch(err => {
      alert('Error al cargar la revisión: ' + err.message);
    });
});

function mostrarRevision(data) {
  const info = document.getElementById('info-intento');
  const { intento, preguntas } = data;

  info.innerHTML = `
    <strong>Intento #${intento.id}</strong>
    &nbsp;| Fecha: ${formatearFecha(intento.start_time)}
    &nbsp;| Nota: ${intento.score}%
  `;

  const cont = document.getElementById('contenedor-revision');
  cont.innerHTML = '';

  preguntas.forEach((p, idx) => {
    const div = document.createElement('div');
    div.classList.add('pregunta-revision');

    let opcionesHTML = '';
    p.opciones.forEach(op => {
      const sel  = op.id === p.opcionMarcada;
      const corr = op.id === p.opcionCorrecta;
      const clase = sel && corr ? 'correcta'
                  : sel && !corr ? 'incorrecta'
                  : corr          ? 'resaltada'
                                 : '';
      opcionesHTML += `<div class="opcion ${clase}">${op.texto}</div>`;
    });

    const icono = p.opcionMarcada === p.opcionCorrecta ? '✅' : '❌';

    div.innerHTML = `
      <p><strong>${idx + 1}.</strong> ${p.texto} ${icono}</p>
      ${p.imagen ? `<img src="${p.imagen}" class="pregunta-img">` : ''}
      ${opcionesHTML}
    `;
    cont.appendChild(div);
  });
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatearFecha(fechaStr) {
  return new Date(fechaStr).toLocaleString();
}
