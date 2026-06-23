const bcrypt      = require('bcryptjs');
const jwt         = require('jsonwebtoken');
const crypto      = require('crypto');
const db          = require('../models/db');
const userService = require('./userService');
const { AppError } = require('../middleware/errorHandler');

const ACCESS_EXPIRY  = '15m';
const REFRESH_EXPIRY = '7d';
const REFRESH_MS     = 7 * 24 * 60 * 60 * 1000;

// ── Token helpers ────────────────────────────────────────────
const issueAccessToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRY }
  );

const issueRefreshToken = () => crypto.randomBytes(64).toString('hex');

const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge:   REFRESH_MS,
};

// ── login ────────────────────────────────────────────────────
const login = async (email, password, res, req) => {
  const user = await userService.getByEmail(email);

  // Generic error — don't reveal whether email exists
  const invalid = () => { throw new AppError('Invalid email or password.', 401); };

  if (!user || !user.is_active) return invalid();

  // Check lockout
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw new AppError(`Account locked. Try again in ${remaining} minute(s).`, 423);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await userService.recordFailedLogin(email);
    return invalid();
  }

  // Successful — issue tokens
  await userService.recordLogin(user.id);

  const accessToken  = issueAccessToken(user);
  const refreshToken = issueRefreshToken();
  const tokenHash    = hashToken(refreshToken);

  // Persist refresh token
  await db('refresh_tokens').insert({
    user_id:    user.id,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + REFRESH_MS),
    ip_address: req.ip,
    user_agent: req.headers['user-agent'],
  });

  // Set HTTP-only cookie
  res.cookie('refresh_token', refreshToken, COOKIE_OPTS);

  return {
    accessToken,
    user: userService.sanitize(user),
  };
};

// ── refresh ──────────────────────────────────────────────────
const refresh = async (cookieToken, res) => {
  if (!cookieToken) throw new AppError('No refresh token.', 401);

  const tokenHash = hashToken(cookieToken);
  const stored    = await db('refresh_tokens')
    .where({ token_hash: tokenHash, is_revoked: false })
    .where('expires_at', '>', new Date())
    .first();

  if (!stored) throw new AppError('Refresh token invalid or expired.', 401);

  const user = await db('users').where({ id: stored.user_id, is_active: true }).first();
  if (!user)  throw new AppError('User not found or deactivated.', 401);

  // Rotate: revoke old, issue new
  await db('refresh_tokens').where({ id: stored.id }).update({ is_revoked: true });

  const newRefresh   = issueRefreshToken();
  const newHash      = hashToken(newRefresh);

  await db('refresh_tokens').insert({
    user_id:    user.id,
    token_hash: newHash,
    expires_at: new Date(Date.now() + REFRESH_MS),
  });

  res.cookie('refresh_token', newRefresh, COOKIE_OPTS);

  return { accessToken: issueAccessToken(user) };
};

// ── logout ───────────────────────────────────────────────────
const logout = async (cookieToken, res) => {
  if (cookieToken) {
    const tokenHash = hashToken(cookieToken);
    await db('refresh_tokens').where({ token_hash: tokenHash }).update({ is_revoked: true });
  }
  res.clearCookie('refresh_token');
};

module.exports = { login, refresh, logout };
