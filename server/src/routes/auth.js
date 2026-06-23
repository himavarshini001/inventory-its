const router = require('express').Router();

const ctrl                = require('../controllers/authController');
const { authenticate }    = require('../middleware/auth');
const { validate, loginSchema } = require('../middleware/validate');

// POST /api/auth/login   — public
router.post('/login',   validate(loginSchema), ctrl.login);

// POST /api/auth/refresh — public (reads HTTP-only cookie)
router.post('/refresh', ctrl.refresh);

// POST /api/auth/logout  — requires valid access token
router.post('/logout',  authenticate, ctrl.logout);

// GET  /api/auth/me      — returns decoded token payload
router.get('/me',       authenticate, ctrl.me);

module.exports = router;
