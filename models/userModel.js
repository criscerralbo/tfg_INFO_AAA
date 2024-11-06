const db = require('../db');  // Conexión a la base de datos desde db.js
const bcrypt = require('bcrypt');

// Crear la tabla de roles si no existe
db.query(`
  CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
)
`, (err) => {
    if (err) {
        console.error('Error al crear la tabla de roles:', err);
    } else {
        console.log('Tabla de roles creada o ya existente');

        // Insertar roles predeterminados (alumno, profesor, administrador) si no existen
        const rolesPorDefecto = ['alumno', 'profesor', 'administrador'];
        rolesPorDefecto.forEach((rol) => {
            db.query(`INSERT IGNORE INTO roles (nombre) VALUES (?)`, [rol], (err) => {
                if (err) {
                    console.error(`Error al insertar rol ${rol}:`, err);
                } else {
                    console.log(`Rol ${rol} insertado o ya existente.`);
                }
            });
        });
    }
});


// Crear la tabla de usuarios si no existe
db.query(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol_id INT,
    verificado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE SET NULL
  )
`, (err) => {
    if (err) {
        console.error('Error al crear la tabla de usuarios:', err);
    } else {
        console.log('Tabla de usuarios creada o ya existente');

        // Crear usuario administrador por defecto si no existe
        db.query(`SELECT * FROM usuarios WHERE email = 'admin@tfg.com'`, (err, results) => {
            if (err) {
                console.error('Error al verificar el usuario administrador:', err);
            } else if (results.length === 0) {
                const hashedPassword = bcrypt.hashSync('admin123', 10);

                // Buscar el rol_id para administrador
                db.query(`SELECT id FROM roles WHERE nombre = 'administrador'`, (err, roleResults) => {
                    if (err || roleResults.length === 0) {
                        console.error('Error al obtener rol_id para administrador:', err);
                    } else {
                        const rol_id = roleResults[0].id;
                        db.query(`
                          INSERT INTO usuarios (nombre, email, password, rol_id, verificado) 
                          VALUES (?, ?, ?, ?, ?)`, 
                          ['Admin', 'admin@tfg.com', hashedPassword, rol_id, 1],
                          (err) => {
                              if (err) {
                                  console.error('Error al crear el usuario administrador:', err);
                              } else {
                                  console.log('Administrador por defecto creado: admin@tfg.com');
                              }
                          }
                        );
                    }
                });
            }
        });
    }
});

// Crear la tabla de tokens si no existe
db.query(`DROP TABLE IF EXISTS tokens`, (err) => {
    if (err) {
        console.error('Error al eliminar la tabla de tokens:', err);
    } else {
        console.log('Tabla de tokens eliminada correctamente.');
    }
});

db.query(`
  CREATE TABLE IF NOT EXISTS tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token INT NOT NULL,
    tipo ENUM('recuperacion', 'verificacion') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`, (err) => {
    if (err) {
        console.error('Error al crear la tabla de tokens:', err);
    } else {
        console.log('Tabla de tokens creada o ya existente');
    }
});

// Crear usuarios por defecto: Profesor y Alumno
const usuariosPorDefecto = [
    { nombre: 'Profesor 1', email: 'profesor1@tfg.com', password: 'profesor123', rol: 'profesor', verificado: 1 },
    { nombre: 'Alumno 1', email: 'alumno1@tfg.com', password: 'alumno123', rol: 'alumno', verificado: 1 }
];

usuariosPorDefecto.forEach(usuario => {
    const hashedPassword = bcrypt.hashSync(usuario.password, 10);

    // Obtener rol_id para cada usuario por defecto
    db.query(`SELECT id FROM roles WHERE nombre = ?`, [usuario.rol], (err, results) => {
        if (err || results.length === 0) {
            console.error(`Error al obtener rol_id para ${usuario.rol}:`, err);
        } else {
            const rol_id = results[0].id;
            db.query(`
              INSERT INTO usuarios (nombre, email, password, rol_id, verificado) 
              VALUES (?, ?, ?, ?, ?) 
              ON DUPLICATE KEY UPDATE nombre = VALUES(nombre)`,
              [usuario.nombre, usuario.email, hashedPassword, rol_id, usuario.verificado],
              (err) => {
                  if (err) {
                      console.error(`Error al crear el usuario ${usuario.rol}:`, err);
                  } else {
                      console.log(`Usuario por defecto creado: ${usuario.email}`);
                  }
              }
            );
        }
    });
});

module.exports = db;
