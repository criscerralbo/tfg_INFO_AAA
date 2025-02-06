async function cargarDetalles() {
    const params = new URLSearchParams(window.location.search);
    const grupoId = params.get('grupoId');

    const response = await fetch(`/api/groups/detalles/${grupoId}`, {
        method: 'GET',
        credentials: 'include'
    });

    if (!response.ok) {
        alert('No se pudieron cargar los detalles del grupo');
        return;
    }

    const grupo = await response.json();
    const detallesContainer = document.getElementById('detalle-grupo');

    detallesContainer.innerHTML = `
        <h2>Detalles del Grupo</h2>
        <p><strong>Nombre:</strong> ${grupo.nombre}</p>
        <p><strong>Código:</strong> ${grupo.identificador}</p>
        <p><strong>Creado el:</strong> ${new Date(grupo.creado_en).toLocaleString()}</p>
        <h3>Miembros</h3>
        <ul>
            ${grupo.miembros.map(m => `
                <li>
                    ${m.nombre} (${m.rol})
                    <button onclick="eliminarMiembro(${grupo.id}, ${m.id})">Eliminar</button>
                </li>
            `).join('')}
        </ul>
        <button onclick="mostrarFormulario()">Añadir Usuario</button>
        <div id="formulario-anadir" style="display:none;">
            <input type="text" id="usuarioId" placeholder="ID del Usuario">
            <button onclick="anadirMiembro(${grupo.id})">Añadir</button>
        </div>
    `;
}

function mostrarFormulario() {
    document.getElementById('formulario-anadir').style.display = 'block';
}
const buscarUsuarioInput = document.getElementById('buscar-usuario');
const resultadosBusqueda = document.getElementById('resultados-busqueda');

async function buscarUsuarios() {
    const query = buscarUsuarioInput.value.trim();

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
        alert('Error al buscar usuarios');
    }
}

function mostrarResultados(usuarios) {
    resultadosBusqueda.innerHTML = '';
    if (usuarios.length === 0) {
        resultadosBusqueda.innerHTML = '<p>No se encontraron usuarios</p>';
        return;
    }

    usuarios.forEach(user => {
        const userElement = document.createElement('div');
        userElement.innerHTML = `
            <p>${user.nombre} (${user.email})
            <button onclick="anadirMiembro(${user.id})">Añadir</button></p>
        `;
        resultadosBusqueda.appendChild(userElement);
    });
}

async function anadirMiembro(usuarioId) {
    const params = new URLSearchParams(window.location.search);
    const grupoId = params.get('grupoId');

    try {
        const response = await fetch('/api/groups/add-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ grupoId, usuarioId, rolId: 1 }) // Rol por defecto: alumno
        });

        if (!response.ok) throw new Error('Error al añadir miembro');

        alert('Usuario añadido correctamente');
        cargarDetalles(); // Recargar los detalles del grupo
    } catch (error) {
        console.error('Error al añadir miembro:', error);
        alert('No se pudo añadir el usuario');
    }
}

buscarUsuarioInput.addEventListener('input', buscarUsuarios);


async function eliminarMiembro(grupoId, usuarioId) {
    await fetch('/api/groups/remove-member', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grupoId, usuarioId })
    });
    cargarDetalles();
}

window.addEventListener('DOMContentLoaded', cargarDetalles);
