const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/assets');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  filename: (_req, file, cb) => {
    // Random hex prefix + original extension — prevents filename collisions
    const ext    = path.extname(file.originalname).toLowerCase();
    const random = crypto.randomBytes(16).toString('hex');
    cb(null, `${random}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  const ALLOWED_MIME  = ['image/jpeg', 'image/png', 'image/webp'];
  const ALLOWED_EXT   = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext           = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_MIME.includes(file.mimetype) && ALLOWED_EXT.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

module.exports = upload;
