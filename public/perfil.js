document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos del perfil del usuario desde el servidor
    fetch('/usuarios/perfil')
        .then(response => response.json())
        .then(data => {
            if (data && data.nombre && data.email) {
                document.getElementById('nombre').value = data.nombre;
                document.getElementById('email').value = data.email;
            }
        });

    // Enviar el formulario para actualizar datos del usuario
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const nombre = document.getElementById('nombre').value;
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;

        const response = await fetch('/usuarios/actualizarPerfil', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, currentPassword, newPassword })
        });

        const result = await response.text();
        alert(result);
    });

    // Cerrar sesión
    document.getElementById('logout-button').addEventListener('click', function() {
        fetch('/usuarios/logout')
            .then(() => {
                window.location.href = '/'; // Redirigir a la página de inicio de sesión (index.html)
            })
            .catch(err => {
                console.error('Error al cerrar sesión:', err);
                alert('Hubo un problema al intentar cerrar la sesión. Por favor, inténtalo de nuevo.');
            });
    });

    // Volver a inicio (redirigir a /inicio)
    document.getElementById('inicio-button').addEventListener('click', function() {
        window.location.href = '/inicio'; // Redirigir a la ruta /inicio
    });
});
