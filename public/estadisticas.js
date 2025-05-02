
console.log('arrancó estadisticas.js')
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

document.addEventListener('DOMContentLoaded', () => {
  const grupoId = getParam('grupoId');
  if (!grupoId) {
    return alert('Falta el parámetro grupoId');
  }


  fetch(`/api/grupos/${grupoId}/estadisticas`)
    .then(res => res.ok ? res.json() : Promise.reject())
    .then(data => {
      // Quizzes
      const quizContainer = document.getElementById('quiz-stats');
      data.quizzes.forEach(q => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
          <h3>${q.titulo}</h3>
          <p>Intentos: ${q.totalIntentos}</p>
          <p>Puntuación media: ${q.mediaScore}%</p>
          <p>Tiempo medio: ${q.mediaTime}s</p>
        `;
        quizContainer.appendChild(card);
      });

      // Emparejamientos
      const matchContainer = document.getElementById('match-stats');
      data.emparejamientos.forEach(m => {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML = `
          <h3>${m.titulo}</h3>
          <p>Intentos: ${m.totalIntentos}</p>
          <p>Puntuación media: ${m.mediaScore}%</p>
          <p>Tiempo medio: ${m.mediaTime}s</p>
        `;
        matchContainer.appendChild(card);
      });
    })
    .catch(() => alert('No se pudieron cargar las estadísticas.'));
});
