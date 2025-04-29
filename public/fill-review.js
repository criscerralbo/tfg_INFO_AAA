function normalizeText(str) {
    return str
      .normalize("NFD")                 // separa caracteres con tilde
      .replace(/[\u0300-\u036f]/g, "")  // elimina marcas diacríticas
      .trim()                           // quita espacios en los extremos
      .toLowerCase();                   // pasa a minúsculas
  }
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const attemptId = getParam('attemptId');
    if (!attemptId) {
      alert('Falta el parámetro attemptId');
      return;
    }
  
    // DOM
    const backBtn       = document.getElementById('btn-back');
    const logoutBtn     = document.getElementById('logout-button');
    const logoutModal   = document.getElementById('logoutModal');
    const cancelLogout  = document.getElementById('cancelLogout');
    const closeModal    = document.getElementById('closeModal');
    const confirmLogout = document.getElementById('confirmLogout');
    const infoEl        = document.getElementById('info-intento');
    const containerEl   = document.getElementById('contenedor-revision');
  
    // Logout modal
    logoutBtn.onclick    = () => logoutModal.style.display = 'block';
    cancelLogout.onclick = () => logoutModal.style.display = 'none';
    closeModal.onclick   = () => logoutModal.style.display = 'none';
    confirmLogout.onclick= () => fetch('/usuarios/logout').then(_ => window.location = '/');
  
    // Fetch del detalle del intento
    fetch(`/api/emparejamientos/fill/attempts/${attemptId}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(({ intento, answers }) => {
        // Botón volver a historial
        backBtn.onclick = () => {
          window.location.href = `/fill-attempts.html?actividadId=${intento.actividad_id}`;
        };
  
        // Mostrar cabecera del intento
        const fecha = new Date(intento.start_time)
          .toLocaleString('es-ES', { dateStyle:'short', timeStyle:'short' });
        const mins  = Math.floor(intento.duracion_segundos / 60);
        const secs  = intento.duracion_segundos % 60;
        infoEl.innerHTML = `
          <p>Fecha: ${fecha}</p>
          <p>Duración: ${mins}m ${secs}s | Puntuación: ${intento.score}%</p>
          <hr>
        `;
  
        // Mostrar cada respuesta
        answers.forEach((ans, idx) => {
            // en lugar de usar ans.correct directamente, 
            // recalculamos también aquí si lo deseas:
            const isCorrect = normalizeText(ans.elegida) === normalizeText(ans.correcta);
            const icon = isCorrect ? '✅' : '❌';
        
            const div = document.createElement('div');
            div.className = 'pregunta-revision';
            div.innerHTML = `
              <p><strong>${idx+1}.</strong> ${icon}</p>
              <img src="${ans.imagen}" class="pregunta-img" alt="…">
              <div class="opcion ${isCorrect ? 'correcta' : 'incorrecta'}">
                Tu respuesta: <em>${ans.elegida}</em>
              </div>
              <div class="opcion resaltada">
                Respuesta correcta: <em>${ans.correcta}</em>
              </div>
              <hr>
            `;
            containerEl.appendChild(div);
          });
      })
      .catch(err => {
        console.error(err);
        alert('Error al cargar revisión: ' + err.message);
      });
  });
  