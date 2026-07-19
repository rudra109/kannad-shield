// =============================================================
//  Kanad S.H.I.E.L.D. — SOS Service Unit Tests
//  Run: npm test (inside services/sos-service/)
// =============================================================
'use strict';

const request = require('supertest');
const { app } = require('../server');

describe('Health', () => {
  it('GET /health → 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('sos-service');
  });
});

describe('Auth — register + login', () => {
  const phone = `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`;

  it('POST /api/auth/register → 201', async () => {
    const res = await request(app).post('/api/auth/register').send({
      phone,
      full_name: 'Test User',
      password:  'securePass123',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.user.phone).toBe(phone);
  });

  it('POST /api/auth/register duplicate → 409', async () => {
    const res = await request(app).post('/api/auth/register').send({
      phone,
      full_name: 'Dup',
      password:  'securePass123',
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toBe('phone_already_registered');
  });

  it('POST /api/auth/login → 200 with tokens', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone,
      password: 'securePass123',
    });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body.mfa_required).toBe(false);
  });

  it('POST /api/auth/login wrong password → 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      phone,
      password: 'wrongPassword',
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('SOS — auth required', () => {
  it('POST /api/sos/trigger without token → 401', async () => {
    const res = await request(app).post('/api/sos/trigger').send({ lat: 23.0, lng: 72.5 });
    expect(res.statusCode).toBe(401);
  });
});

describe('ERSS mock adapter', () => {
  const { dispatchToERSS } = require('../erss_adapter');

  it('returns a mock case ID in mock mode', async () => {
    process.env.ERSS_MODE = 'mock';
    const result = await dispatchToERSS({
      incidentId:  '12345678-0000-0000-0000-000000000000',
      lat:          23.022,
      lng:          72.571,
      callerPhone: '+919876543210',
      description: 'Test SOS',
    });
    expect(result.erss_case_id).toMatch(/^MOCK-/);
    expect(result.status).toBe('accepted');
    expect(result.mode).toBe('mock');
  });
});
