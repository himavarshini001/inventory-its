const jwt = require('jsonwebtoken');

// Verify access token on every protected request
exports.authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ error: 'No token' });

  try {
    req.user = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Token expired or invalid' });
  }
};

// Role guard factory — usage: authorize('admin')
exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: 'Forbidden' });
  next();
};