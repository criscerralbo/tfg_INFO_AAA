// public/js/actividades.js

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  // — LOGOUT MODAL —
  const logoutButton = document.getElementById('logout-button');
  const logoutModal  = document.getElementById('logoutModal');
  const cancelBtn    = document.getElementById('cancelLogout');
  const closeBtn     = document.getElementById('closeModal');
  const confirmBtn   = document.getElementById('confirmLogout');
  document.getElementById('btn-back').onclick = () => {
    // de Actividades volvemos a Actividades-Grupo
    window.location.href = '/actividades-grupo.html';
  };
  logoutButton?.addEventListener('click', () => {
    logoutModal.style.display = 'block';
  });
  cancelBtn?.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });
  closeBtn?.addEventListener('click', () => {
    logoutModal.style.display = 'none';
  });
  confirmBtn?.addEventListener('click', () => {
    fetch('/usuarios/logout')
      .then(() => window.location.href = '/')
      .catch(() => window.location.href = '/');
  });

  // — CARGA DE ACTIVIDADES —
  const grupoId = getParam('grupoId');
  if (!grupoId) {
    alert('Falta el parámetro grupoId');
    return;
  }

  const tDiv = document.getElementById('lista-tests');
  const eDiv = document.getElementById('lista-emparejamientos');
  const noT  = document.getElementById('no-tests');
  const noE  = document.getElementById('no-emparejamientos');

  fetch(`/api/grupos/${grupoId}/recursos`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(({ tests, emparejamientos }) => {
      // Tests
      if (tests.length > 0) {
        noT.style.display = 'none';
        tests.forEach(t => {
          const card = document.createElement('div');
          card.className = 'actividad-card';
          card.innerHTML = `
            <img src="/images/tooth-test.png" alt="Test">
            <h3>${t.titulo}</h3>
          `;
          card.onclick = () => {
            window.location.href = `/realizar_test.html?testId=${t.id}`;
          };
          tDiv.appendChild(card);
        });
      } else {
        noT.textContent = 'De momento no hay tests asignados.';
      }

      // Emparejamientos
      if (emparejamientos.length > 0) {
        noE.style.display = 'none';
        emparejamientos.forEach(e => {
          const card = document.createElement('div');
          card.className = 'actividad-card';
          card.innerHTML = `
            <img src="/images/tooth-match.png" alt="Emparejamiento">
            <h3>${e.nombre}</h3>
          `;
          card.onclick = () => {
            sessionStorage.setItem('grupoIdActual', grupoId);
            window.location.href = `/actividades-emparejamiento.html?actividadId=${e.id}`;
          };
          eDiv.appendChild(card);
        });
      } else {
        noE.textContent = 'De momento no hay emparejamientos asignados.';
      }
    })
    .catch(err => {
      alert('Error al cargar actividades: ' + err.message);
    });
});
