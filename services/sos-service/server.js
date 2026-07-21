// =============================================================
//  Kanad S.H.I.E.L.D. — SOS Microservice  (server.js)
//  Owner: Developer 1
//  Stack: Node.js + Express + ws (WebSocket) + pg
//
//  Endpoints:
//    POST   /api/auth/register          — create victim user account
//    POST   /api/auth/login             — issue JWT access + refresh tokens
//    POST   /api/auth/refresh           — rotate refresh token
//    POST   /api/auth/mfa/setup         — generate TOTP QR for officers
//    POST   /api/auth/mfa/verify        — verify TOTP step (officer login)
//
//    POST   /api/sos/trigger            — one-touch SOS (auth required)
//    POST   /api/sos/checkin/:id        — reset Dead-Man's Switch
//    PATCH  /api/sos/:id/status         — officer updates incident status
//    GET    /api/sos/:id                — fetch incident detail
//
//    WS     /ws/track?incidentId=<id>   — real-time location stream
//
//    GET    /health                     — service health check
// =============================================================
'use strict';

require('dotenv').config();

const express  = require('express');
const http     = require('http');
const { WebSocketServer } = require('ws');
const { Pool } = require('pg');
const jwt      = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode   = require('qrcode');
const { v4: uuid } = require('uuid');
const crypto   = require('crypto');
const { createClient } = require('redis');

const { authMiddleware, officerOnly, globalLimiter, authLimiter, sosLimiter } = require('./middleware/auth');
const { dispatchToERSS } = require('./erss_adapter');
const { notifyGuardians, notifyResolved } = require('./guardian_notify');

// ── Config ────────────────────────────────────────────────────
const JWT_SECRET          = process.env.JWT_SECRET || 'change_me';
const ACCESS_EXPIRES      = '3650d';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);
const PORT                = parseInt(process.env.PORT || '4000', 10);

// ── DB + Redis ────────────────────────────────────────────────
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const redisClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
redisClient.connect().catch(console.error);

// ── Express + HTTP server ─────────────────────────────────────
const app    = express();
const server = http.createServer(app);

app.use(express.json({ limit: '1mb' }));
app.use(globalLimiter);

// ── WebSocket server ──────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws/track' });

/**
 * rooms: Map<incidentId, Set<WebSocket>>
 * Both the victim device and police console connect to the same room.
 */
const rooms = new Map();

function broadcast(incidentId, payload) {
  const room = rooms.get(incidentId);
  if (!room) return;
  const data = JSON.stringify(payload);
  room.forEach((ws) => {
    if (ws.readyState === 1 /* OPEN */) ws.send(data);
  });
}

wss.on('connection', (ws, req) => {
  const url        = new URL(req.url, 'http://x');
  const incidentId = url.searchParams.get('incidentId');

  if (!incidentId) { ws.close(1008, 'incidentId required'); return; }

  if (!rooms.has(incidentId)) rooms.set(incidentId, new Set());
  rooms.get(incidentId).add(ws);
  console.log(`[WS] Client connected to incident room ${incidentId} (${rooms.get(incidentId).size} total)`);

  ws.on('message', async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());

      if (msg.type === 'location_update') {
        // Persist the latest position
        await pool.query(
          'UPDATE incidents SET lat=$1, lng=$2, updated_at=now() WHERE id=$3',
          [msg.lat, msg.lng, incidentId]
        );
        // Fan out to police console
        broadcast(incidentId, { type: 'location_update', incidentId, lat: msg.lat, lng: msg.lng, ts: msg.ts || Date.now() });
      }
    } catch (err) {
      console.error('[WS] message error:', err.message);
    }
  });

  ws.on('close', () => {
    rooms.get(incidentId)?.delete(ws);
    if (rooms.get(incidentId)?.size === 0) rooms.delete(incidentId);
  });

  ws.on('error', (err) => console.error('[WS] socket error:', err.message));
});

// ── Dead-Man's Switch ─────────────────────────────────────────
/** Map<incidentId, NodeJS.Timeout> */
const deadManTimers = new Map();

function resetDeadMansSwitch(incidentId, intervalSeconds = 120) {
  clearTimeout(deadManTimers.get(incidentId));
  const handle = setTimeout(async () => {
    try {
      await pool.query(
        `UPDATE incidents SET severity=100, status='dispatched', updated_at=now() WHERE id=$1`,
        [incidentId]
      );
      broadcast(incidentId, {
        type: 'deadman_timeout_escalation',
        incidentId,
        message: 'No check-in received — severity escalated to CRITICAL.',
        ts: Date.now(),
      });
      console.warn(`[DEADMAN] Escalated incident ${incidentId} — no check-in received.`);
    } catch (err) {
      console.error('[DEADMAN] escalation error:', err.message);
    }
  }, intervalSeconds * 1000);
  deadManTimers.set(incidentId, handle);
}

// ── JWT helpers ───────────────────────────────────────────────
function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES });
}

async function issueRefreshToken(userId, officerId) {
  const rawToken   = crypto.randomBytes(48).toString('hex');
  const tokenHash  = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt  = new Date(Date.now() + REFRESH_EXPIRES_DAYS * 86400 * 1000);

  await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, officer_id, token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [uuid(), userId || null, officerId || null, tokenHash, expiresAt]
  );
  return rawToken; // returned to client; only the hash is stored
}

// ── AUTH ROUTES ───────────────────────────────────────────────

// Register a victim user account
app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { phone, full_name, password, preferred_language = 'en' } = req.body;

  if (!phone || !password) return res.status(400).json({ error: 'phone and password required' });
  if (password.length < 8)  return res.status(400).json({ error: 'password_too_short' });

  try {
    const passwordHash = crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
    const { rows } = await pool.query(
      `INSERT INTO users (id, phone, full_name, password_hash, preferred_language)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, phone, full_name, preferred_language`,
      [uuid(), phone, full_name, passwordHash, preferred_language]
    );
    res.status(201).json({ user: rows[0] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'phone_already_registered' });
    console.error('[AUTH/register]', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

// User login — returns access + refresh tokens
app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { phone, password, role = 'user' } = req.body;

  try {
    let subject, tokenPayload;

    if (role === 'officer') {
      // Officer login: first factor only — MFA step follows separately
      const { badge_no, password: pw } = req.body;
      const passwordHash = crypto.createHash('sha256').update(pw + JWT_SECRET).digest('hex');
      const { rows } = await pool.query(
        'SELECT id, badge_no, name, role FROM police_officers WHERE badge_no=$1 AND is_active=true',
        [badge_no]
      );
      if (!rows[0]) return res.status(401).json({ error: 'invalid_credentials' });

      subject      = rows[0].id;
      tokenPayload = { sub: rows[0].id, role: rows[0].role, badge_no: rows[0].badge_no, mfa_pending: true };
    } else {
      // Victim user login
      const passwordHash = crypto.createHash('sha256').update(password + JWT_SECRET).digest('hex');
      const { rows } = await pool.query(
        'SELECT id, phone, full_name, preferred_language FROM users WHERE phone=$1 AND password_hash=$2 AND is_active=true',
        [phone, passwordHash]
      );
      if (!rows[0]) return res.status(401).json({ error: 'invalid_credentials' });

      subject      = rows[0].id;
      tokenPayload = { sub: rows[0].id, role: 'user', phone: rows[0].phone };
    }

    const accessToken  = signAccessToken(tokenPayload);
    const refreshToken = await issueRefreshToken(
      role === 'user' ? subject : null,
      role === 'officer' ? subject : null
    );

    res.json({
      access_token:  accessToken,
      refresh_token: refreshToken,
      token_type:    'Bearer',
      expires_in:    parseInt(process.env.JWT_ACCESS_EXPIRES_MINUTES || '15', 10) * 60,
      mfa_required:  role === 'officer',
    });
  } catch (err) {
    console.error('[AUTH/login]', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Rotate refresh token
app.post('/api/auth/refresh', authLimiter, async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

  const tokenHash = crypto.createHash('sha256').update(refresh_token).digest('hex');
  const { rows } = await pool.query(
    `SELECT * FROM refresh_tokens WHERE token_hash=$1 AND revoked=false AND expires_at > now()`,
    [tokenHash]
  );
  if (!rows[0]) return res.status(401).json({ error: 'invalid_or_expired_refresh_token' });

  // Revoke old token
  await pool.query('UPDATE refresh_tokens SET revoked=true WHERE id=$1', [rows[0].id]);

  // Issue new pair
  const isOfficer     = !!rows[0].officer_id;
  const subjectId     = isOfficer ? rows[0].officer_id : rows[0].user_id;
  const payload       = isOfficer
    ? { sub: subjectId, role: 'officer' }
    : { sub: subjectId, role: 'user' };

  const newAccess  = signAccessToken(payload);
  const newRefresh = await issueRefreshToken(
    isOfficer ? null : subjectId,
    isOfficer ? subjectId : null
  );
  res.json({ access_token: newAccess, refresh_token: newRefresh });
});

// MFA setup — generate TOTP secret + QR code (officers only, after first login)
app.post('/api/auth/mfa/setup', authLimiter, authMiddleware, officerOnly, async (req, res) => {
  const secret = speakeasy.generateSecret({ name: `KanadShield (${req.user.badge_no})`, length: 20 });
  await pool.query('UPDATE police_officers SET totp_secret=$1 WHERE id=$2', [secret.base32, req.user.sub]);
  const qr = await QRCode.toDataURL(secret.otpauth_url);
  res.json({ otpauth_url: secret.otpauth_url, qr_code_data_url: qr, secret: secret.base32 });
});

// MFA verify — second factor for officers
app.post('/api/auth/mfa/verify', authLimiter, authMiddleware, async (req, res) => {
  const { totp_code } = req.body;
  const { rows } = await pool.query('SELECT totp_secret FROM police_officers WHERE id=$1', [req.user.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'officer_not_found' });

  const verified = speakeasy.totp.verify({
    secret:   rows[0].totp_secret,
    encoding: 'base32',
    token:    totp_code,
    window:   1,
  });

  if (!verified) return res.status(401).json({ error: 'invalid_totp' });

  // Issue a fresh token without mfa_pending flag
  const accessToken = signAccessToken({ sub: req.user.sub, role: req.user.role, badge_no: req.user.badge_no });
  res.json({ access_token: accessToken, mfa_verified: true });
});

// ── SOS ROUTES ────────────────────────────────────────────────

// One-touch SOS trigger
app.post('/api/sos/trigger', sosLimiter, authMiddleware, async (req, res) => {
  const { lat, lng, silent = false, description = '' } = req.body;

  if (lat == null || lng == null) {
    return res.status(400).json({ error: 'lat and lng are required' });
  }

  const incidentId = uuid();

  try {
    // Fetch user phone for ERSS
    const { rows: userRows } = await pool.query('SELECT phone, full_name FROM users WHERE id=$1', [req.user.sub]);
    const user = userRows[0] || {};

    // Create incident
    await pool.query(
      `INSERT INTO incidents
         (id, user_id, incident_type, category, status, severity, lat, lng, is_silent, description)
       VALUES ($1,$2,'physical','sos','dispatched',80,$3,$4,$5,$6)`,
      [incidentId, req.user.sub, lat, lng, silent, description]
    );

    // Dispatch to ERSS (async — don't block the SOS response)
    dispatchToERSS({
      incidentId,
      lat, lng,
      callerPhone: user.phone,
      description: `SOS triggered by ${user.full_name || user.phone}. Silent=${silent}`,
    }).then(async (erssResult) => {
      await pool.query(
        'UPDATE incidents SET erss_case_id=$1 WHERE id=$2',
        [erssResult.erss_case_id, incidentId]
      );
      broadcast(incidentId, { type: 'erss_dispatched', erss_case_id: erssResult.erss_case_id });
    }).catch((err) => console.error('[SOS] ERSS dispatch error:', err.message));

    // Start Dead-Man's Switch (2-minute default)
    resetDeadMansSwitch(incidentId, 120);

    // Notify guardians (async)
    notifyGuardians(pool, req.user.sub, incidentId, { lat, lng }, silent)
      .catch((err) => console.error('[SOS] guardian notify error:', err.message));

    // Broadcast to any police console already connected
    broadcast(incidentId, {
      type:       'sos_triggered',
      incidentId,
      lat, lng,
      silent,
      userId:     req.user.sub,
      ts:         Date.now(),
    });

    res.status(201).json({ incidentId, status: 'dispatched', silent });
  } catch (err) {
    console.error('[SOS/trigger]', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Dead-Man's Switch check-in — victim must call this periodically to prevent escalation
app.post('/api/sos/checkin/:incidentId', authMiddleware, (req, res) => {
  const { incidentId } = req.params;
  const interval = parseInt(req.body.intervalSeconds || '120', 10);
  resetDeadMansSwitch(incidentId, interval);
  console.log(`[DEADMAN] Check-in received for ${incidentId}, next deadline in ${interval}s`);
  res.json({ ok: true, next_checkin_deadline: new Date(Date.now() + interval * 1000).toISOString() });
});

// Officer updates incident status
app.patch('/api/sos/:incidentId/status', authMiddleware, officerOnly, async (req, res) => {
  const { status } = req.body;
  const allowed = ['open', 'under_review', 'dispatched', 'en_route', 'arrived', 'resolved', 'closed'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'invalid_status', allowed });
  }

  try {
    await pool.query(
      `UPDATE incidents SET status=$1, assigned_officer_id=$2, updated_at=now() WHERE id=$3`,
      [status, req.user.sub, req.params.incidentId]
    );

    broadcast(req.params.incidentId, { type: 'status_update', status, ts: Date.now() });

    // If resolved, cancel Dead-Man's Switch + notify guardians
    if (status === 'resolved') {
      clearTimeout(deadManTimers.get(req.params.incidentId));
      deadManTimers.delete(req.params.incidentId);

      const { rows } = await pool.query('SELECT user_id FROM incidents WHERE id=$1', [req.params.incidentId]);
      if (rows[0]) {
        notifyResolved(pool, rows[0].user_id, req.params.incidentId)
          .catch((err) => console.error('[SOS] resolved notify error:', err.message));
      }
    }

    res.json({ ok: true, status });
  } catch (err) {
    console.error('[SOS/status]', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Fetch a single incident (officer or incident owner)
app.get('/api/sos/:incidentId', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM incidents WHERE id=$1', [req.params.incidentId]);
    if (!rows[0]) return res.status(404).json({ error: 'not_found' });

    // Only the incident owner or an officer can view
    const isOwner   = rows[0].user_id === req.user.sub;
    const isOfficer = ['officer', 'supervisor', 'admin'].includes(req.user.role);
    if (!isOwner && !isOfficer) return res.status(403).json({ error: 'forbidden' });

    res.json(rows[0]);
  } catch (err) {
    console.error('[SOS/get]', err.message);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Emergency contacts CRUD
app.get('/api/user/contacts', authMiddleware, async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM emergency_contacts WHERE user_id=$1',
    [req.user.sub]
  );
  res.json(rows);
});

app.post('/api/user/contacts', authMiddleware, async (req, res) => {
  const { contact_name, contact_phone, relationship } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO emergency_contacts (id, user_id, contact_name, contact_phone, relationship)
     VALUES ($1,$2,$3,$4,$5) RETURNING *`,
    [uuid(), req.user.sub, contact_name, contact_phone, relationship]
  );
  res.status(201).json(rows[0]);
});

app.delete('/api/user/contacts/:contactId', authMiddleware, async (req, res) => {
  await pool.query(
    'DELETE FROM emergency_contacts WHERE id=$1 AND user_id=$2',
    [req.params.contactId, req.user.sub]
  );
  res.json({ ok: true });
});

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'sos-service', ts: new Date().toISOString() }));

// ── Start ─────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅ SOS Service running on port ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}/ws/track?incidentId=<id>`);
  console.log(`   ERSS mode: ${process.env.ERSS_MODE || 'mock'}`);
  console.log(`   Notify mode: ${process.env.NOTIFY_MODE || 'mock'}`);
});

module.exports = { app, server }; // for tests
