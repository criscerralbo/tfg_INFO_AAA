// edit_quiz.js
(() => {
  document.addEventListener('DOMContentLoaded', init);

  let preguntas = [];    // { id, enunciado, opciones: [], respuesta_correcta }
  let editIdx   = null;  // índice de la pregunta en edición
  let quizId;

  // ——— Helpers ———
  const id = s => document.getElementById(s);
  async function fetchJSON(url, opts) {
    const r = await fetch(url, opts);
    if (!r.ok) throw new Error((await r.json()).error || r.statusText);
    return r.json();
  }
  function toast(msg, tipo = 'info') {
    const d = id('mensaje-estado');
    d.textContent = msg;
    d.className = tipo === 'success' ? 'mensaje-success' : 'mensaje-error';
    d.style.display = 'block';
    clearTimeout(d._t);
    d._t = setTimeout(() => d.style.display = 'none', 4000);
  }
  function confirmModal(msg, onOk) {
    let m = id('confirmModalGen');
    if (!m) {
      m = document.createElement('div');
      m.id = 'confirmModalGen'; 
      m.className = 'modal';
      m.innerHTML = `
        <div class="modal-content">
          <span class="close" id="cmClose">&times;</span>
          <p id="cmMsg"></p>
          <div class="modal-buttons">
            <button id="cmOk" class="confirm-button">Aceptar</button>
            <button id="cmCanc" class="cancel-button">Cancelar</button>
          </div>
        </div>`;
      document.body.appendChild(m);
    }
    id('cmMsg').textContent = msg;
    m.style.display = 'block';
    const cerrar = () => m.style.display = 'none';
    id('cmClose').onclick = id('cmCanc').onclick = cerrar;
    id('cmOk').onclick = () => { cerrar(); onOk && onOk(); };
  }
  function prepararLogout() {
    const l = id('logout-button'),
          c = id('cancelLogout'),
          x = id('closeModal'),
          ok= id('confirmLogout');
    if (!l) return;
    l.onclick = () => id('logoutModal').style.display = 'block';
    if (c) c.onclick = () => id('logoutModal').style.display = 'none';
    if (x) x.onclick = () => id('logoutModal').style.display = 'none';
    if (ok) ok.onclick = () => fetch('/usuarios/logout').then(()=>location.href='/');
  }

  // ——— Inicialización ———
  async function init() {
    prepararLogout();

    // 1) leer ID de la URL
    const params = new URLSearchParams(location.search);
    quizId = params.get('id');
    if (!quizId) { toast('Falta parámetro ?id', 'error'); return; }

    // 2) refs DOM
    const tituloIn   = id('titulo-quiz');
    const descIn     = id('descripcion-quiz');
    const formQuiz   = id('form-edit-quiz');
    const btnDelQuiz = id('btn-eliminar-quiz');

    const secciónTit    = id('pregunta-titulo');
    const formPreg      = id('form-nueva-pregunta');
    const inEnunciado   = id('enunciado');
    const contOpciones  = id('opciones-container');
    const selResp       = id('respuesta');
    const btnAddOpt     = id('agregar-opcion');
    const btnRemOpt     = id('quitar-opcion');
    const btnSavePreg   = id('btn-agregar-pregunta');
    const btnCancelPreg = id('btn-cancelar-edicion');

    const contPreguntas = id('contenedor-preguntas');

    // 3) carga inicial: quiz + preguntas
    try {
      const quiz = await fetchJSON(`/api/quizzes/${quizId}`);
      tituloIn.value = quiz.titulo;
      descIn.value   = quiz.descripcion || '';
      // si tu GET /api/quizzes/:id devolvía .preguntas, úsalo; si no:
      preguntas = (await fetchJSON(`/api/preguntas?quizId=${quizId}`)) || [];
    } catch (e) {
      console.error(e);
      toast('Error al cargar datos','error');
      return;
    }

    renderPreguntas();
    resetFormPregunta();

    // 4) listeners
    formQuiz.addEventListener('submit', e => {
      e.preventDefault();
      confirmModal('¿Actualizar Quiz?', async () => {
        try {
          await fetchJSON(`/api/quizzes/${quizId}`, {
            method: 'PUT',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({
              titulo: tituloIn.value.trim(),
              descripcion: descIn.value.trim()
            })
          });
          toast('Quiz actualizado','success');
        } catch (err) {
          console.error(err);
          toast(err.message,'error');
        }
      });
    });
    btnDelQuiz.addEventListener('click', () => {
      confirmModal('¿Eliminar Quiz completo?', async () => {
        try {
          await fetchJSON(`/api/quizzes/${quizId}`, { method:'DELETE' });
          toast('Quiz eliminado','success');
          setTimeout(()=>location.href='adm_quizzes.html',500);
        } catch (err) {
          console.error(err);
          toast(err.message,'error');
        }
      });
    });

    formPreg.addEventListener('submit', guardarPregunta);
    btnCancelPreg.addEventListener('click', resetFormPregunta);
    btnAddOpt.addEventListener('click', () => addOption(''));
    btnRemOpt.addEventListener('click', removeOption);
    contOpciones.addEventListener('input', updateSelect);

    // delegación en preguntas existentes
    contPreguntas.addEventListener('click', e => {
      const btn = e.target.closest('button[data-idx]');
      if (!btn) return;
      const idx = +btn.dataset.idx;
      if (btn.dataset.act === 'edit') startEdit(idx);
      else deletePregunta(idx);
    });
  }

  // ——— UI / lógica de preguntas ———
  function renderPreguntas() {
    const cont = id('contenedor-preguntas');
    cont.innerHTML = '';
    preguntas.forEach((p,i) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'pregunta-item';
      // texto + opciones + respuesta
      const optsHtml = p.opciones.map((o,j)=>`<p>${String.fromCharCode(65+j)}) ${o}</p>`).join('');
      wrapper.innerHTML = `
        <p><strong>${p.enunciado}</strong></p>
        ${optsHtml}
        <p><em>Respuesta:</em> ${p.respuesta_correcta}</p>
        <button data-act="edit" data-idx="${i}">✏️</button>
        <button data-act="del"  data-idx="${i}">🗑️</button>
      `;
      cont.appendChild(wrapper);
    });
  }

  function startEdit(idx) {
    editIdx = idx;
    const p = preguntas[idx];
    id('pregunta-titulo').textContent = 'Editar Pregunta';
    id('btn-agregar-pregunta').textContent = 'Guardar Cambios';
    id('btn-cancelar-edicion').style.display = 'inline-block';

    id('enunciado').value = p.enunciado;
    const cont = id('opciones-container');
    cont.innerHTML = '';
    p.opciones.forEach(o => addOption(o));
    updateSelect(p.respuesta_correcta);
  }

  function resetFormPregunta() {
    editIdx = null;
    id('pregunta-titulo').textContent = 'Nueva Pregunta';
    id('btn-agregar-pregunta').textContent = 'Agregar Pregunta';
    id('btn-cancelar-edicion').style.display = 'none';
    id('enunciado').value = '';
    const cont = id('opciones-container');
    cont.innerHTML = '';
    addOption(''); addOption('');
    updateSelect();
  }

  async function guardarPregunta(e) {
    e.preventDefault();
    const enun = id('enunciado').value.trim();
    const opts = [...id('opciones-container').querySelectorAll('input')]
                  .map(i=>i.value.trim()).filter(v=>v);
    const resp = id('respuesta').value;
    if (!enun || opts.length < 2) { toast('Enunciado + ≥2 opciones','error'); return; }

    const payload = { quiz_id: quizId, enunciado: enun, opciones: opts, respuesta_correcta: resp };
    const url    = editIdx===null ? '/api/preguntas' : `/api/preguntas/${preguntas[editIdx].id}`;
    const method = editIdx===null ? 'POST' : 'PUT';

    try {
      await fetchJSON(url, {
        method,
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(payload)
      });
      toast(editIdx===null ? 'Pregunta creada' : 'Pregunta actualizada','success');

      // recarga
      preguntas = await fetchJSON(`/api/preguntas?quizId=${quizId}`);
      renderPreguntas();
      resetFormPregunta();
    } catch (err) {
      console.error(err);
      toast('Error interno al crear/actualizar pregunta','error');
    }
  }

  function deletePregunta(idx) {
    confirmModal('¿Eliminar esta pregunta?', async () => {
      try {
        await fetchJSON(`/api/preguntas/${preguntas[idx].id}`, { method:'DELETE' });
        toast('Pregunta eliminada','success');
        preguntas.splice(idx,1);
        renderPreguntas();
        resetFormPregunta();
      } catch (err) {
        console.error(err);
        toast('Error al eliminar pregunta','error');
      }
    });
  }

  // — opciones dinámicas —
  function addOption(val) {
    const div = document.createElement('div');
    div.className = 'opcion-item';
    div.innerHTML = `<input type="text" value="${val}" required>`;
    id('opciones-container').appendChild(div);
    updateSelect();
  }
  function removeOption() {
    const cont = id('opciones-container');
    if (cont.children.length > 2) {
      cont.removeChild(cont.lastElementChild);
      updateSelect();
    }
  }
  function updateSelect(selected) {
    const sel = id('respuesta');
    sel.innerHTML = '';
    [...id('opciones-container').querySelectorAll('input')].forEach((inp,i) => {
      const opt = document.createElement('option');
      opt.value = String.fromCharCode(65 + i);
      opt.textContent = `${opt.value}) ${inp.value}`;
      sel.appendChild(opt);
    });
    if (selected) sel.value = selected;
  }
})();
