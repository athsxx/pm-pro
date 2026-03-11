const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  try {
    const header = req.headers['authorization'] || '';
    const [type, token] = header.split(' ');

    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server misconfigured: JWT_SECRET is missing' });
    }

    const decoded = jwt.verify(token, secret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { authenticateToken };
