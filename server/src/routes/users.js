const router = require('express').Router();

const ctrl                        = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, userCreateSchema, userUpdateSchema, passwordChangeSchema } = require('../middleware/validate');

// All user routes require authentication
router.use(authenticate);

// ── Self-service (any authenticated user) ────────────────────
router.get('/me',                  ctrl.getMe);
router.patch('/me/password',       validate(passwordChangeSchema), ctrl.changeMyPassword);

// ── Admin-only: list all users + create ──────────────────────
router.get('/',                    authorize('admin', 'auditor'), ctrl.list);
router.post('/',                   authorize('admin'), validate(userCreateSchema), ctrl.create);

// ── Single user: read (admin/auditor) + write (admin) ────────
router.get('/:id',                 authorize('admin', 'auditor'), ctrl.get);
router.patch('/:id',               validate(userUpdateSchema), ctrl.update);   // role-check inside controller
router.patch('/:id/toggle-active', authorize('admin'), ctrl.toggleActive);
router.patch('/:id/reset-password',authorize('admin'), ctrl.adminResetPassword);

// ── Assigned assets: staff can view own, admin/auditor view any
router.get('/:id/assets',          ctrl.assignedAssets);

module.exports = router;
