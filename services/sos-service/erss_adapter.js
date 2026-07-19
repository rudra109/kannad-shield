// =============================================================
//  Kanad S.H.I.E.L.D. — 112/ERSS Mock Adapter
//  Owner: Developer 1
//
//  In mock mode (ERSS_MODE=mock):   logs the payload and returns
//    a fake erss_case_id — safe for demos without credentials.
//  In live mode  (ERSS_MODE=live):  POSTs to the real ERSS endpoint.
//    Swap ERSS_BASE_URL + ERSS_API_KEY in .env when available.
//
//  The request/response shape mirrors the official ERSS 112
//  integration pattern so upgrading is a config change, not a
//  code rewrite.
// =============================================================
'use strict';

const axios = require('axios');

/**
 * Dispatches an emergency incident to 112/ERSS.
 *
 * @param {Object} params
 * @param {string} params.incidentId  - Internal UUID
 * @param {number} params.lat         - Latitude
 * @param {number} params.lng         - Longitude
 * @param {string} params.callerPhone - Victim phone number
 * @param {string} params.description - Short incident description
 * @returns {Promise<{erss_case_id: string, status: string}>}
 */
async function dispatchToERSS({ incidentId, lat, lng, callerPhone, description = '' }) {
  const payload = {
    caller_number:  callerPhone,
    incident_type:  'WOMEN_SAFETY',
    latitude:       lat,
    longitude:      lng,
    description:    description.slice(0, 500),   // ERSS max description length
    external_ref:   incidentId,
    priority:       'HIGH',
    source:         'KANAD_SHIELD_APP',
  };

  if (process.env.ERSS_MODE === 'live') {
    const response = await axios.post(
      `${process.env.ERSS_BASE_URL}/dispatch`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.ERSS_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 8000,
      }
    );
    return response.data;
  }

  // ── Mock mode ───────────────────────────────────────────────
  const mockCaseId = `MOCK-${incidentId.slice(0, 8).toUpperCase()}`;
  console.log(`[ERSS-MOCK] Dispatch →`, { ...payload, _mockCaseId: mockCaseId });
  return { erss_case_id: mockCaseId, status: 'accepted', mode: 'mock' };
}

/**
 * Checks status of a previously dispatched ERSS case.
 * In live mode this would poll the ERSS status endpoint.
 */
async function getERSSStatus(erssCase_id) {
  if (process.env.ERSS_MODE === 'live') {
    const response = await axios.get(
      `${process.env.ERSS_BASE_URL}/cases/${erssCase_id}`,
      { headers: { Authorization: `Bearer ${process.env.ERSS_API_KEY}` }, timeout: 5000 }
    );
    return response.data;
  }

  // Mock: simulate a case progression
  console.log(`[ERSS-MOCK] Status check for ${erssCase_id}`);
  return { erss_case_id: erssCase_id, status: 'dispatched', eta_minutes: 8, mode: 'mock' };
}

module.exports = { dispatchToERSS, getERSSStatus };
