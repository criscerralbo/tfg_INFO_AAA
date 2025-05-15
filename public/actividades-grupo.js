// public/js/actividades-grupo.js
document.addEventListener('DOMContentLoaded', () => {
   // — LOGOUT MODAL —
   const logoutButton = document.getElementById('logout-button');
   const logoutModal  = document.getElementById('logoutModal');
   const cancelBtn    = document.getElementById('cancelLogout');
   const closeBtn     = document.getElementById('closeModal');
   const confirmBtn   = document.getElementById('confirmLogout');
   const backBtn = document.getElementById('btn-back');
  
   document.getElementById('btn-back').onclick = () => {
    // de Actividades-Grupo volvemos a Inicio
    window.location.href = '/inicio';
  };
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
   /* -----------------------------------------------------------------
   ▶ ROL + BOTÓN “IR A GRUPOS” + MENSAJE CUANDO NO HAY GRUPOS
------------------------------------------------------------------ */
let rol = 'alumno';                       // valor por defecto

/* 1 · Traemos rol (mismo endpoint que usas en inicio.html) */
fetch('/usuarios/nombre')
  .then(r => r.ok ? r.json() : Promise.reject())
  .then(u => { rol = u.rol || 'alumno'; })
  .catch(() => console.warn('No se pudo obtener rol, asumo alumno'))
  .finally(() => cargarGrupos());

/* 2 · Función principal: pinta grupos o mensaje alternativo */
function cargarGrupos(){
  fetch('/api/grupos')
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(grupos => {
      const cont = document.getElementById('lista-grupos');

       /*---------------- SIN grupos ---------------- */
      if (grupos.length === 0){
        const aviso = document.createElement('div');
        aviso.className = 'mensaje-vacio';

        if (rol === 'profesor'){
          aviso.textContent =
            'Oh, parece que aún no perteneces a ningún grupo. '+
            'Ve a la pantalla de grupos para poder crear y administrarlos '+
            'también puedes esperar a que otros pofesores te añadan a sus grupos.';
        }else{ // alumno
          aviso.textContent =
            'Aún no formas parte de ningún grupo. '+
            'Solicita unirte a los grupos disponibles o espera a que tus profesores te añadan.';
        }
        cont.appendChild(aviso);
      }
      else{
        const aviso = document.createElement('div');
        aviso.className = 'mensaje-vacio';

        if (rol === 'profesor'){
          aviso.textContent =
          'Estos son los grupos de los que formas parte actualmente '+  
          'Si lo que estas buscando es gestionar tus grupos '+
            'Ve a la pantalla de grupos para poder crear y administrarlos '+
            'también puedes esperar a que otros pofesores te añadan a sus grupos.';
        }else{ // alumno
          aviso.textContent =
            'Estos son los grupos de los que formas parte actualmente '+
            'Solicita unirte a los grupos disponibles o espera a que tus profesores te añadan.';
        }
        cont.appendChild(aviso);
      }

      /* botón “Ir a Grupos” siempre visible */
      const btnIr = document.createElement('button');
      btnIr.id = 'btn-ir-grupos';
      btnIr.className = 'btn-go-grupos';
      btnIr.textContent = 'Ir a Grupos';
      btnIr.onclick = () => {
        
        if (rol === 'profesor')          window.location.href = '/profesor.html';
        else                                  window.location.href = '/alumno.html';
      };
      cont.appendChild(btnIr);

      /* ---------------- CON grupos ----------------
      grupos.forEach(g => {
        const card = document.createElement('div');
        card.className = 'grupo-card';
        card.innerHTML = `
          <img src="/images/tooth-group.png" alt="Grupo">
          <h3>${g.nombre}</h3>`;
        card.onclick = () =>
          window.location.href = `/actividades.html?grupoId=${g.id}`;
        cont.appendChild(card);
      }); */
    })
    .catch(err => alert('Error al cargar grupos: '+ err));
}

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
