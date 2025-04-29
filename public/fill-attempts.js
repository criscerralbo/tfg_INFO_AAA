function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const actividadId = getParam('actividadId');
    if (!actividadId) {
      alert('Falta el parámetro actividadId');
      return;
    }
  
    // — DOM elements —
    const backBtn       = document.getElementById('btn-back');
    const logoutBtn     = document.getElementById('logout-button');
    const logoutModal   = document.getElementById('logoutModal');
    const cancelLogout  = document.getElementById('cancelLogout');
    const closeModal    = document.getElementById('closeModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const tableBody     = document.querySelector('#tabla-intentos tbody');
    const noIntentsMsg  = document.getElementById('no-intentos');
  
 
  
    // — Logout modal —
    logoutBtn.onclick    = () => logoutModal.style.display = 'block';
    cancelLogout.onclick = () => logoutModal.style.display = 'none';
    closeModal.onclick   = () => logoutModal.style.display = 'none';
    confirmLogout.onclick= () => {
      fetch('/usuarios/logout').then(_ => window.location.href = '/');
    };
    const actividadId2 = new URLSearchParams(window.location.search)
    .get('actividadId');
    document.getElementById('btn-back').onclick = () => {
    // de Multiple-Attempts volvemos a Emparejamiento
    window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId2}`;
    };
    // — Carga de intentos —
    fetch(`/api/emparejamientos/${actividadId}/fill/attempts`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(attempts => {
        if (attempts.length === 0) {
          noIntentsMsg.textContent = 'No hay intentos realizados aún.';
          return;
        }
        noIntentsMsg.style.display = 'none';
  
        attempts.forEach(att => {
          const tr = document.createElement('tr');
  
          // Fecha
          const fecha = new Date(att.start_time)
            .toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' });
          tr.innerHTML += `<td>${fecha}</td>`;
  
          // Duración
          const mins = Math.floor(att.duracion_segundos / 60);
          const secs = att.duracion_segundos % 60;
          tr.innerHTML += `<td>${mins}m ${secs}s</td>`;
  
          // Puntuación
          tr.innerHTML += `<td>${att.score}%</td>`;
  
          // Botón Revisar
          const reviewBtn = document.createElement('button');
          reviewBtn.className = 'btn-secundario';
          reviewBtn.textContent = 'Revisar';
          reviewBtn.onclick = () => {
            window.location.href =
              `/fill-review.html?attemptId=${att.id}`;
          };
          const tdBtn = document.createElement('td');
          tdBtn.appendChild(reviewBtn);
          tr.appendChild(tdBtn);
  
          tableBody.appendChild(tr);
        });
      })
      .catch(err => {
        console.error(err);
        alert('Error al cargar intentos: ' + err.message);
      });
  });
  