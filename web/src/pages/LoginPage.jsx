// =============================================================
//  Login Page — Badge No + Password → MFA TOTP step
// =============================================================
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, ShieldAlert, LogIn, KeyRound } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.jsx';

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
      if (!res.mfa_required) navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  async function handleMFA(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await verifyMFA(totp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid TOTP code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg-base)', padding: 20 }}>
      <div className="login-terminal" style={{ width: '100%', maxWidth: 400, margin: '0 auto' }}>
        <div className="login-header">
          <ShieldAlert size={32} color="var(--blue)" style={{ margin: '0 auto 12px' }} />
          <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Kanad S.H.I.E.L.D.</h2>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>SECURE ACCESS TERMINAL</div>
        </div>

        <div className="login-body">
          {!mfaPending ? (
            <form onSubmit={handleLogin} id="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="badge-input">Officer ID</label>
                <input
                  id="badge-input"
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  placeholder="ACP-001"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password-input">Auth Key</label>
                <input
                  id="password-input"
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              {error && (
                <div className="alert-banner critical" style={{ marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button
                id="login-btn"
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: '12px', marginTop: 8 }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : <><LogIn size={18} /> Authenticate</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMFA} id="mfa-form">
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <ShieldCheck size={32} color="var(--amber)" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1rem', color: 'var(--amber)' }}>MFA REQUIRED</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Enter the 6-digit TOTP code from your authenticator app.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="totp-input">TOTP Code</label>
                <input
                  id="totp-input"
                  className="form-input text-center"
                  style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', letterSpacing: '0.25em' }}
                  placeholder="000000"
                  maxLength={6}
                  value={totp}
                  onChange={(e) => setTotp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="one-time-code"
                />
              </div>

              {error && (
                <div className="alert-banner critical" style={{ marginBottom: 16 }}>
                  {error}
                </div>
              )}

              <button
                id="mfa-btn"
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: '12px' }}
                disabled={loading || totp.length !== 6}
              >
                {loading ? <span className="spinner" /> : <><KeyRound size={18} /> Verify</>}
              </button>
            </form>
          )}
        </div>
        <div style={{ padding: '12px', background: 'var(--bg-card)', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          UNAUTHORIZED ACCESS IS STRICTLY PROHIBITED
        </div>
      </div>
    </div>
  );
}
