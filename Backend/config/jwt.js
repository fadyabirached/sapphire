const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'fallbackSecret';

function generateToken(userId) {
  return jwt.sign({ userId }, SECRET_KEY, { expiresIn: '1d' });
}

module.exports = { SECRET_KEY, generateToken };
