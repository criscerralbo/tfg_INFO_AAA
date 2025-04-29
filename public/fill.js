// public/js/fill.js

// Normaliza cadenas: quita tildes, espacios extremos y pasa a minúsculas
function normalizeText(str) {
  return str
    .normalize("NFD")                 // separa letra + tilde
    .replace(/[\u0300-\u036f]/g, "")  // elimina marcas diacríticas
    .trim()                           // quita espacios al inicio/fin
    .toLowerCase();                   // pasa a minúsculas
}

// Extrae un parámetro de query string
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const actividadId = getParam('actividadId');
  // Aceptamos mayúsculas/minúsculas
  const repetir    = getParam('repetirFalladas') === '1'
                  || getParam('repetirfalladas') === '1';

  if (!actividadId) {
    return alert('Falta el parámetro actividadId');
  }
  console.log('🏷 actividadId=', actividadId, 'modo repetir?', repetir);

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
  let answers       = {};      // { pairId: textoIntroducido }
  let currentIndex  = 0;
  let timerSecs     = 0;
  let timerInterval = null;

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

  // — Carga de preguntas —
  function loadQuestions() {
    const url = repetir
      ? `/api/emparejamientos/${actividadId}/fill/falladas`
      : `/api/emparejamientos/${actividadId}/fill`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        // ambos endpoints devuelven { questions: [ {id, imagen, respuestaCorrecta} ] }
        questions = data.questions;
        console.log('📋 Preguntas cargadas:', questions);

        if (!questions.length) {
          return alert('No hay preguntas disponibles.');
        }
        renderQuestion();
        startTimer();
      })
      .catch(err => {
        console.error(err);
        alert('Error cargando preguntas: ' + err.message);
      });
  }

  // — Renderizado de la pregunta actual —
  function renderQuestion() {
    const q = questions[currentIndex];
    feedbackEl.textContent  = `Pregunta ${currentIndex+1} de ${questions.length}`;
    imgEl.src               = q.imagen;
    imgEl.alt               = q.respuestaCorrecta;
    inputEl.value           = answers[q.id] || '';
    prevBtn.disabled        = currentIndex === 0;
    nextBtn.style.display   = currentIndex < questions.length - 1 ? 'inline-block' : 'none';
    submitBtn.style.display = currentIndex === questions.length - 1 ? 'inline-block' : 'none';
  }

  // — Guarda localmente la respuesta actual —
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
  submitBtn.onclick = async () => {
    if (!saveAnswer()) return;
    stopTimer();

    // En modo normal guardas intento (mismo código your submitFillAttempt)...

    if (!repetir) {
      // POST /api/emparejamientos/:actividadId/fill/attempts
      const payload = {
        answers: Object.entries(answers).map(([pairId, respuesta]) => ({
          pairId: Number(pairId),
          respuesta
        })),
        duracionSegundos: timerSecs
      };
      try {
        const r = await fetch(
          `/api/emparejamientos/${actividadId}/fill/attempts`,
          {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(payload)
          }
        );
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        window.location.href = `/fill-attempts.html?actividadId=${actividadId}`;
      } catch (e) {
        console.error(e);
        alert('Error guardando intento: ' + e.message);
      }
      return;
    }

    // — Modo repetir falladas: borramos las acertadas de la tabla `fill_falladas` —
    try {
      // 1) dispara DELETE por cada pregunta acertada
      const deletes = questions.map(q => {
        const userNorm    = normalizeText(answers[q.id] || '');
        const correctNorm = normalizeText(q.respuestaCorrecta || '');
        if (userNorm === correctNorm) {
          return fetch(
            `/api/emparejamientos/${actividadId}/fill/falladas?pairId=${q.id}`,
            { method: 'DELETE' }
          ).then(res => {
            if (!res.ok) throw new Error(`DELETE fallada ${q.id} → HTTP ${res.status}`);
          });
        }
        return Promise.resolve();
      });
      await Promise.all(deletes);

      // 2) recargo la lista de falladas
      const rr = await fetch(`/api/emparejamientos/${actividadId}/fill/falladas`);
      if (!rr.ok) throw new Error(`HTTP ${rr.status}`);
      const nueva = await rr.json();
      console.log('🔄 Después DELETE, falladas restantes:', nueva.questions);

      if (nueva.questions.length === 0) {
        // ya no quedan, vuelvo a modos
        window.location.href = `/actividades-emparejamiento.html?actividadId=${actividadId}`;
      } else {
        // aún faltan, reinicio el juego con las preguntas restantes
        questions    = nueva.questions;
        answers      = {};
        currentIndex = 0;
        renderQuestion();
        timerSecs = 0;
        startTimer();
      }
    } catch (err) {
      console.error(err);
      alert('Error actualizando preguntas falladas: ' + err.message);
    }
  };

  // Arrancamos
  loadQuestions();
});
