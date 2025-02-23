document.addEventListener('DOMContentLoaded', () => {
    // --- Lógica para crear un nuevo grupo ---
    const formCrearGrupo = document.getElementById('form-crear-grupo');
    const mensajeEstado = document.getElementById('mensaje-estado');

    if (!formCrearGrupo) {
        console.error('Formulario de creación de grupo no encontrado.');
        return;
    }

    formCrearGrupo.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nombreGrupo = document.getElementById('nombre-grupo').value.trim();

        if (nombreGrupo === '') {
            mostrarMensaje('Por favor, introduce un nombre para el grupo.', 'error');
            return;
        }

        try {
            const response = await fetch('/api/groups/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ nombre: nombreGrupo })
            });

            const data = await response.json();

            if (data.error) {
                mostrarMensaje(`Error: ${data.error}`, 'error');
            } else {
                mostrarMensaje(`Grupo creado con éxito. Código: ${data.codigo}`, 'success');
                
                // Limpiar el campo de texto
                document.getElementById('nombre-grupo').value = '';
                
                // Recargar la lista de grupos
                cargarMisGrupos();
            }
        } catch (err) {
            console.error('Error al crear el grupo:', err);
            mostrarMensaje('Ocurrió un error al crear el grupo.', 'error');
        }
    });

    // --- Lógica para cargar la lista de grupos ---
    cargarMisGrupos();

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
});

// --- Funciones auxiliares ---
function mostrarMensaje(mensaje, tipo) {
    const mensajeEstado = document.getElementById('mensaje-estado');
    mensajeEstado.textContent = mensaje;
    mensajeEstado.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    mensajeEstado.style.display = 'block';

    setTimeout(() => {
        mensajeEstado.style.display = 'none';
    }, 4000);
}

async function cargarMisGrupos() {
    try {
        const response = await fetch('/api/groups/mis-grupos', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Error al cargar los grupos');
        }

        const grupos = await response.json();
        const gruposContainer = document.getElementById('lista-grupos');
        gruposContainer.innerHTML = '';

        grupos.forEach(grupo => {
            const grupoElemento = document.createElement('li');
            grupoElemento.innerHTML = `
                <p><strong>Nombre:</strong> ${grupo.nombre}</p>
                <p><strong>Código:</strong> ${grupo.identificador}</p>
                <p><strong>Creado el:</strong> ${new Date(grupo.creado_en).toLocaleString()}</p>
                <button class="detalles-button" onclick="irADetalles(${grupo.id})">Ver Detalles</button>
            `;
            gruposContainer.appendChild(grupoElemento);
        });

    } catch (error) {
        console.error('Error al cargar los grupos:', error);
        mostrarMensaje('No se pudieron cargar los grupos.', 'error');
    }
}

function irADetalles(grupoId) {
    window.location.href = `/detalles.html?grupoId=${grupoId}`;
}
