// public/js/fill.js

// Normaliza cadenas: quita tildes, espacios extremos y pasa a minúsculas
function normalizeText(str) {
  return str
    .normalize("NFD")                 // separa letra + tilde
    .replace(/[\u0300-\u036f]/g, "")  // elimina marcas diacríticas
    .trim()                           // quita espacios al inicio/fin
    .toLowerCase();                   // pasa a minúsculas
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const actividadId = getParam('actividadId');
  const repetir    = getParam('repetirFalladas') === '1';

  if (!actividadId) {
    alert('Falta el parámetro actividadId');
    return;
  }

  // — Referencias al DOM —
  const imgEl       = document.getElementById('pair-image');
  const inputEl     = document.getElementById('text-answer');
  const prevBtn     = document.getElementById('btn-prev');
  const nextBtn     = document.getElementById('btn-next');
  const submitBtn   = document.getElementById('btn-submit');
  const feedbackEl  = document.getElementById('feedback');
  const timerEl     = document.getElementById('timer');

  // — Logout modal —
  const logoutBtn    = document.getElementById('logout-button');
  const logoutModal  = document.getElementById('logoutModal');
  const closeModal   = document.getElementById('closeModal');
  const cancelLogout = document.getElementById('cancelLogout');
  const confirmLogout= document.getElementById('confirmLogout');

  logoutBtn.onclick    = () => logoutModal.style.display = 'block';
  closeModal.onclick   = () => logoutModal.style.display = 'none';
  cancelLogout.onclick = () => logoutModal.style.display = 'none';
  confirmLogout.onclick= () =>
    fetch('/usuarios/logout').then(_ => window.location.href = '/');

  // — Estado interno —
  let questions     = [];
  let answers       = {};      // { pairId: respuestaUsuario }
  let currentIndex  = 0;
  let timerSecs     = 0;
  let timerInterval = null;

  // — Cronómetro —
  function startTimer() {
    timerInterval = setInterval(() => {
      timerSecs++;
      const mm = String(Math.floor(timerSecs / 60)).padStart(2, '0');
      const ss = String(timerSecs % 60).padStart(2, '0');
      timerEl.textContent = `${mm}:${ss}`;
    }, 1000);
  }
  function stopTimer() {
    clearInterval(timerInterval);
  }

  // — Carga de preguntas —
  const endpoint = repetir
    ? `/api/emparejamientos/${actividadId}/fill/falladas`
    : `/api/emparejamientos/${actividadId}/fill`;

  fetch(endpoint)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(data => {
      questions = data.questions.map(q => ({
        id: q.id,
        imagen: q.imagen,
        respuestaCorrecta: q.respuestaCorrecta || q.palabra
      }));

      if (!questions.length) {
        alert('No hay preguntas disponibles.');
        return;
      }
      renderQuestion();
      startTimer();
    })
    .catch(err => {
      console.error(err);
      alert('Error cargando preguntas: ' + err.message);
    });

  // — Renderizado —
  function renderQuestion() {
    const q = questions[currentIndex];
    feedbackEl.textContent    = `Pregunta ${currentIndex + 1} de ${questions.length}`;
    imgEl.src                 = q.imagen;
    imgEl.alt                 = q.respuestaCorrecta;
    inputEl.value             = answers[q.id] || '';
    prevBtn.disabled          = currentIndex === 0;
    nextBtn.style.display     = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
    submitBtn.style.display   = currentIndex === questions.length - 1 ? 'inline-block' : 'none';
  }

  // — Guardar localmente la respuesta actual —
  function saveAnswer() {
    const val = inputEl.value;
    if (!val.trim()) {
      alert('Escribe una respuesta antes de continuar.');
      return false;
    }
    answers[questions[currentIndex].id] = val;
    return true;
  }

  prevBtn.onclick = () => {
    saveAnswer();
    currentIndex--;
    renderQuestion();
  };
  nextBtn.onclick = () => {
    if (!saveAnswer()) return;
    currentIndex++;
    renderQuestion();
  };

  // — Enviar respuestas —
  submitBtn.onclick = () => {
    if (!saveAnswer()) return;
    stopTimer();

    const payload = {
      answers: Object.entries(answers).map(([pairId, respuesta]) => ({
        pairId: Number(pairId),
        respuesta
      })),
      duracionSegundos: timerSecs
    };

    if (!repetir) {
      // Modo normal: guardamos intento
      fetch(`/api/emparejamientos/${actividadId}/fill/attempts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(() => {
          window.location.href = `/fill-attempts.html?actividadId=${actividadId}`;
        })
        .catch(err => {
          console.error(err);
          alert('Error guardando intento: ' + err.message);
        });

    } else {
      // Modo repetir-falladas: borramos sólo las que ahora aciertes
      const eliminarOps = questions.map(q => {
        const userAnsNorm    = normalizeText(answers[q.id] || '');
        const correctAnsNorm = normalizeText(q.respuestaCorrecta || '');
        if (userAnsNorm === correctAnsNorm) {
          return fetch(
            `/api/emparejamientos/${actividadId}/fill/falladas?pairId=${q.id}`,
            { method: 'DELETE' }
          )
          .then(res => {
            if (!res.ok) throw new Error(`DELETE fallo para pairId ${q.id}`);
          });
        }
        return Promise.resolve();
      });

      Promise.all(eliminarOps)
        .then(() => {
          window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId}`;
        })
        .catch(err => {
          console.error(err);
          alert('Error actualizando banco de falladas: ' + err.message);
        });
    }
  };
});
