document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const actividadId = params.get('id');
    if (!actividadId) {
      alert('ID de actividad no proporcionado');
      return;
    }
  
    const tituloInput = document.getElementById('tituloEmp');
    const descripcionInput = document.getElementById('descripcionEmp');
    const form = document.getElementById('form-edit-emparejamiento');
    const deleteBtn = document.getElementById('btn-eliminar-emparejamiento');
    const paresContainer = document.getElementById('pares-container');
  
    // ========== Logout ==========
    document.getElementById('logout-button').addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'block';
    });
    document.getElementById('cancelLogout').addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
    document.getElementById('closeModal').addEventListener('click', () => {
      document.getElementById('logoutModal').style.display = 'none';
    });
    document.getElementById('confirmLogout').addEventListener('click', () => {
      fetch('/usuarios/logout').then(() => window.location.href = '/');
    });
  
    // ========== Cargar Datos ==========
    async function cargarActividad() {
      try {
        const res = await fetch(`/api/alumno/emparejamientos/${actividadId}`);
        const data = await res.json();
  
        tituloInput.value = data.nombre;
        descripcionInput.value = data.descripcion || '';
        paresContainer.innerHTML = '';
  
        data.pares.forEach(par => {
          const div = document.createElement('div');
          div.innerHTML = `
            <input type="text" placeholder="Palabra" value="${par.palabra}" required>
            <input type="text" placeholder="URL Imagen" value="${par.imagen}" required>
            <button type="button" onclick="this.parentElement.remove()">❌</button>
            <br>`;
          paresContainer.appendChild(div);
        });
      } catch (err) {
        console.error(err);
        alert('Error al cargar la actividad');
      }
    }
  
    cargarActividad();
  
    // ========== Guardar Cambios ==========
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
  
      const nombre = tituloInput.value.trim();
      const descripcion = descripcionInput.value.trim();
      const pares = Array.from(paresContainer.children).map(div => {
        const [palabra, imagen] = div.querySelectorAll('input');
        return { palabra: palabra.value, imagen: imagen.value };
      });
  
      try {
        const res = await fetch(`/api/profesor/emparejamientos/${actividadId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, descripcion, pares })
        });
  
        if (res.ok) {
          mostrarMensaje('Actividad actualizada correctamente', 'success');
        } else {
          const data = await res.json();
          mostrarMensaje(data.error || 'Error al actualizar', 'error');
        }
      } catch (err) {
        console.error(err);
        mostrarMensaje('Error al conectar con el servidor', 'error');
      }
    });
  
    // ========== Eliminar Actividad ==========
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('¿Estás seguro de eliminar esta actividad?')) return;
      try {
        const res = await fetch(`/api/profesor/emparejamientos/${actividadId}`, { method: 'DELETE' });
        if (res.ok) {
          alert('Actividad eliminada');
          window.location.href = 'adm_quizzes.html';
        } else {
          const data = await res.json();
          alert(data.error || 'Error al eliminar');
        }
      } catch (err) {
        console.error(err);
        alert('Error al conectar con el servidor');
      }
    });
  });
  
  // ========== Función Global ==========
  function agregarPar() {
    const container = document.getElementById('pares-container');
    const div = document.createElement('div');
    div.innerHTML = `
      <input type="text" placeholder="Palabra" required>
      <input type="text" placeholder="URL Imagen" required>
      <button type="button" onclick="this.parentElement.remove()">❌</button>
      <br>`;
    container.appendChild(div);
  }
  
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    div.textContent = mensaje;
    div.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => {
      div.style.display = 'none';
    }, 4000);
  }
  