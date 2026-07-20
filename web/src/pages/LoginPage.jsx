// =============================================================
//  Login Page — Sentinel HUD
// =============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, LogIn, KeyRound, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';
import LiveMap from '../components/LiveMap.jsx'; // Use map as background even on login

export default function LoginPage() {
  const { login, verifyMFA, mfaPending } = useAuth();
  const navigate = useNavigate();

  const [badge, setBadge]       = useState('');
  const [password, setPassword] = useState('');
  const [totp, setTotp]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(badge, password);
      if (!res?.mfa_required) navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally { setLoading(false); }
  }

  async function handleMFA(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMFA(totp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid TOTP code. Please try again.');
    } finally { setLoading(false); }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
        {/* We use a static heatmap or just the dark map */}
        <LiveMap showHeatmap={false} />
        {/* Light overlay to make map subtle */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255, 255, 255, 0.65)' }} />
      </div>

      <div className="hud-container animate-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        <div className="hud-panel" style={{ width: 400, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--accent-dim)', border: '1px solid var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
            <ShieldAlert size={28} color="var(--accent)" />
          </div>
          
          <div style={{ fontSize: '1.2rem', fontWeight: 900, letterSpacing: '0.05em', marginBottom: 4 }}>KANAD S.H.I.E.L.D.</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 32 }}>Operations Terminal Login</div>

          <div style={{ width: '100%' }}>
            {!mfaPending ? (
              <form onSubmit={handleLogin} id="login-form">
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Officer Badge No.</label>
                  <input
                    id="badge-input"
                    className="hud-input"
                    placeholder="ACP-001"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    required autoFocus autoComplete="username"
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>Authentication Key</label>
                  <input
                    id="password-input"
                    type="password"
                    className="hud-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required autoComplete="current-password"
                  />
                </div>

                {error && (
                  <div style={{ background: 'var(--critical-dim)', border: '1px solid var(--critical)', color: 'var(--critical)', padding: '10px 14px', borderRadius: 8, fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button id="login-btn" type="submit" className="hud-btn hud-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading || !badge}>
                  {loading ? <span className="spinner" /> : <><LogIn size={16} /> Authenticate</>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleMFA} id="mfa-form">
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8, textAlign: 'center' }}>Enter 2FA Code</label>
                  <input
                    id="totp-input"
                    className="hud-input"
                    style={{ fontSize: '2rem', letterSpacing: '0.4em', textAlign: 'center', padding: '16px' }}
                    placeholder="000000"
                    maxLength={6}
                    value={totp}
                    onChange={e => setTotp(e.target.value.replace(/\D/g, ''))}
                    required autoFocus autoComplete="one-time-code"
                  />
                </div>

                {error && (
                  <div style={{ background: 'var(--critical-dim)', border: '1px solid var(--critical)', color: 'var(--critical)', padding: '10px 14px', borderRadius: 8, fontSize: '0.8rem', display: 'flex', gap: 8, alignItems: 'center', marginBottom: 24 }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button id="mfa-btn" type="submit" className="hud-btn hud-btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading || totp.length !== 6}>
                  {loading ? <span className="spinner" /> : <><KeyRound size={16} /> Verify & Initialize HUD</>}
                </button>
              </form>
            )}
          </div>
          
          <div style={{ marginTop: 24, fontSize: '0.65rem', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            UNAUTHORIZED ACCESS STRICTLY PROHIBITED
          </div>
        </div>
      </div>
    </>
  );
}
