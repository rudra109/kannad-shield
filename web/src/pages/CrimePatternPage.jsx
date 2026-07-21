// =============================================================
//  Crime Pattern Analysis Page — Heatmaps, Trends, Coordination
//  Phase 2.4 of POLICE_DASHBOARD_EXPANSION_ROADMAP
// =============================================================
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area, CartesianGrid
} from 'recharts';
import { TrendingUp, MapPin, AlertTriangle, Network, Activity, Clock } from 'lucide-react';

const CRIME_TYPES = [
  { name: 'Online Harassment', value: 42, cases: 184, color: '#DC2626' },
  { name: 'Cyberstalking', value: 25, cases: 110, color: '#D97706' },
  { name: 'Deepfake/Morphing', value: 18, cases: 78, color: '#7C3AED' },
  { name: 'Blackmail', value: 10, cases: 44, color: '#2563EB' },
  { name: 'Financial Fraud', value: 5, cases: 22, color: '#059669' },
];

const TEMPORAL = [
  { time: '00-03h', pct: 2 }, { time: '03-06h', pct: 1 }, { time: '06-09h', pct: 8 },
  { time: '09-12h', pct: 34 }, { time: '12-15h', pct: 25 }, { time: '15-18h', pct: 28 },
  { time: '18-21h', pct: 25 }, { time: '21-24h', pct: 8 },
];

const WEEKLY_TREND = [
  { day: 'Mon', incidents: 22, resolved: 18 },
  { day: 'Tue', incidents: 28, resolved: 20 },
  { day: 'Wed', incidents: 19, resolved: 15 },
  { day: 'Thu', incidents: 34, resolved: 25 },
  { day: 'Fri', incidents: 25, resolved: 19 },
  { day: 'Sat', incidents: 12, resolved: 10 },
  { day: 'Sun', incidents: 17, resolved: 14 },
];

const HOTSPOTS = [
  { rank: 1, name: 'Thaltej–Express Avenue', incidents: 12, risk: 'critical' },
  { rank: 2, name: 'CG Road – High Street', incidents: 9, risk: 'critical' },
  { rank: 3, name: 'Satellite – Ramdev Plaza', incidents: 8, risk: 'warn' },
  { rank: 4, name: 'SG Highway – Mahadev Nagar', incidents: 7, risk: 'warn' },
  { rank: 5, name: 'Downtown – Manek Chowk', incidents: 4, risk: 'safe' },
];

const COORDINATED_ATTACKS = [
  {
    id: 'CA-001',
    label: 'FAKE PROFILE HARASSMENT NETWORK',
    severity: 'critical',
    details: ['4 linked profiles coordinating attacks', '3 victims (2 Ahmedabad, 1 Surat)', 'Timed harassment at 9 PM UTC daily', 'Same IP origin (Amsterdam VPN)'],
    confidence: 87,
    action: 'Escalate to Cyber Crime + INTERPOL',
  },
  {
    id: 'CA-002',
    label: 'BLACKMAIL SYNDICATE',
    severity: 'warn',
    details: ['2 operators using morphed images', '12 victims across Ahmedabad + Gandhinagar', 'Demand range: ₹50k–₹500k per victim', 'Method: WhatsApp + Telegram'],
    confidence: 91,
    action: '2 arrests made, 3 suspects identified',
  },
];

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--hud-panel)', border: '1px solid var(--hud-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.75rem', backdropFilter: 'blur(10px)' }}>
      <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.fill || p.color, fontWeight: 700, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{p.name}</span><span>{p.value}{p.dataKey === 'pct' ? '%' : ''}</span>
        </div>
      ))}
    </div>
  );
}

export default function CrimePatternPage() {
  const [dateRange, setDateRange] = useState('30d');

  const riskColor = (r) => r === 'critical' ? 'var(--critical)' : r === 'warn' ? 'var(--warn)' : 'var(--safe)';
  const riskBg = (r) => r === 'critical' ? 'var(--critical-dim)' : r === 'warn' ? 'var(--warn-dim)' : 'var(--safe-dim)';

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 680,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="hud-panel-header">
        <div className="hud-panel-title"><TrendingUp size={14} /> Crime Pattern Analysis</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map(r => (
            <button
              key={r}
              className={`hud-btn ${dateRange === r ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
              style={{ padding: '3px 10px', fontSize: '0.65rem' }}
              onClick={() => setDateRange(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Weekly Trend */}
        <section>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={12} /> Weekly Incident Trend
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={WEEKLY_TREND} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--critical)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--critical)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--safe)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--safe)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Area type="monotone" dataKey="incidents" name="Incidents" stroke="var(--critical)" strokeWidth={2} fill="url(#gI)" />
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="var(--safe)" strokeWidth={2} fill="url(#gR)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Crime Type Distribution */}
        <section>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
            Crime Type Distribution — Last {dateRange}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 16, alignItems: 'center' }}>
            <div>
              {CRIME_TYPES.map(ct => (
                <div key={ct.name} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)' }}>{ct.name}</span>
                    <span style={{ fontSize: '0.72rem', color: ct.color, fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{ct.value}% ({ct.cases})</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${ct.value}%`, background: ct.color, borderRadius: 3, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ height: 140 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CRIME_TYPES} dataKey="value" cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3}>
                    {CRIME_TYPES.map((ct, i) => <Cell key={i} fill={ct.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Temporal Analysis */}
        <section>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={12} /> Peak Reporting Hours
          </div>
          <div style={{ height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEMPORAL} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="pct" name="% of Reports" fill="var(--accent)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Hotspots */}
        <section>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} /> Active Hotspots
          </div>
          {HOTSPOTS.map(hs => (
            <div key={hs.rank} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '10px 12px',
              borderRadius: 8, marginBottom: 6,
              background: riskBg(hs.risk), border: `1px solid ${riskColor(hs.risk)}30`,
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '1.1rem', color: riskColor(hs.risk), minWidth: 24 }}>
                #{hs.rank}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{hs.name}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>{hs.incidents} incidents/week</div>
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: riskColor(hs.risk), textTransform: 'uppercase', padding: '3px 8px', borderRadius: 5, background: `${riskColor(hs.risk)}15` }}>
                {hs.risk === 'critical' ? '🔴 HIGH' : hs.risk === 'warn' ? '🟠 MEDIUM' : '🟢 LOW'}
              </span>
            </div>
          ))}
        </section>

        {/* Coordinated Attack Detection */}
        <section>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Network size={12} /> Coordinated Attack Detection
          </div>
          {COORDINATED_ATTACKS.map(ca => (
            <div key={ca.id} style={{
              border: `1px solid ${riskColor(ca.severity)}30`,
              background: riskBg(ca.severity),
              borderRadius: 10, padding: '12px 14px', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontWeight: 800, fontSize: '0.78rem', color: riskColor(ca.severity) }}>⚠ {ca.label}</div>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                  Confidence: {ca.confidence}%
                </span>
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 8px' }}>
                {ca.details.map((d, i) => (
                  <li key={i} style={{ fontSize: '0.76rem', color: 'var(--text-primary)', display: 'flex', gap: 8, padding: '2px 0' }}>
                    <span style={{ color: riskColor(ca.severity) }}>├─</span> {d}
                  </li>
                ))}
              </ul>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                Recommended: <span style={{ color: 'var(--text-primary)' }}>{ca.action}</span>
              </div>
            </div>
          ))}
        </section>

        {/* Predictive Forecast */}
        <section style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
            📊 Predictive Forecast — Next 7 Days
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { label: 'Expected Incidents', value: '145 ±12' },
              { label: 'High-Risk Days', value: 'Nov 25–27' },
              { label: 'Patrol Increase Rec.', value: 'CG Road, Thaltej' },
              { label: 'Predicted New Hotspot', value: 'South Bopal' },
            ].map(f => (
              <div key={f.label} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{f.label}</div>
                <div style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{f.value}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
