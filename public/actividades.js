function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const grupoId = getParam('grupoId');
  if (!grupoId) {
    return alert('Falta el parámetro grupoId');
  }

  // — LOGOUT MODAL —
  const logoutButton = document.getElementById('logout-button');
  const logoutModal  = document.getElementById('logoutModal');
  const cancelBtn    = document.getElementById('cancelLogout');
  const closeBtn     = document.getElementById('closeModal');
  const confirmBtn   = document.getElementById('confirmLogout');

  document.getElementById('btn-back').onclick = () => {
    window.location.href = '/actividades-grupo.html?grupoId=' + grupoId;
  };
  logoutButton.addEventListener('click', () => logoutModal.style.display = 'block');
  cancelBtn   .addEventListener('click', () => logoutModal.style.display = 'none');
  closeBtn    .addEventListener('click', () => logoutModal.style.display = 'none');
  confirmBtn  .addEventListener('click', () => {
    fetch('/usuarios/logout')
      .then(() => window.location.href = '/')
      .catch(() => window.location.href = '/');
  });

  // contenedores
  const tDiv = document.getElementById('lista-tests');
  const eDiv = document.getElementById('lista-emparejamientos');
  const noT  = document.getElementById('no-tests');
  const noE  = document.getElementById('no-emparejamientos');

  let isProfesor = false;

  // 1) Averiguamos el role del usuario
 // 1) Averiguamos el rol
// 1) Averiguamos el rol
fetch('/usuarios/nombre')
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(user => { isProfesor = (user.rol === 'profesor'); })
  .catch(() => console.warn('No pude obtener perfil, asumo alumno'))
  .finally(() => {
    // 2) Si es profe, mostramos el botón de estadísticas
    if (isProfesor) {
      const btnStats = document.getElementById('btn-stats');
      btnStats.style.display = 'inline-block';
      btnStats.addEventListener('click', () => {
        const grupoId = getParam('grupoId');
        window.location.href = `/estadisticas.html?grupoId=${grupoId}`;
      });
    }
    // 3) Ya podemos cargar los recursos
    loadRecursos();
  });


  // 2) Cargamos tests y emparejamientos
  function loadRecursos() {
    fetch(`/api/grupos/${grupoId}/recursos`)
      .then(res => res.ok ? res.json() : Promise.reject(res.status))
      .then(({ tests, emparejamientos }) => {
        // — Tests —
        if (tests.length > 0) {
          noT.style.display = 'none';
          tests.forEach(t => {
            const card = document.createElement('div');
            card.className = 'actividad-card';
            // contenido principal
            card.innerHTML = `
              <img src="/images/tooth-test.png" alt="Test">
              <h3>${t.titulo}</h3>
            `;

 

            // al hacer click en la tarjeta (no en los botones) lanzamos el test
            card.addEventListener('click', () => {
              window.location.href = `/realizar_test.html?testId=${t.id}`;
            });

            tDiv.appendChild(card);
          });
        } else {
          noT.textContent = 'De momento no hay tests asignados.';
        }

        // — Emparejamientos —
        if (emparejamientos.length > 0) {
          noE.style.display = 'none';
          emparejamientos.forEach(e => {
            const card = document.createElement('div');
            card.className = 'actividad-card';
            card.innerHTML = `
              <img src="/images/tooth-match.png" alt="Emparejamiento">
              <h3>${e.nombre}</h3>
            `;
            card.addEventListener('click', () => {
              sessionStorage.setItem('grupoIdActual', grupoId);
              window.location.href =
                `/actividades-emparejamiento.html?actividadId=${e.id}`;
            });
            eDiv.appendChild(card);
          });
        } else {
          noE.textContent = 'De momento no hay emparejamientos asignados.';
        }
      })
      .catch(err => {
        alert('Error al cargar actividades: ' + err);
      });
  }
});
