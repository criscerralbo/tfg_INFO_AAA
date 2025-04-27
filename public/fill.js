function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const actividadId = getParam('actividadId');
    if (!actividadId) {
      alert('Falta actividadId');
      return;
    }
    // Logout modal (idéntico a multiple.js)
    // …
  
    fetch(`/api/emparejamientos/${actividadId}/fill`)
      .then(r => r.json())
      .then(({ questions }) => startFill(questions))
      .catch(e => alert('Error al cargar juego: '+e.message));
  });
  
  function startFill(questions) {
    let idx = 0, score = 0;
    const cont = document.getElementById('pregunta-container');
    const btnNext = document.getElementById('btn-siguiente');
  
    function render() {
      const q = questions[idx];
      cont.innerHTML = `
        <img src="${q.imagen}" class="preg-img">
        <input type="text" id="txtResp" placeholder="Escribe la palabra…">
      `;
      btnNext.disabled = true;
      const input = cont.querySelector('#txtResp');
      input.oninput = () => btnNext.disabled = input.value.trim()==='';
    }
  
    btnNext.onclick = () => {
      const val = cont.querySelector('#txtResp').value.trim();
      if (val.toLowerCase() === questions[idx].palabra.toLowerCase()) score++;
      idx++;
      if (idx < questions.length) {
        render();
      } else {
        cont.innerHTML = `<h2>¡Juego completado!</h2>
          <p>Has acertado ${score} de ${questions.length}.</p>
          <button onclick="location.href='/actividades.html?grupoId='+getParam('grupoId')">← Volver</button>`;
        btnNext.style.display = 'none';
      }
    };
  
    render();
  }
  