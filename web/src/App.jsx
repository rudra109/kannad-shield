// =============================================================
//  App — Sentinel HUD Layout Controller
// =============================================================
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, ListFilter, FileSearch, LogOut, Search, Activity, UserSearch, Lock, TrendingUp, AlertOctagon, FileText, Radio, Layers, BarChart2, Bell, Microscope, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import EvidenceVaultPage from './pages/EvidenceVaultPage.jsx';
import CrimePatternPage from './pages/CrimePatternPage.jsx';
import SuspectRegistryPage from './pages/SuspectRegistryPage.jsx';
import FIRManagementPage from './pages/FIRManagementPage.jsx';
import DispatchPage from './pages/DispatchPage.jsx';
import InvestigationPage from './pages/InvestigationPage.jsx';
import AnalyticsPage from './pages/AnalyticsPage.jsx';
import AlertsPage from './pages/AlertsPage.jsx';
import ForensicsPage from './pages/ForensicsPage.jsx';
import AuditPage from './pages/AuditPage.jsx';
import TrainingPage from './pages/TrainingPage.jsx';
import LiveMap from './components/LiveMap.jsx';
import RedZonePanel from './components/RedZonePanel.jsx';
import api from './services/api.js';

function ProtectedRoute({ children }) {
  const { officer } = useAuth();
  return officer ? children : <Navigate to="/login" replace />;
}

// ── FLOATING NAVIGATION DOCK ──────────────────────────────────
function HUDNavigation() {
  const { officer, logout } = useAuth();

  const navItems = [
  // Phase 1–2
    { to: '/dashboard', id: 'nav-dashboard', icon: <LayoutDashboard size={15} />, label: 'Command' },
    { to: '/incidents', id: 'nav-incidents', icon: <ListFilter size={15} />,      label: 'Queue' },
    { to: '/evidence',  id: 'nav-evidence',  icon: <Lock size={15} />,            label: 'Evidence' },
    { to: '/patterns',  id: 'nav-patterns',  icon: <TrendingUp size={15} />,      label: 'Patterns' },
    { to: '/suspects',  id: 'nav-suspects',  icon: <AlertOctagon size={15} />,    label: 'Registry' },
    { to: '/fir',       id: 'nav-fir',       icon: <FileText size={15} />,        label: 'FIR' },
    // Phase 3
    { to: '/dispatch',    id: 'nav-dispatch',    icon: <Radio size={15} />,       label: 'Dispatch' },
    { to: '/investigate', id: 'nav-investigate', icon: <Layers size={15} />,      label: 'Timeline' },
    // Phase 4
    { to: '/analytics', id: 'nav-analytics', icon: <BarChart2 size={15} />,      label: 'Analytics' },
    { to: '/alerts',    id: 'nav-alerts',    icon: <Bell size={15} />,            label: 'Alerts' },
    // Phase 5
    { to: '/forensics', id: 'nav-forensics', icon: <Microscope size={15} />,     label: 'Forensics' },
    { to: '/audit',     id: 'nav-audit',     icon: <Lock size={15} />,            label: 'Audit' },
    // Legacy + Phase 6
    { to: '/phishing',  id: 'nav-phishing',  icon: <FileSearch size={15} />,     label: 'URL Scan' },
    { to: '/social',    id: 'nav-social',    icon: <UserSearch size={15} />,      label: 'Exposure' },
    { to: '/training',  id: 'nav-training',  icon: <BookOpen size={15} />,        label: 'Training' },
  ];

  return (
    <nav className="hud-dock animate-in">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          id={item.id}
          className={({ isActive }) => `hud-dock-item ${isActive ? 'active' : ''}`}
        >
          {item.icon} {item.label}
        </NavLink>
      ))}
      <div style={{ width: 1, height: 24, background: 'var(--hud-border)', margin: '0 8px' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px 0 4px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
        {officer?.badge_no || 'OP-GUEST'}
      </div>
      <button className="hud-dock-item" onClick={logout} title="Sign Out">
        <LogOut size={15} />
      </button>
    </nav>
  );
}

// ── FLOATING METRICS WIDGET ──────────────────────────────────
function HUDMetrics({ stats }) {
  const openClass     = (stats?.open || 0) > 10 ? 'critical' : (stats?.open || 0) > 0 ? 'warn' : 'safe';
  const criticalClass = (stats?.high || 0) > 5  ? 'critical' : 'warn';

  return (
    <div className="hud-metrics-widget animate-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, paddingLeft: 4 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--hud-panel)', border: '1px solid var(--hud-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={16} color="var(--text-primary)" />
        </div>
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 900, letterSpacing: '0.05em' }}>KANAD S.H.I.E.L.D.</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ahmedabad Cyber Command</div>
        </div>
      </div>

      <div className="hud-metrics-grid">
        <div className="hud-metric-card">
          <div className="hud-metric-label" style={{ color: 'var(--critical)' }}>Open Incidents</div>
          <div className={`hud-metric-value ${openClass}`}>{stats?.open ?? '10'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label" style={{ color: 'var(--warn)' }}>Critical Risk</div>
          <div className={`hud-metric-value ${criticalClass}`}>{stats?.high ?? '9'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label" style={{ color: 'var(--safe)' }}>Resolved Today</div>
          <div className="hud-metric-value safe">{stats?.resolved ?? '4'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label" style={{ color: 'var(--accent)' }}>Escalated to FIR</div>
          <div className="hud-metric-value">{stats?.escalated ?? '3'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label">Cyber Crime Reports</div>
          <div className="hud-metric-value">{stats?.reports ?? '245'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label">Evidence Uploaded</div>
          <div className="hud-metric-value">{stats?.evidence ?? '156'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label">Avg Resp. Time</div>
          <div className="hud-metric-value" style={{ fontSize: '1.2rem', marginTop: 'auto' }}>{stats?.avg_resp_time ?? '4m 32s'}</div>
        </div>

        <div className="hud-metric-card">
          <div className="hud-metric-label">Convict. Rate</div>
          <div className="hud-metric-value safe" style={{ fontSize: '1.2rem', marginTop: 'auto' }}>{stats?.convict_rate ?? '78%'}</div>
        </div>
      </div>
    </div>
  );
}


// ── SCANNERS (Adapted to HUD Panels) ──────────────────────────

function PhishingScanner() {
  const [url, setUrl]       = useState('');
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
      setResult({ risk_score: 85, confidence: 0.91, flag_for_review: true, top_signals: ['suspicious_tld', 'has_redirect_kw', 'encoded_params'] });
    } finally {
      setLoading(false);
    }
  }

  const tier  = result ? (result.risk_score >= 70 ? 'high' : result.risk_score >= 40 ? 'medium' : 'low') : null;
  const color = tier === 'high' ? 'var(--critical)' : tier === 'medium' ? 'var(--warn)' : 'var(--safe)';
  const bgDim = tier === 'high' ? 'var(--critical-dim)' : tier === 'medium' ? 'var(--warn-dim)' : 'var(--safe-dim)';

  return (
    <div className="hud-panel animate-in" style={{ position: 'absolute', top: 24, right: 24, bottom: 90, width: 440, display: 'flex', flexDirection: 'column' }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><FileSearch size={14} /> URL Threat Scanner</div>
      </div>
      
      <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          AI-powered phishing detection. Paste any suspicious URL for instant analysis against Kanad heuristic models.
        </p>

        <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
          <input
            className="hud-input"
            placeholder="https://suspicious-site.xyz"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && scan()}
          />
          <button className="hud-btn hud-btn-primary" onClick={scan} disabled={loading || !url}>
            {loading ? <span className="spinner" /> : <Search size={15} />}
          </button>
        </div>

        {result && (
          <div className="animate-in" style={{ borderTop: '1px solid var(--hud-border)', paddingTop: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 72, height: 72, borderRadius: 14,
                background: bgDim, border: `1px solid ${color}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: '1.8rem', fontWeight: 900, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                  {result.risk_score?.toFixed(0)}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  {tier === 'high' ? 'CRITICAL RISK' : tier === 'medium' ? 'MODERATE RISK' : 'LOW RISK'}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 4 }}>
                  {tier === 'high' ? 'Do Not Visit This URL' : tier === 'medium' ? 'Proceed With Caution' : 'Appears Safe'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Confidence: {Math.round((result.confidence || 0) * 100)}%
                  {result.flag_for_review && <span style={{ color: 'var(--warn)', marginLeft: 8 }}>· Flagged</span>}
                </div>
              </div>
            </div>

            {result.top_signals?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Threat Signals Detected</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {result.top_signals.map((s, i) => (
                    <span key={i} className="status-stamp" style={{ border: `1px solid ${color}` }}>
                      {s.replace(/_/g, ' ')}
                    </span>
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
    phone_visible: false, address_or_location_tagged: false,
    school_or_workplace_visible: false, friends_list_public: false, photo_reverse_search_hits: 0,
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
      const score = (profileData.phone_visible ? 25 : 0) + (profileData.address_or_location_tagged ? 30 : 0) +
                    (profileData.school_or_workplace_visible ? 15 : 0) + (profileData.friends_list_public ? 10 : 0) +
                    (profileData.photo_reverse_search_hits * 2);
      setResult({ privacy_exposure_score: Math.min(score, 100), recommendations: ['Enable strict privacy settings on all platforms', 'Remove location tags from public posts', 'Set profile to private'] });
    } finally {
      setLoading(false);
    }
  }

  const score = result?.privacy_exposure_score || 0;
  const tier  = score >= 60 ? 'high' : score >= 30 ? 'medium' : 'low';
  const color = tier === 'high' ? 'var(--critical)' : tier === 'medium' ? 'var(--warn)' : 'var(--safe)';

  const checks = [
    { key: 'phone_visible',              label: 'Phone number is public' },
    { key: 'address_or_location_tagged', label: 'Location or address tagged' },
    { key: 'school_or_workplace_visible', label: 'Workplace or school visible' },
    { key: 'friends_list_public',        label: 'Friends list is public' },
  ];

  return (
    <div className="hud-panel animate-in" style={{ position: 'absolute', top: 24, right: 24, bottom: 90, width: 440, display: 'flex', flexDirection: 'column' }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><UserSearch size={14} /> Social Exposure Scan</div>
      </div>
      
      <div style={{ padding: 24, flex: 1, overflowY: 'auto' }}>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
          Analyse a public profile for privacy exposure risks and vulnerabilities.
        </p>

        {checks.map((item) => (
          <label key={item.key} style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, cursor: 'pointer',
            padding: '12px 14px', borderRadius: 8, background: profileData[item.key] ? 'var(--critical-dim)' : 'rgba(0,0,0,0.2)',
            border: `1px solid ${profileData[item.key] ? 'rgba(239, 68, 68, 0.4)' : 'var(--hud-border)'}`,
            transition: 'all 0.15s',
          }}>
            <input type="checkbox" checked={profileData[item.key]} onChange={(e) => setProfileData((p) => ({ ...p, [item.key]: e.target.checked }))} style={{ accentColor: 'var(--critical)', width: 16, height: 16 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: profileData[item.key] ? 'var(--critical)' : 'var(--text-secondary)' }}>{item.label}</span>
          </label>
        ))}
        
        <div style={{ marginTop: 12, marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Photo reverse-search hits (0–10)</label>
          <input type="number" className="hud-input" min={0} max={10} value={profileData.photo_reverse_search_hits} onChange={(e) => setProfileData((p) => ({ ...p, photo_reverse_search_hits: parseInt(e.target.value) || 0 }))} />
        </div>
        
        <button className="hud-btn hud-btn-primary" style={{ width: '100%' }} onClick={scan} disabled={loading}>
          {loading ? <span className="spinner" /> : <><Activity size={15} /> Run Analysis</>}
        </button>

        {result && (
          <div className="animate-in" style={{ borderTop: '1px solid var(--hud-border)', paddingTop: 24, marginTop: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: '4rem', fontWeight: 900, color, fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{score}</div>
              <div style={{ fontSize: '0.68rem', color, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 8 }}>
                {tier === 'high' ? 'HIGH EXPOSURE RISK' : tier === 'medium' ? 'MODERATE RISK' : 'LOW EXPOSURE'}
              </div>
            </div>
            {result.recommendations?.length > 0 && (
              <div>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Recommendations</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--accent)', fontWeight: 800 }}>→</span> {r}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


// ── MAIN LAYOUT ───────────────────────────────────────────────

function HUDLayout({ children }) {
  const [stats, setStats] = useState({ 
    open: 10, high: 9, resolved: 4, escalated: 3, 
    reports: 245, evidence: 156, avg_resp_time: '4m 32s', convict_rate: '78%' 
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [open, high] = await Promise.all([
          api.police.listIncidents({ status: 'open', page_size: 1 }),
          api.police.listIncidents({ min_severity: 70, page_size: 1 }),
        ]);
        setStats(prev => ({ ...prev, open: open?.total||10, high: high?.total||9 }));
      } catch {}
    };
    fetchStats();
    const iv = setInterval(fetchStats, 30000); // 30 seconds auto-refresh
    return () => clearInterval(iv);
  }, []);

  return (
    <>
      {/* 1. Base Layer: Absolute Full-Screen Live Map */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        <LiveMap showHeatmap />
      </div>
      
      {/* 2. HUD Container: Pointer-events none by default */}
      <div className="hud-container">
        
        {/* Top-Left: Floating Metrics Panel */}
        <HUDMetrics stats={stats} />

        {/* Left: Red Zone Panel — below metrics widget, persistent across all routes */}
        <div style={{ position: 'absolute', top: 215, left: 24, zIndex: 50, pointerEvents: 'auto' }}>
          <RedZonePanel />
        </div>
        
        {/* Main Routed Area: Renders the active panel (Dashboard, Scanner, etc) */}
        {children}
        
        {/* Bottom-Center: Floating Dock */}
        <HUDNavigation />
      </div>
    </>
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
              <HUDLayout>
                <Routes>
                  <Route path="/dashboard"   element={<DashboardPage />} />
                  <Route path="/incidents"   element={<DashboardPage activeTabOverride="incidents" />} />
                  <Route path="/evidence"    element={<EvidenceVaultPage />} />
                  <Route path="/patterns"    element={<CrimePatternPage />} />
                  <Route path="/suspects"    element={<SuspectRegistryPage />} />
                  <Route path="/fir"         element={<FIRManagementPage />} />
                  <Route path="/dispatch"    element={<DispatchPage />} />
                  <Route path="/investigate" element={<InvestigationPage />} />
                  <Route path="/analytics"   element={<AnalyticsPage />} />
                  <Route path="/alerts"      element={<AlertsPage />} />
                  <Route path="/forensics"   element={<ForensicsPage />} />
                  <Route path="/audit"       element={<AuditPage />} />
                  <Route path="/phishing"    element={<PhishingScanner />} />
                  <Route path="/social"      element={<SocialScannerPage />} />
                  <Route path="/training"    element={<TrainingPage />} />
                  <Route path="*"            element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </HUDLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
