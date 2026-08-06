const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config/jwt');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}

// Admin credentials live only in the server's environment (ADMIN_EMAIL /
// ADMIN_PASSWORD_HASH), never in client code, so they can't be read out of
// the Admin app's JS bundle.
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    next();
  });
}

module.exports = { authenticateToken, authenticateAdmin };
