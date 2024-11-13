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

document.getElementById('show-ver').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('register-container').style.display = 'none';
  document.getElementById('verification-container').style.display = 'block';
});


document.getElementById('show-login-from-verContra').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('verification-container').style.display = 'none';
  document.getElementById('login-container').style.display = 'block';
});

// Alternar al formulario de recuperación de contraseña
document.getElementById('show-password-recovery').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('login-container').style.display = 'none';
  document.getElementById('password-recovery-container').style.display = 'block';
});

// Regresar al formulario de inicio de sesión desde recuperación de contraseña
document.getElementById('show-login-from-recovery').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('password-recovery-container').style.display = 'none';
  document.getElementById('login-container').style.display = 'block';
});

// Regresar al formulario de inicio de sesión desde verificación de código
document.getElementById('show-login-from-verification').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('code-verification-container').style.display = 'none';
  document.getElementById('login-container').style.display = 'block';
});

// Regresar al formulario de inicio de sesión desde restablecimiento de contraseña
document.getElementById('show-login-from-reset').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('password-reset-container').style.display = 'none';
  document.getElementById('login-container').style.display = 'block';
});

// Ir al formulario de verificación de código desde recuperación de contraseña
document.getElementById('show-verification-from-recovery').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('password-recovery-container').style.display = 'none';
  document.getElementById('code-verification-container').style.display = 'block';
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

document.getElementById('registerForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const nombre = document.getElementById('nombre').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const rol = "alumno"; // Rol predeterminado

  // Contenedor de mensaje de error
  const successMessageDiv = document.getElementById('register-message');
  const errorMessageDiv = document.getElementById('register-error-message');

  errorMessageDiv.style.display = 'none'; // Ocultar el mensaje inicialmente
  successMessageDiv.style.display = 'none';

  // Validar que el correo sea institucional (@ucm.es)
  const emailRegex = /^[a-zA-Z0-9._%+-]+@ucm\.es$/;
  if (!emailRegex.test(email)) {
    errorMessageDiv.textContent = 'Debe usar un correo institucional (@ucm.es)';
    errorMessageDiv.style.display = 'block'; // Mostrar el mensaje de error en rojo
    return;
  }

  const response = await fetch('/usuarios/registrar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ nombre, email, password, rol })
  });

  if (response.ok) {
    const data = await response.json();
    successMessageDiv.textContent = data.success_message || 'Registro exitoso. Revisa tu correo para verificar tu cuenta.';
    successMessageDiv.style.display = 'block';
    // oculta el mensaje de éxito después de unos segundos
    setTimeout(() => {
      successMessageDiv.style.display = 'none';
    }, 10000); // Oculta el mensaje de éxito después de 5 segundos

        // Limpiar los campos del formulario
        nombre = '';
        email = '';
        password = '';

   // document.getElementById('register-container').style.display = 'none';
   // document.getElementById('verification-container').style.display = 'block';
  } else {
    const data = await response.json();
    errorMessageDiv.textContent = data.error_message || 'Error al registrarse';
    errorMessageDiv.style.display = 'block'; // Mostrar el mensaje de error en rojo


  }
});

document.getElementById('verifyForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('verifyEmail').value;
  const token = document.getElementById('verificationCode').value;

  const errorMessageDiv = document.getElementById('verification-error-message');
  errorMessageDiv.style.display = 'none'; // Ocultar el mensaje inicialmente

  const successMessageDiv = document.getElementById('verification-success-message');
  successMessageDiv.style.display = 'none';

  const response = await fetch('/usuarios/verificar', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, token })
  });

  if (response.ok) {
    // Si la verificación es exitosa, redirigir al formulario de inicio de sesión
    const data = await response.json();
    successMessageDiv.textContent = data.success_message || 'Cuenta Verificada, ya puedes iniciar sesión.';

    successMessageDiv.style.display = 'block';
    // Limpiar los campos del formulario
    email.value = '';
    token.value = '';
    // Opcional: Redirigir al inicio de sesión después de unos segundos
    setTimeout(() => {
      document.getElementById('verification-container').style.display = 'none';
      document.getElementById('login-container').style.display = 'block';
    }, 10000); // Redirige después de 5 segundos
    //document.getElementById('verification-container').style.display = 'none';
    //document.getElementById('login-container').style.display = 'block';
  } else {
    // Mostrar el mensaje de error en caso de que el código sea incorrecto o cualquier otro problema
    const data = await response.json();
    errorMessageDiv.textContent = data.error || 'Código de verificación incorrecto';
    errorMessageDiv.style.display = 'block';
  }
});


// Enviar el formulario de recuperación de contraseña
document.getElementById('passwordRecoveryForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('recoveryEmail').value;
  const recoveryErrorMessageDiv = document.getElementById('recovery-error-message');

  const response = await fetch('/usuarios/recuperarContrasena', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email })
  });

  const data = await response.json();

  if (response.ok) {
    document.getElementById('password-recovery-container').style.display = 'none';
    document.getElementById('code-verification-container').style.display = 'block';
  } else {
    recoveryErrorMessageDiv.textContent = data.error || 'Error al recuperar la contraseña';
    recoveryErrorMessageDiv.style.display = 'block';
  }
});

// Enviar el formulario de verificación de código para restablecimiento de contraseña
document.getElementById('codeVerificationForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('verificationEmail').value;
  const token = document.getElementById('verificationToken').value;
  const verificationMessageDiv = document.getElementById('verification-message');

  const response = await fetch('/usuarios/verificarCodigo', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token })
  });

  const data = await response.json();

  if (response.ok) {
    verificationMessageDiv.textContent = data.message;
    verificationMessageDiv.style.color = 'green';
    document.getElementById('code-verification-container').style.display = 'none';
    document.getElementById('password-reset-container').style.display = 'block';
  } else {
    verificationMessageDiv.textContent = data.error || 'Código de verificación incorrecto';
    verificationMessageDiv.style.color = 'red';
  }

  verificationMessageDiv.style.display = 'block';
});

// Enviar el formulario de restablecimiento de contraseña
document.getElementById('passwordResetForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const email = document.getElementById('resetEmail').value;
  const token = document.getElementById('resetToken').value;
  const newPassword = document.getElementById('newPassword').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const resetMessageDiv = document.getElementById('reset-message');

  resetMessageDiv.textContent = '';
  resetMessageDiv.style.display = 'none';

  if (newPassword !== confirmPassword) {
    resetMessageDiv.textContent = 'Las contraseñas no coinciden';
    resetMessageDiv.style.color = 'red';
    resetMessageDiv.style.display = 'block';
    return;
  }

  const response = await fetch('/usuarios/resetearContrasena', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, newPassword, token })
  });

  const data = await response.json();

  if (response.ok) {
    resetMessageDiv.textContent = data.message;
    resetMessageDiv.style.color = 'green';
    document.getElementById('password-reset-container').style.display = 'none';
    document.getElementById('login-container').style.display = 'block';
  } else {
    resetMessageDiv.textContent = data.error || 'Error al restablecer la contraseña';
    resetMessageDiv.style.color = 'red';
  }

  resetMessageDiv.style.display = 'block';
});

// Actualizar saludo con el nombre del usuario de la sesión
window.addEventListener('DOMContentLoaded', (event) => {
  fetch('/usuarios/nombre')
    .then(response => response.json())
    .then(data => {
      document.getElementById('user-greeting').textContent = `Bienvenido, ${data.nombreUsuario}`;
    });
});

// Función para cerrar sesión
document.getElementById('logout-button').addEventListener('click', function() {
  window.location.href = '/usuarios/logout';
});
