const router = require('express').Router();

const ctrl                    = require('../controllers/assetController');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, assetCreateSchema, assetUpdateSchema, assetStatusSchema } = require('../middleware/validate');
const upload                  = require('../middleware/upload');

// All asset routes require a valid JWT
router.use(authenticate);

// ── Read (all authenticated roles) ──────────────────────────
router.get('/stats',    ctrl.stats);        // GET  /api/assets/stats
router.get('/',         ctrl.list);         // GET  /api/assets
router.get('/:id',      ctrl.get);          // GET  /api/assets/:id
router.get('/:id/history', ctrl.history);   // GET  /api/assets/:id/history

// ── Write (admin only) ───────────────────────────────────────

// POST /api/assets — create with optional photo
router.post(
  '/',
  authorize('admin'),
  upload.single('photo'),         // must come before validate (multipart)
  validate(assetCreateSchema),
  ctrl.create,
);

// PATCH /api/assets/:id — partial update
router.patch(
  '/:id',
  authorize('admin'),
  upload.single('photo'),
  validate(assetUpdateSchema),
  ctrl.update,
);

// PATCH /api/assets/:id/status — standalone status change
router.patch(
  '/:id/status',
  authorize('admin'),
  validate(assetStatusSchema),
  ctrl.updateStatus,
);

// DELETE /api/assets/:id — soft retire
router.delete(
  '/:id',
  authorize('admin'),
  ctrl.retire,
);

module.exports = router;
