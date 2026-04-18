const jwt = require('jsonwebtoken');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to req object
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  // Token comes in format: "Bearer <token>"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, is_verified }
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
};

/**
 * Role-based Authorization Middleware
 * e.g., requireRole(['admin', 'restaurant_owner'])
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
};

/**
 * Verified User Middleware
 * Prevents unverified users from placing orders
 */
const requireVerified = (req, res, next) => {
  if (!req.user || !req.user.is_verified) {
    return res.status(403).json({ error: 'Account not verified. Please verify your email first.' });
  }
  next();
};

module.exports = { authenticateToken, requireRole, requireVerified };
