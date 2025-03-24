// ver_tests.js
// Lógica para obtener los quizzes asignados al alumno y mostrarlos

async function cargarQuizzesAsignados() {
    try {
      // GET a un endpoint que devuelva los quizzes asignados al usuario actual
      const res = await fetch('/api/user/quizzes');
      if (!res.ok) throw new Error('Error al obtener quizzes asignados');
  
      const quizzes = await res.json();
      const lista = document.getElementById('lista-quizzes-asignados');
      lista.innerHTML = '';
  
      quizzes.forEach(quiz => {
        const li = document.createElement('li');
        li.textContent = `${quiz.titulo} - ${quiz.descripcion || ''}`;
  
        // Botón para "Jugar" (redirige a jugar_quiz.html?id=...)
        const btnJugar = document.createElement('button');
        btnJugar.textContent = 'Realizar Test';
        btnJugar.addEventListener('click', () => {
          // Llevamos a la pantalla de jugar
          window.location.href = `jugar_quiz.html?id=${quiz.id}`;
        });
        li.appendChild(btnJugar);
  
        lista.appendChild(li);
      });
    } catch (err) {
      console.error(err);
      // Muestra un mensaje de error en tu modal o contenedor
    }
  }
  
  // Llamamos a la función al cargar la página
  window.addEventListener('DOMContentLoaded', cargarQuizzesAsignados);
  