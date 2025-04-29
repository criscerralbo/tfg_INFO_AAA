function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const actividadId = getParam('actividadId');
    if (!actividadId) {
      alert('Falta actividadId');
      return;
    }
     
  
    // Logout
    const logoutButton = document.getElementById('logout-button');
    const logoutModal  = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const closeModal   = document.getElementById('closeModal');
    const confirmLogout= document.getElementById('confirmLogout');
  
    logoutButton.onclick    = () => logoutModal.style.display = 'block';
    cancelLogout.onclick    = () => logoutModal.style.display = 'none';
    closeModal.onclick      = () => logoutModal.style.display = 'none';
    confirmLogout.onclick   = () => fetch('/usuarios/logout').then(_=> window.location = '/');
  
    const tbody        = document.querySelector('#tabla-intentos tbody');
    const noIntentosEl = document.getElementById('no-intentos');
  // public/js/multiple-attempts.js
const actividadId2 = new URLSearchParams(window.location.search)
.get('actividadId');
document.getElementById('btn-back').onclick = () => {
// de Multiple-Attempts volvemos a Emparejamiento
window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId2}`;
};

    fetch(`/api/emparejamientos/${actividadId}/attempts`)
      .then(res => res.json())
      .then(intentos => {
        if (intentos.length === 0) {
          noIntentosEl.textContent = 'Aún no has hecho ningún intento.';
          return;
        }
        noIntentosEl.style.display = 'none';
  
        intentos.forEach(it => {
          const tr = document.createElement('tr');
          const date = new Date(it.start_time).toLocaleString();
          const mins = Math.floor(it.duracion_segundos/60);
          const secs = it.duracion_segundos % 60;
          tr.innerHTML = `
            <td>${date}</td>
            <td>${mins}m ${secs}s</td>
            <td>${it.score}%</td>
            <td><button class="btn-small" data-id="${it.id}">Revisar</button></td>
          `;
          tbody.appendChild(tr);
        });
  
        // Bind revisar
        tbody.querySelectorAll('button[data-id]').forEach(btn => {
          btn.onclick = () => {
            const aid = btn.dataset.id;
            window.location = `/multiple-review.html?attemptId=${aid}`;
          };
        });
      })
      .catch(e => {
        console.error(e);
        noIntentosEl.textContent = 'Error cargando intentos.';
      });
  });
  