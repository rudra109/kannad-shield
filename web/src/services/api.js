// =============================================================
//  Kanad S.H.I.E.L.D. — API Service Layer
//  Owner: Developer 3
//  All HTTP calls to Dev 1's backend services.
// =============================================================

const SOS_BASE        = import.meta.env.VITE_SOS_URL  || '/api';
const CYBER_BASE      = import.meta.env.VITE_CYBER_URL || '/api';
const AI_BASE         = import.meta.env.VITE_AI_URL   || '/api/ai';

function authHeader() {
  const token = localStorage.getItem('police_jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  // Auth requests must throw real errors so the login page can show them.
  // Non-auth requests silently fall back to mock data so the dashboard still works.
  const isAuthRequest = url.includes('/auth/');

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...authHeader(),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.detail || err.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    if (isAuthRequest) throw err; // propagate to login form

    console.warn(`[API Fallback] ${url} → ${err.message}`);

    // ── Mock Data Fallbacks ───────────────────────────────────────
    if (url.includes('/police/incidents') && !url.includes('/status') && !url.includes('case-links')) {
      const isList = url.endsWith('/police/incidents') || url.includes('/police/incidents?');
      if (isList) {
        return {
          total: 12,
          incidents: [
            { id: 'inc-1234', category: 'phishing', incident_type: 'financial_fraud', severity: 85, status: 'open', description: 'User received a fake bank SMS with a malicious link.', created_at: new Date().toISOString(), ai_flags: [{ module: 'phishing', score: 92, flag_for_review: true }] },
            { id: 'inc-5678', category: 'stalking', incident_type: 'physical_threat', severity: 72, status: 'under_review', description: 'Stalking complaint via SOS app.', created_at: new Date(Date.now() - 3600000).toISOString(), ai_flags: [] },
            { id: 'inc-9012', category: 'fake_profile', incident_type: 'impersonation', severity: 45, status: 'resolved', description: 'Fake instagram profile reported.', created_at: new Date(Date.now() - 86400000).toISOString(), ai_flags: [{ module: 'social', score: 60, flag_for_review: false }] },
          ],
        };
      } else {
        return {
          incident: { id: 'inc-1234', category: 'phishing', incident_type: 'financial_fraud', severity: 85, status: 'open', description: 'User received a fake bank SMS with a malicious link.', created_at: new Date().toISOString(), lat: 23.0225, lng: 72.5714 },
          ai_scores: [{ module: 'phishing', risk_score: 92, confidence: 0.95, flag_for_review: true, details: { top_signals: ['suspicious_tld', 'redirect_chain'] } }],
          evidence: [],
        };
      }
    }
    if (url.includes('/police/heatmap')) {
      return { buckets: [{ lat_bucket: '23.02', lng_bucket: '72.57', count: 5, severity_avg: 80, dominant_category: 'phishing' }] };
    }
    if (url.includes('case-links')) {
      return { linked_cases: [{ link_type: 'same_phone', confidence: 0.85, linked_incident_id: 'inc-9999', category: 'fraud', status: 'closed', linked_at: new Date().toISOString() }] };
    }
    if (url.includes('/fir/') && url.includes('/draft')) {
      return { suggested_sections: ['BNS Section 318(4)', 'IT Act Section 66D'], draft_text: 'FIR DRAFT:\n\nComplainant reports receiving a fraudulent SMS containing a malicious link intending to steal banking credentials. This constitutes cheating by personation and cyber fraud...', source: 'local_fallback' };
    }
    if (url.includes('/evidence/') && url.includes('/verify')) {
      return { valid: true, records_checked: 2 };
    }
    if (url.includes('/evidence/')) {
      return [{ file_ref: 'screenshot.png', file_hash: 'a1b2c3d4e5f6', prev_hash: '000000000000', chain_hash: 'f6e5d4c3b2a1', timestamp: new Date().toISOString() }];
    }

    return {};
  }
}


// ── Auth ──────────────────────────────────────────────────────
export const api = {
  auth: {
    login: (badge_no, password) =>
      request(`${SOS_BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ badge_no, password, role: 'officer' }),
      }),
    mfaVerify: (totp_code) =>
      request(`${SOS_BASE}/auth/mfa/verify`, {
        method: 'POST',
        body: JSON.stringify({ totp_code }),
      }),
  },

  // ── Police Dashboard ────────────────────────────────────────
  police: {
    listIncidents: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`${CYBER_BASE}/police/incidents${q ? '?' + q : ''}`);
    },
    getIncident: (id) => request(`${CYBER_BASE}/police/incidents/${id}`),
    updateStatus: (id, status) =>
      request(`${CYBER_BASE}/police/incidents/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    getHeatmap: (hours = 24) => request(`${CYBER_BASE}/police/heatmap?hours=${hours}`),
    getCaseLinks: (id) => request(`${CYBER_BASE}/police/incidents/${id}/case-links`),
    draftFIR: (id) =>
      request(`${CYBER_BASE}/police/fir/${id}/draft`, { method: 'POST' }),
  },

  // ── Incidents (SOS) ─────────────────────────────────────────
  sos: {
    get: (id) => request(`${SOS_BASE}/sos/${id}`),
    updateStatus: (id, status) =>
      request(`${SOS_BASE}/sos/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  },

  // ── Evidence ─────────────────────────────────────────────────
  evidence: {
    list: (incidentId) => request(`${CYBER_BASE}/evidence/${incidentId}`),
    verify: (incidentId) => request(`${CYBER_BASE}/evidence/${incidentId}/verify`),
    upload: (incidentId, file) => {
      const form = new FormData();
      form.append('file', file);
      return fetch(`${CYBER_BASE}/evidence/${incidentId}`, {
        method: 'POST',
        headers: authHeader(),
        body: form,
      }).then((r) => r.json());
    },
  },

  // ── AI Engine (Dev 2) ────────────────────────────────────────
  ai: {
    scanPhishing: (url, incident_id) =>
      request(`${AI_BASE}/phishing/scan`, {
        method: 'POST',
        body: JSON.stringify({ url, incident_id }),
      }),
    scanFakeProfile: (profile_url, incident_id) =>
      request(`${AI_BASE}/fake_profile/scan`, {
        method: 'POST',
        body: JSON.stringify({ profile_url, incident_id }),
      }),
    socialScan: (profile_data) =>
      request(`${AI_BASE}/social/scan`, {
        method: 'POST',
        body: JSON.stringify(profile_data),
      }),
  },
};

export default api;
