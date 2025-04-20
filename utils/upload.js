const multer = require('multer');
const path   = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});

module.exports = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },          // 2 MB
  fileFilter: (req, file, cb) => {
    cb(null, /image\/(png|jpeg|jpg|gif)/.test(file.mimetype));
  }
});
