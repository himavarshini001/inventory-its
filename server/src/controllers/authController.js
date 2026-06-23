const authService       = require('../services/authService');
const { auditFromReq }  = require('../utils/audit');
const { asyncHandler }  = require('../middleware/errorHandler');

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password, res, req);

  await auditFromReq(req, 'LOGIN', 'user', result.user.id, null, { email });

  res.json(result);
});

// POST /api/auth/refresh
const refresh = asyncHandler(async (req, res) => {
  const token  = req.cookies?.refresh_token;
  const result = await authService.refresh(token, res);
  res.json(result);
});

// POST /api/auth/logout
const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.refresh_token;
  await authService.logout(token, res);

  await auditFromReq(req, 'LOGOUT', 'user', req.user?.id, null, null);

  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json(req.user);
});

module.exports = { login, refresh, logout, me };
