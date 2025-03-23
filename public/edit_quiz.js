document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get('id');
    if (!quizId) return alert('Quiz no especificado');
  
    cargarQuiz(quizId);
  
    document.getElementById('form-editar-quiz').addEventListener('submit', async (e) => {
      e.preventDefault();
      const titulo = document.getElementById('titulo').value.trim();
      const descripcion = document.getElementById('descripcion').value.trim();
      try {
        const res = await fetch(`/api/quizzes/${quizId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descripcion })
        });
        if (res.ok) {
          mostrarMensaje('Quiz actualizado', 'success');
        } else {
          const data = await res.json();
          mostrarMensaje(data.error, 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al actualizar', 'error');
      }
    });
  
    document.getElementById('form-nueva-pregunta').addEventListener('submit', async (e) => {
      e.preventDefault();
      const texto = document.getElementById('texto-pregunta').value.trim();
      const opcion1 = document.getElementById('opcion1').value.trim();
      const opcion2 = document.getElementById('opcion2').value.trim();
      const opcion3 = document.getElementById('opcion3').value.trim();
      const opcion4 = document.getElementById('opcion4').value.trim();
      const respuesta = parseInt(document.getElementById('respuesta-correcta').value.trim(), 10);
      if (!texto || !opcion1 || !opcion2 || !opcion3 || !opcion4 || !respuesta) {
        return alert('Completa todos los campos');
      }
      // Llamada a la API para agregar la pregunta
      try {
        const res = await fetch(`/api/preguntas/${quizId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto })
        });
        if (res.ok) {
          // Nota: Aquí se asume que en el futuro se enviarán también las opciones.
          mostrarMensaje('Pregunta agregada (opciones no implementadas en este ejemplo)', 'success');
          document.getElementById('form-nueva-pregunta').reset();
          cargarQuiz(quizId);
        } else {
          const data = await res.json();
          mostrarMensaje(data.error, 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al agregar pregunta', 'error');
      }
    });
  });
  
  async function cargarQuiz(id) {
    try {
      const res = await fetch(`/api/quizzes/${id}`);
      if (res.ok) {
        const quiz = await res.json();
        document.getElementById('titulo').value = quiz.titulo;
        document.getElementById('descripcion').value = quiz.descripcion || '';
        listarPreguntas(quiz.preguntas);
      } else {
        mostrarMensaje('Error al cargar el quiz', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  }
  
  function listarPreguntas(preguntas) {
    const lista = document.getElementById('lista-preguntas');
    lista.innerHTML = '';
    if (!preguntas || preguntas.length === 0) {
      lista.innerHTML = '<li>No hay preguntas en este quiz.</li>';
      return;
    }
    preguntas.forEach(p => {
      const li = document.createElement('li');
      li.innerHTML = `
        <strong>${p.texto}</strong><br>
        <button onclick="eliminarPregunta(${p.id})">Eliminar</button>
      `;
      lista.appendChild(li);
    });
  }
  
  async function eliminarPregunta(id) {
    if (confirm('¿Eliminar esta pregunta?')) {
      try {
        const res = await fetch(`/api/preguntas/${id}`, { method: 'DELETE' });
        if (res.ok) {
          mostrarMensaje('Pregunta eliminada', 'success');
          const params = new URLSearchParams(window.location.search);
          cargarQuiz(params.get('id'));
        } else {
          const data = await res.json();
          mostrarMensaje(data.error, 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al eliminar', 'error');
      }
    }
  }
  
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    div.textContent = mensaje;
    div.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 4000);
  }
  