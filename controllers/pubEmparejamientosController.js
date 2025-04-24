const db = require('../db');

// Obtener emparejamientos propios del profesor
exports.getMisEmparejamientos = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const sql = 'SELECT * FROM emparejamientos WHERE profesor_id = ?';
  db.query(sql, [idProfesor], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener emparejamientos' });
    res.json(results);
  });
};

// Obtener emparejamientos públicos (de otros profesores)
exports.getPublicEmparejamientos = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const sql = 'SELECT * FROM emparejamientos WHERE publico = 1 AND profesor_id != ?';

  db.query(sql, [idProfesor], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener emparejamientos públicos' });
    res.json(results);
  });
};
// backend: marcar emparejamiento como privado
exports.hacerPrivado = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { emparejamientoId } = req.body;

  if (!emparejamientoId) return res.status(400).json({ error: 'ID de emparejamiento requerido' });

  const sql = 'UPDATE emparejamientos SET publico = 0 WHERE id = ? AND profesor_id = ?';
  db.query(sql, [emparejamientoId, idProfesor], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al hacer privado el emparejamiento' });
    res.json({ success: 'Emparejamiento marcado como privado' });
  });
};


// Publicar un emparejamiento (clonar en repertorio propio)
exports.publicarEmparejamiento = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'ID faltante' });

  const sqlSel = 'SELECT * FROM emparejamientos WHERE id = ?';
  db.query(sqlSel, [id], (err, rows) => {
    if (err || rows.length === 0) return res.status(404).json({ error: 'Emparejamiento no encontrado' });

    const original = rows[0];
    if (original.profesor_id === idProfesor) {
      return res.status(400).json({ error: 'No puedes duplicar tu propio emparejamiento' });
    }

    const base = original.nombre;
    const likePattern = `${base} (copia%`;
    const sqlCount = 'SELECT COUNT(*) AS total FROM emparejamientos WHERE nombre LIKE ? AND profesor_id = ?';
    db.query(sqlCount, [likePattern, idProfesor], (err, rowsC) => {
      if (err) return res.status(500).json({ error: 'Error al contar copias' });

      const nuevoNombre = `${base} (copia ${rowsC[0].total + 1})`;
      const sqlInsert = 'INSERT INTO emparejamientos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)';
      db.query(sqlInsert, [nuevoNombre, original.descripcion, idProfesor], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al duplicar emparejamiento' });

        const newId = result.insertId;
        const sqlPairs = 'SELECT * FROM pares_emparejamiento WHERE actividad_id = ?';
        db.query(sqlPairs, [id], (err, pares) => {
          if (err) return res.status(500).json({ error: 'Error al obtener pares' });
          if (!pares.length) return res.status(201).json({ success: 'Emparejamiento duplicado sin pares', id: newId });

          let procesadas = 0;
          pares.forEach(p => {
            const sqlIns = 'INSERT INTO pares_emparejamiento (actividad_id, palabra, imagen) VALUES (?, ?, ?)';
            db.query(sqlIns, [newId, p.palabra, p.imagen], (err) => {
              if (err) console.error(err);
              procesadas++;
              if (procesadas === pares.length) {
                return res.status(201).json({ success: 'Emparejamiento duplicado correctamente', id: newId });
              }
            });
          });
        });
      });
    });
  });
};

// Obtener asignaciones de emparejamientos por grupo
exports.getAsignaciones = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const sql = `
    SELECT g.id AS id_grupo, g.nombre AS nombre_grupo,
           e.id AS id_emparejamiento, e.nombre AS nombre_emparejamiento
    FROM grupos g
    JOIN grupo_miembros gm ON gm.grupo_id = g.id AND gm.estado = 'aprobado'
    JOIN emparejamientos_asignaciones ea ON ea.id_grupo = g.id
    JOIN emparejamientos e ON e.id = ea.id_emparejamiento
    WHERE g.propietario_id = ? OR gm.usuario_id = ?
    ORDER BY g.nombre
  `;
  db.query(sql, [idProfesor, idProfesor], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener asignaciones' });

    const grupos = {};
    rows.forEach(row => {
      if (!grupos[row.id_grupo]) {
        grupos[row.id_grupo] = { id: row.id_grupo, nombre: row.nombre_grupo, emparejamientos: [] };
      }
      grupos[row.id_grupo].emparejamientos.push({ id: row.id_emparejamiento, nombre: row.nombre_emparejamiento });
    });
    res.json(Object.values(grupos));
  });
};

exports.asignarEmparejamiento = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { emparejamientoId, grupo } = req.body;

  if (!emparejamientoId || !grupo) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  // Verificar si ya existe esa asignación
  const checkSql = 'SELECT 1 FROM emparejamientos_asignaciones WHERE id_emparejamiento = ? AND id_grupo = ?';
  db.query(checkSql, [emparejamientoId, grupo], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al verificar asignación' });
    }

    if (rows.length > 0) {
      return res.status(400).json({ error: 'Este emparejamiento ya está asignado a este grupo' });
    }

    // Si no existe, insertamos
    const insertSql = 'INSERT INTO emparejamientos_asignaciones (id_emparejamiento, id_grupo, id_profesor) VALUES (?, ?, ?)';
    db.query(insertSql, [emparejamientoId, grupo, idProfesor], (err2) => {
      if (err2) {
        console.error(err2);
        return res.status(500).json({ error: 'Error al asignar emparejamiento' });
      }

      res.status(201).json({ success: 'Emparejamiento asignado correctamente' });
    });
  });
};

// Marcar emparejamiento como público
exports.hacerPublico = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { emparejamientoId } = req.body;

  if (!emparejamientoId) return res.status(400).json({ error: 'ID de emparejamiento requerido' });

  const sql = 'UPDATE emparejamientos SET publico = 1 WHERE id = ? AND profesor_id = ?';
  db.query(sql, [emparejamientoId, idProfesor], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al hacer público el emparejamiento' });
    res.json({ success: 'Emparejamiento marcado como público' });
  });
};
// EmparejamientosController.js
exports.desasignarEmparejamiento = (req, res) => {
  const { emparejamientoId, grupoId } = req.body;
  const idProfesor = req.session.usuarioId;
  if (!emparejamientoId || !grupoId) {
    return res.status(400).json({ error: 'Faltan datos' });
  }

  const sql = 'DELETE FROM emparejamientos_asignaciones WHERE id_emparejamiento = ? AND id_grupo = ?';
  db.query(sql, [emparejamientoId, grupoId, idProfesor], err => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error al desasignar' });
    }
    res.json({ success: 'Emparejamiento desasignado' });
  });
};
