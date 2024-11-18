document.addEventListener('DOMContentLoaded', function() {
    // Mostrar mensaje de estado desde sessionStorage
    const statusMessage = sessionStorage.getItem('statusMessage');
    const statusType = sessionStorage.getItem('statusType');
    if (statusMessage && statusType) {
        const statusMessageDiv = document.getElementById('perfil-status-message');
        statusMessageDiv.textContent = statusMessage;
        statusMessageDiv.className = statusType === 'error' ? 'message-error' : 'message-success';
        statusMessageDiv.style.display = 'block';

        // Ocultar mensaje después de 10 segundos y limpiar sessionStorage
        setTimeout(() => {
            statusMessageDiv.style.display = 'none';
            sessionStorage.removeItem('statusMessage');
            sessionStorage.removeItem('statusType');
        }, 5000);
    }

    // Cargar datos del perfil del usuario
    fetch('/usuarios/perfil')
        .then(response => response.json())
        .then(data => {
            if (data && data.nombre && data.email) {
                document.getElementById('nombre').value = data.nombre;
                document.getElementById('email').value = data.email;
            }
        })
        .catch(err => {
            console.error('Error al cargar los datos del perfil:', err);
            showMessage('Hubo un problema al cargar los datos del perfil. Por favor, inténtalo de nuevo.', 'error');
        });

        document.getElementById('profileForm').addEventListener('submit', async function(e) {
            e.preventDefault();
        
            const nombre = document.getElementById('nombre').value;
            const email = document.getElementById('email').value;
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
        
            try {
                const response = await fetch('/usuarios/actualizarPerfil', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nombre, email, currentPassword, newPassword, confirmNewPassword })
                });
        
                if (response.ok) {
                    showMessage(await response.text(), 'success');
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmNewPassword').value = '';
                } else {
                    showMessage(`Error al actualizar el perfil: ${await response.text()}`, 'error');
                }
            } catch (error) {
                console.error("Error al actualizar el perfil:", error);
                showMessage('Hubo un problema al actualizar el perfil. Por favor, inténtalo de nuevo.', 'error');
            }
        });
        
    //elinar cuenta
    document.getElementById('confirmDeleteAccount').addEventListener('click', async function() {
        try {
            const response = await fetch('/usuarios/eliminarCuenta', {
                method: 'DELETE'
            });
    
            if (response.ok) {
                showMessage('Tu cuenta ha sido eliminada correctamente.', 'success');
                setTimeout(() => {
                    window.location.href = '/'; // Redirige a la página de inicio de sesión
                }, 2000);
            } else {
                showMessage('Error al eliminar la cuenta. Intenta de nuevo más tarde.', 'error');
            }
        } catch (error) {
            console.error('Error al eliminar la cuenta:', error);
            showMessage('Hubo un problema al intentar eliminar la cuenta.', 'error');
        }
        document.getElementById('deleteAccountModal').style.display = 'none';
    });
    

    // Cerrar sesión
    document.getElementById('logout-button').addEventListener('click', function() {
        document.getElementById('logoutModal').style.display = 'block';
    });

    document.getElementById('confirmLogout').addEventListener('click', function() {
        fetch('/usuarios/logout')
            .then(() => {
                window.location.href = '/'; // Redirigir a la página de inicio de sesión
            });
    });

    document.getElementById('cancelLogout').addEventListener('click', function() {
        document.getElementById('logoutModal').style.display = 'none';
    });

    document.getElementById('closeModal').addEventListener('click', function() {
        document.getElementById('logoutModal').style.display = 'none';
    });

    // Volver a inicio
    document.getElementById('inicio-button').addEventListener('click', function() {
        window.location.href = '/inicio';
    });
        // Mostrar el modal de confirmación para eliminar cuenta
    document.getElementById('delete-account-button').addEventListener('click', function() {
        document.getElementById('deleteAccountModal').style.display = 'block';
    });

    // Cerrar el modal al hacer clic en "Cancelar" o en la "X"
    document.getElementById('cancelDeleteAccount').addEventListener('click', function() {
        document.getElementById('deleteAccountModal').style.display = 'none';
    });

    document.getElementById('closeDeleteAccountModal').addEventListener('click', function() {
        document.getElementById('deleteAccountModal').style.display = 'none';
    });

});

// Función para mostrar mensajes en el contenedor de estado
function showMessage(message, type) {
    sessionStorage.setItem('statusMessage', message);
    sessionStorage.setItem('statusType', type);
    location.reload(); // Recargar la página para que el mensaje aparezca
}
