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

// Crear una nueva actividad (sin pares)
exports.crearActividad = (req, res) => {
  const idProfesor = req.session.usuarioId;
  const { nombre, descripcion } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre es obligatorio' });
  }

  const sql = 'INSERT INTO emparejamientos (nombre, descripcion, profesor_id) VALUES (?, ?, ?)';
  db.query(sql, [nombre, descripcion, idProfesor], (err, result) => {
    if (err) {
      console.error('Error al crear actividad:', err);
      return res.status(500).json({ error: 'Error al crear la actividad' });
    }
    const actividadId = result.insertId;
    res.status(201).json({ mensaje: 'Actividad creada correctamente', id: actividadId });
  });
};

// Obtener una actividad y sus pares
exports.obtenerEmparejamientoPorId = (req, res) => {
  const actividadId = req.params.id;
  const idProfesor = req.session.usuarioId;

  const sql = 'SELECT * FROM emparejamientos WHERE id = ? AND profesor_id = ?';
  db.query(sql, [actividadId, idProfesor], (err, result) => {
    if (err || result.length === 0) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    const actividad = result[0];

    const sqlPares = 'SELECT * FROM pares_emparejamiento WHERE actividad_id = ?';
    db.query(sqlPares, [actividadId], (err2, pares) => {
      if (err2) {
        console.error('Error al obtener pares:', err2);
        return res.status(500).json({ error: 'Error al obtener pares' });
      }
      res.json({ ...actividad, pares });
    });
  });
};

// Actualizar actividad y sus pares
exports.actualizarEmparejamiento = (req, res) => {
  const actividadId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const { nombre, descripcion, pares } = req.body;

  const sql = 'UPDATE emparejamientos SET nombre = ?, descripcion = ? WHERE id = ? AND profesor_id = ?';
  db.query(sql, [nombre, descripcion, actividadId, idProfesor], (err) => {
    if (err) {
      console.error('Error al actualizar la actividad:', err);
      return res.status(500).json({ error: 'Error al actualizar la actividad' });
    }

    const sqlDelete = 'DELETE FROM pares_emparejamiento WHERE actividad_id = ?';
    db.query(sqlDelete, [actividadId], (err2) => {
      if (err2) {
        console.error('Error al eliminar pares anteriores:', err2);
        return res.status(500).json({ error: 'Error al limpiar pares antiguos' });
      }

      if (!pares || pares.length === 0) {
        return res.json({ mensaje: 'Actividad actualizada (sin pares)' });
      }

      const valores = pares.map(p => [actividadId, p.palabra, p.imagen]);
      const sqlInsert = 'INSERT INTO pares_emparejamiento (actividad_id, palabra, imagen) VALUES ?';

      db.query(sqlInsert, [valores], (err3) => {
        if (err3) {
          console.error('Error al guardar nuevos pares:', err3);
          return res.status(500).json({ error: 'Error al guardar pares' });
        }
        res.json({ mensaje: 'Actividad actualizada correctamente' });
      });
    });
  });
};

// Eliminar una actividad
exports.eliminarEmparejamiento = (req, res) => {
  const actividadId = req.params.id;
  const idProfesor = req.session.usuarioId;
  const sql = 'DELETE FROM emparejamientos WHERE id = ? AND profesor_id = ?';
  db.query(sql, [actividadId, idProfesor], (err) => {
    if (err) {
      console.error('Error al eliminar actividad:', err);
      return res.status(500).json({ error: 'Error al eliminar la actividad' });
    }
    res.json({ mensaje: 'Actividad eliminada correctamente' });
  });
};
