const urlParams = new URLSearchParams(window.location.search);
const grupoId = urlParams.get('grupoId');

async function cargarGrupo() {
  const response = await fetch(`/api/groups/${grupoId}`);
  const grupo = await response.json();

  document.getElementById('nombre-grupo').textContent = `Nombre: ${grupo.name}`;
  document.getElementById('codigo-grupo').textContent = `Código: ${grupo.identifier}`;

  const listaMiembros = document.getElementById('lista-miembros');
  grupo.members.forEach((miembro) => {
    const li = document.createElement('li');
    li.textContent = `${miembro.user.name} (${miembro.role})`;
    listaMiembros.appendChild(li);
  });

  const listaSolicitudes = document.getElementById('lista-solicitudes');
  grupo.requests.forEach((solicitud) => {
    const li = document.createElement('li');
    li.innerHTML = `
      ${solicitud.user.name} (${solicitud.role})
      <button onclick="aprobarSolicitud('${solicitud._id}')">Aprobar</button>
      <button onclick="rechazarSolicitud('${solicitud._id}')">Rechazar</button>
    `;
    listaSolicitudes.appendChild(li);
  });
}

cargarGrupo();
