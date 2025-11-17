// Authentication utility functions
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

/**
 * Hash a password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token for a user
 * Token does not expire (long-lived until logout)
 */
function generateToken(user) {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      isAdmin: user.is_admin
    },
    JWT_SECRET
    // No expiration - token valid until logout
  );
}

/**
 * Verify and decode a JWT token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to extract and verify token from request
 */
function authenticateRequest(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, user: null };
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const decoded = verifyToken(token);

  if (!decoded) {
    return { authenticated: false, user: null };
  }

  return { authenticated: true, user: decoded };
}

/**
 * Check if user is admin
 */
function requireAdmin(authResult) {
  if (!authResult.authenticated) {
    return { error: 'Nicht authentifiziert', status: 401 };
  }

  if (!authResult.user.isAdmin) {
    return { error: 'Admin-Berechtigung erforderlich', status: 403 };
  }

  return null;
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  authenticateRequest,
  requireAdmin
};
