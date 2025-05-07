console.log('📊 estadísticas – inicializando…');

(() => {
  const $ = sel => document.querySelector(sel);
  const getParam = k => new URLSearchParams(location.search).get(k);

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

  function fillGrid(containerSel, arr) {
    const el = $(containerSel);
    el.innerHTML = '';
    arr.forEach(it =>
      el.insertAdjacentHTML('beforeend', `
        <div class="stat-card">
          <h3>${it.titulo}</h3>
          <p>Intentos: <strong>${it.totalIntentos}</strong></p>
          <p>Puntuación media: <strong>${it.mediaScore}%</strong></p>
          <p>Tiempo medio: <strong>${it.mediaTime}s</strong></p>
        </div>`
      )
    );
  }

  // <-- aquí movemos grupoId al scope superior -->
  let grupoId;

  async function descargarResumenExcel() {
    const url = `/api/grupos/${grupoId}/estadisticas/excel`;
    const resp = await fetch(url, { credentials:'include' });
    if (!resp.ok) { alert('Error al descargar resumen'); return; }
    const blob = await resp.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `estadisticas_grupo_${grupoId}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function descargarIntentosExcel() {
    const url = `/api/grupos/${grupoId}/estadisticas/intentos/excel`;
    const resp = await fetch(url, { credentials:'include' });
    if (!resp.ok) { alert('Error al descargar intentos'); return; }
    const blob = await resp.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `intentos_grupo_${grupoId}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  document.addEventListener('DOMContentLoaded', async () => {
    // --- Logout modal ---
  const logoutButton = document.getElementById('logout-button');
  const cancelLogout = document.getElementById('cancelLogout');
  const closeModal = document.getElementById('closeModal');
  const confirmLogout = document.getElementById('confirmLogout');

  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
  }
  cancelLogout?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
  });
  closeModal?.addEventListener('click', () => {
    document.getElementById('logoutModal').style.display = 'none';
  });
  confirmLogout?.addEventListener('click', () => {
    fetch('/usuarios/logout').then(() => window.location.href = '/');
  });
    grupoId = getParam('grupoId');
    if (!grupoId) return alert('Falta el parámetro grupoId en la URL');
    document.querySelector('#btnDescargarResumen').addEventListener('click', descargarResumenExcel);
    document.querySelector('#btnDescargarIntentos').addEventListener('click', descargarIntentosExcel);

    try {
      const res = await fetch(`/api/grupos/${grupoId}/estadisticas`, {
        credentials: 'include'
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status} → ${text}`);
      }
      const data = await res.json();

      // 1) RESUMEN
      const summary = $('#summary');
      summary.innerHTML = '';
      [
        { l: 'Alumnos activos',  v: data.activos },
        { l: 'Intentos totales', v: data.intentosTotales },
        { l: 'Media global',     v: data.mediaGlobal + '%' }
      ].forEach(c =>
        summary.insertAdjacentHTML('beforeend', `
          <div class="card"><h3>${c.l}</h3><strong>${c.v}</strong></div>`
        )
      );

      // 2) ACTIVIDAD últimos 30 días
      drawBar(
        '#activityChart',
        data.actividad.map(r => r.dia),
        data.actividad.map(r => r.intentos),
        'Intentos'
      );

      // 3) HISTOGRAMA NOTAS
      drawBar(
        '#scoreChart',
        data.distribucionNotas.map(r => r.tramo),
        data.distribucionNotas.map(r => r.n),
        'Nº intentos'
      );

      // 4) TOP 10 PREGUNTAS
      const topUl = $('#top-questions');
      topUl.innerHTML = '';
      data.topPreguntas.forEach(p =>
        topUl.insertAdjacentHTML('beforeend', `
          <li><strong>${Math.round(p.ratio_error * 100)} % fallos</strong> – ${p.texto}</li>`
        )
      );

      // 5) GRIDS
      fillGrid('#quiz-stats',  data.quizzes);
      fillGrid('#match-stats', data.emparejamientos);

    } catch (err) {
      console.error('❌ Fallo al cargar estadísticas:', err);
      alert('No se pudieron cargar las estadísticas.\n' + err.message);
    }
  });
})();
