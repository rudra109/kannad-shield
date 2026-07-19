// =============================================================
//  Dashboard Page — stats + live map + quick incident view
// =============================================================
import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { AlertOctagon, CheckCircle2, ListFilter, Activity, Globe, BookOpen } from 'lucide-react';
import api from '../services/api.js';
import LiveMap from '../components/LiveMap.jsx';
import IncidentQueue from '../components/IncidentQueue.jsx';

// Awareness / Education module content
const AWARENESS_MODULES = [
  {
    title: 'Phishing & Malicious Links',
    desc: 'Learn to spot fake URLs, suspicious TLDs, and redirect chains before clicking.',
    lang: { en: true, hi: true, gu: true },
  },
  {
    title: 'Fake Profile Detection',
    desc: 'Warning signs: new account, low engagement, reused photos, suspicious bio text.',
    lang: { en: true, hi: true, gu: true },
  },
  {
    title: 'Privacy Settings Guide',
    desc: 'Step-by-step guide to locking down your Instagram, Facebook, and WhatsApp privacy.',
    lang: { en: true, hi: true, gu: true },
  },
  {
    title: 'Deepfake Awareness',
    desc: 'How to identify AI-manipulated images and what to do if you are targeted.',
    lang: { en: true, hi: false, gu: false },
  },
  {
    title: 'Online Fraud & Scams',
    desc: 'Common fraud patterns: UPI scams, romance fraud, job offer fraud.',
    lang: { en: true, hi: true, gu: true },
  },
  {
    title: 'How to File a Cybercrime Report',
    desc: 'Step-by-step guide to using Kanad S.H.I.E.L.D. and cybercrime.gov.in',
    lang: { en: true, hi: true, gu: true },
  }
];

const TREND_DATA = [
  { day: 'Mon', open: 12, resolved: 8 },
  { day: 'Tue', open: 18, resolved: 14 },
  { day: 'Wed', open: 15, resolved: 11 },
  { day: 'Thu', open: 22, resolved: 17 },
  { day: 'Fri', open: 19, resolved: 15 },
  { day: 'Sat', open: 9,  resolved: 7 },
  { day: 'Sun', open: 14, resolved: 10 },
];

export default function DashboardPage() {
  const [stats, setStats]         = useState({ open: 0, high: 0, resolved: 0, total: 0 });
  const [activeView, setActiveView] = useState('queue'); // queue | map | awareness
  const [liveIncident, setLiveIncident] = useState(null);
  const [lang, setLang]           = useState('en');

  const LANG_LABELS = { en: 'English', hi: 'हिंदी', gu: 'ગુજરાતી' };

  useEffect(() => {
    Promise.all([
      api.police.listIncidents({ status: 'open',     page_size: 1 }),
      api.police.listIncidents({ min_severity: 70,   page_size: 1 }),
      api.police.listIncidents({ status: 'resolved', page_size: 1 }),
      api.police.listIncidents({ page_size: 1 }),
    ]).then(([open, high, resolved, all]) => {
      setStats({
        open:     open.total     || 0,
        high:     high.total     || 0,
        resolved: resolved.total || 0,
        total:    all.total      || 0,
      });
    }).catch(console.error);
  }, []);

  return (
    <div>
      {/* ── Page Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', marginBottom: 4 }}>Operations Dashboard</h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Cyber Crime Branch · Ahmedabad City Police
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            id="lang-switcher"
            className="form-select"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{ width: 120, padding: '6px 10px', fontSize: '0.8rem' }}
          >
            {Object.entries(LANG_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <div className="live-indicator">
            <div className="live-dot" />
            Live Sync
          </div>
        </div>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────── */}
      <div className="stat-grid">
        <div className="stat-card blue">
          <div className="stat-header">
            <Activity size={14} /> Open Incidents
          </div>
          <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats.open}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-header">
            <AlertOctagon size={14} color="var(--red)" /> Critical Risk
          </div>
          <div className="stat-value" style={{ color: 'var(--red)' }}>{stats.high}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-header">
            <CheckCircle2 size={14} /> Resolved Today
          </div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.resolved}</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-header">
            <ListFilter size={14} /> Total Reports
          </div>
          <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.total}</div>
        </div>
      </div>

      {/* ── Trend Chart ──────────────────────────────────────── */}
      <div className="card mb-6" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '16px 20px', margin: 0, borderBottom: 'none' }}>
          <span className="card-title" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>7-DAY INCIDENT TREND</span>
        </div>
        <div style={{ padding: '0 20px 20px' }}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={TREND_DATA} margin={{ top: 5, right: 0, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="gradOpen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--red)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradRes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--green)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--green)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, fontSize: 12, color: 'var(--text-primary)' }}
                cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }}
              />
              <Area type="monotone" dataKey="open"     stroke="var(--red)" strokeWidth={2} fill="url(#gradOpen)" name="Open" />
              <Area type="monotone" dataKey="resolved" stroke="var(--green)" strokeWidth={2} fill="url(#gradRes)"  name="Resolved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── View Tabs ────────────────────────────────────────── */}
      <div className="tabs mb-6" style={{ marginBottom: 20 }}>
        {[
          { id: 'queue',     label: 'Incident Queue', icon: <ListFilter size={16} /> },
          { id: 'map',       label: 'Live Map', icon: <Globe size={16} /> },
          { id: 'awareness', label: 'Awareness', icon: <BookOpen size={16} /> },
        ].map((v) => (
          <button
            key={v.id}
            id={`view-tab-${v.id}`}
            className={`tab ${activeView === v.id ? 'active' : ''}`}
            onClick={() => setActiveView(v.id)}
          >
            {v.icon} {v.label}
          </button>
        ))}
      </div>

      {/* ── Views ────────────────────────────────────────────── */}
      {activeView === 'queue' && (
        <IncidentQueue onSelectIncident={(inc) => setLiveIncident(inc)} />
      )}

      {activeView === 'map' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ margin: 0, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <span className="card-title" style={{ fontSize: '0.85rem' }}>Real-Time Incident Map — Ahmedabad</span>
          </div>
          <LiveMap liveIncident={liveIncident} showHeatmap />
        </div>
      )}

      {activeView === 'awareness' && (
        <div className="card">
          <div className="card-header" style={{ marginBottom: 20 }}>
            <span className="card-title">Cyber Safety Awareness Modules</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {AWARENESS_MODULES
              .filter((m) => m.lang[lang])
              .map((m, i) => (
                <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 8, color: 'var(--text-primary)' }}>{m.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{m.desc}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
