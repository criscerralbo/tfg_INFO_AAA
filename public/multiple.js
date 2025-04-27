function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const actividadId = getParam('actividadId');
    if (!actividadId) {
      alert('Falta actividadId');
      return;
    }
  
    // Logout modal
    const logoutButton = document.getElementById('logout-button');
    logoutButton.onclick = () => document.getElementById('logoutModal').style.display = 'block';
    document.getElementById('cancelLogout').onclick = () => document.getElementById('logoutModal').style.display = 'none';
    document.getElementById('closeModal').onclick  = () => document.getElementById('logoutModal').style.display = 'none';
    document.getElementById('confirmLogout').onclick = () => {
      fetch('/usuarios/logout').then(_ => window.location.href = '/');
    };
  
    fetch(`/api/emparejamientos/${actividadId}/multiple`)
      .then(r => r.json())
      .then(({ questions }) => startQuiz(questions))
      .catch(e => alert('Error al cargar juego: '+e.message));
  });
  
  function startQuiz(questions) {
    let idx = 0, score = 0;
    const cont = document.getElementById('pregunta-container');
    const btnNext = document.getElementById('btn-siguiente');
  
    function render() {
      const q = questions[idx];
      cont.innerHTML = `
        <img src="${q.imagen}" class="preg-img">
        <div class="opciones-group">
          ${q.opciones.map(opt =>
            `<label><input type="radio" name="opt" value="${opt}"> ${opt}</label>`
          ).join('')}
        </div>
      `;
      btnNext.disabled = true;
      // habilitar botón al seleccionar
      cont.querySelectorAll('input[name="opt"]').forEach(el =>
        el.onchange = () => btnNext.disabled = false
      );
    }
  
    btnNext.onclick = () => {
      const sel = cont.querySelector('input[name="opt"]:checked').value;
      if (sel === questions[idx].respuestaCorrecta) score++;
      idx++;
      if (idx < questions.length) {
        render();
      } else {
        cont.innerHTML = `<h2>¡Juego completado!</h2>
          <p>Has acertado ${score} de ${questions.length}.</p>
          <button onclick="location.href='/actividades.html?grupoId='+getParam('grupoId')">← Volver a actividades</button>`;
        btnNext.style.display = 'none';
      }
    };
  
    render();
  }
  