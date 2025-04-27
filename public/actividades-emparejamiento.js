// public/js/emparejamiento.js

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
  }
  
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
  
    // — NAVEGACIÓN A MODO —
    const actividadId = getParam('actividadId');
    document.getElementById('card-multiple').onclick = () => {
      window.location.href = `/multiple.html?actividadId=${actividadId}`;
    };
    document.getElementById('card-fill').onclick = () => {
      window.location.href = `/fill.html?actividadId=${actividadId}`;
    };
  });
  