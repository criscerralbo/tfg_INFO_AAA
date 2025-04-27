// actividades-grupo.js
document.addEventListener('DOMContentLoaded', () => {
    fetch('/api/grupos')
      .then(res => res.json())
      .then(grupos => {
        const cont = document.getElementById('lista-grupos');
        grupos.forEach(g => {
          const btn = document.createElement('button');
          btn.textContent = g.nombre;
          btn.onclick = () => {
            window.location.href = `/actividades.html?grupoId=${g.id}`;
          };
          cont.appendChild(btn);
        });
      })
      .catch(err => {
        alert('No se pudieron cargar los grupos: ' + err.message);
      });
  });
  