function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const actividadId = getParam('actividadId');
  if (!actividadId) {
    alert('Falta el parámetro actividadId');
    return;
  }

  // 2) grupoId desde sessionStorage
  const grupoId = sessionStorage.getItem('grupoIdActual');
  if (!grupoId) {
    alert('No se encontró el grupoId en sesión');
    return;
  }
  // — Logout Modal —
  const logoutButton = document.getElementById('logout-button');
  const logoutModal  = document.getElementById('logoutModal');
  const cancelBtn    = document.getElementById('cancelLogout');
  const closeBtn     = document.getElementById('closeModal');
  const confirmBtn   = document.getElementById('confirmLogout');

  logoutButton.addEventListener('click', () => logoutModal.style.display = 'block');
  cancelBtn   .addEventListener('click', () => logoutModal.style.display = 'none');
  closeBtn    .addEventListener('click', () => logoutModal.style.display = 'none');
  confirmBtn  .addEventListener('click', () => {
    fetch('/usuarios/logout').then(() => window.location.href = '/');
  });
// public/js/actividades-emparejamiento.js

  // — Botón ← Volver: a actividades.html con grupoId
  document.getElementById('btn-back').onclick = () => {
    window.location.href = `/actividades.html?grupoId=${grupoId}`;
  };
  // — Navegación a los modos —
  document.getElementById('card-multiple')
    .addEventListener('click', () => {
      window.location.href = `/multiple.html?actividadId=${actividadId}`;
    });
  document.getElementById('card-fill')
    .addEventListener('click', () => {
      window.location.href = `/fill.html?actividadId=${actividadId}`;
    });
// Dentro de DOMContentLoaded, tras validar actividadId y grupoId:

// 1) Fetch de los datos de la actividad, para mostrar la descripción
// justo tras obtener actividadId...
fetch(`/api/emparejamientos/${actividadId}`)
  .then(res => {
    if (!res.ok) throw new Error('No se encontró la actividad');
    return res.json();
  })
  .then(data => {
    const descEl = document.getElementById('descripcion-actividad');
    descEl.textContent = data.descripcion || 'Sin descripción.';
  })
  .catch(() => {
    document.getElementById('descripcion-actividad')
      .textContent = 'Error al cargar la descripción de la actividad.';
  });


// …resto de tu código (logout, back, navegación, intentos, etc.)…

  // — BOTONES MÚLTIPLE —  
  // Revisar intentos
  fetch(`/api/emparejamientos/${actividadId}/attempts`)
    .then(r => r.json())
    .then(attempts => {
      if (attempts.length > 0) {
        const rc = document.getElementById('review-container-multiple');
        const btn = document.getElementById('btn-review-multiple');
        rc.style.display = 'block';
        btn.addEventListener('click', e => {
          e.stopPropagation();
          window.location.href = `/multiple-attempts.html?actividadId=${actividadId}`;
        });
      }
    })
    .catch(() => {});

  // Repetir falladas
  fetch(`/api/emparejamientos/${actividadId}/falladas`)
    .then(r => r.json())
    .then(data => {
      if (data.questions && data.questions.length > 0) {
        const rc = document.getElementById('repeat-container-multiple');
        const btn = document.getElementById('btn-repeat-multiple');
        rc.style.display = 'block';
        btn.addEventListener('click', e => {
          e.stopPropagation();
          window.location.href = `/multiple.html?actividadId=${actividadId}&repetirFalladas=1`;
        });
      }
    })
    .catch(() => {});

  // — BOTONES FILL —  
  // Revisar intentos de fill
  fetch(`/api/emparejamientos/${actividadId}/fill/attempts`)
    .then(r => r.json())
    .then(attempts => {
      if (attempts.length > 0) {
        const rc = document.getElementById('review-container-fill');
        const btn = document.getElementById('btn-review-fill');
        rc.style.display = 'block';
        btn.addEventListener('click', e => {
          e.stopPropagation();
          window.location.href = `/fill-attempts.html?actividadId=${actividadId}`;
        });
      }
    })
    .catch(() => {});

  // Repetir falladas de fill
  fetch(`/api/emparejamientos/${actividadId}/fill/falladas`)
    .then(r => r.json())
    .then(data => {
      if (data.questions && data.questions.length > 0) {
        const rc = document.getElementById('repeat-container-fill');
        const btn = document.getElementById('btn-repeat-fill');
        rc.style.display = 'block';
        btn.addEventListener('click', e => {
          e.stopPropagation();
          window.location.href = `/fill.html?actividadId=${actividadId}&repetirFalladas=1`;
        });
      }
    })
    .catch(() => {});

});
