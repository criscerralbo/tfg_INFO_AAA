// public/js/multiple.js

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const actividadId = getParam('actividadId');
  const repetir    = getParam('repetirFalladas') === '1' || getParam('repetirfalladas') === '1';

  if (!actividadId) {
    alert('Falta el parámetro actividadId');
    return;
  }

  // DOM elements
  const imgEl      = document.getElementById('pair-image');
  const optsEl     = document.getElementById('options-list');
  const prevBtn    = document.getElementById('btn-prev');
  const nextBtn    = document.getElementById('btn-next');
  const finishBtn  = document.getElementById('btn-finish');
  const submitBtn  = document.getElementById('btn-submit');
  const feedbackEl = document.getElementById('feedback');
  const timerEl    = document.getElementById('timer');
  const backBtn    = document.getElementById('btn-back');

  // Logout modal
  const logoutBtn     = document.getElementById('logout-button');
  const logoutModal   = document.getElementById('logoutModal');
  const cancelLogout  = document.getElementById('cancelLogout');
  const closeModal    = document.getElementById('closeModal');
  const confirmLogout = document.getElementById('confirmLogout');

  logoutBtn.onclick    = () => logoutModal.style.display = 'block';
  cancelLogout.onclick = () => logoutModal.style.display = 'none';
  closeModal.onclick   = () => logoutModal.style.display = 'none';
  confirmLogout.onclick= () => fetch('/usuarios/logout').then(() => window.location = '/');

  // Back button
  backBtn.onclick = () => {
    window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId}`;
  };

  let questions     = [];
  let options       = [];
  let answers       = {};    // { questionId: selectedOptionOrNull }
  let currentIndex  = 0;
  let timerSecs     = 0;
  let timerInterval = null;

  // Timer
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

  // Load common options
  fetch(`/api/emparejamientos/${actividadId}/multiple`)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      options = data.questions[0]?.opciones || [];
    })
    .then(loadQuestions)
    .catch(err => {
      console.error(err);
      alert('Error cargando opciones: ' + err.message);
    });

  // Load questions (normal or repeat)
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
          questions = data.questions.map(q => ({
            id: q.id,
            imagen: q.imagen,
            opciones: options,
            respuestaCorrecta: q.palabra
          }));
        } else {
          questions = data.questions;
        }

        if (!questions.length) {
          alert('No hay preguntas disponibles.');
          return;
        }

        render();
        startTimer();
      })
      .catch(err => {
        console.error(err);
        alert('Error cargando preguntas: ' + err.message);
      });
  }

  // Render current question
  function render() {
    const q = questions[currentIndex];
    feedbackEl.textContent = `Pregunta ${currentIndex + 1} de ${questions.length}`;
    imgEl.src = q.imagen;
    imgEl.alt = q.respuestaCorrecta;

    const opts = [...q.opciones];
    shuffle(opts);

    optsEl.innerHTML = '';
    opts.forEach(opt => {
      const lbl = document.createElement('label');
      lbl.innerHTML = `
        <input type="radio" name="opt" value="${opt}">
        <span>${opt}</span>
      `;
      optsEl.appendChild(lbl);
    });

    const prevAnswer = answers[q.id];
    if (prevAnswer != null) {
      const sel = optsEl.querySelector(`input[value="${prevAnswer}"]`);
      if (sel) sel.checked = true;
    }

    prevBtn.disabled        = currentIndex === 0;
    nextBtn.style.display   = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
    submitBtn.style.display = currentIndex === questions.length - 1 ? 'inline-block' : 'none';
  }

  // Save current answer (allow blank)
  function saveAnswer() {
    const sel = optsEl.querySelector('input[name="opt"]:checked');
    answers[questions[currentIndex].id] = sel ? sel.value : null;
  }

  // Navigation handlers
  prevBtn.onclick = () => {
    saveAnswer();
    currentIndex--;
    render();
  };
  nextBtn.onclick = () => {
    saveAnswer();
    currentIndex++;
    render();
  };

  // Finish / Submit handlers
  finishBtn.onclick = doSubmit;
  submitBtn.onclick = doSubmit;

  function doSubmit() {
    saveAnswer();
    stopTimer();


        // Construimos el array con UNA entrada por cada pregunta,
    // usando "" si no hay respuesta (se contará como incorrecta).
    const payload = {
      answers: questions.map(q => ({
        pairId:   q.id,
        palabra:  answers[q.id] || ""
      })),
      duracionSegundos: timerSecs
    };

    if (!repetir) {
      // Normal mode: record attempt and go to history
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
      // Repeat-fail mode: delete correct from falladas, then back
      const deletes = questions.map(q => {
        if (answers[q.id] === q.respuestaCorrecta) {
          return fetch(
            `/api/emparejamientos/${actividadId}/falladas?pairId=${q.id}`,
            { method: 'DELETE' }
          ).then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
          });
        }
        return Promise.resolve();
      });

      Promise.all(deletes)
        .then(() => {
          window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId}`;
        })
        .catch(err => {
          console.error(err);
          alert('Error actualizando preguntas falladas: ' + err.message);
        });
    }
  }
});
