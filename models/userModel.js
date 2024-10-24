const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// Conectar a la base de datos
const db = new sqlite3.Database('./database/usuarios.db');

// Crear la tabla de usuarios si no existe
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      rol TEXT NOT NULL,
      verificado INTEGER DEFAULT 0  -- 0 = No verificado, 1 = Verificado
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla de usuarios', err);
    } else {
      // Comprobar si ya existe un usuario administrador
      db.get(`SELECT * FROM usuarios WHERE rol = 'administrador'`, (err, row) => {
        if (!row) {
          // Si no existe, crear un administrador por defecto
          const hashedPassword = bcrypt.hashSync('admin123', 10); // Contraseña encriptada
          db.run(`
            INSERT INTO usuarios (nombre, email, password, rol, verificado) 
            VALUES (?, ?, ?, ?, ?)`, 
            ['Admin', 'admin@tfg.com', hashedPassword, 'administrador', 1],  // El administrador se crea como verificado por defecto
            (err) => {
              if (err) {
                console.error('Error al crear el usuario administrador', err);
              } else {
                console.log('Administrador por defecto creado: admin@tfg.com');
              }
            }
          );
        }
      });
    }
  });

  

  // Crear la tabla de tokens si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      token TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error al crear la tabla de tokens', err);
    }
  });

  // Crear usuarios por defecto: Profesor y Alumno
  db.run(`
    INSERT INTO usuarios (nombre, email, password, rol, verificado) 
    VALUES (?, ?, ?, ?, ?)`, 
    ['Profesor 1', 'profesor1@tfg.com', bcrypt.hashSync('profesor123', 10), 'profesor', 1],
    (err) => {
      if (err && err.code !== 'SQLITE_CONSTRAINT') { // Ignorar errores de duplicado
        console.error('Error al crear el usuario profesor', err);
      } else {
        console.log('Profesor por defecto creado: profesor1@tfg.com');
      }
    }
  );


  db.run(`
    INSERT INTO usuarios (nombre, email, password, rol, verificado) 
    VALUES (?, ?, ?, ?, ?)`, 
    ['Alumno 1', 'alumno1@tfg.com', bcrypt.hashSync('alumno123', 10), 'alumno', 1],
    (err) => {
      if (err && err.code !== 'SQLITE_CONSTRAINT') { // Ignorar errores de duplicado
        console.error('Error al crear el usuario alumno', err);
      } else {
        console.log('Alumno por defecto creado: alumno1@tfg.com');
      }
    }
  );
});

module.exports = db;
