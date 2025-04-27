const db = require('../db');

// 1) Listar grupos del usuario
exports.getUserGroups = (req, res) => {
  const usuarioId = req.session.usuarioId;
  if (!usuarioId) {
    return res.status(401).json({ error: 'No has iniciado sesión.' });
  }

  const sql = `
    SELECT g.id, g.nombre
    FROM grupos AS g
    JOIN grupo_miembros AS gm
      ON g.id = gm.grupo_id
    WHERE gm.usuario_id = ? AND gm.estado = 'aprobado'
    ORDER BY g.nombre
  `;
  db.query(sql, [usuarioId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al cargar grupos.' });
    res.json(rows);
  });
};

// 2) Listar tests y emparejamientos de un grupo
exports.getGroupResources = (req, res) => {
  const usuarioId = req.session.usuarioId;
  const grupoId   = req.params.grupoId;

  if (!usuarioId) {
    return res.status(401).json({ error: 'No has iniciado sesión.' });
  }

  // Tests asignados a ese grupo
  const sqlTests = `
    SELECT q.id, q.titulo
    FROM quizzes AS q
    JOIN quiz_asignaciones AS qa
      ON q.id = qa.id_quiz
    WHERE qa.id_grupo = ?
    ORDER BY q.titulo
  `;

  // Emparejamientos asignados a ese grupo
  const sqlEmp = `
    SELECT e.id, e.nombre
    FROM emparejamientos AS e
    JOIN emparejamientos_asignaciones AS ea
      ON e.id = ea.id_emparejamiento
    WHERE ea.id_grupo = ?
    ORDER BY e.nombre
  `;

  db.query(sqlTests, [grupoId], (err1, tests) => {
    if (err1) return res.status(500).json({ error: 'Error al cargar tests.' });

    db.query(sqlEmp, [grupoId], (err2, emparejamientos) => {
      if (err2) return res.status(500).json({ error: 'Error al cargar emparejamientos.' });

      res.json({ tests, emparejamientos });
    });
  });
};
