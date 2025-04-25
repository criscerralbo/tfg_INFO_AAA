document.addEventListener('DOMContentLoaded', () => {
    const attemptId = getParam('attemptId');
    if (!attemptId) {
      alert('No se recibió attemptId');
      return;
    }
  
    // Modal logout
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
        fetch('/usuarios/logout').then(() => window.location.href = '/');
      });
    }
  
    fetch(`/api/tests/${getParam('testId')}/attempts/${attemptId}/revisar`)

      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
          return;
        }
  
        const info = document.getElementById('info-intento');
        info.innerHTML = `Intento #${data.intento.id} | Fecha: ${formatearFecha(data.intento.start_time)} | Nota: ${data.intento.score}%`;
  
        const contenedor = document.getElementById('contenedor-revision');
        contenedor.innerHTML = '';
  
        data.preguntas.forEach((p, idx) => {
          const div = document.createElement('div');
          div.classList.add('pregunta-revision');
  
          let opcionesHTML = '';
          p.opciones.forEach(op => {
            const seleccionada = op.id === p.opcionMarcada;
            const correcta = op.id === p.opcionCorrecta;
            let clase = '';
            if (seleccionada && correcta) clase = 'correcta';
            else if (seleccionada && !correcta) clase = 'incorrecta';
            else if (correcta) clase = 'resaltada';
  
            opcionesHTML += `<div class="opcion ${clase}">${op.texto}</div>`;
          });
  
          const estadoIcono = p.opcionMarcada === p.opcionCorrecta ? '✅' : '❌';
  
          div.innerHTML = `
            <p><strong>${idx + 1}.</strong> ${p.texto} ${estadoIcono}</p>
            ${p.imagen ? `<img src="${p.imagen}" class="pregunta-img">` : ''}
            ${opcionesHTML}
          `;
          contenedor.appendChild(div);
        });
      });
  });
  
  function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  function formatearFecha(fechaStr) {
    return new Date(fechaStr).toLocaleString();
  }
  