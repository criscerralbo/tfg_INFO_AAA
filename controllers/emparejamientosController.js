const db = require('../db');

// Obtener todas las actividades del profesor
exports.obtenerTodosDelProfesor = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const sql = 'SELECT * FROM emparejamientos WHERE profesor_id = ?';
  db.query(sql, [idProfesor], (err, results) => {
    if (err) {
      console.error('Error al obtener emparejamientos:', err);
      return res.status(500).json({ error: 'Error al obtener emparejamientos' });
    }
    res.json(results);
  });
};

// Crear una nueva actividad con pares
exports.crearActividad = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { nombre, descripcion, pares } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  // 1) Crear la actividad
  const sqlAct = 'INSERT INTO emparejamientos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)';
  db.query(sqlAct, [nombre, descripcion, idProfesor], (err, result) => {
    if (err) {
      console.error('Error al crear actividad:', err);
      return res.status(500).json({ error: 'Error al crear la actividad' });
    }
    const actividadId = result.insertId;

    // 2) Insertar pares asociados (si hay)
    if (Array.isArray(pares) && pares.length > 0) {
      const valores = pares.map(p => [actividadId, p.palabra, p.imagen]);
      const sqlPares = 'INSERT INTO pares_emparejamiento (actividad_id, palabra, imagen) VALUES ?';
      db.query(sqlPares, [valores], (err2) => {
        if (err2) {
          console.error('Error al guardar pares:', err2);
          return res.status(500).json({ error: 'Actividad creada, pero no se guardaron pares' });
        }
        res.status(201).json({ mensaje: 'Actividad y pares creados correctamente', id: actividadId });
      });
    } else {
      res.status(201).json({ mensaje: 'Actividad creada sin pares', id: actividadId });
    }
  });
};

// Obtener una actividad y sus pares para edición
exports.obtenerEmparejamientoPorId = (req, res) => {
  const actividadId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const sqlAct = 'SELECT id, nombre, descripcion FROM emparejamientos WHERE id = ? AND profesor_id = ?';
  db.query(sqlAct, [actividadId, idProfesor], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    const actividad = rows[0];
    const sqlPares = 'SELECT id, palabra, imagen FROM pares_emparejamiento WHERE actividad_id = ?';
    db.query(sqlPares, [actividadId], (err2, pares) => {
      if (err2) {
        console.error('Error al obtener pares:', err2);
        return res.status(500).json({ error: 'Error al obtener pares' });
      }
      res.json({ ...actividad, pares });
    });
  });
};

// Actualizar actividad y sincronizar pares
exports.actualizarEmparejamiento = (req, res) => {
  const actividadId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const { nombre, descripcion, pares } = req.body;

  // 1) Validar existencia
  const sqlVal = 'SELECT id FROM emparejamientos WHERE id = ? AND profesor_id = ?';
  db.query(sqlVal, [actividadId, idProfesor], (err, rows) => {
    if (err || rows.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // 2) Actualizar campos de actividad
    const sqlUpd = 'UPDATE emparejamientos SET nombre = ?, descripcion = ? WHERE id = ?';
    db.query(sqlUpd, [nombre, descripcion, actividadId], err2 => {
      if (err2) {
        console.error('Error al actualizar actividad:', err2);
        return res.status(500).json({ error: 'Error al actualizar actividad' });
      }

      // 3) Sincronizar pares: eliminar antiguos, luego insertar nuevos
      const sqlDel = 'DELETE FROM pares_emparejamiento WHERE actividad_id = ?';
      db.query(sqlDel, [actividadId], err3 => {
        if (err3) {
          console.error('Error al limpiar pares antiguos:', err3);
          return res.status(500).json({ error: 'Error al limpiar pares antiguos' });
        }

        if (!Array.isArray(pares) || pares.length === 0) {
          return res.json({ mensaje: 'Actividad actualizada sin pares' });
        }

        const valores = pares.map(p => [actividadId, p.palabra, p.imagen]);
        const sqlIns = 'INSERT INTO pares_emparejamiento (actividad_id, palabra, imagen) VALUES ?';
        db.query(sqlIns, [valores], err4 => {
          if (err4) {
            console.error('Error al guardar nuevos pares:', err4);
            return res.status(500).json({ error: 'Error al guardar nuevos pares' });
          }
          res.json({ mensaje: 'Actividad y pares actualizados correctamente' });
        });
      });
    });
  });
};

// Subir imagen (via multer)
exports.subirImagen = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se recibió archivo' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
};

// Eliminar una actividad y sus pares
exports.eliminarEmparejamiento = (req, res) => {
  const actividadId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const sql = 'DELETE FROM emparejamientos WHERE id = ? AND profesor_id = ?';
  db.query(sql, [actividadId, idProfesor], err => {
    if (err) {
      console.error('Error al eliminar actividad:', err);
      return res.status(500).json({ error: 'Error al eliminar actividad' });
    }
    res.json({ mensaje: 'Actividad eliminada correctamente' });
  });
};
