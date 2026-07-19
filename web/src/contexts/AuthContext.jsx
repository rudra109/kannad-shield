// =============================================================
//  Auth Context — stores JWT, officer info, login/logout
// =============================================================
import { createContext, useContext, useState, useCallback } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [officer, setOfficer] = useState(() => {
    try {
      const raw = localStorage.getItem('officer_info');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  });
  const [mfaPending, setMfaPending] = useState(false);

  const login = useCallback(async (badge_no, password) => {
    const data = await api.auth.login(badge_no, password);
    localStorage.setItem('police_jwt', data.access_token);
    localStorage.setItem('police_refresh', data.refresh_token);
    if (data.mfa_required) {
      setMfaPending(true);
      return { mfa_required: true };
    }
    const info = { badge_no, role: 'officer' };
    localStorage.setItem('officer_info', JSON.stringify(info));
    setOfficer(info);
    return { mfa_required: false };
  }, []);

  const verifyMFA = useCallback(async (code) => {
    const data = await api.auth.mfaVerify(code);
    localStorage.setItem('police_jwt', data.access_token);
    const info = { role: 'officer', mfa_verified: true };
    localStorage.setItem('officer_info', JSON.stringify(info));
    setOfficer(info);
    setMfaPending(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('police_jwt');
    localStorage.removeItem('police_refresh');
    localStorage.removeItem('officer_info');
    setOfficer(null);
    setMfaPending(false);
  }, []);

  return (
    <AuthContext.Provider value={{ officer, mfaPending, login, verifyMFA, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
