// public/js/actividades-grupo.js
document.addEventListener('DOMContentLoaded', () => {
   // — LOGOUT MODAL —
   const logoutButton = document.getElementById('logout-button');
   const logoutModal  = document.getElementById('logoutModal');
   const cancelBtn    = document.getElementById('cancelLogout');
   const closeBtn     = document.getElementById('closeModal');
   const confirmBtn   = document.getElementById('confirmLogout');
 
   logoutButton?.addEventListener('click', () => {
     logoutModal.style.display = 'block';
   });
   cancelBtn?.addEventListener('click', () => {
     logoutModal.style.display = 'none';
   });
   closeBtn?.addEventListener('click', () => {
     logoutModal.style.display = 'none';
   });
   confirmBtn?.addEventListener('click', () => {
     fetch('/usuarios/logout')
       .then(() => window.location.href = '/')
       .catch(() => window.location.href = '/');
   });
  fetch('/api/grupos')
    .then(res => {
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.json();
    })
    .then(grupos => {
      const cont = document.getElementById('lista-grupos');
      grupos.forEach(g => {
        const card = document.createElement('div');
        card.className = 'grupo-card';
        card.innerHTML = `
          <img src="/images/tooth-group.png" alt="Grupo">
          <h3>${g.nombre}</h3>
        `;
        card.onclick = () => {
          window.location.href = `/actividades.html?grupoId=${g.id}`;
        };
        cont.appendChild(card);
      });
    })
    .catch(err => {
      alert('Error al cargar grupos: ' + err.message);
    });
});
