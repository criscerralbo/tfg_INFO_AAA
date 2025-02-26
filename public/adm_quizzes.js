document.addEventListener('DOMContentLoaded', () => {
    // Configuración de listeners para el modal de logout
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
        .then(() => window.location.href = '/');
    });
  }
    const formNuevaPregunta = document.getElementById('form-nueva-pregunta');
    const preguntasUl = document.getElementById('preguntas-ul');
  
    // Array en memoria para simular almacenamiento de preguntas
    let preguntas = [
      {
        titulo: 'Quiz de Anatomía Básica',
        texto: '¿Cuántos dientes permanentes tiene un adulto?',
        opciones: ['20', '24', '28', '32'],
        respuestaCorrecta: 4
      }
    ];
  
    // Cargar preguntas existentes al iniciar
    mostrarPreguntas();
  
    // Manejar el envío del formulario para agregar pregunta
    formNuevaPregunta.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const tituloQuiz = document.getElementById('titulo-quiz').value.trim();
      const textoPregunta = document.getElementById('texto-pregunta').value.trim();
      const opcion1 = document.getElementById('opcion1').value.trim();
      const opcion2 = document.getElementById('opcion2').value.trim();
      const opcion3 = document.getElementById('opcion3').value.trim();
      const opcion4 = document.getElementById('opcion4').value.trim();
      const respuesta = document.getElementById('respuesta-correcta').value.trim();
  
      // Validaciones mínimas
      if (!textoPregunta || !opcion1 || !opcion2 || !opcion3 || !opcion4 || !respuesta) {
        mostrarMensaje('Por favor, completa todos los campos.', 'error');
        return;
      }
  
      const numRespuesta = parseInt(respuesta, 10);
      if (numRespuesta < 1 || numRespuesta > 4) {
        mostrarMensaje('La respuesta correcta debe ser un número entre 1 y 4.', 'error');
        return;
      }
  
      // Crear objeto de pregunta
      const nuevaPregunta = {
        titulo: tituloQuiz || 'Quiz sin título',
        texto: textoPregunta,
        opciones: [opcion1, opcion2, opcion3, opcion4],
        respuestaCorrecta: numRespuesta
      };
  
      // Guardamos en el array local
      preguntas.push(nuevaPregunta);
  
      mostrarMensaje('Pregunta guardada correctamente.', 'success');
      
      // Limpiar formulario
      formNuevaPregunta.reset();
  
      // Actualizar la lista de preguntas
      mostrarPreguntas();
    });
  
    // Función para renderizar las preguntas en la lista
    function mostrarPreguntas() {
      preguntasUl.innerHTML = '';
  
      preguntas.forEach((pregunta, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <strong>Título:</strong> ${pregunta.titulo}<br>
          <strong>Pregunta:</strong> ${pregunta.texto}<br>
          <strong>Opciones:</strong><br>
          1) ${pregunta.opciones[0]}<br>
          2) ${pregunta.opciones[1]}<br>
          3) ${pregunta.opciones[2]}<br>
          4) ${pregunta.opciones[3]}<br>
          <strong>Respuesta Correcta:</strong> Opción ${pregunta.respuestaCorrecta}
          <hr>
        `;
        preguntasUl.appendChild(li);
      });
    }
  });
  
  // Función para mostrar mensajes (reutilizable)
  function mostrarMensaje(mensaje, tipo) {
    const mensajeEstado = document.getElementById('mensaje-estado');
    if (mensajeEstado) {
      mensajeEstado.textContent = mensaje;
      mensajeEstado.className = (tipo === 'success') ? 'mensaje-success' : 'mensaje-error';
      mensajeEstado.style.display = 'block';
  
      // Ocultar el mensaje después de 4 segundos
      setTimeout(() => {
        mensajeEstado.style.display = 'none';
      }, 4000);
    } else {
      console.log(`${tipo.toUpperCase()}: ${mensaje}`);
    }
  }
  