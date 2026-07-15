const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  // Token format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(400).json({ error: 'Token format must be "Bearer <token>"' });
  }

  const token = parts[1];
  try {
    const secret = process.env.JWT_SECRET || 'supersecretjwttokenforhackathon';
    const decoded = jwt.verify(token, secret);
    req.user = decoded; // Attach user info to request object
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
