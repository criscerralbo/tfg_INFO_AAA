// Función para buscar grupos
async function buscarGrupos() {
    const query = document.getElementById('buscar-grupo').value.trim();
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    
    if (query === '') {
        resultadosBusqueda.innerHTML = 'Introduce un nombre o número de referencia.';
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
    }
}

// Mostrar los resultados de la búsqueda de grupos
function mostrarResultadosGrupos(grupos) {
    const resultadosBusqueda = document.getElementById('resultados-busqueda');
    resultadosBusqueda.innerHTML = '';
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

async function solicitarUnirse(grupoId) {
    try {
        const response = await fetch('/api/alumno/solicitar-unirse', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  // Para incluir las cookies de sesión si es necesario
            body: JSON.stringify({ grupoId })
        });

        if (!response.ok) throw new Error('Error al solicitar unirse al grupo');
        alert('Solicitud enviada correctamente');
    } catch (error) {
        console.error('Error al solicitar unirse:', error);
        alert('Error al enviar la solicitud');
    }
}


// Función para ver los grupos matriculados
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

// Mostrar los grupos en los que el alumno está matriculado
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

// Función para ver los detalles de un grupo
async function verDetallesGrupo(grupoId) {
    try {
        const response = await fetch(`/api/alumno/detalles-grupo/${grupoId}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al obtener los detalles del grupo');
        
        const grupo = await response.json();
        mostrarDetallesGrupo(grupo);
    } catch (error) {
        console.error('Error al cargar detalles del grupo:', error);
    }
}

// Mostrar los detalles del grupo
function mostrarDetallesGrupo(grupo) {
    const grupoDetalle = document.getElementById('grupo-detalle');
    const miembrosGrupo = document.getElementById('miembros-grupo');
    grupoDetalle.style.display = 'block';

    miembrosGrupo.innerHTML = `<h3>Miembros del Grupo</h3>`;
    grupo.miembros.forEach(miembro => {
        miembrosGrupo.innerHTML += `<p>${miembro.nombre} (${miembro.rol})</p>`;
    });
}

// Función para buscar miembros del grupo
async function buscarMiembros() {
    const query = document.getElementById('buscar-miembro').value.trim();
    const miembrosGrupo = document.getElementById('miembros-grupo');
    
    if (query === '') {
        miembrosGrupo.innerHTML = 'Introduce un nombre para buscar miembros.';
        return;
    }

    try {
        const response = await fetch(`/api/alumno/buscar-miembros?query=${query}`, {
            method: 'GET',
            credentials: 'include'
        });
        if (!response.ok) throw new Error('Error al buscar miembros');

        const miembros = await response.json();
        mostrarMiembrosBusqueda(miembros);
    } catch (error) {
        console.error('Error al buscar miembros:', error);
    }
}

// Mostrar los resultados de búsqueda de miembros
function mostrarMiembrosBusqueda(miembros) {
    const miembrosGrupo = document.getElementById('miembros-grupo');
    miembrosGrupo.innerHTML = '<h3>Miembros del Grupo</h3>';
    if (miembros.length === 0) {
        miembrosGrupo.innerHTML += '<p>No se encontraron miembros.</p>';
        return;
    }
    miembros.forEach(miembro => {
        miembrosGrupo.innerHTML += `<p>${miembro.nombre} (${miembro.rol})</p>`;
    });
}

// Cargar los grupos matriculados al cargar la página
window.addEventListener('DOMContentLoaded', () => {
    cargarGruposMatriculados();
});
