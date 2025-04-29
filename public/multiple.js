// public/js/multiple.js

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const actividadId = getParam('actividadId');
  // Aceptamos mayúsculas/minúsculas por si acaso
  const repetir    = getParam('repetirFalladas') === '1' || getParam('repetirfalladas') === '1';

  console.log('✨ Modo repetir falladas:', repetir, 'actividadId=', actividadId);

  if (!actividadId) {
    return alert('Falta el parámetro actividadId');
  }

  // — DOM elements —
  const imgEl      = document.getElementById('pair-image');
  const optsEl     = document.getElementById('options-list');
  const prevBtn    = document.getElementById('btn-prev');
  const nextBtn    = document.getElementById('btn-next');
  const submitBtn  = document.getElementById('btn-submit');
  const feedbackEl = document.getElementById('feedback');
  const timerEl    = document.getElementById('timer');

  // — Logout modal elements —
  const logoutBtn    = document.getElementById('logout-button');
  const logoutModal  = document.getElementById('logoutModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const closeModal   = document.getElementById('closeModal');
  const confirmLogout= document.getElementById('confirmLogout');

  logoutBtn.onclick    = () => logoutModal.style.display = 'block';
  cancelLogout.onclick = () => logoutModal.style.display = 'none';
  closeModal.onclick   = () => logoutModal.style.display = 'none';
  confirmLogout.onclick= () => fetch('/usuarios/logout').then(_ => window.location = '/');

  let questions     = [];
  let options       = [];
  let answers       = {};    // { questionId: selectedOption }
  let currentIndex  = 0;
  let timerSecs     = 0;
  let timerInterval = null;
  // public/js/multiple.js
const actividadId2 = new URLSearchParams(window.location.search)
.get('actividadId');
document.getElementById('btn-back').onclick = () => {
// de Multiple volvemos a Emparejamiento
window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId2}`;
};


  // — Cronómetro —
  function startTimer() {
    timerInterval = setInterval(() => {
      timerSecs++;
      const mm = String(Math.floor(timerSecs/60)).padStart(2,'0');
      const ss = String(timerSecs%60).padStart(2,'0');
      timerEl.textContent = `${mm}:${ss}`;
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerInterval);
  }

  // — 1) Carga las opciones comunes —
  fetch(`/api/emparejamientos/${actividadId}/multiple`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      options = data.questions[0]?.opciones || [];
      console.log('Opciones cargadas:', options);
    })
    .then(loadQuestions)
    .catch(err => {
      console.error(err);
      alert('Error cargando opciones: ' + err.message);
    });

  // — 2) Carga las preguntas según si es modo normal o modo falladas —
  function loadQuestions() {
    const url = repetir
      ? `/api/emparejamientos/${actividadId}/falladas`
      : `/api/emparejamientos/${actividadId}/multiple`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (repetir) {
          // falladas devuelve { questions: [{ id, imagen, palabra }] }
          questions = data.questions.map(q => ({
            id: q.id,
            imagen: q.imagen,
            opciones: options,
            respuestaCorrecta: q.palabra
          }));
        } else {
          // multiple devuelve { questions: [{ id, imagen, opciones, respuestaCorrecta }] }
          questions = data.questions;
        }

        console.log('Preguntas cargadas:', questions);

        if (!questions.length) {
          return alert('No hay preguntas disponibles.');
        }

        render();
        startTimer();
      })
      .catch(err => {
        console.error(err);
        alert('Error cargando preguntas: ' + err.message);
      });
  }

  // — Render de la pregunta actual —
  function render() {
    const q = questions[currentIndex];
    feedbackEl.textContent = `Pregunta ${currentIndex+1} de ${questions.length}`;
    imgEl.src = q.imagen;
    imgEl.alt = q.respuestaCorrecta;
    optsEl.innerHTML = '';
    q.opciones.forEach(opt => {
      const lbl = document.createElement('label');
      lbl.innerHTML = `<input type="radio" name="opt" value="${opt}"> ${opt}`;
      optsEl.appendChild(lbl);
    });
    if (answers[q.id]) {
      const sel = optsEl.querySelector(`input[value="${answers[q.id]}"]`);
      if (sel) sel.checked = true;
    }
    prevBtn.disabled        = currentIndex === 0;
    nextBtn.style.display   = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
    submitBtn.style.display = currentIndex === questions.length - 1 ? 'inline-block' : 'none';
  }

  // — Guarda localmente la respuesta actual —
  function saveAnswer() {
    const sel = optsEl.querySelector('input[name="opt"]:checked');
    if (!sel) {
      alert('Selecciona una opción antes de continuar');
      return false;
    }
    answers[questions[currentIndex].id] = sel.value;
    return true;
  }

  prevBtn.onclick = () => {
    saveAnswer();
    currentIndex--;
    render();
  };
  nextBtn.onclick = () => {
    if (!saveAnswer()) return;
    currentIndex++;
    render();
  };

  // — Manejador de envío —
  submitBtn.onclick = () => {
    if (!saveAnswer()) return;
    stopTimer();

    const payload = {
      answers: Object.entries(answers).map(([id, palabra]) => ({
        pairId: Number(id),
        palabra
      })),
      duracionSegundos: timerSecs
    };

    if (!repetir) {
      // Modo normal: guardamos intento y redirigimos al historial
      fetch(`/api/emparejamientos/${actividadId}/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(() => {
        window.location.href = `/multiple-attempts.html?actividadId=${actividadId}`;
      })
      .catch(err => {
        console.error(err);
        alert('Error guardando intento: ' + err.message);
      });

    } else {
      // Modo repetir falladas: eliminamos sólo las acertadas de la tabla de falladas
      const promesas = questions.map(q => {
        if (answers[q.id] === q.respuestaCorrecta) {
          console.log('Borrando fallada:', q.id);
          return fetch(
            `/api/emparejamientos/${actividadId}/falladas?pairId=${q.id}`,
            { method: 'DELETE' }
          )
          .then(res => {
            if (!res.ok) throw new Error(`DELETE fallada ${q.id} -> HTTP ${res.status}`);
          });
        }
        return Promise.resolve();
      });

      Promise.all(promesas)
        .then(() => {
          // tras limpiar, volvemos a la pantalla de modos
          window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId}`;
        })
        .catch(err => {
          console.error(err);
          alert('Error al actualizar preguntas falladas: ' + err.message);
        });
    }
  };
});
