// =============================================================
//  Alerts & Escalation Engine — Phase 4.10
//  Active alerts, rule configuration, notification channels
// =============================================================
import { useState } from 'react';
import { Bell, AlertTriangle, CheckCircle2, XCircle, Plus, Settings, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const ACTIVE_ALERTS = [
  {
    id: 'ALT-001', severity: 'critical', type: 'Repeat Offender Detected',
    incident: '#SOS-004521', suspect: 'Arjun Sharma (Prev. 7 cases, 28% conv.)',
    detail: 'Active harassing another victim · Case similarity score: 89%',
    recommended: 'Immediate arrest + warrant',
    time: '2024-11-21 07:52:34', ack: false,
  },
  {
    id: 'ALT-002', severity: 'warn', type: 'Coordinated Attack Network Detected',
    incident: '#SOS-004519, #SOS-004518', suspect: null,
    detail: '3 fake profiles + same Telegram bot · Social graph correlation: 92% · 2 victims (Ahmedabad + Surat)',
    recommended: 'Coordinate with Surat Police, Alert CID',
    time: '2024-11-21 08:34:12', ack: true,
  },
  {
    id: 'ALT-003', severity: 'medium', type: 'Hotspot Activity Surge',
    incident: null, suspect: null,
    detail: 'Thaltej–Express Avenue: 4 incidents today (baseline: 2) · 38% increase from yesterday',
    recommended: 'Increase patrol presence in area',
    time: '2024-11-21 09:12:45', ack: false,
  },
  {
    id: 'ALT-004', severity: 'warn', type: 'Response Time SLA Breach',
    incident: '#SOS-004517', suspect: null,
    detail: 'Response time exceeded 10 minutes for HIGH priority incident · Current: 12m 33s',
    recommended: 'Reassign to nearest available officer immediately',
    time: '2024-11-21 09:44:10', ack: false,
  },
];

const RULES = [
  {
    id: 'R-001', name: 'Repeat Offender Detected', enabled: true, severity: 'critical',
    conditions: ['new_case similar_to previous_cases > 85%', 'suspect_conviction_rate < 50%'],
    action: 'Escalate to CRITICAL → Alert ACP',
  },
  {
    id: 'R-002', name: 'Coordinated Attack Network', enabled: true, severity: 'warn',
    conditions: ['multiple_cases share_attributes >= 3', 'same_tool_OR_technique detected'],
    action: 'Escalate to HIGH → Alert CID',
  },
  {
    id: 'R-003', name: 'Hotspot Activity Surge', enabled: true, severity: 'medium',
    conditions: ['incidents_in_zone > baseline * 1.3', '3+ incidents within 2 hours'],
    action: 'Escalate to MEDIUM → Notify Beat Commander',
  },
  {
    id: 'R-004', name: 'Response Time Breach', enabled: true, severity: 'warn',
    conditions: ['response_time > 10 minutes', 'threat_level >= HIGH'],
    action: 'Escalate to HIGH → Reassign officer',
  },
  {
    id: 'R-005', name: 'Evidence Tampering Detected', enabled: true, severity: 'critical',
    conditions: ['blockchain_hash_mismatch detected'],
    action: 'Escalate to CRITICAL → Lock evidence + Alert supervisor',
  },
];

const CHANNELS = [
  { method: 'In-app Popup', severity: 'All', lead: 'Immediate', retry: 'Auto-repeat', active: true },
  { method: 'SMS Alert', severity: 'CRITICAL', lead: '+5 min', retry: '3 attempts', active: true },
  { method: 'Push Notification', severity: 'HIGH+', lead: 'Immediate', retry: 'Auto-retry', active: true },
  { method: 'Email', severity: 'MEDIUM+', lead: '+10 min', retry: 'None', active: true },
  { method: 'Siren (Dispatch)', severity: 'CRITICAL', lead: 'Immediate', retry: 'On speaker', active: false },
  { method: 'Officer Call', severity: 'CRITICAL', lead: '+2 min', retry: 'Live connection', active: true },
];

const sevStyle = {
  critical: { color: 'var(--critical)', bg: 'var(--critical-dim)', label: '🔴 CRITICAL' },
  warn:     { color: 'var(--warn)',     bg: 'var(--warn-dim)',     label: '🟠 HIGH' },
  medium:   { color: '#7C3AED',        bg: 'rgba(124,58,237,0.1)', label: '🟡 MEDIUM' },
};

function AlertCard({ alert, onAck, onDismiss }) {
  const ss = sevStyle[alert.severity] || sevStyle.medium;
  return (
    <div style={{
      background: ss.bg, border: `1px solid ${ss.color}30`,
      borderRadius: 12, marginBottom: 10, padding: '12px 14px',
      opacity: alert.ack ? 0.65 : 1, transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: ss.color, background: `${ss.color}20`, padding: '2px 7px', borderRadius: 5 }}>{ss.label}</span>
            {alert.ack && <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--safe)' }}>✓ Acknowledged</span>}
          </div>
          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)' }}>[{alert.id}] {alert.type}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {!alert.ack && (
            <button className="hud-btn hud-btn-ghost" style={{ padding: '3px 8px', fontSize: '0.6rem', color: 'var(--safe)' }} onClick={() => onAck(alert.id)}>
              <CheckCircle2 size={10} /> Ack
            </button>
          )}
          <button className="hud-btn hud-btn-ghost" style={{ padding: '3px 8px', fontSize: '0.6rem', color: 'var(--critical)' }} onClick={() => onDismiss(alert.id)}>
            <XCircle size={10} />
          </button>
        </div>
      </div>
      {alert.incident && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Incident: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{alert.incident}</span></div>}
      {alert.suspect && <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: 4 }}>Suspect: <strong style={{ color: 'var(--text-primary)' }}>{alert.suspect}</strong></div>}
      <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.5 }}>{alert.detail}</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 800, color: ss.color, background: `${ss.color}15`, padding: '3px 8px', borderRadius: 5 }}>
          ⚡ {alert.recommended}
        </div>
        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{alert.time}</div>
      </div>
    </div>
  );
}

function RuleCard({ rule }) {
  const [open, setOpen] = useState(false);
  const [enabled, setEnabled] = useState(rule.enabled);
  const ss = sevStyle[rule.severity] || sevStyle.medium;

  return (
    <div style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid var(--hud-border)', borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: ss.color, background: ss.bg, padding: '2px 6px', borderRadius: 4 }}>{ss.label}</div>
          <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{rule.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{ width: 32, height: 18, borderRadius: 9, background: enabled ? 'var(--safe)' : 'rgba(0,0,0,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            onClick={e => { e.stopPropagation(); setEnabled(!enabled); }}
          >
            <div style={{ position: 'absolute', top: 2, left: enabled ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
          </div>
          {open ? <ChevronUp size={12} color="var(--text-secondary)" /> : <ChevronDown size={12} color="var(--text-secondary)" />}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 14px 12px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ marginTop: 10, marginBottom: 8 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Trigger Conditions (ALL must be true):</div>
            {rule.conditions.map((c, i) => (
              <div key={i} style={{ fontSize: '0.72rem', fontFamily: 'var(--font-mono)', color: 'var(--accent)', background: 'rgba(37,99,235,0.06)', padding: '4px 8px', borderRadius: 5, marginBottom: 4 }}>IF {c}</div>
            ))}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Action:</div>
          <div style={{ fontSize: '0.74rem', fontWeight: 700, color: ss.color, background: ss.bg, padding: '4px 8px', borderRadius: 5 }}>THEN → {rule.action}</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.62rem' }}><Settings size={10} /> Edit</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.62rem', color: 'var(--critical)' }}><XCircle size={10} /> Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(ACTIVE_ALERTS);
  const [tab, setTab] = useState('active');

  const ack = (id) => setAlerts(a => a.map(x => x.id === id ? { ...x, ack: true } : x));
  const dismiss = (id) => setAlerts(a => a.filter(x => x.id !== id));

  const unacked = alerts.filter(a => !a.ack).length;

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 640,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title">
          <Bell size={14} /> Alerts & Escalation Engine
          {unacked > 0 && <span style={{ fontSize: '0.6rem', fontWeight: 900, background: 'var(--critical)', color: '#fff', padding: '1px 6px', borderRadius: 9, marginLeft: 6 }}>{unacked}</span>}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: 'active', l: 'Active Alerts' }, { v: 'rules', l: 'Rules' }, { v: 'channels', l: 'Channels' }].map(t => (
            <button key={t.v} className={`hud-btn ${tab === t.v ? 'hud-btn-primary' : 'hud-btn-ghost'}`} style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={() => setTab(t.v)}>{t.l}</button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 24, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { l: 'Active', v: alerts.length, c: 'var(--critical)' },
          { l: 'Unacknowledged', v: unacked, c: 'var(--warn)' },
          { l: 'Rules Active', v: RULES.filter(r => r.enabled).length, c: 'var(--accent)' },
          { l: 'Today Fired', v: 12, c: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {tab === 'active' && (
          <>
            {alerts.length === 0 ? (
              <div className="empty-state"><CheckCircle2 size={32} /><div className="empty-state-title">All Clear</div><div className="empty-state-sub">No active alerts at this time.</div></div>
            ) : (
              alerts.map(a => <AlertCard key={a.id} alert={a} onAck={ack} onDismiss={dismiss} />)
            )}
          </>
        )}

        {tab === 'rules' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
              <button className="hud-btn hud-btn-primary" style={{ padding: '5px 12px', fontSize: '0.68rem' }}><Plus size={12} /> Add Custom Rule</button>
            </div>
            {RULES.map(r => <RuleCard key={r.id} rule={r} />)}
          </>
        )}

        {tab === 'channels' && (
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Notification Channels</div>
            <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--hud-border)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 100px 60px', padding: '7px 14px', background: 'rgba(0,0,0,0.04)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <div>Method</div><div>Severity</div><div>Lead Time</div><div>Retry</div><div style={{ textAlign: 'center' }}>Active</div>
              </div>
              {CHANNELS.map((ch, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 70px 100px 60px', padding: '9px 14px', borderTop: '1px solid rgba(0,0,0,0.05)', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.76rem', color: 'var(--text-primary)' }}>🔔 {ch.method}</div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 700, color: ch.severity === 'CRITICAL' ? 'var(--critical)' : 'var(--text-secondary)' }}>{ch.severity}</div>
                  <div style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{ch.lead}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{ch.retry}</div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 28, height: 16, borderRadius: 8, background: ch.active ? 'var(--safe)' : 'rgba(0,0,0,0.15)', margin: '0 auto', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: 2, left: ch.active ? 14 : 2, width: 12, height: 12, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
