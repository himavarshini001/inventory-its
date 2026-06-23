const assetService          = require('../services/assetService');
const { auditFromReq }      = require('../utils/audit');
const { asyncHandler }      = require('../middleware/errorHandler');

// GET /api/assets
const list = asyncHandler(async (req, res) => {
  const result = await assetService.getAll(req);
  res.json(result);
});

// GET /api/assets/stats
const stats = asyncHandler(async (_req, res) => {
  const data = await assetService.getStats();
  res.json(data);
});

// GET /api/assets/:id
const get = asyncHandler(async (req, res) => {
  const asset = await assetService.getById(req.params.id);
  res.json(asset);
});

// POST /api/assets
const create = asyncHandler(async (req, res) => {
  const photoPath = req.file?.path ?? null;
  const asset     = await assetService.create(req.body, photoPath);

  await auditFromReq(req, 'CREATE', 'asset', asset.id, null, asset);

  res.status(201).json(asset);
});

// PATCH /api/assets/:id
const update = asyncHandler(async (req, res) => {
  const before  = await assetService.getById(req.params.id);
  const photoPath = req.file?.path ?? null;
  const asset   = await assetService.update(req.params.id, req.body, photoPath);

  await auditFromReq(req, 'UPDATE', 'asset', asset.id, before, asset);

  res.json(asset);
});

// PATCH /api/assets/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const before = await assetService.getById(req.params.id);
  const asset  = await assetService.updateStatus(req.params.id, status, notes);

  await auditFromReq(req, 'UPDATE', 'asset', asset.id, { status: before.status }, { status });

  res.json(asset);
});

// DELETE /api/assets/:id  (soft retire)
const retire = asyncHandler(async (req, res) => {
  const before = await assetService.getById(req.params.id);
  const asset  = await assetService.retire(req.params.id);

  await auditFromReq(req, 'RETIRE', 'asset', asset.id, before, asset);

  res.json({ message: 'Asset retired successfully.', asset });
});

// GET /api/assets/:id/history
const history = asyncHandler(async (req, res) => {
  const data = await assetService.getHistory(req.params.id);
  res.json(data);
});

module.exports = { list, stats, get, create, update, updateStatus, retire, history };
