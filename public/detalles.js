// Variable global para controlar el modo administración (muestra botones de eliminar miembros)
let adminMode = false;

/* =====================================================
   Funciones globales para mensajes y modales
===================================================== */

// Muestra mensajes en la app (verde para éxito, rojo para error)
function mostrarMensaje(mensaje, tipo) {
  let mensajeEstado = document.getElementById('mensaje-estado');
  if (!mensajeEstado) {
    mensajeEstado = document.createElement('div');
    mensajeEstado.id = 'mensaje-estado';
    document.body.prepend(mensajeEstado);
  }
  mensajeEstado.textContent = mensaje;
  mensajeEstado.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
  mensajeEstado.style.display = 'block';
  setTimeout(() => {
    mensajeEstado.style.display = 'none';
  }, 4000);
}

// Funciones para el modal de eliminación de grupo
function mostrarModalEliminarGrupo() {
  document.getElementById('modal-eliminar').style.display = 'block';
}
function cerrarModalEliminarGrupo() {
  document.getElementById('modal-eliminar').style.display = 'none';
}
async function confirmarEliminarGrupo() {
  const params = new URLSearchParams(window.location.search);
  const grupoId = params.get('grupoId');
  try {
    const response = await fetch('/api/groups/delete-group', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ grupoId })
    });
    if (!response.ok) throw new Error('Error al eliminar el grupo');
    mostrarMensaje('Grupo eliminado correctamente', 'success');
    window.location.href = '/profesor.html';
  } catch (err) {
    console.error('Error al eliminar el grupo', err);
    mostrarMensaje('No se pudo eliminar el grupo', 'error');
  }
}

// Funciones para el modal de eliminación de miembro
function mostrarModalEliminarMiembro(miembroNombre, grupoId, usuarioId) {
  const modal = document.getElementById('modal-eliminar-miembro');
  const mensajeElem = document.getElementById('modal-eliminar-miembro-mensaje');
  mensajeElem.textContent = `¿Estás seguro de eliminar a ${miembroNombre}? Esta acción es irreversible.`;
  // Guardar los datos en el botón de confirmación
  const btnConfirmar = document.getElementById('confirmar-eliminar-miembro');
  btnConfirmar.setAttribute('data-grupo', grupoId);
  btnConfirmar.setAttribute('data-usuario', usuarioId);
  modal.style.display = 'block';
}
function cerrarModalEliminarMiembro() {
  document.getElementById('modal-eliminar-miembro').style.display = 'none';
}
async function confirmarEliminarMiembro() {
  const btn = document.getElementById('confirmar-eliminar-miembro');
  const grupoId = btn.getAttribute('data-grupo');
  const usuarioId = btn.getAttribute('data-usuario');
  try {
    const response = await fetch('/api/groups/remove-member', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ grupoId, usuarioId })
    });
    if (!response.ok) throw new Error('Error al eliminar miembro');
    mostrarMensaje('Miembro eliminado correctamente', 'success');
    cerrarModalEliminarMiembro();
    cargarDetalles();
  } catch (error) {
    console.error('Error al eliminar miembro:', error);
    mostrarMensaje('No se pudo eliminar el miembro', 'error');
  }
}

/* =====================================================
   Funciones principales
===================================================== */

// Carga y renderiza los detalles del grupo
async function cargarDetalles() {
  const params = new URLSearchParams(window.location.search);
  const grupoId = params.get('grupoId');

  // Configuración de listeners para el modal de logout
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
  }
  const cancelLogout = document.getElementById('cancelLogout');
  if (cancelLogout) {
    cancelLogout.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }
  const closeModal = document.getElementById('closeModal');
  if (closeModal) {
    closeModal.addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
  }
  const confirmLogout = document.getElementById('confirmLogout');
  if (confirmLogout) {
    confirmLogout.addEventListener('click', () => {
      fetch('/usuarios/logout')
        .then(() => window.location.href = '/');
    });
  }

  try {
    const response = await fetch(`/api/groups/detalles/${grupoId}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) {
      mostrarMensaje('No se pudieron cargar los detalles del grupo', 'error');
      return;
    }
    const grupo = await response.json();

    // Renderizar la lista de miembros en la sección superior
    const listaMiembros = document.getElementById('lista-miembros');
    listaMiembros.innerHTML = grupo.miembros.map(m => {
      let html = `<p>${m.nombre} (${m.rol})`;
      // Solo mostrar botón de eliminar si adminMode está activo y el miembro NO es el propietario
      // Se compara numéricamente para evitar problemas de tipo
      if (adminMode && Number(m.id) !== Number(reqSessionId()) && m.rol.toLowerCase() !== 'propietario') {
        html += ` <button onclick="mostrarModalEliminarMiembro('${m.nombre}', ${grupo.id}, ${m.id})">Eliminar</button>`;
      }
      html += `</p>`;
      return html;
    }).join('');

    // Cargar las solicitudes de unión
    cargarSolicitudes();
  } catch (error) {
    console.error('Error al cargar detalles:', error);
    mostrarMensaje('Error al cargar detalles del grupo', 'error');
  }
}

// Función auxiliar para obtener el ID del usuario de la sesión (se espera que esté en sessionStorage o similar)
// Si no tienes una función así, puedes definirla. Por ejemplo, suponiendo que el backend envía el id en el HTML o en una variable global.
function reqSessionId() {
  // Aquí se debe retornar el id del usuario logueado. Por ejemplo, si lo guardaste en sessionStorage:
  return sessionStorage.getItem('usuarioId') || 0;
}

// Alterna el modo administración y recarga detalles
function toggleAdmin() {
  adminMode = !adminMode;
  cargarDetalles();
}

// Función para búsqueda dinámica de usuarios
async function buscarUsuarios() {
  const buscarUsuarioInput = document.getElementById('buscar-usuario');
  const query = buscarUsuarioInput.value.trim();
  const resultadosBusqueda = document.getElementById('resultados-busqueda');
  if (query === '') {
    resultadosBusqueda.innerHTML = '';
    return;
  }
  try {
    const response = await fetch(`/api/groups/buscar-usuarios?query=${query}`, {
      method: 'GET',
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Error al buscar usuarios');
    const usuarios = await response.json();
    mostrarResultados(usuarios);
  } catch (error) {
    console.error('Error al buscar usuarios:', error);
    mostrarMensaje('Error al buscar usuarios', 'error');
  }
}

function mostrarResultados(usuarios) {
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    resultadosBusqueda.innerHTML = '';
    if (usuarios.length === 0) {
        resultadosBusqueda.innerHTML = '<p>No se encontraron usuarios</p>';
        return;
    }
    usuarios.forEach(user => {
        console.log("usuarioId:", user.id, "rolId:", user.rolId);  // Verifica que rolId ya tiene un valor válido
        const userElement = document.createElement('div');
        userElement.innerHTML = `
            <p>${user.nombre} (${user.email}) - ${user.rol}
            <button onclick="anadirMiembro(${user.id}, ${user.rolId})">Añadir</button></p>
        `;
        resultadosBusqueda.appendChild(userElement);
    });
}

  
  
  async function anadirMiembro(usuarioId, rolId) {
    const params = new URLSearchParams(window.location.search);
    const grupoId = params.get('grupoId');
    console.log("grupoId:", grupoId);  // Añadir este log para verificar que grupoId está siendo recibido correctamente
    console.log("usuarioId:", usuarioId, "rolId:", rolId);  // Verificar que usuarioId y rolId son correctos
  
    // Verificar que los datos no sean nulos o vacíos
    if (!grupoId || !usuarioId || !rolId) {
      mostrarMensaje("Faltan datos requeridos", "error");
      return;
    }
  
    try {
      const response = await fetch('/api/groups/add-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ grupoId, usuarioId, rolId })
      });
  
      if (!response.ok) {
        const error = await response.json();
        mostrarMensaje(`Error: ${error.error}`, 'error');
        throw new Error(error.error);
      }
  
      mostrarMensaje('Usuario añadido correctamente', 'success');
      cargarDetalles();
    } catch (error) {
      console.error('Error al añadir miembro:', error);
      mostrarMensaje('No se pudo añadir el usuario', 'error');
    }
  }
  
  
  

// Función para cargar las solicitudes de unión del grupo
async function cargarSolicitudes() {
  const params = new URLSearchParams(window.location.search);
  const grupoId = params.get('grupoId');
  try {
    const response = await fetch(`/api/groups/join-requests/${grupoId}`, {
      method: 'GET',
      credentials: 'include'
    });
    const solicitudes = await response.json();
    const solicitudesContainer = document.getElementById('solicitudes-join');
    if (solicitudes.length === 0) {
      solicitudesContainer.innerHTML = '<p>No hay solicitudes pendientes.</p>';
    } else {
      solicitudesContainer.innerHTML = solicitudes.map(s => ` 
        <div>
          <p>${s.nombre} (${s.rol})</p>
          <button onclick="aceptarSolicitud(${grupoId}, ${s.usuario_id})">Aceptar</button>
          <button onclick="rechazarSolicitud(${grupoId}, ${s.usuario_id})">Rechazar</button>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error al cargar solicitudes:', error);
    mostrarMensaje('Error al cargar solicitudes', 'error');
  }
}

async function aceptarSolicitud(grupoId, usuarioId) {
  try {
    const response = await fetch('/api/groups/accept-request', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ grupoId, usuarioId })
    });
    if (!response.ok) throw new Error('Error al aceptar la solicitud');
    mostrarMensaje('Solicitud aceptada', 'success');
    cargarDetalles();
  } catch (error) {
    console.error('Error al aceptar solicitud:', error);
    mostrarMensaje('No se pudo aceptar la solicitud', 'error');
  }
}

async function rechazarSolicitud(grupoId, usuarioId) {
  try {
    const response = await fetch('/api/groups/remove-member', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ grupoId, usuarioId })
    });
    if (!response.ok) throw new Error('Error al rechazar la solicitud');
    mostrarMensaje('Solicitud rechazada', 'success');
    cargarDetalles();
  } catch (error) {
    console.error('Error al rechazar solicitud:', error);
    mostrarMensaje('No se pudo rechazar la solicitud', 'error');
  }
}

// Inicialización: carga detalles y configura búsqueda dinámica
window.addEventListener('DOMContentLoaded', () => {
  cargarDetalles();
  const buscarUsuarioInput = document.getElementById('buscar-usuario');
  buscarUsuarioInput.addEventListener('input', buscarUsuarios);
});
