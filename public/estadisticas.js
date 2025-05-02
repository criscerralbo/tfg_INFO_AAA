/* ────────────────────────────────────────────────────────────────
   estadísticas.js – 02 may 2025
   – carga /api/grupos/:id/estadisticas
   – pinta resumen, bar‑charts y grids
   – muestra detalles de error en consola
───────────────────────────────────────────────────────────────── */

console.log('📊 estadísticas – inicializando…');

(() => {
  /* helpers ─────────────────────────────────────────────── */
  const $  = sel => document.querySelector(sel);
  const getParam = k => new URLSearchParams(location.search).get(k);

  /* Chart.js handlers ------------------------------------- */
  let activityChart, scoreChart;
  function drawBar(canvasId, labels, data, datasetLabel) {
    const ctx = $(canvasId);
    if (!ctx) return;
    const prev = canvasId === '#activityChart' ? activityChart : scoreChart;
    prev?.destroy();

    const chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets: [{ label: datasetLabel, data }] },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
    if (canvasId === '#activityChart') activityChart = chart;
    else scoreChart = chart;
  }

  /* tarjetas grid ----------------------------------------- */
  function fillGrid(containerSel, arr) {
    const el = $(containerSel);
    el.innerHTML = '';                             // limpia antes de pintar
    arr.forEach(it =>
      el.insertAdjacentHTML(
        'beforeend',
        `<div class="stat-card">
           <h3>${it.titulo}</h3>
           <p>Intentos: <strong>${it.totalIntentos}</strong></p>
           <p>Puntuación media: <strong>${it.mediaScore}%</strong></p>
           <p>Tiempo medio: <strong>${it.mediaTime}s</strong></p>
         </div>`
      )
    );
  }

  /* flujo principal --------------------------------------- */
  document.addEventListener('DOMContentLoaded', async () => {
    const grupoId = getParam('grupoId');
    if (!grupoId) return alert('Falta el parámetro grupoId en la URL');

    try {
      const res = await fetch(`/api/grupos/${grupoId}/estadisticas`, {
        credentials: 'include'           // lleva cookie de sesión
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} → ${text}`);
      }
      const data = await res.json();

      /* 1) RESUMEN */
      const summary = $('#summary');
      summary.innerHTML = '';
      [
        { l: 'Alumnos activos',  v: data.activos },
        { l: 'Intentos totales', v: data.intentosTotales },
        { l: 'Media global',     v: data.mediaGlobal + '%' }
      ].forEach(c =>
        summary.insertAdjacentHTML(
          'beforeend',
          `<div class="card"><h3>${c.l}</h3><strong>${c.v}</strong></div>`
        )
      );

      /* 2) GRÁFICO ACTIVIDAD 30 días */
      drawBar(
        '#activityChart',
        data.actividad.map(r => r.dia),
        data.actividad.map(r => r.intentos),
        'Intentos'
      );

      /* 3) HISTOGRAMA DE NOTAS */
      drawBar(
        '#scoreChart',
        data.distribucionNotas.map(r => r.tramo),
        data.distribucionNotas.map(r => r.n),
        'Nº intentos'
      );

      /* 4) TOP 10 PREGUNTAS FALLADAS */
      const topUl = $('#top-questions');
      topUl.innerHTML = '';
      data.topPreguntas.forEach(p =>
        topUl.insertAdjacentHTML(
          'beforeend',
          `<li><strong>${Math.round(p.ratio_error * 100)} % fallos</strong> – ${p.texto}</li>`
        )
      );

      /* 5) GRIDS QUIZ / EMPAREJAMIENTO */
      fillGrid('#quiz-stats',  data.quizzes);
      fillGrid('#match-stats', data.emparejamientos);
    } catch (err) {
      console.error('❌ Fallo al cargar estadísticas:', err);
      alert('No se pudieron cargar las estadísticas.\n' + err.message);
    }
  });
})();
