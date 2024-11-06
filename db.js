const mysql = require('mysql2');

// Configuración de la conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',          // Usuario por defecto en XAMPP
  password: '',          // Generalmente, XAMPP no tiene contraseña en el usuario root, déjalo vacío si es tu caso
  database: 'odon', // Nombre de la base de datos que creaste en phpMyAdmin
  port: 3306             // Puerto MySQL predeterminado en XAMPP
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    return;
  }
  console.log('Conectado a MySQL como ID ' + db.threadId);
});

module.exports = db;
