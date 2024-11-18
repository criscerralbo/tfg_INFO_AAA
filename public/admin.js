document.addEventListener('DOMContentLoaded', () => {
    // Mostrar el mensaje de estado almacenado en sessionStorage al cargar la página
    const statusMessage = sessionStorage.getItem('statusMessage');
    const statusType = sessionStorage.getItem('statusType');
    if (statusMessage && statusType) {
        const statusMessageDiv = document.getElementById('admin-status-message');
        statusMessageDiv.textContent = statusMessage;
        statusMessageDiv.className = statusType === 'error' ? 'message-error' : 'message-success';
        statusMessageDiv.style.display = 'block';

        // Oculta el mensaje después de 10 segundos y limpia sessionStorage
        setTimeout(() => {
            statusMessageDiv.style.display = 'none';
            sessionStorage.removeItem('statusMessage');
            sessionStorage.removeItem('statusType');
        }, 5000);
    }

    loadUsers();

    // Manejadores de eventos para búsqueda en tiempo real
    document.getElementById('nameInput').addEventListener('input', filterUsers);
    document.getElementById('emailInput').addEventListener('input', filterUsers);
    document.getElementById('roleFilter').addEventListener('change', filterUsers);
    document.getElementById('verifiedFilter').addEventListener('change', filterUsers);
});

let allUsers = [];

// Función para cargar la lista de usuarios
function loadUsers() {
    fetch('/usuarios')
        .then(response => {
            if (!response.ok) throw new Error('Error al cargar usuarios');
            return response.json();
        })
        .then(users => {
            allUsers = users; // Guardamos todos los usuarios en una variable global para filtrar
            displayUsers(users);
        })
        .catch(error => showMessage(error.message, 'error'));
}

// Función para mostrar usuarios en la tabla
function displayUsers(users) {
    const userList = document.getElementById('user-list');
    userList.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td contenteditable="true">${user.nombre}</td>
            <td contenteditable="true">${user.email}</td>
            <td>
                <select class="role-select" data-id="${user.id}">
                    <option value="alumno" ${user.rol === 'alumno' ? 'selected' : ''}>Alumno</option>
                    <option value="profesor" ${user.rol === 'profesor' ? 'selected' : ''}>Profesor</option>
                    <option value="administrador" ${user.rol === 'administrador' ? 'selected' : ''}>Administrador</option>
                </select>
            </td>
            <td>${user.verificado ? 'Sí' : '<button class="verify-button" data-id="' + user.id + '">Verificar</button>'}</td>
            <td>
                <button class="edit-button" data-id="${user.id}">Guardar</button>
                <button class="delete-button" data-id="${user.id}">Eliminar</button>
            </td>
        `;
        userList.appendChild(row);
    });

    activateButtonEvents();
}
document.getElementById('add-user-button').addEventListener('click', () => {
    document.getElementById('addUserModal').style.display = 'block';
});

// Cerrar el modal al hacer clic en la "X" o fuera del modal
document.getElementById('closeAddUserModal').addEventListener('click', closeAddUserModal);

function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
}


// Activar eventos de botones después de mostrar los usuarios
function activateButtonEvents() {
    // Botones de Eliminar
    document.querySelectorAll('.delete-button').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            showModal('¿Estás seguro de que deseas eliminar este usuario?', () => deleteUser(userId));
        });
    });

    // Botones de Guardar
    document.querySelectorAll('.edit-button').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            const row = button.closest('tr');
            const nombre = row.children[0].textContent;
            const email = row.children[1].textContent;
            const rol = row.querySelector('.role-select').value;
            showModal('¿Estás seguro de que deseas guardar los cambios?', () => updateUser(userId, nombre, email, rol));
        });
    });

    // Botones de Verificar
    document.querySelectorAll('.verify-button').forEach(button => {
        button.addEventListener('click', () => {
            const userId = button.getAttribute('data-id');
            verifyUser(userId);
        });
    });
}

// Función para mostrar mensajes en el contenedor de estado
function showMessage(message, type) {
    sessionStorage.setItem('statusMessage', message);
    sessionStorage.setItem('statusType', type);
    location.reload(); // Recargar la página para que el mensaje aparezca
}

// Función para mostrar el modal de confirmación
function showModal(message, onConfirm) {
    const modal = document.getElementById('actionModal');
    const modalMessage = document.getElementById('modalMessage');
    modalMessage.textContent = message;
    modal.style.display = 'block';

    document.getElementById('confirmAction').onclick = () => {
        modal.style.display = 'none';
        onConfirm(); // Ejecutar la función confirmada
    };

    document.getElementById('cancelAction').onclick = () => {
        modal.style.display = 'none';
    };
    document.getElementById('closeActionModal').onclick = () => {
        modal.style.display = 'none';
    };
}

// Función para verificar un usuario
function verifyUser(id) {
    fetch(`/usuarios/${id}/verificar`, { method: 'PUT' })
        .then(response => {
            if (!response.ok) throw new Error('Error al verificar usuario');
            return response.json();
        })
        .then(data => {
            showMessage('Usuario verificado con éxito', 'success');
        })
        .catch(error => showMessage(error.message, 'error'));
}

// Función para eliminar un usuario
function deleteUser(id) {
    fetch(`/usuarios/${id}`, { method: 'DELETE' })
        .then(response => {
            if (!response.ok) throw new Error('Error al eliminar usuario');
            return response.json();
        })
        .then(data => {
            showMessage('Usuario eliminado con éxito', 'success');
        })
        .catch(error => showMessage(error.message, 'error'));
}

// Función para actualizar un usuario
function updateUser(id, nombre, email, rol) {
    fetch(`/usuarios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, rol })
    })
    .then(response => {
        if (!response.ok) throw new Error('Error al actualizar usuario');
        return response.json();
    })
    .then(data => {
        showMessage('Usuario actualizado con éxito', 'success');
    })
    .catch(error => showMessage(error.message, 'error'));
}

// Función para buscar y filtrar usuarios
function filterUsers() {
    const nameTerm = document.getElementById('nameInput').value.toLowerCase();
    const emailTerm = document.getElementById('emailInput').value.toLowerCase();
    const selectedRole = document.getElementById('roleFilter').value;
    const verifiedFilter = document.getElementById('verifiedFilter').value;

    const filteredUsers = allUsers.filter(user => {
        const matchesName = user.nombre.toLowerCase().includes(nameTerm);
        const matchesEmail = user.email.toLowerCase().includes(emailTerm);
        const matchesRole = selectedRole ? user.rol === selectedRole : true;
        const matchesVerified = verifiedFilter ? (user.verificado === parseInt(verifiedFilter)) : true;

        return matchesName && matchesEmail && matchesRole && matchesVerified;
    });

    displayUsers(filteredUsers);
}

// Cerrar el modal de añadir usuario
function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
}

// Manejar el envío del formulario de añadir usuario
document.getElementById('addUserForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const nombre = document.getElementById('nombre').value;
    const email = document.getElementById('email').value;
    const rol = document.getElementById('rol').value;

    fetch('/usuarios/registrarAdm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, email, password: 'default123', rol })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success_message) {
            showMessage(data.success_message, 'success');
            closeAddUserModal();
        } else {
            showMessage(data.error_message || 'Error al crear el usuario', 'error');
        }
    })
    .catch(error => showMessage(error.message, 'error'));
});
