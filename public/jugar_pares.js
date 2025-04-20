const id   = new URLSearchParams(location.search).get('id');
const datos = await (await fetch(`/api/alumno/emparejamientos/${id}`)).json();

document.getElementById('titulo').textContent = datos.nombre;

// barajar clones (Fisher–Yates)
const pares    = datos.pares;
const palabras = pares.slice().sort(() => Math.random() - .5);
const imagenes = pares.slice().sort(() => Math.random() - .5);

// Render
palabras.forEach(p => {
  const li = document.createElement('li');
  li.textContent = p.palabra;
  li.draggable   = true;
  li.dataset.id  = p.id;
  prepararDrag(li);
  listaPalabras.appendChild(li);
});

imagenes.forEach(p => {
  const li = document.createElement('li');
  li.dataset.id = p.id;
  li.innerHTML  = `<img src="${p.imagen}">`;
  prepararDrop(li);
  listaImagenes.appendChild(li);
});

function prepararDrag(elem) {
  elem.addEventListener('dragstart', e => {
    e.dataTransfer.setData('text/plain', elem.dataset.id);
  });
}
function prepararDrop(elem) {
  elem.addEventListener('dragover',  e => e.preventDefault());
  elem.addEventListener('drop',      e => {
    e.preventDefault();
    const palabraId = e.dataTransfer.getData('text/plain');
    elem.dataset.palabraId = palabraId;      // emparejamiento tentativo
    elem.classList.add('asignado');
  });
}

document.getElementById('btn-comprobar').onclick = () => {
  const total   = pares.length;
  const correct = [...listaImagenes.children].filter(li =>
    li.dataset.id === li.dataset.palabraId).length;
  resultado.textContent = `¡${correct} de ${total} correctas!`;
};
