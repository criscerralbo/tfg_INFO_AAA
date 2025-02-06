exports.isAuthenticated = (req, res, next) => {
  console.log('Sesión:', req.session); // Esto debe mostrar la sesión activa en la consola
  if (req.session && req.session.emailUsuario) {
      return next();
  }
  res.status(401).json({ error: 'No autorizado' });
};
