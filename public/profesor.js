document.addEventListener('DOMContentLoaded', () => {
    const formCrearGrupo = document.getElementById('form-crear-grupo');

    // Verificar si el formulario existe
    if (!formCrearGrupo) {
        console.error('Formulario de creación de grupo no encontrado.');
        return;
    }

    // Event Listener para crear un grupo
    formCrearGrupo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombreGrupo = document.getElementById('nombre-grupo').value.trim();

        if (nombreGrupo === '') {
            alert('Por favor, introduce un nombre para el grupo.');
            return;
        }

        console.log('Formulario enviado. Nombre del grupo:', nombreGrupo);

        try {
            const response = await fetch('/api/groups/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nombre: nombreGrupo })
            });

            const data = await response.json();
            console.log('Respuesta del servidor al crear grupo:', data);

            if (data.error) {
                alert(`Error: ${data.error}`);
            } else {
                alert(`Grupo creado con éxito. Código: ${data.codigo}`);
                cargarMisGrupos(); // Recargar lista de grupos automáticamente
            }
        } catch (err) {
            console.error('Error al crear el grupo:', err);
            alert('Ocurrió un error al crear el grupo.');
        }
    });

    // Cargar los grupos al cargar la página
    cargarMisGrupos();
});

// Función para cargar los grupos del usuario
async function cargarMisGrupos() {
    try {
        const response = await fetch('/api/groups/mis-grupos', {
            method: 'GET',
            credentials: 'include' // Enviar cookies de sesión
        });

        if (!response.ok) {
            throw new Error('Error al cargar los grupos');
        }

        const grupos = await response.json();
        const gruposContainer = document.getElementById('lista-grupos');
        gruposContainer.innerHTML = ''; // Limpiar el contenido anterior

        grupos.forEach(grupo => {
            const grupoElemento = document.createElement('li');
            grupoElemento.innerHTML = `
                <p><strong>Nombre:</strong> ${grupo.nombre}</p>
                <p><strong>Código:</strong> ${grupo.identificador}</p>
                <p><strong>Creado el:</strong> ${new Date(grupo.creado_en).toLocaleString()}</p>
                <button class="detalles-button" onclick="irADetalles(${grupo.id})">Detalles</button>
            `;
            gruposContainer.appendChild(grupoElemento);
        });

    } catch (error) {
        console.error('Error al cargar los grupos:', error);
        alert('No se pudieron cargar los grupos.');
    }
}

// Función para redirigir a la página de detalles del grupo
function irADetalles(grupoId) {
    window.location.href = `/detalles.html?grupoId=${grupoId}`;
}
