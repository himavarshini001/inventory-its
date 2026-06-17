const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../models/db');

const issueTokens = (user) => {
  const payload = { id: user.id, role: user.role, name: user.name };
  const access  = jwt.sign(payload, process.env.JWT_SECRET,  { expiresIn: '15m' });
  const refresh = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { access, refresh };
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await db('users').where({ email, is_active: true }).first();
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    return res.status(401).json({ error: 'Invalid credentials' });

  const { access, refresh } = issueTokens(user);

  // Refresh token in HTTP-only cookie — JS cannot read it
  res.cookie('refresh_token', refresh, {
    httpOnly: true, secure: true, sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({ accessToken: access, user: { id: user.id, name: user.name, role: user.role } });
};

exports.refresh = async (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await db('users').where({ id: payload.id, is_active: true }).first();
    if (!user) return res.status(401).json({ error: 'User not found' });
    const { access } = issueTokens(user);
    res.json({ accessToken: access });
  } catch {
    res.status(401).json({ error: 'Refresh token invalid' });
  }
};

exports.logout = (_req, res) => {
  res.clearCookie('refresh_token');
  res.json({ message: 'Logged out' });
};