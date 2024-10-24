// Alternar entre el formulario de registro e inicio de sesión
document.getElementById('show-register').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('register-container').style.display = 'block';
});

document.getElementById('show-login').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('register-container').style.display = 'none';
  document.getElementById('login-container').style.display = 'block';
});

// Enviar el formulario de inicio de sesión
document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  // Enviar la solicitud al servidor
  const response = await fetch('/usuarios/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const errorMessageDiv = document.getElementById('error-message');

  // Verificar si la respuesta es correcta o contiene un error
  if (response.ok) {
    // Si el inicio de sesión es exitoso, redirigir al inicio
    window.location.href = '/inicio';
  } else {
    // Si hay un error, obtener el mensaje de error y mostrarlo en la página
    const data = await response.json(); // Convertir la respuesta en JSON
    errorMessageDiv.textContent = data.error_message; // Mostrar el mensaje de error
    errorMessageDiv.style.display = 'block'; // Hacer visible el mensaje
  }
});

// Enviar el formulario de registro
document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  // Validar que el correo sea institucional (@ucm.es)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@ucm\.es$/;
  if (!emailRegex.test(email)) {
    alert('Debe usar un correo institucional (@ucm.es)');
    return;
  }

  // Enviar datos al servidor
  const response = await fetch('/usuarios/registrar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nombre, email, password })
  });

  const data = await response.text();
  alert(data);

  // Si el registro fue exitoso, mostrar el formulario de verificación
  if (response.status === 200) {
    document.getElementById('register-container').style.display = 'none';
    document.getElementById('verification-container').style.display = 'block';
  }
});

// Enviar el formulario de verificación
document.getElementById('verifyForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('verifyEmail').value;
  const token = document.getElementById('verificationCode').value;

  const response = await fetch('/usuarios/verificar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, token })
  });

  // Asegurarnos de que estamos obteniendo la respuesta como JSON
  const data = await response.json();

  // Mostrar la respuesta del servidor para depurar
  console.log('Respuesta de verificación:', data);

  // Si la verificación es exitosa, redirigir al formulario de inicio de sesión
  if (response.status === 200) {
    document.getElementById('verification-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
  }
});

window.addEventListener('DOMContentLoaded', (event) => {
  // Actualizar el saludo con el nombre del usuario almacenado en la sesión
  fetch('/usuarios/nombre')
      .then(response => response.json())
      .then(data => {
          document.getElementById('user-greeting').textContent = `Bienvenido, ${data.nombreUsuario}`;
      });
});

// Función para cerrar sesión
document.getElementById('logout-button').addEventListener('click', function() {
  window.location.href = '/usuarios/logout'; // Llamada a la ruta de cierre de sesión
});
