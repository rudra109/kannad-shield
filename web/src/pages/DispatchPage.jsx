// =============================================================
//  Officer Dispatch & Tracking Page — Phase 3.7
//  Real-time officer location, dispatch, ETA, communication
// =============================================================
import { useState, useEffect } from 'react';
import { Radio, MapPin, Clock, Phone, MessageSquare, Shield, Zap, UserCheck, RefreshCw, AlertTriangle } from 'lucide-react';

const BEATS = [
  {
    id: 'beat-14',
    name: 'Beat-14 (Thaltej–Express Avenue)',
    officers: [
      { id: 'O-2847', name: 'Rajesh Patel', badge: '#2847', status: 'available', location: 'Express Avenue, Thaltej', tasks: 1, avgResponse: '3.2 min', reliability: 94, female: false, speed: 42, distance: '2.1 km', eta: '3 min 45 sec' },
      { id: 'O-1923', name: 'Shreya Nair', badge: '#1923', status: 'on_duty', location: 'CG Road Junction', tasks: 1, avgResponse: '2.8 min', reliability: 98, female: true, currentTask: '#SOS-004520', taskEta: '4 min' },
      { id: 'O-3012', name: 'Vikram Singh', badge: '#3012', status: 'off_duty', location: 'Station', tasks: 0, avgResponse: '3.8 min', reliability: 88, female: false },
    ],
  },
  {
    id: 'beat-22',
    name: 'Beat-22 (Satellite–Ramdev Plaza)',
    officers: [
      { id: 'O-1847', name: 'Priya Desai', badge: '#1847', status: 'available', location: 'Ramdev Plaza, Satellite', tasks: 0, avgResponse: '2.9 min', reliability: 96, female: true, distance: '4.2 km', eta: '6 min 10 sec' },
      { id: 'O-2156', name: 'Amit Verma', badge: '#2156', status: 'available', location: 'SG Highway, near ISKCON', tasks: 0, avgResponse: '3.1 min', reliability: 91, female: false, distance: '3.7 km', eta: '5 min 30 sec' },
    ],
  },
  {
    id: 'beat-08',
    name: 'Beat-08 (CG Road–Navrangpura)',
    officers: [
      { id: 'O-4201', name: 'Anita Sharma', badge: '#4201', status: 'on_duty', location: 'Law Garden Area', tasks: 2, avgResponse: '2.5 min', reliability: 99, female: true, currentTask: '#SOS-004518', taskEta: '8 min' },
    ],
  },
];

const PENDING_SOS = [
  { id: 'SOS-004521', threat: 'Assault + Cyber Stalking', location: 'Thaltej, Near Express Avenue', caller: 'Anjali M. (Age 24)', severity: 'critical', recommended: 'O-2847' },
  { id: 'SOS-004519', threat: 'Online Harassment + Blackmail', location: 'Satellite, Ramdev Plaza', caller: 'Priya S. (Age 28)', severity: 'warn', recommended: 'O-1847' },
];

const statusConfig = {
  available:  { label: 'Available', color: 'var(--safe)', dot: '#22C55E' },
  on_duty:    { label: 'On Duty',   color: 'var(--warn)', dot: '#F59E0B' },
  off_duty:   { label: 'Off Duty',  color: 'var(--text-secondary)', dot: '#94A3B8' },
};

function OfficerRow({ officer, onDispatch, dispatchTarget }) {
  const sc = statusConfig[officer.status];
  const isRecommended = dispatchTarget === officer.id;

  return (
    <div style={{
      padding: '10px 14px',
      borderRadius: 10,
      marginBottom: 6,
      background: isRecommended ? 'rgba(37,99,235,0.08)' : 'rgba(255,255,255,0.4)',
      border: `1px solid ${isRecommended ? 'rgba(37,99,235,0.3)' : 'rgba(0,0,0,0.07)'}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flex: 1 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: sc.color + '20', border: `2px solid ${sc.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={14} color={sc.color} />
          </div>
          <div style={{ position: 'absolute', bottom: -1, right: -1, width: 10, height: 10, borderRadius: '50%', background: sc.dot, border: '2px solid white' }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
            👮 {officer.name} <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-secondary)', fontSize: '0.7rem' }}>{officer.badge}</span>
            {officer.female && <span style={{ fontSize: '0.58rem', background: 'rgba(236,72,153,0.1)', color: '#EC4899', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>♀ Female</span>}
            {isRecommended && <span style={{ fontSize: '0.58rem', background: 'rgba(37,99,235,0.1)', color: 'var(--accent)', padding: '1px 5px', borderRadius: 4, fontWeight: 800 }}>⚡ RECOMMENDED</span>}
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            📍 {officer.location} · Avg: {officer.avgResponse} · Reliability: {officer.reliability}/100
          </div>
          {officer.status === 'on_duty' && officer.currentTask && (
            <div style={{ fontSize: '0.66rem', color: 'var(--warn)', marginTop: 2 }}>
              ↳ On task {officer.currentTask} — ETA {officer.taskEta}
            </div>
          )}
          {officer.distance && (
            <div style={{ fontSize: '0.66rem', color: 'var(--accent)', marginTop: 2 }}>
              🚗 {officer.distance} away — ETA {officer.eta}
            </div>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {officer.status !== 'off_duty' && (
          <>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.62rem' }}><Phone size={10} /></button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.62rem' }}><MessageSquare size={10} /></button>
          </>
        )}
        {officer.status === 'available' && (
          <button
            className="hud-btn hud-btn-primary"
            style={{ padding: '4px 10px', fontSize: '0.62rem', background: isRecommended ? 'var(--accent)' : undefined }}
            onClick={() => onDispatch(officer)}
          >
            <Zap size={10} /> Dispatch
          </button>
        )}
      </div>
    </div>
  );
}

export default function DispatchPage() {
  const [selectedSOS, setSelectedSOS] = useState(PENDING_SOS[0]);
  const [dispatched, setDispatched] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    if (!dispatched) return;
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, [dispatched]);

  const handleDispatch = (officer) => {
    const now = new Date();
    setDispatched({ officer, time: now });
    setElapsed(0);
    setLog([
      { time: now.toLocaleTimeString(), msg: `Alert sent to ${officer.name} (${officer.badge})` },
      { time: new Date(now.getTime() + 2000).toLocaleTimeString(), msg: `Acknowledgment received (2 sec)` },
      { time: new Date(now.getTime() + 4000).toLocaleTimeString(), msg: `Status: En-route — ETA ${officer.eta}` },
    ]);
  };

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 680,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><Radio size={14} /> Officer Dispatch & Tracking</div>
        <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>
          <RefreshCw size={11} /> Refresh
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* Pending SOS queue */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            🚨 Pending SOS — Awaiting Dispatch
          </div>
          {PENDING_SOS.map(sos => (
            <div
              key={sos.id}
              onClick={() => setSelectedSOS(sos)}
              style={{
                padding: '10px 14px', borderRadius: 10, marginBottom: 8, cursor: 'pointer',
                background: selectedSOS?.id === sos.id ? (sos.severity === 'critical' ? 'var(--critical-dim)' : 'var(--warn-dim)') : 'rgba(255,255,255,0.4)',
                border: `1px solid ${selectedSOS?.id === sos.id ? (sos.severity === 'critical' ? 'rgba(220,38,38,0.35)' : 'rgba(217,119,6,0.35)') : 'rgba(0,0,0,0.07)'}`,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.82rem', color: sos.severity === 'critical' ? 'var(--critical)' : 'var(--warn)' }}>#{sos.id}</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: sos.severity === 'critical' ? 'var(--critical)' : 'var(--warn)' }}>
                  {sos.severity === 'critical' ? '🔴 CRITICAL' : '🟠 HIGH'}
                </span>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', marginTop: 4 }}>🚨 {sos.threat}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>📍 {sos.location} · 👤 {sos.caller}</div>
            </div>
          ))}
        </section>

        {/* Officer roster */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            Available Officers — Beat Allocation
          </div>
          {BEATS.map(beat => (
            <div key={beat.id} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent)', marginBottom: 6, padding: '4px 8px', background: 'rgba(37,99,235,0.06)', borderRadius: 6, display: 'inline-block' }}>
                🏢 {beat.name}
              </div>
              {beat.officers.map(o => (
                <OfficerRow
                  key={o.id}
                  officer={o}
                  onDispatch={handleDispatch}
                  dispatchTarget={selectedSOS?.recommended}
                />
              ))}
            </div>
          ))}
        </section>

        {/* Dispatch status */}
        {dispatched && (
          <section style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <UserCheck size={16} color="var(--safe)" />
              <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--safe)' }}>✅ DISPATCH CONFIRMED</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>({fmt(elapsed)} elapsed)</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-primary)', marginBottom: 12 }}>
              Officer <strong>{dispatched.officer.name}</strong> ({dispatched.officer.badge}) dispatched to <strong>#{selectedSOS?.id}</strong>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}><Phone size={11} /> Call Officer</button>
              <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}><MessageSquare size={11} /> Send Message</button>
              <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}><MapPin size={11} /> Live Map View</button>
              <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem', color: 'var(--critical)' }}><AlertTriangle size={11} /> Request Backup</button>
            </div>
            <div style={{ borderLeft: '2px solid var(--safe)', paddingLeft: 14 }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize: '0.72rem', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginRight: 8 }}>{l.time}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
