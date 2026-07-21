// =============================================================
//  Police Analytics KPI Dashboard — Phase 4.9
//  Performance metrics, officer leaderboard, geographic breakdown
// =============================================================
import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown, Award, MapPin, Clock, Target } from 'lucide-react';

const KPI_CARDS = [
  { label: 'Total Incidents', value: '488', prev: '422', delta: '+15.6%', trend: 'up', color: 'var(--accent)' },
  { label: 'Resolved Today', value: '34', prev: '28', delta: '+21%', trend: 'up', color: 'var(--safe)' },
  { label: 'Avg Response Time', value: '4m 32s', prev: '5m 10s', delta: '-12%', trend: 'down_good', color: 'var(--safe)' },
  { label: 'Conviction Rate', value: '78%', prev: '74%', delta: '+4pts', trend: 'up', color: 'var(--safe)' },
  { label: 'FIRs Registered', value: '156', prev: '140', delta: '+11%', trend: 'up', color: 'var(--accent)' },
  { label: 'Evidence Uploaded', value: '1,240', prev: '1,100', delta: '+12%', trend: 'up', color: 'var(--text-primary)' },
  { label: 'Pending > 7 days', value: '23', prev: '31', delta: '-26%', trend: 'down_good', color: 'var(--safe)' },
  { label: 'Escalated to CBI', value: '7', prev: '4', delta: '+75%', trend: 'up_warn', color: 'var(--warn)' },
];

const OFFICERS = [
  { rank: 1, name: 'Shreya Nair', badge: '#1923', cases: 48, avgResp: '2.8m', conviction: '85%', score: 98, trend: 'up' },
  { rank: 2, name: 'Priya Desai', badge: '#1847', cases: 41, avgResp: '2.9m', conviction: '82%', score: 96, trend: 'up' },
  { rank: 3, name: 'Rajesh Patel', badge: '#2847', cases: 55, avgResp: '3.2m', conviction: '79%', score: 94, trend: 'stable' },
  { rank: 4, name: 'Amit Verma', badge: '#2156', cases: 38, avgResp: '3.1m', conviction: '75%', score: 91, trend: 'up' },
  { rank: 5, name: 'Vikram Singh', badge: '#3012', cases: 22, avgResp: '3.8m', conviction: '68%', score: 88, trend: 'down' },
];

const GEO_DATA = [
  { zone: 'Thaltej', incidents: 78, response: '2.9m', conviction: '82%', color: '#DC2626' },
  { zone: 'Satellite', incidents: 65, response: '3.1m', conviction: '79%', color: '#D97706' },
  { zone: 'CG Road', incidents: 52, response: '3.4m', conviction: '75%', color: '#D97706' },
  { zone: 'SG Highway', incidents: 45, response: '3.6m', conviction: '71%', color: '#059669' },
  { zone: 'Downtown', incidents: 38, response: '3.8m', conviction: '68%', color: '#059669' },
];

const FUNNEL = [
  { stage: 'SOS Reports', value: 488, color: '#DC2626' },
  { stage: 'Evidence Collected', value: 412, color: '#D97706' },
  { stage: 'FIR Registered', value: 156, color: '#7C3AED' },
  { stage: 'Arrest Made', value: 98, color: '#2563EB' },
  { stage: 'Prosecution Filed', value: 81, color: '#059669' },
  { stage: 'Convicted', value: 63, color: '#10B981' },
];

const MONTHLY = [
  { month: 'Jun', incidents: 312, resolved: 245, convicted: 42 },
  { month: 'Jul', incidents: 356, resolved: 278, convicted: 51 },
  { month: 'Aug', incidents: 389, resolved: 302, convicted: 55 },
  { month: 'Sep', incidents: 421, resolved: 331, convicted: 60 },
  { month: 'Oct', incidents: 445, resolved: 348, convicted: 58 },
  { month: 'Nov', incidents: 488, resolved: 382, convicted: 63 },
];

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--hud-panel)', border: '1px solid var(--hud-border)', borderRadius: 8, padding: '8px 12px', fontSize: '0.72rem', backdropFilter: 'blur(10px)' }}>
      <div style={{ fontWeight: 800, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color || p.fill, fontWeight: 700, display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <span>{p.name}</span><span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');

  const trendIcon = (t) => t === 'up' ? <TrendingUp size={11} /> : t === 'down_good' ? <TrendingDown size={11} /> : t === 'up_warn' ? <TrendingUp size={11} /> : null;
  const trendColor = (t) => t === 'up' ? 'var(--accent)' : t === 'down_good' ? 'var(--safe)' : t === 'up_warn' ? 'var(--warn)' : 'var(--text-secondary)';

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 720,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><BarChart2 size={14} /> Police Analytics Dashboard</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['7d', '30d', '90d'].map(p => (
            <button key={p} className={`hud-btn ${period === p ? 'hud-btn-primary' : 'hud-btn-ghost'}`} style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI Grid */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>Key Performance Indicators</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {KPI_CARDS.map(k => (
              <div key={k.label} style={{ background: 'rgba(255,255,255,0.6)', border: '1px solid var(--hud-border)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: k.color, lineHeight: 1 }}>{k.value}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ color: trendColor(k.trend) }}>{trendIcon(k.trend)}</span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, color: trendColor(k.trend) }}>{k.delta} vs prev</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Monthly Trend */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={11} /> 6-Month Performance Trend
          </div>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MONTHLY} margin={{ top: 0, right: 0, left: -28, bottom: 0 }}>
                <CartesianGrid stroke="rgba(0,0,0,0.05)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: 'var(--text-secondary)', fontSize: 10, fontWeight: 600 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTip />} />
                <Line type="monotone" dataKey="incidents" name="Incidents" stroke="var(--critical)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="resolved" name="Resolved" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="convicted" name="Convicted" stroke="var(--safe)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Case Resolution Funnel */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={11} /> Case Resolution Funnel (SOS → Conviction)
          </div>
          {FUNNEL.map((f, i) => {
            const pct = Math.round((f.value / FUNNEL[0].value) * 100);
            return (
              <div key={f.stage} style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>{f.stage}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: f.color }}>{f.value} ({pct}%)</span>
                </div>
                <div style={{ height: 7, background: 'rgba(0,0,0,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: f.color, borderRadius: 4, transition: 'width 0.6s' }} />
                </div>
              </div>
            );
          })}
        </section>

        {/* Officer Leaderboard */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Award size={11} /> Officer Performance Leaderboard
          </div>
          <div style={{ background: 'rgba(255,255,255,0.4)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--hud-border)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '30px 1fr 60px 60px 70px 60px', gap: 0, padding: '7px 12px', background: 'rgba(0,0,0,0.04)', fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <div>#</div><div>Officer</div><div style={{ textAlign: 'center' }}>Cases</div><div style={{ textAlign: 'center' }}>Resp.</div><div style={{ textAlign: 'center' }}>Conv. Rate</div><div style={{ textAlign: 'center' }}>Score</div>
            </div>
            {OFFICERS.map(o => (
              <div key={o.rank} style={{ display: 'grid', gridTemplateColumns: '30px 1fr 60px 60px 70px 60px', gap: 0, padding: '9px 12px', borderTop: '1px solid rgba(0,0,0,0.05)', alignItems: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: '0.82rem', color: o.rank <= 2 ? 'var(--warn)' : 'var(--text-secondary)' }}>
                  {o.rank === 1 ? '🥇' : o.rank === 2 ? '🥈' : o.rank === 3 ? '🥉' : o.rank}
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)' }}>👮 {o.name}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{o.badge}</div>
                </div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>{o.cases}</div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.72rem', color: 'var(--safe)' }}>{o.avgResp}</div>
                <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.78rem', color: parseInt(o.conviction) >= 80 ? 'var(--safe)' : 'var(--warn)' }}>{o.conviction}</div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontWeight: 900, fontSize: '0.82rem', fontFamily: 'var(--font-mono)', color: o.score >= 95 ? 'var(--safe)' : o.score >= 90 ? 'var(--accent)' : 'var(--text-primary)' }}>{o.score}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Geographic Performance */}
        <section>
          <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={11} /> Geographic Performance by Zone
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {GEO_DATA.map(g => (
              <div key={g.zone} style={{ background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '10px 12px' }}>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color, flexShrink: 0 }} />
                  {g.zone}
                </div>
                {[
                  { l: 'Incidents', v: g.incidents },
                  { l: 'Avg Response', v: g.response },
                  { l: 'Conviction Rate', v: g.conviction },
                ].map(d => (
                  <div key={d.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', padding: '2px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{d.l}</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{d.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
