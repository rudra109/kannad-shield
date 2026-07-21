// =============================================================
//  Access Control & Audit Logging — Phase 5.12
//  RBAC roles, permission matrix, immutable audit trail
// =============================================================
import { useState } from 'react';
import { Lock, Eye, Download, Shield, User, Clock, Filter, Search, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

const ROLES = [
  {
    name: 'Beat Constable',
    level: 'Junior Officer',
    color: '#3B82F6',
    perms: {
      'Create SOS responses': true,
      'View assigned incidents': true,
      'Submit evidence': true,
      'View complainant info': true,
      'Create FIR (with approval)': true,
      'Access confidential evidence': false,
      'Create investigation reports': false,
      'Approve FIR filing': false,
      'View analytics dashboard': false,
      'User role management': false,
    },
  },
  {
    name: 'Sub-Inspector',
    level: 'Senior Officer',
    color: '#8B5CF6',
    perms: {
      'Create SOS responses': true,
      'View assigned incidents': true,
      'Submit evidence': true,
      'View complainant info': true,
      'Create FIR (with approval)': true,
      'Access confidential evidence': true,
      'Create investigation reports': true,
      'Approve FIR filing': true,
      'View analytics dashboard': false,
      'User role management': false,
    },
  },
  {
    name: 'Inspector',
    level: 'Senior Management',
    color: '#F59E0B',
    perms: {
      'Create SOS responses': true,
      'View assigned incidents': true,
      'Submit evidence': true,
      'View complainant info': true,
      'Create FIR (with approval)': true,
      'Access confidential evidence': true,
      'Create investigation reports': true,
      'Approve FIR filing': true,
      'View analytics dashboard': true,
      'User role management': false,
    },
  },
  {
    name: 'ACP / DCP',
    level: 'Command Level',
    color: '#DC2626',
    perms: {
      'Create SOS responses': true,
      'View assigned incidents': true,
      'Submit evidence': true,
      'View complainant info': true,
      'Create FIR (with approval)': true,
      'Access confidential evidence': true,
      'Create investigation reports': true,
      'Approve FIR filing': true,
      'View analytics dashboard': true,
      'User role management': true,
    },
  },
];

const AUDIT_LOG = [
  { time: '2024-11-21 14:32:16', user: 'U-2024-5821', role: 'Victim', action: 'Evidence uploaded', detail: 'Chat_Logs.zip (3.2 MB)', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-21 14:32:45', user: 'SYS-ANTIVIRUS', role: 'Automated', action: 'AV scan complete', detail: 'Clean result', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-21 14:33:02', user: 'SYS-VAULT', role: 'Automated', action: 'Encrypted storage', detail: 'AES-256-GCM applied', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-21 14:33:45', user: 'SYS-BLOCKCHAIN', role: 'Automated', action: 'Blockchain notarized', detail: 'Block #847293', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-22 09:15:30', user: 'SI-Shreya-1923', role: 'Sub-Inspector', action: 'Evidence accessed', detail: 'View — Case #FIR-2024-08821', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-22 09:15:35', user: 'SI-Shreya-1923', role: 'Sub-Inspector', action: 'Evidence downloaded', detail: 'Chat_Logs.zip — Purpose: Forensic', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-22 16:30:00', user: 'LAB-Vikram-001', role: 'Lab Analyst', action: 'Lab analysis started', detail: 'Batch LAB-2024-523', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-22 17:00:00', user: 'SI-Shreya-1923', role: 'Sub-Inspector', action: 'Lab report reviewed', detail: 'FOR-2024-08821-01', case: '#FIR-2024-08821', ok: true },
  { time: '2024-11-22 18:22:11', user: 'UNKNOWN-EXT', role: 'Unknown', action: '⚠ Unauthorized access attempt', detail: 'IP: 103.45.22.1 — Blocked by firewall', case: '#FIR-2024-08821', ok: false },
  { time: '2024-11-22 18:22:13', user: 'SYS-SECURITY', role: 'Automated', action: 'Security alert raised', detail: 'IP 103.45.22.1 blacklisted', case: '#FIR-2024-08821', ok: true },
];

const PERM_KEYS = Object.keys(ROLES[0].perms);

export default function AuditPage() {
  const [tab, setTab] = useState('rbac');
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);

  const filteredLog = AUDIT_LOG.filter(l =>
    !search ||
    l.user.toLowerCase().includes(search.toLowerCase()) ||
    l.action.toLowerCase().includes(search.toLowerCase()) ||
    l.case.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 720,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><Lock size={14} /> Access Control & Audit Logging</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: 'rbac', l: 'Roles & Permissions' }, { v: 'audit', l: 'Audit Log' }].map(t => (
            <button key={t.v} className={`hud-btn ${tab === t.v ? 'hud-btn-primary' : 'hud-btn-ghost'}`} style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={() => setTab(t.v)}>{t.l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {tab === 'rbac' && (
          <>
            {/* Role Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
              {ROLES.map(r => (
                <div
                  key={r.name}
                  onClick={() => setSelectedRole(selectedRole?.name === r.name ? null : r)}
                  style={{
                    background: selectedRole?.name === r.name ? `${r.color}15` : 'rgba(255,255,255,0.5)',
                    border: `1px solid ${selectedRole?.name === r.name ? r.color + '40' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.color + '20', border: `2px solid ${r.color}`, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={16} color={r.color} />
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 2 }}>{r.name}</div>
                  <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{r.level}</div>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, color: r.color, marginTop: 4 }}>{Object.values(r.perms).filter(Boolean).length}/{PERM_KEYS.length} perms</div>
                </div>
              ))}
            </div>

            {/* Permission Matrix */}
            <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--hud-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 90px)', padding: '8px 14px', background: 'rgba(0,0,0,0.05)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', gap: 4 }}>
                <div>Permission</div>
                {ROLES.map(r => <div key={r.name} style={{ textAlign: 'center', color: r.color }}>{r.name.split('/')[0].trim()}</div>)}
              </div>
              {PERM_KEYS.map((perm, i) => (
                <div key={perm} style={{ display: 'grid', gridTemplateColumns: '1fr repeat(4, 90px)', padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)', gap: 4, alignItems: 'center' }}>
                  <div style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-primary)' }}>{perm}</div>
                  {ROLES.map(r => (
                    <div key={r.name} style={{ textAlign: 'center' }}>
                      {r.perms[perm]
                        ? <CheckCircle2 size={14} color="var(--safe)" style={{ margin: '0 auto' }} />
                        : <XCircle size={14} color="rgba(0,0,0,0.2)" style={{ margin: '0 auto' }} />}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'audit' && (
          <>
            {/* Search + Export */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input className="hud-input" style={{ paddingLeft: 30 }} placeholder="Search by user, action, or case..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.68rem' }}><Download size={12} /> Export Trail</button>
            </div>

            {/* Log Table */}
            <div style={{ background: 'rgba(255,255,255,0.4)', border: '1px solid var(--hud-border)', borderRadius: 12, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px', padding: '7px 14px', background: 'rgba(0,0,0,0.05)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <div>Timestamp</div><div>Action</div><div>User / Role</div><div style={{ textAlign: 'center' }}>Status</div>
              </div>
              {filteredLog.map((l, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 80px', padding: '8px 14px', borderTop: '1px solid rgba(0,0,0,0.05)', background: !l.ok ? 'rgba(220,38,38,0.04)' : i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{l.time}</div>
                  <div>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: l.ok ? 'var(--text-primary)' : 'var(--critical)' }}>{l.action}</div>
                    <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)' }}>{l.detail} · {l.case}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.user}</div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)' }}>{l.role}</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    {l.ok
                      ? <CheckCircle2 size={13} color="var(--safe)" style={{ margin: '0 auto' }} />
                      : <AlertTriangle size={13} color="var(--critical)" style={{ margin: '0 auto' }} />}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              🔒 Audit log is immutable and blockchain-protected · Retention: 7+ years
            </div>
          </>
        )}
      </div>
    </div>
  );
}


