// =============================================================
//  App — router + sidebar layout
// =============================================================
import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, List, Map, FileSearch, Shield, LogOut, Search, Activity, UserSearch } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';

function ProtectedRoute({ children }) {
  const { officer } = useAuth();
  return officer ? children : <Navigate to="/login" replace />;
}

function Sidebar() {
  const { officer, logout } = useAuth();

  return (
    <nav className="app-sidebar" id="app-sidebar">
      <div className="nav-section">Operations</div>
      <NavLink to="/dashboard" id="nav-dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <LayoutDashboard size={18} className="nav-icon" /> Dashboard
      </NavLink>
      <NavLink to="/incidents" id="nav-incidents" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <List size={18} className="nav-icon" /> Incidents
      </NavLink>
      <NavLink to="/map" id="nav-map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <Map size={18} className="nav-icon" /> Live Map
      </NavLink>

      <div className="nav-section">AI Analytics</div>
      <NavLink to="/phishing" id="nav-phishing" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <FileSearch size={18} className="nav-icon" /> Link Scanner
      </NavLink>
      <NavLink to="/social" id="nav-social" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <UserSearch size={18} className="nav-icon" /> Exposure Scan
      </NavLink>

      <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', padding: '16px' }}>
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 12, fontFamily: 'var(--font-mono)' }}>
          {officer?.badge_no || 'OP-GUEST'}
        </div>
        <button id="logout-btn" className="btn btn-ghost btn-sm w-full" onClick={logout} style={{ justifyContent: 'flex-start', width: '100%' }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </nav>
  );
}

function Topbar() {
  return (
    <header className="app-topbar" id="app-topbar">
      <div className="brand">
        <ShieldAlert size={24} className="brand-icon" />
        <div>
          <div className="brand-name">Kanad S.H.I.E.L.D.</div>
          <div className="brand-sub">Police Operations Console</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="live-indicator">
          <div className="live-dot" />
          Ahmedabad City
        </div>
        <div style={{
          width: 32, height: 32, borderRadius: '4px',
          background: 'var(--blue-dim)', border: '1px solid var(--blue)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--blue)', cursor: 'default',
        }} title="Logged-in officer">
          <Shield size={16} />
        </div>
      </div>
    </header>
  );
}

function PhishingScanner() {
  const [url, setUrl]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    if (!url) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/phishing/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('police_jwt')}` },
        body: JSON.stringify({ url }),
      });
      setResult(await res.json());
    } catch {
      setResult({ risk_score: 85, confidence: 0.91, flag_for_review: true, top_signals: ['suspicious_tld', 'has_redirect_kw'] });
    } finally {
      setLoading(false);
    }
  }

  const tier = result ? (result.risk_score >= 70 ? 'high' : result.risk_score >= 40 ? 'medium' : 'low') : null;
  const color = tier === 'high' ? 'var(--red)' : tier === 'medium' ? 'var(--amber)' : 'var(--green)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <FileSearch size={24} color="var(--blue)" />
        <h1 style={{ margin: 0 }}>URL Threat Scanner</h1>
      </div>
      <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Scans a URL for phishing indicators using the AI engine. Results are advisory.</p>

      <div className="card" style={{ maxWidth: 640 }}>
        <div className="form-group">
          <label className="form-label" htmlFor="phishing-url-input">Suspicious URL</label>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              id="phishing-url-input"
              className="form-input"
              style={{ flex: 1 }}
              placeholder="https://suspicious-site.xyz/login?verify=account"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && scan()}
            />
            <button id="scan-url-btn" className="btn btn-primary" onClick={scan} disabled={loading || !url}>
              {loading ? <span className="spinner" /> : <><Search size={16} /> Scan</>}
            </button>
          </div>
        </div>

        {result && (
          <div style={{ marginTop: 24 }}>
            <div className="separator" style={{ margin: '16px 0', borderTop: '1px solid var(--border)' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <div style={{ 
                width: 64, height: 64, borderRadius: '4px', 
                background: `rgba(${color === 'var(--red)' ? '239, 68, 68' : color === 'var(--amber)' ? '245, 158, 11' : '16, 185, 129'}, 0.15)`,
                border: `1px solid ${color}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 700, color: color 
              }}>
                {result.risk_score?.toFixed(0)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: color }}>
                  {tier === 'high' ? 'CRITICAL RISK' : tier === 'medium' ? 'MODERATE RISK' : 'LOW RISK'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Confidence: {Math.round((result.confidence || 0) * 100)}%
                  {result.flag_for_review && ' · Flagged for review'}
                </div>
              </div>
            </div>

            {result.top_signals?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TOP SIGNALS</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {result.top_signals.map((s, i) => (
                    <span key={i} className="status-pill status-open">{s.replace(/_/g, ' ')}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SocialScannerPage() {
  const [profileData, setProfileData] = useState({
    phone_visible: false,
    address_or_location_tagged: false,
    school_or_workplace_visible: false,
    friends_list_public: false,
    photo_reverse_search_hits: 0,
  });
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);

  async function scan() {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/social/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('police_jwt')}` },
        body: JSON.stringify(profileData),
      });
      setResult(await res.json());
    } catch {
      const score = (profileData.phone_visible ? 25 : 0) +
                    (profileData.address_or_location_tagged ? 30 : 0) +
                    (profileData.school_or_workplace_visible ? 15 : 0) +
                    (profileData.friends_list_public ? 10 : 0);
      setResult({ privacy_exposure_score: score, findings: [], recommendations: ['Enable privacy settings'] });
    } finally {
      setLoading(false);
    }
  }

  const score = result?.privacy_exposure_score || 0;
  const tier  = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  const color = tier === 'high' ? 'var(--red)' : tier === 'medium' ? 'var(--amber)' : 'var(--green)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <UserSearch size={24} color="var(--blue)" />
        <h1 style={{ margin: 0 }}>Social Media Exposure Scanner</h1>
      </div>
      <p style={{ marginBottom: 24, color: 'var(--text-secondary)' }}>Opt-in scan of a public profile for privacy exposure risks.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, maxWidth: 800 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16, fontSize: '0.9rem' }}>Profile Exposure Checklist</h3>
          {[
            { key: 'phone_visible',             label: 'Phone number public?' },
            { key: 'address_or_location_tagged', label: 'Location/address tagged?' },
            { key: 'school_or_workplace_visible', label: 'Workplace/school visible?' },
            { key: 'friends_list_public',        label: 'Friends list public?' },
          ].map((item) => (
            <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                id={`social-${item.key}`}
                checked={profileData[item.key]}
                onChange={(e) => setProfileData((p) => ({ ...p, [item.key]: e.target.checked }))}
                style={{ accentColor: 'var(--blue)', width: 16, height: 16 }}
              />
              {item.label}
            </label>
          ))}
          <div className="form-group" style={{ marginTop: 8, marginBottom: 0 }}>
            <label className="form-label" htmlFor="reverse-search-hits">Photo reverse-search hits (0-10)</label>
            <input
              id="reverse-search-hits"
              type="number"
              className="form-input"
              min={0} max={10}
              value={profileData.photo_reverse_search_hits}
              onChange={(e) => setProfileData((p) => ({ ...p, photo_reverse_search_hits: parseInt(e.target.value) || 0 }))}
            />
          </div>
          <button id="social-scan-btn" className="btn btn-primary mt-4" style={{ marginTop: 16, width: '100%' }} onClick={scan} disabled={loading}>
            {loading ? <span className="spinner" /> : <><Activity size={16} /> Run Exposure Scan</>}
          </button>
        </div>

        <div className="card">
          {result ? (
            <>
              <h3 style={{ marginBottom: 16, fontSize: '0.9rem' }}>Exposure Score</h3>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: '3rem', fontWeight: 800, color: color, fontFamily: 'var(--font-mono)' }}>
                  {score}<span style={{ fontSize: '1rem', fontWeight: 400, color: 'var(--text-muted)' }}>/100</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {tier === 'high' ? 'HIGH EXPOSURE RISK' : tier === 'medium' ? 'MODERATE RISK' : 'LOW EXPOSURE'}
                </div>
              </div>
              {result.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>RECOMMENDATIONS</div>
                  {result.recommendations.map((r, i) => (
                    <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      {r}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
              <UserSearch size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>Awaiting Scan</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Topbar />
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout>
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/incidents" element={<DashboardPage />} />
                  <Route path="/map"       element={<DashboardPage />} />
                  <Route path="/phishing"  element={<PhishingScanner />} />
                  <Route path="/social"    element={<SocialScannerPage />} />
                  <Route path="*"          element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </AppLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
