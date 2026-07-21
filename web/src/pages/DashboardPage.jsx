// =============================================================
//  Dashboard — Sentinel HUD Floating Layout
// =============================================================
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Zap, Shield, FileText, Eye, AlertOctagon, CheckCircle2, ChevronRight, Activity, BookOpen, Layers } from 'lucide-react';
import api from '../services/api.js';
import IncidentQueue from '../components/IncidentQueue.jsx';

const TREND_DATA = [
  { day: 'Mon', open: 12, resolved: 8 },
  { day: 'Tue', open: 18, resolved: 14 },
  { day: 'Wed', open: 15, resolved: 11 },
  { day: 'Thu', open: 22, resolved: 17 },
  { day: 'Fri', open: 19, resolved: 15 },
  { day: 'Sat', open: 9,  resolved: 7 },
  { day: 'Sun', open: 14, resolved: 10 },
];

const AWARENESS = [
  { icon: <Zap size={14} />, tag: 'Phishing', title: 'Malicious Link Anatomy' },
  { icon: <Shield size={14} />, tag: 'Social Eng.', title: 'Fake Profile Detection' },
  { icon: <FileText size={14} />, tag: 'Prevention', title: 'Privacy Lock Guide' },
  { icon: <Eye size={14} />, tag: 'AI Threat', title: 'Deepfake Recognition' },
];

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--hud-panel)', border: '1px solid var(--hud-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', backdropFilter: 'blur(10px)' }}>
      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.name}</span><span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

import { LiveIncidentContext } from '../App.jsx';
import { useContext } from 'react';

export default function DashboardPage({ activeTabOverride }) {
  const [activeTab, setActiveTab] = useState(activeTabOverride || 'awareness'); // awareness | queue | stats
  const [incidents, setIncidents] = useState([]);
  const { setLiveIncident: setLiveInc } = useContext(LiveIncidentContext);

  useEffect(() => {
    if (activeTabOverride) setActiveTab(activeTabOverride);
  }, [activeTabOverride]);

  return (
    <>
      {/* ── TOP RIGHT: Floating Panel Switcher ── */}
      <div className="hud-interactive animate-in" style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8, background: 'var(--hud-panel)', padding: 6, borderRadius: 12, border: '1px solid var(--hud-border)', backdropFilter: 'blur(20px)' }}>
        {[
          { id: 'awareness', icon: <BookOpen size={14} />, label: 'Awareness' },
          { id: 'queue', icon: <Layers size={14} />, label: 'Case Queue' },
          { id: 'stats', icon: <Activity size={14} />, label: 'Metrics' },
        ].map(t => (
          <button
            key={t.id}
            className={`hud-btn ${activeTab === t.id ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
            style={{ padding: '6px 12px', fontSize: '0.7rem' }}
            onClick={() => setActiveTab(t.id)}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT PANELS ── */}

      {activeTab === 'awareness' && (
        <div className="hud-panel animate-in" style={{ position: 'absolute', top: 80, right: 24, width: 340 }}>
          <div className="hud-panel-header">
            <div className="hud-panel-title">Awareness Modules</div>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {AWARENESS.map((m, i) => (
              <div key={i} style={{ padding: 12, background: 'rgba(255,255,255,0.05)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ color: 'var(--accent)' }}>{m.icon}</div>
                  <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{m.tag}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{m.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="hud-panel animate-in" style={{ position: 'absolute', top: 80, right: 24, width: 380 }}>
          <div className="hud-panel-header">
            <div className="hud-panel-title">7-Day Incident Trend</div>
          </div>
          <div style={{ padding: '24px 16px 16px', height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA} margin={{ top: 0, right: 0, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="gO" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--critical)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--critical)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--safe)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--safe)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="open" stroke="var(--critical)" strokeWidth={2} fill="url(#gO)" name="Open" />
                <Area type="monotone" dataKey="resolved" stroke="var(--safe)" strokeWidth={2} fill="url(#gR)" name="Resolved" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ padding: 16, borderTop: '1px solid var(--hud-border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Avg Daily</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>15.6</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Resolution</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--safe)' }}>68%</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Avg Close</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>4.2h</div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'queue' && (
        <div className="hud-panel animate-in" style={{ position: 'absolute', top: 80, right: 24, bottom: 90, width: 850 }}>
          <IncidentQueue onSelectIncident={setLiveInc} />
        </div>
      )}
    </>
  );
}
