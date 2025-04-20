// ====================== EDITAR EMPAREJAMIENTO – v6 ======================
// • Formulario central para crear/editar un par.
// • Lista de pares a la derecha con ✏️ y 🗑️.
// • Toast + modal de confirmación para todas las acciones.
// • Logout reutiliza tu modal existente.
// • Botón “Eliminar actividad” borra la actividad entera y redirige.
// ----------------------------------------------------------------------

(() => {
  document.addEventListener('DOMContentLoaded', init);

  /* ----------------- Estado global ----------------- */
  let pares   = [];          // { palabra, imagen }
  let editIdx = null;        // índice en edición, null = nuevo
  let actividadId;

  /* ----------------- Inicialización ---------------- */
  async function init() {
    prepararLogout();

    actividadId = new URLSearchParams(location.search).get('id');
    if (!actividadId) { toast('Falta parámetro ?id', 'error'); return; }

    // referencias DOM
    const $     = id => document.getElementById(id);
    const iTitulo   = $('tituloEmp');
    const iDesc     = $('descripcionEmp');
    const iPalabra  = $('palabraInput');
    const hUrl      = $('urlImagen');
    const imgPrev   = $('imgPreview');
    const dropzone  = $('dropzone');
    const fileInput = $('fileInput');
    const btnSavePar  = $('btn-save-par');
    const btnCancPar  = $('btn-cancel-par');
    const btnAddPar   = $('btn-add-par');
    const btnDelAct   = $('btn-eliminar-emparejamiento');
    const listaUI     = $('lista-pares');
    const formAct     = $('form-edit-emparejamiento');

    // Carga inicial de datos
    try {
      const datos = await fetchJSON(`/api/profesor/emparejamientos/${actividadId}`);
      iTitulo.value = datos.nombre;
      iDesc.value   = datos.descripcion || '';
      pares = Array.isArray(datos.pares) ? datos.pares : [];
      pintarLista();
    } catch (err) {
      toast(err.message, 'error');
      return;
    }

    // Eventos UI
    btnAddPar.onclick     = resetForm;       // "Nuevo par"
    btnSavePar.onclick    = guardarPar;      // "Guardar par"
    btnCancPar.onclick    = resetForm;       // "Cancelar"
    listaUI.onclick       = onListaClick;    // edición / borrado de par
    formAct.onsubmit      = guardarActividad;// "Actualizar Actividad"
    if (btnDelAct) {
      btnDelAct.onclick  = eliminarActividad;// "Eliminar actividad"
    }

    // Drag & drop / click para la imagen
    dropzone.onclick      = () => fileInput.click();
    fileInput.onchange    = e => subirImg(e.target.files[0]);
    ['dragenter','dragover']
      .forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.add('hover'); }));
    ['dragleave','drop']
      .forEach(ev => dropzone.addEventListener(ev, e => { e.preventDefault(); dropzone.classList.remove('hover'); }));
    dropzone.addEventListener('drop', e => subirImg(e.dataTransfer.files[0]));

    /* =========== Funciones internas =========== */
    function guardarPar() {
      const palabra = iPalabra.value.trim();
      const url     = hUrl.value.trim();
      if (!palabra || !url) {
        toast('Completa palabra e imagen', 'error');
        return;
      }
      const par = { palabra, imagen: url };
      if (editIdx === null) {
        pares.push(par);
        toast('Par añadido', 'success');
      } else {
        pares[editIdx] = par;
        toast('Par actualizado', 'success');
      }
      autoSave();      // opcional: guarda inmediatamente en BD
      resetForm();
      pintarLista();
    }

    function onListaClick(e) {
      const btn = e.target.closest('button[data-idx]');
      if (!btn) return;
      const idx = +btn.dataset.idx;
      if (btn.dataset.act === 'edit') {
        const p = pares[idx];
        iPalabra.value = p.palabra;
        hUrl.value     = p.imagen;
        imgPrev.src    = p.imagen;
        imgPrev.style.display = 'block';
        dropzone.classList.add('subido');
        editIdx = idx;
      } else if (btn.dataset.act === 'del') {
        confirmModal('¿Eliminar este par?', () => {
          pares.splice(idx,1);
          if (editIdx === idx) resetForm();
          pintarLista();
          autoSave();  // opcional: guarda inmediatamente
          toast('Par eliminado', 'success');
        });
      }
    }

    function resetForm() {
      iPalabra.value = '';
      hUrl.value     = '';
      imgPrev.style.display = 'none';
      imgPrev.src    = '';
      dropzone.classList.remove('subido');
      editIdx = null;
    }

    function pintarLista() {
      listaUI.innerHTML = '';
      pares.forEach((p,idx) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <img src="${p.imagen}" width="45" style="vertical-align:middle;margin-right:8px">
          ${p.palabra}
          <button class="btn-list" data-idx="${idx}" data-act="edit">✏️</button>
          <button class="btn-list" data-idx="${idx}" data-act="del">🗑️</button>
        `;
        listaUI.appendChild(li);
      });
    }

    async function subirImg(file) {
      if (!file) return;
      try {
        const fd = new FormData(); fd.append('imagen', file);
        const res = await fetch(`/api/profesor/emparejamientos/${actividadId}/upload`, { method:'POST', body:fd });
        if (!res.ok) throw new Error('Error al subir imagen');
        const { url } = await res.json();
        hUrl.value   = url;
        imgPrev.src  = url;
        imgPrev.style.display = 'block';
        dropzone.classList.add('subido');
      } catch (err) {
        toast(err.message,'error');
      }
    }

    function guardarActividad(e) {
      e.preventDefault();
      confirmModal('¿Guardar todos los cambios en la actividad?', async () => {
        try {
          await fetch(`/api/profesor/emparejamientos/${actividadId}`, {
            method: 'PUT',
            headers:{ 'Content-Type':'application/json' },
            body: JSON.stringify({
              nombre: iTitulo.value.trim(),
              descripcion: iDesc.value.trim(),
              pares
            })
          }).then(r => r.ok ? r : Promise.reject(r));
          toast('Actividad actualizada','success');
        } catch {
          toast('Error al guardar actividad','error');
        }
      });
    }

    function eliminarActividad() {
      confirmModal('¿Eliminar esta actividad? Esto no se puede deshacer.', async () => {
        try {
          const res = await fetch(`/api/profesor/emparejamientos/${actividadId}`, {
            method:'DELETE'
          });
          if (!res.ok) throw new Error('Error al eliminar actividad');
          toast('Actividad eliminada','success');
          setTimeout(() => window.location.href = '/adm_quizzes.html', 800);
        } catch (err) {
          toast(err.message,'error');
        }
      });
    }

    // (Opcional) auto-save tras cada cambio de par
    async function autoSave() {
      try {
        await fetch(`/api/profesor/emparejamientos/${actividadId}`, {
          method:'PUT',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({
            nombre: iTitulo.value.trim(),
            descripcion: iDesc.value.trim(),
            pares
          })
        });
      } catch {
        /* silencioso */
      }
    }
  }

  /* -------------- Utilidades -------------- */
  function prepararLogout() {
    const l = id('logout-button');
    if (!l) return;
    l.onclick = () => id('logoutModal').style.display='block';
    const c = id('cancelLogout'), x = id('closeModal'), ok = id('confirmLogout');
    c && (c.onclick = x && (x.onclick = () => id('logoutModal').style.display='none'));
    ok && (ok.onclick = () => fetch('/usuarios/logout').then(()=>location.href='/'));
  }

  function toast(msg, tipo='info') {
    const div = id('mensaje-estado');
    if (!div) { alert(msg); return; }
    div.textContent = msg;
    div.className = tipo==='success' ? 'mensaje-success'
                     : tipo==='error'   ? 'mensaje-error'
                                        : 'mensaje-info';
    div.style.display = 'block';
    clearTimeout(div._t);
    div._t = setTimeout(()=>div.style.display='none', 4000);
  }

  function confirmModal(msg, onOk) {
    let m = id('confirmModalGen');
    if (!m) {
      m = document.createElement('div');
      m.id = 'confirmModalGen';
      m.className = 'modal';
      m.innerHTML = `
        <div class="modal-content">
          <span id="cmClose" class="close">&times;</span>
          <p id="cmMsg"></p>
          <div class="modal-buttons">
            <button id="cmOk" class="confirm-button">Aceptar</button>
            <button id="cmCanc" class="cancel-button">Cancelar</button>
          </div>
        </div>`;
      document.body.appendChild(m);
    }
    m.querySelector('#cmMsg').textContent = msg;
    m.style.display = 'block';
    m.querySelector('#cmClose').onclick = () => m.style.display='none';
    m.querySelector('#cmCanc').onclick  = () => m.style.display='none';
    m.querySelector('#cmOk').onclick    = () => { m.style.display='none'; onOk && onOk(); };
  }

  async function fetchJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }

  const id = s => document.getElementById(s);
})();
