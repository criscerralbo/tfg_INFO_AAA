// actividades.js
function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    const grupoId = getParam('grupoId');
    if (!grupoId) {
      alert('Falta el parámetro grupoId');
      return;
    }
  
    fetch(`/api/grupos/${grupoId}/recursos`)
      .then(res => res.json())
      .then(({ tests, emparejamientos }) => {
        const tdiv = document.getElementById('lista-tests');
        tests.forEach(t => {
          const btn = document.createElement('button');
          btn.textContent = t.titulo;
          btn.onclick = () => {
            window.location.href = `/realizar_test.html?testId=${t.id}`;
          };
          tdiv.appendChild(btn);
        });
  
        const ediv = document.getElementById('lista-emparejamientos');
        emparejamientos.forEach(e => {
          const btn = document.createElement('button');
          btn.textContent = e.nombre;
          btn.onclick = () => {
            window.location.href = `/actividades-emparejamiento.html?actividadId=${e.id}`;
          };
          ediv.appendChild(btn);
        });
      })
      .catch(err => {
        alert('Error al cargar actividades: ' + err.message);
      });
  });
  