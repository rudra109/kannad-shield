// =============================================================
//  Kanad S.H.I.E.L.D. — Auth Middleware (SOS Service)
//  Handles JWT verification, role checks, and rate limiting.
// =============================================================
'use strict';

const jwt        = require('jsonwebtoken');
const rateLimit  = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

// ── JWT verification ──────────────────────────────────────────
/**
 * Verifies the Bearer token in Authorization header.
 * Attaches decoded payload to req.user.
 */
function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'missing_token', message: 'Authorization header required.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    const msg = err.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token';
    return res.status(401).json({ error: msg, message: err.message });
  }
}

// ── Officer-only guard ────────────────────────────────────────
/**
 * Must be used AFTER authMiddleware.
 * Only allows through if req.user.role === 'officer' or 'supervisor' or 'admin'.
 */
function officerOnly(req, res, next) {
  const allowedRoles = ['officer', 'supervisor', 'admin'];
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ error: 'forbidden', message: 'This endpoint is restricted to police officers.' });
  }
  next();
}

// ── Rate limiters ─────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'rate_limit_exceeded', message: 'Too many requests. Please slow down.' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'auth_rate_limit', message: 'Too many auth attempts. Try again in a minute.' },
});

const sosLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'sos_rate_limit', message: 'SOS rate limit reached.' },
});

module.exports = { authMiddleware, officerOnly, globalLimiter, authLimiter, sosLimiter };
