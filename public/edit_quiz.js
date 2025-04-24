// public/js/edit_quiz.js
(() => {
  document.addEventListener('DOMContentLoaded', init);
  let preguntas = [], editIdx = null, quizId;

  const id = s => document.getElementById(s);
  async function fetchJSON(url,opts){ 
    const r = await fetch(url,opts);
    const ct = r.headers.get('Content-Type')||'';
    const data = ct.includes('json')?await r.json():await r.text();
    if(!r.ok) throw new Error((data.error||r.statusText));
    return data;
  }
  function toast(msg, type='info'){
    const d=id('mensaje-estado');
    d.textContent=msg;
    d.className=`toast ${
      type==='success'?'mensaje-success':
      type==='error'  ?'mensaje-error':
                       'mensaje-info'}`;
    d.style.display='block';
    clearTimeout(d._t);
    d._t=setTimeout(()=>d.style.display='none',3000);
  }
  function confirmModal(text, onOk){
    let m=id('confirmModalGen');
    if(!m){
      m=document.createElement('div');
      m.id='confirmModalGen'; m.className='modal';
      m.innerHTML=`
        <div class="modal-content">
          <span class="close" id="cmClose">&times;</span>
          <p id="cmMsg"></p>
          <div class="modal-buttons">
            <button id="cmOk" class="confirm-button">Aceptar</button>
            <button id="cmCanc" class="cancel-button">Cancelar</button>
          </div>
        </div>`;
      document.body.appendChild(m);
      id('cmClose').onclick = id('cmCanc').onclick = ()=>m.style.display='none';
      id('cmOk').onclick = ()=>{ m.style.display='none'; onOk(); };
    }
    id('cmMsg').textContent=text;
    m.style.display='block';
  }
  function prepararLogout(){
    const b=id('logout-button');
    if(!b) return;
    b.onclick=()=>id('logoutModal').style.display='block';
    id('closeModal').onclick = id('cancelLogout').onclick = ()=>id('logoutModal').style.display='none';
    id('confirmLogout').onclick = ()=>fetch('/usuarios/logout').then(_=>location.href='/');
  }

  async function init() {
    prepararLogout();
    quizId = new URLSearchParams(location.search).get('id');
    if (!quizId) {
      toast('Falta ?id', 'error');
      return;
    }
  
    // Referencias DOM
    const inT     = id('titulo-quiz'),
          inD     = id('descripcion-quiz'),
          fQ      = id('form-edit-quiz'),
          bDel    = id('btn-eliminar-quiz'),
          fP      = id('form-nueva-pregunta'),
          inE     = id('enunciado'),
          contO   = id('opciones-container'),
          selR    = id('respuesta'),
          bAdd    = id('agregar-opcion'),
          bRem    = id('quitar-opcion'),
          bCan    = id('btn-cancelar-edicion'),
          contP   = id('contenedor-preguntas'),
          dropzone= id('dropzone'),
          btnRemoveImg = id('btn-remove-img'),
          fileInp = id('imagenPregunta'),
          imgPrev = id('imgPreview');
          
  
    // Cargar datos del quiz y preguntas
    try {
      const quiz = await fetchJSON(`/api/quizzes/${quizId}`);
      inT.value = quiz.titulo;
      inD.value = quiz.descripcion || '';
      preguntas = await fetchJSON(`/api/preguntas?quizId=${quizId}`);
    } catch (e) {
      console.error(e);
      toast('Error al cargar', 'error');
      return;
    }
  
    renderPreguntas();
    resetForm();
  
    // Listeners del formulario del quiz
    fQ.onsubmit = e => {
      e.preventDefault();
      confirmModal('¿Actualizar Quiz?', async () => {
        try {
          await fetchJSON(`/api/quizzes/${quizId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              titulo: inT.value.trim(),
              descripcion: inD.value.trim(),
             
            })
          });
          toast('Quiz actualizado', 'success');
        } catch (err) {
          console.error(err);
          toast(err.message, 'error');
        }
      });
    };
  
    // Botón eliminar quiz
    bDel.onclick = () =>
      confirmModal('¿Eliminar Quiz completo?', async () => {
        try {
          await fetchJSON(`/api/quizzes/${quizId}`, { method: 'DELETE' });
          toast('Quiz eliminado', 'success');
          setTimeout(() => window.location.href = '/adm_quizzes.html', 500);
        } catch (err) {
          console.error(err);
          toast(err.message, 'error');
        }
      });

  
    // Listeners de pregunta
    fP.onsubmit   = guardarPregunta;
    bCan.onclick = resetForm;
    bAdd.onclick = () => addOption('');
    bRem.onclick = () => {
      if (contO.children.length > 2) contO.removeChild(contO.lastChild);
      updateSelect();
    };
    contO.oninput = updateSelect;
    contP.onclick = e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      const i = +btn.dataset.idx;
      btn.dataset.act === 'edit' ? startEdit(i) : deletePregunta(i);
    };
  
    // Imagen: click y drag&drop
    dropzone.onclick = () => fileInp.click();
    btnRemoveImg.onclick = () => {
      fileInp.value = '';
      imgPrev.src = '';
      imgPrev.style.display = 'none';
      dropzone.classList.remove('subido');
      btnRemoveImg.style.display = 'none';
      id('imagen_eliminada').value = '1'; // Marcar para eliminar
    };
    
    fileInp.onchange = e => mostrarPreview(e.target.files[0]);
  
    ['dragenter', 'dragover'].forEach(ev => {
      dropzone.addEventListener(ev, e => {
        e.preventDefault();
        dropzone.classList.add('hover');
      });
    });
  
    ['dragleave', 'drop'].forEach(ev => {
      dropzone.addEventListener(ev, e => {
        e.preventDefault();
        dropzone.classList.remove('hover');
      });
    });
  
    dropzone.addEventListener('drop', e => {
      const file = e.dataTransfer.files[0];
      fileInp.files = e.dataTransfer.files;
      mostrarPreview(file);
    });
  
    function mostrarPreview(file) {
      if (!file) return;
      const url = URL.createObjectURL(file);
      imgPrev.src = url;
      imgPrev.style.display = 'block';
      dropzone.classList.add('subido');
      btnRemoveImg.style.display = 'inline-block';
    }
    
  }
  

  function renderPreguntas() {
    const cont = id('contenedor-preguntas');
    cont.innerHTML = '';
  
    preguntas.forEach((p, i) => {
      const opts = Array.isArray(p.opciones) ? p.opciones : [];
      const htmlOpts = opts.map((o, j) => `<p>${String.fromCharCode(65 + j)}) ${o.texto}</p>`).join('');
      const resp = p.respuesta_correcta || '';
      const imgHtml = p.imagen ? `<img src="${p.imagen}" class="preview" style="max-width:100%; margin-bottom:8px">` : '';
  
      const div = document.createElement('div');
      div.className = 'pregunta-item';
      div.innerHTML = `
        
        <p><strong>${p.enunciado}</strong></p>
        ${imgHtml}
        ${htmlOpts}
        <p><em>Respuesta:</em> ${resp}</p>
        <button data-act="edit" data-idx="${i}">✏️</button>
        <button data-act="del"  data-idx="${i}">🗑️</button>`;
      cont.appendChild(div);
    });
    document.getElementById('buscador-preguntas')?.addEventListener('input', function (e) {
      const texto = e.target.value.toLowerCase();
      const preguntas = document.querySelectorAll('#contenedor-preguntas .pregunta-item');
      preguntas.forEach(p => {
        const match = p.textContent.toLowerCase().includes(texto);
        p.style.display = match ? '' : 'none';
      });
    });
    
  }
  

  function resetForm(){
    editIdx = null;
    id('pregunta-titulo').textContent='Nueva Pregunta';
    id('btn-agregar-pregunta').textContent='Agregar Pregunta';
    id('btn-cancelar-edicion').style.display='none';
    id('enunciado').value='';
    id('opciones-container').innerHTML='';
    addOption(); addOption();
    updateSelect();
  }

  function startEdit(i){
    editIdx = i;
    const p = preguntas[i];
    id('pregunta-titulo').textContent = 'Editar Pregunta';
    id('btn-agregar-pregunta').textContent = 'Guardar Cambios';
    id('btn-cancelar-edicion').style.display = 'inline-block';
    id('enunciado').value = p.enunciado;
  
    const cont = id('opciones-container');
    cont.innerHTML = '';
    (p.opciones || []).forEach(o => addOption(o.texto));
    updateSelect(p.respuesta_correcta_idx);
  
    const imgPrev = id('imgPreview');
    const dropzone = id('dropzone');
    const btnRemoveImg = id('btn-remove-img');
    const fileInput = id('imagenPregunta');
  
    // Mostrar imagen si hay
    if (p.imagen) {
      imgPrev.src = p.imagen;
      imgPrev.style.display = 'block';
      dropzone.classList.add('subido');
      btnRemoveImg.style.display = 'inline-block';
      fileInput.value = ''; // limpiar archivo por si acaso
    } else {
      imgPrev.src = '';
      imgPrev.style.display = 'none';
      dropzone.classList.remove('subido');
      btnRemoveImg.style.display = 'none';
    }
  }
  

  async function guardarPregunta(e) {
    e.preventDefault();
    const enun = id('enunciado').value.trim();
    const opts = [...id('opciones-container').querySelectorAll('input')].map(i => i.value.trim()).filter(Boolean);
    const resp = id('respuesta').value;
    const img = id('imagenPregunta').files[0];
  
    if (!enun || opts.length < 2 || !resp) return toast('Datos incompletos', 'error');
  
    const fd = new FormData();
    fd.append('quiz_id', quizId);
    fd.append('enunciado', enun);
    fd.append('opciones', JSON.stringify(opts));
    fd.append('respuesta_correcta_idx', parseInt(resp));
  
    if (img) fd.append('imagen', img);
  
    const eliminarImg = id('imagen_eliminada').value === '1';
    if (eliminarImg) {
      fd.append('eliminar_imagen', '1');
    }
  
    const url = editIdx === null ? '/api/preguntas' : `/api/preguntas/${preguntas[editIdx].id}`;
    const method = editIdx === null ? 'POST' : 'PUT';
  
    try {
      await fetch(url, { method, body: fd }); // ← ahora sí, incluye todo
      toast(editIdx === null ? 'Pregunta creada' : 'Pregunta actualizada', 'success');
      preguntas = await fetchJSON(`/api/preguntas?quizId=${quizId}`);
      renderPreguntas(); resetForm();
    } catch (err) {
      console.error(err); toast(err.message, 'error');
    }
  }
  

  function deletePregunta(i){
    confirmModal('¿Eliminar esta pregunta?', async ()=>{
      try{
        await fetchJSON(`/api/preguntas/${preguntas[i].id}`,{method:'DELETE'});
        toast('Pregunta eliminada','success');
        preguntas.splice(i,1);
        renderPreguntas(); resetForm();
      }catch(err){
        console.error(err); toast(err.message,'error');
      }
    });
  }

  function addOption(val=''){
    const div=document.createElement('div');
    div.className='opcion-item';
    div.innerHTML=`<input type="text" value="${val}" required>`;
    id('opciones-container').appendChild(div);
  }

  function updateSelect(selectedIdx){
    const sel = id('respuesta'); 
    sel.innerHTML = '';
    [...id('opciones-container').querySelectorAll('input')].forEach((inp, i) => {
      const letra = String.fromCharCode(65 + i); // A, B, C, ...
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `${letra}) ${inp.value}`;
      sel.appendChild(opt);
    });
  
    if (selectedIdx !== undefined && selectedIdx !== null) {
      sel.value = selectedIdx;
    }
  }
  

})();
