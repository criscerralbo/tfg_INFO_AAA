// Función para buscar grupos
// Función para buscar grupos
async function buscarGrupos() {
    const query = document.getElementById('buscar-grupo').value.trim();
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    
    if (query === '') {
        resultadosBusqueda.innerHTML = ''; // Limpiar los resultados si no hay texto
        return;
    }

    try {
        const response = await fetch(`/api/alumno/buscar-grupos?query=${query}`, {
            method: 'GET',
            credentials: 'include'  // Para incluir las cookies de sesión si es necesario
        });

        if (!response.ok) throw new Error('Error al buscar grupos');
        
        const grupos = await response.json();
        mostrarResultadosGrupos(grupos);
    } catch (error) {
        console.error('Error al buscar grupos:', error);
        mostrarMensaje('Error al buscar grupos', 'error');
    }
}

// Mostrar los resultados de la búsqueda de grupos
function mostrarResultadosGrupos(grupos) {
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    resultadosBusqueda.innerHTML = ''; // Limpiar los resultados previos
    if (grupos.length === 0) {
        resultadosBusqueda.innerHTML = '<p>No se encontraron grupos.</p>';
        return;
    }
    grupos.forEach(grupo => {
        const grupoElement = document.createElement('div');
        grupoElement.innerHTML = `
            <p>${grupo.nombre} (Ref: ${grupo.identificador})</p>
            <button onclick="solicitarUnirse(${grupo.id})">Solicitar Unirse</button>
        `;
        resultadosBusqueda.appendChild(grupoElement);
    });
}


// Mostrar mensajes en la pantalla
function mostrarMensaje(mensaje, tipo) {
    const mensajeEstado = document.getElementById('mensaje-estado');
    if (!mensajeEstado) {
        const newMensajeEstado = document.createElement('div');
        newMensajeEstado.id = 'mensaje-estado';
        document.body.appendChild(newMensajeEstado);
    }
    const mensajeElem = document.getElementById('mensaje-estado');
    mensajeElem.textContent = mensaje;
    mensajeElem.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    mensajeElem.style.display = 'block';
    setTimeout(() => {
        mensajeElem.style.display = 'none';
    }, 4000);
}


// Función para solicitar unirse a un grupo
// Función para solicitar unirse a un grupo
async function solicitarUnirse(grupoId) {
    try {
        const response = await fetch('/api/alumno/solicitar-unirse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  // Para incluir las cookies de sesión si es necesario
            body: JSON.stringify({ grupoId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            mostrarMensaje(errorData.error || 'Error al enviar la solicitud', 'error');
            return;
        }

        mostrarMensaje('Solicitud enviada correctamente', 'success');
    } catch (error) {
        console.error('Error al solicitar unirse:', error);
        mostrarMensaje('Error al enviar la solicitud', 'error');
    }
}


// Función para cargar los grupos en los que el alumno está matriculado
async function cargarGruposMatriculados() {
    try {
        const response = await fetch('/api/alumno/grupos-matriculados', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) throw new Error('Error al obtener los grupos matriculados');
        
        const grupos = await response.json();
        mostrarGruposMatriculados(grupos);
    } catch (error) {
        console.error('Error al cargar grupos matriculados:', error);
    }
}

// Mostrar los grupos matriculados
function mostrarGruposMatriculados(grupos) {
    const gruposLista = document.getElementById('grupos-lista');
    gruposLista.innerHTML = '';
    if (grupos.length === 0) {
        gruposLista.innerHTML = '<p>No estás matriculado en ningún grupo.</p>';
        return;
    }
    grupos.forEach(grupo => {
        const grupoElement = document.createElement('div');
        grupoElement.innerHTML = `
            <p>${grupo.nombre} (Ref: ${grupo.identificador})</p>
            <button onclick="verDetallesGrupo(${grupo.id})">Ver Detalles</button>
        `;
        gruposLista.appendChild(grupoElement);
    });
}

// Función para ver los detalles del grupo
async function verDetallesGrupo(grupoId) {
    try {
        const response = await fetch(`/api/alumno/detalles/${grupoId}`, {
            method: 'GET',
            credentials: 'include'  // Para incluir las cookies de sesión si es necesario
        });
        if (!response.ok) throw new Error('Error al obtener los detalles del grupo');
        
        const grupo = await response.json();
        mostrarDetallesGrupo(grupo);
    } catch (error) {
        console.error('Error al cargar detalles del grupo:', error);
        mostrarMensaje('Error al obtener los detalles del grupo', 'error');
    }
}

// Mostrar los detalles del grupo
function mostrarDetallesGrupo(grupo) {
    const grupoDetalle = document.getElementById('grupo-detalle');
    const miembrosGrupo = document.getElementById('miembros-grupo');
    grupoDetalle.style.display = 'block';

    // Mostrar los detalles del grupo
    grupoDetalle.innerHTML = `<h2>Detalles del Grupo: ${grupo.nombre}</h2>
                              <p><strong>Referencia: </strong>${grupo.identificador}</p>
                              <p><strong>Fecha de Creación: </strong>${grupo.creado_en}</p>`;

    // Mostrar la lista de miembros
    miembrosGrupo.innerHTML = `<h3>Miembros del Grupo</h3>`;
    grupo.miembros.forEach(miembro => {
        miembrosGrupo.innerHTML += `<p>${miembro.nombre} - ${miembro.rol}</p>`;
    });
}


// Cargar los grupos matriculados al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    // --- Lógica para el modal de cierre de sesión ---
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
                .then(() => {
                    window.location.href = '/'; // Redirigir a la página de inicio de sesión
                });
        });
    }
    const buscarGrupoInput = document.getElementById('buscar-grupo');
    buscarGrupoInput.addEventListener('input', buscarGrupos);  // Búsqueda en tie
    cargarGruposMatriculados();
});
