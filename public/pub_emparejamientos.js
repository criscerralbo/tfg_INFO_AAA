function mostrarModalConfirmacion(texto, onConfirm) {
  const modal = document.getElementById('actionConfirmModal');
  const textoElem = document.getElementById('actionConfirmText');
  const btnConfirmar = document.getElementById('confirmActionButton');
  const btnCancelar = document.getElementById('cancelActionButton');
  const btnCerrar = document.getElementById('closeActionModal');

  textoElem.textContent = texto;
  modal.style.display = 'block';

  const cerrarModal = () => {
    modal.style.display = 'none';
    btnConfirmar.onclick = null;
  };

  btnCancelar.onclick = cerrarModal;
  btnCerrar.onclick = cerrarModal;
  btnConfirmar.onclick = () => {
    cerrarModal();
    onConfirm();
  };
}
document.addEventListener('DOMContentLoaded', () => {
    const formEmp = document.getElementById('form-asignar-emparejamiento');
    if (formEmp) {
      formEmp.addEventListener('submit', async (e) => {
        e.preventDefault();
        const empId = document.getElementById('emparejamiento-select').value;
        const grupo = document.getElementById('grupo-emparejamiento-input').value.trim();
        if (!empId || !grupo) return mostrarMensaje('Campos requeridos.', 'error');
        try {
          const res = await fetch('/api/emparejamientos/asignar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emparejamientoId: empId, grupo })
          });
          const data = await res.json();
          if (res.ok) {
            mostrarMensaje('Emparejamiento asignado correctamente.', 'success');
            cargarAsignacionesEmparejamientos();
            formEmp.reset();
          } else {
            mostrarMensaje(data.error || 'Error al asignar.', 'error');
          }
        } catch (err) {
          console.error(err);
          mostrarMensaje('Error al conectar con el servidor.', 'error');
        }
      });
    }
  
    cargarMisEmparejamientos();
    cargarPublicEmparejamientos();
    cargarAsignacionesEmparejamientos();
  });
  
  async function cargarMisEmparejamientos() {
    const lista = document.getElementById('lista-mis-emparejamientos');
    const select = document.getElementById('emparejamiento-select');
    if (!lista || !select) return;
  
    try {
        const res = await fetch('/api/emparejamientos/mis');
        const data = await res.json();
        select.innerHTML = '';
        lista.innerHTML = '';
      
        data.forEach(e => {
          const opt = document.createElement('option');
          opt.value = e.id;
          opt.textContent = e.nombre;
          select.appendChild(opt);
      
          const li = document.createElement('li');
          li.className = "quiz-card";
          li.innerHTML = `
            <div class="quiz-card-title"><strong>${e.nombre}</strong></div>
            <div class="quiz-card-description">
              ${e.descripcion || ''}
              ${e.publico ? ' <em>(Público)</em>' : ''}
            </div>
           <div class="quiz-card-actions">
            <button type="button" class="edit-button" onclick="mostrarModalConfirmacion('Editar este par?', () => window.location.href='edit_emparejamiento.html?id=${e.id}')">Editar</button>
            ${!e.publico ? 
              `<button class="public-button" type="button" onclick="mostrarModalConfirmacion('Hacer público este par?', () => hacerPublico(${e.id}))">Hacer público</button>` : ''}
              
         
          </div>
        `;
          lista.appendChild(li);
        });
      } catch (err) {
        console.error('Error al cargar emparejamientos del profesor');
      }
      
  }
  
  async function hacerEmparejamientoPublico(id) {
    try {
      const res = await fetch('/api/emparejamientos/hacerPublico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emparejamientoId: id })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('Emparejamiento publicado correctamente.', 'success');
        cargarMisEmparejamientos();
        cargarPublicEmparejamientos();
      } else {
        mostrarMensaje(data.error || 'Error al hacer público.', 'error');
      }
    } catch (err) {
      console.error(err);
      mostrarMensaje('Error al conectar con el servidor.', 'error');
    }
  }
  async function cargarPublicEmparejamientos() {
    const lista = document.getElementById('lista-public-emparejamientos');
    if (!lista) return;
    try {
      const res = await fetch('/api/emparejamientos/publicos');
      const data = await res.json();
      lista.innerHTML = '';
      data.forEach(e => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${e.nombre}</strong> - ${e.descripcion || ''} 
       <div class="quiz-card-actions">
         <button class="save-button" type="button" onclick="mostrarModalConfirmacion('Guardar este emparejamiento en tu repertorio?', () => guardarEmparejamiento(${e.id}))">Guardar en mi repertorio</button>
 </div>
      `; lista.appendChild(li);
      });
    } catch (err) {
      console.error('Error al cargar emparejamientos públicos');
    }
  }
  
  async function guardarEmparejamiento(id) {
   
      const res = await fetch('/api/emparejamientos/publicar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok) {
        mostrarMensaje('Emparejamiento guardado correctamente.', 'success');
        cargarMisEmparejamientos();
        cargarPublicEmparejamientos();
      } else {
        mostrarMensaje(data.error || 'Error al guardar.', 'error');
      }
   
  }
  
  async function cargarAsignacionesEmparejamientos() {
    const cont = document.getElementById('contenedor-asignaciones-emparejamientos');
    if (!cont) return;
    try {
      const res = await fetch('/api/emparejamientos/asignaciones');
      const data = await res.json();
      cont.innerHTML = '';
      data.forEach(g => {
        const div = document.createElement('div');
        div.classList.add('grupo-asignado');
        const h3 = document.createElement('h3');
        h3.textContent = `Grupo: ${g.nombre}`;
        div.appendChild(h3);
        const ul = document.createElement('ul');
        g.emparejamientos.forEach(e => {
          const li = document.createElement('li');
          li.textContent = e.nombre;
          ul.appendChild(li);
        });
        div.appendChild(ul);
        cont.appendChild(div);
      });
    } catch (err) {
      console.error('Error al cargar asignaciones emparejamientos');
    }
  }
  
  function mostrarMensaje(mensaje, tipo) {
    const div = document.getElementById('mensaje-estado');
    if (!div) return;
    div.textContent = mensaje;
    div.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    div.style.display = 'block';
    setTimeout(() => {
      div.style.display = 'none';
    }, 4000);
  }
  