function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const attemptId = getParam('attemptId');
    if (!attemptId) {
      alert('Falta el parámetro attemptId');
      return;
    }
  
    // Logout modal
    const logoutBtn    = document.getElementById('logout-button');
    const logoutModal  = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const closeModal   = document.getElementById('closeModal');
    const confirmLogout= document.getElementById('confirmLogout');
  
    logoutBtn.onclick    = () => logoutModal.style.display = 'block';
    cancelLogout.onclick = () => logoutModal.style.display = 'none';
    closeModal.onclick   = () => logoutModal.style.display = 'none';
    confirmLogout.onclick= () => {
      fetch('/usuarios/logout').then(_ => window.location = '/');
    };
  
    // Contenedores
    const infoEl      = document.getElementById('info-intento');
    const containerEl = document.getElementById('contenedor-revision');
  
    fetch(`/api/emparejamientos/attempts/${attemptId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
  
        // Mostrar info del intento
        const { intento, answers } = data;
        const fecha = new Date(intento.start_time).toLocaleString();
        const mins  = Math.floor(intento.duracion_segundos/60);
        const secs  = intento.duracion_segundos % 60;
        infoEl.innerHTML = `
          <p>Fecha: ${fecha}</p>
          <p>Duración: ${mins}m ${secs}s | Puntuación: ${intento.score}%</p>
          <hr>
        `;
  
        // Por cada respuesta
        answers.forEach((ans, idx) => {
          const div = document.createElement('div');
          div.className = 'pregunta-revision';
  
          // Icono
          const icon = ans.correct ? '✅' : '❌';
  
          // Opciones: solo marcada vs correcta
          // Aquí no había lista de todas, sino elegida y correcta
          div.innerHTML = `
            <p><strong>${idx+1}.</strong> ${icon}</p>
            <img src="${ans.imagen}" alt="Imagen ${idx+1}" class="pregunta-img">
            <div class="opcion ${ans.elegida === ans.correcta ? 'correcta' : 'incorrecta'}">
              Tu respuesta: ${ans.elegida}
            </div>
            <div class="opcion resaltada">
              Respuesta correcta: ${ans.correcta}
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
  