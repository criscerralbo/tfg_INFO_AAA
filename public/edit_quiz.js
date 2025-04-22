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

  async function init(){
    prepararLogout();
    quizId = new URLSearchParams(location.search).get('id');
    if(!quizId){ toast('Falta ?id','error'); return; }

    // refs
    const inT = id('titulo-quiz'),
          inD = id('descripcion-quiz'),
          fQ  = id('form-edit-quiz'),
          bDel= id('btn-eliminar-quiz'),
          fP  = id('form-nueva-pregunta'),
          inE = id('enunciado'),
          contO = id('opciones-container'),
          selR = id('respuesta'),
          bAdd = id('agregar-opcion'),
          bRem = id('quitar-opcion'),
          bCan = id('btn-cancelar-edicion'),
          contP= id('contenedor-preguntas');

    try{
      const quiz = await fetchJSON(`/api/quizzes/${quizId}`);
      inT.value=quiz.titulo; inD.value=quiz.descripcion||'';
      preguntas = await fetchJSON(`/api/preguntas?quizId=${quizId}`);
    }catch(e){
      console.error(e); toast('Error al cargar','error'); return;
    }
    renderPreguntas(); resetForm();

    // listeners quiz
    fQ.onsubmit = e=>{
      e.preventDefault();
      confirmModal('¿Actualizar Quiz?', async ()=>{
        try{
          await fetchJSON(`/api/quizzes/${quizId}`, {
            method:'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              titulo: inT.value.trim(),
              descripcion: inD.value.trim(),
              preguntas: [] // el controlador solo actualiza metadata aquí
            })
          });
          toast('Quiz actualizado','success');
        }catch(err){
          console.error(err); toast(err.message,'error');
        }
      });
    };
 // ** ELIMINAR QUIZ **
 bDel.onclick = () => confirmModal('¿Eliminar Quiz completo?', async () => {
  try {
    await fetchJSON(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    toast('Quiz eliminado','success');
    // redirijo de vuelta a la lista principal con ruta absoluta
    setTimeout(() => {
      window.location.href = '/adm_quizzes.html';
    }, 500);
  } catch (err) {
    console.error(err); toast(err.message,'error');
  }
});

    // listeners pregunta
    fP.onsubmit = guardarPregunta;
    bCan.onclick= resetForm;
    bAdd.onclick=()=>addOption('');
    bRem.onclick=()=>{
      if(contO.children.length>2) contO.removeChild(contO.lastChild);
      updateSelect();
    };
    contO.oninput = updateSelect;
    contP.onclick = e=>{
      const btn=e.target.closest('button[data-act]'); if(!btn)return;
      const i=+btn.dataset.idx;
      btn.dataset.act==='edit'?startEdit(i):deletePregunta(i);
    };
  }

  function renderPreguntas(){
    const cont=id('contenedor-preguntas'); cont.innerHTML='';
    preguntas.forEach((p,i)=>{
      const opts = Array.isArray(p.opciones)?p.opciones:[],
            htmlOpts = opts.map((o,j)=>`<p>${'ABCD'[j]}) ${o.texto}</p>`).join(''),
            resp = p.respuesta_correcta||'';
      const div=document.createElement('div');
      div.className='pregunta-item';
      div.innerHTML=`
        <p><strong>${p.enunciado}</strong></p>
        ${htmlOpts}
        <p><em>Respuesta:</em> ${resp}</p>
        <button data-act="edit" data-idx="${i}">✏️</button>
        <button data-act="del"  data-idx="${i}">🗑️</button>`;
      cont.appendChild(div);
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
    id('pregunta-titulo').textContent='Editar Pregunta';
    id('btn-agregar-pregunta').textContent='Guardar Cambios';
    id('btn-cancelar-edicion').style.display='inline-block';
    id('enunciado').value=p.enunciado;
    const cont=id('opciones-container'); cont.innerHTML='';
    (p.opciones||[]).forEach(o=>addOption(o.texto));
    updateSelect(p.respuesta_correcta);
  }

  async function guardarPregunta(e){
    e.preventDefault();
    const enun = id('enunciado').value.trim(),
          opts = [...id('opciones-container').querySelectorAll('input')].map(i=>i.value.trim()).filter(v=>v),
          resp = id('respuesta').value;
    if(!enun||opts.length<2||!resp) { toast('Datos incompletos','error'); return; }

    const payload = { quiz_id: quizId, enunciado: enun, opciones: opts, respuesta_correcta: resp };
    const url = editIdx===null
      ? '/api/preguntas'
      : `/api/preguntas/${preguntas[editIdx].id}`;
    const method = editIdx===null?'POST':'PUT';

    try{
      await fetchJSON(url, {
        method, headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      toast(editIdx===null?'Pregunta creada':'Pregunta actualizada','success');
      preguntas = await fetchJSON(`/api/preguntas?quizId=${quizId}`);
      renderPreguntas(); resetForm();
    }catch(err){
      console.error(err); toast(err.message,'error');
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

  function updateSelect(selected){
    const sel=id('respuesta'); sel.innerHTML='';
    [...id('opciones-container').querySelectorAll('input')].forEach((inp,i)=>{
      const opt=document.createElement('option');
      opt.value='ABCD'[i];
      opt.textContent=`${opt.value}) ${inp.value}`;
      sel.appendChild(opt);
    });
    if(selected) sel.value=selected;
  }

})();
