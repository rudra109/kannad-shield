// =============================================================
//  Repeat Offender Registry Page — Suspect Database
//  Phase 2.5 of POLICE_DASHBOARD_EXPANSION_ROADMAP
// =============================================================
import { useState } from 'react';
import { Search, AlertOctagon, Clock, Shield, User, MapPin, Cpu, ChevronDown, ChevronUp, Radio } from 'lucide-react';

const SUSPECTS = [
  {
    id: 'S-2024-1847',
    name: 'ARJUN SHARMA',
    risk: 'critical',
    status: 'ACTIVE HARASSMENT',
    activeCases: 3,
    totalCases: 7,
    closedCases: 5,
    convictions: 2,
    convictionRate: '28%',
    techniques: ['Fake profiles (12 created)', 'Deepfake morphing (4 instances)', 'WhatsApp harassment (primary)'],
    ips: '4 IPs (one traced to Bangalore)',
    devices: 'iPhone 13, Samsung Galaxy S23',
    locations: 'Satellite, CG Road, Iscon Mall',
    lastActivity: '2024-11-21 09:47:23',
    liveNow: true,
    intelligenceScore: 78,
    aggression: 'EXTREME',
    techSkill: 'ADVANCED',
    recidivism: 'VERY HIGH',
    timeline: [
      { date: '2024-11-21', event: 'Harassment — Victim #3' },
      { date: '2024-11-19', event: 'Deepfake creation detected' },
      { date: '2024-11-15', event: 'Harassment — Victim #2' },
      { date: '2024-11-10', event: 'Harassment — Victim #1' },
      { date: '2024-10-05', event: 'Conviction — 6 months jail' },
    ],
  },
  {
    id: 'S-2024-2103',
    name: 'UNKNOWN_OP_BOTNET',
    risk: 'warn',
    status: 'COORDINATED ATTACKS',
    activeCases: 5,
    totalCases: 18,
    closedCases: 9,
    convictions: 4,
    convictionRate: '22%',
    techniques: ['Automated phishing campaigns', 'Deepfake generation (bot-based)', 'Multi-platform spamming'],
    ips: '47 IPs (VPN rotated, 12 traced EU)',
    devices: 'Multiple virtual machines',
    locations: 'International (Netherlands, US, India)',
    lastActivity: '2024-11-20 22:34:12',
    liveNow: false,
    intelligenceScore: 65,
    aggression: 'HIGH',
    techSkill: 'EXPERT',
    recidivism: 'HIGH',
    timeline: [
      { date: '2024-11-20', event: 'Batch phishing attack — 5 victims' },
      { date: '2024-11-18', event: 'New deepfake content flagged' },
      { date: '2024-11-12', event: 'Coordinated harassment campaign' },
    ],
  },
  {
    id: 'S-2024-0892',
    name: 'RAHUL MEHTA (Alias: rm_shadow)',
    risk: 'safe',
    status: 'MONITORING',
    activeCases: 0,
    totalCases: 3,
    closedCases: 3,
    convictions: 1,
    convictionRate: '33%',
    techniques: ['Fake Instagram profiles', 'Impersonation for financial gain'],
    ips: '2 IPs (Ahmedabad local)',
    devices: 'OnePlus 11',
    locations: 'Navrangpura, Ahmedabad',
    lastActivity: '2024-11-05 14:22:00',
    liveNow: false,
    intelligenceScore: 42,
    aggression: 'MODERATE',
    techSkill: 'BEGINNER',
    recidivism: 'MEDIUM',
    timeline: [
      { date: '2024-11-05', event: 'Last seen online (Instagram)' },
      { date: '2024-10-20', event: 'Released on bail' },
      { date: '2024-09-12', event: 'Arrested — fake profile' },
    ],
  },
];

const riskColor = (r) => r === 'critical' ? 'var(--critical)' : r === 'warn' ? 'var(--warn)' : 'var(--safe)';
const riskBg = (r) => r === 'critical' ? 'var(--critical-dim)' : r === 'warn' ? 'var(--warn-dim)' : 'var(--safe-dim)';

function SuspectCard({ suspect }) {
  const [expanded, setExpanded] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const scoreColor = suspect.intelligenceScore >= 70 ? 'var(--critical)' :
                     suspect.intelligenceScore >= 45 ? 'var(--warn)' : 'var(--safe)';

  return (
    <div style={{
      border: `1px solid ${riskColor(suspect.risk)}30`,
      background: riskBg(suspect.risk),
      borderRadius: 12, marginBottom: 14, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {/* Card header */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
            background: riskColor(suspect.risk), display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: '0.9rem',
          }}>
            <User size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              🚨 {suspect.name}
              {suspect.liveNow && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.6rem', fontWeight: 800, color: 'var(--critical)', background: 'var(--critical-dim)', padding: '2px 6px', borderRadius: 4 }}>
                  <Radio size={8} /> ACTIVE NOW
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 3, fontFamily: 'var(--font-mono)' }}>
              {suspect.id} · {suspect.status}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Intelligence Score gauge */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: scoreColor, lineHeight: 1 }}>{suspect.intelligenceScore}</div>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Risk Score</div>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</div>
        </div>
      </div>

      {/* Quick stats */}
      <div style={{ display: 'flex', borderTop: `1px solid ${riskColor(suspect.risk)}20`, padding: '8px 16px', gap: 20, background: 'rgba(255,255,255,0.3)' }}>
        {[
          { label: 'Active Cases', value: suspect.activeCases, color: suspect.activeCases > 0 ? 'var(--critical)' : 'var(--text-secondary)' },
          { label: 'Total Cases', value: suspect.totalCases },
          { label: 'Convictions', value: `${suspect.convictions} (${suspect.convictionRate})` },
          { label: 'Recidivism', value: suspect.recidivism, color: suspect.recidivism === 'VERY HIGH' ? 'var(--critical)' : suspect.recidivism === 'HIGH' ? 'var(--warn)' : 'var(--safe)' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{s.label}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: s.color || 'var(--text-primary)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${riskColor(suspect.risk)}15` }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { icon: <Cpu size={11} />, label: 'Techniques', value: suspect.techniques.join('; ') },
              { icon: <Shield size={11} />, label: 'Identified IPs', value: suspect.ips },
              { icon: <User size={11} />, label: 'Devices', value: suspect.devices },
              { icon: <MapPin size={11} />, label: 'Known Locations', value: suspect.locations },
            ].map(d => (
              <div key={d.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {d.icon} {d.label}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-primary)', fontWeight: 600 }}>{d.value}</div>
              </div>
            ))}
          </div>

          {/* Behavioral Profile */}
          <div style={{ marginBottom: 14, background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Behavioral Profile</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: 'Aggression', value: suspect.aggression, color: suspect.aggression === 'EXTREME' ? 'var(--critical)' : 'var(--warn)' },
                { label: 'Tech Skill', value: suspect.techSkill, color: 'var(--accent)' },
              ].map(b => (
                <span key={b.label} style={{ fontSize: '0.68rem', fontWeight: 800, color: b.color, background: `${b.color}15`, padding: '3px 8px', borderRadius: 5, border: `1px solid ${b.color}30` }}>
                  {b.label}: {b.value}
                </span>
              ))}
            </div>
          </div>

          {/* Timeline toggle */}
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            onClick={() => setShowTimeline(!showTimeline)}
          >
            <Clock size={11} /> Incident Timeline {showTimeline ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
          </button>
          {showTimeline && (
            <div style={{ borderLeft: '2px solid var(--hud-border)', paddingLeft: 14, marginBottom: 14 }}>
              {suspect.timeline.map((t, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: riskColor(suspect.risk), marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{t.date}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', fontWeight: 600 }}>{t.event}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}>Full Profile</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}>View Cases</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem', color: 'var(--warn)' }}>🔔 Flag Alert</button>
            {suspect.risk === 'critical' && (
              <button className="hud-btn hud-btn-primary" style={{ padding: '5px 10px', fontSize: '0.65rem', background: 'var(--critical)' }}>Issue Arrest Warrant</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SuspectRegistryPage() {
  const [query, setQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('all');

  const filtered = SUSPECTS.filter(s => {
    const matchQuery = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.id.toLowerCase().includes(query.toLowerCase());
    const matchRisk = riskFilter === 'all' || s.risk === riskFilter;
    return matchQuery && matchRisk;
  });

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 600,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="hud-panel-header">
        <div className="hud-panel-title"><AlertOctagon size={14} /> Repeat Offender Registry</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { label: 'All', value: 'all' },
            { label: '🔴 Critical', value: 'critical' },
            { label: '🟠 High', value: 'warn' },
            { label: '🟢 Monitoring', value: 'safe' },
          ].map(f => (
            <button
              key={f.value}
              className={`hud-btn ${riskFilter === f.value ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
              style={{ padding: '3px 10px', fontSize: '0.62rem' }}
              onClick={() => setRiskFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 24, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { label: 'Total on File', value: '847', color: 'var(--text-primary)' },
          { label: 'Active Cases', value: '234', color: 'var(--critical)' },
          { label: 'Avg Conviction', value: '31%', color: 'var(--safe)' },
          { label: 'Multi-state', value: '89', color: 'var(--warn)' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 18px', borderBottom: '1px solid var(--hud-border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input
            className="hud-input"
            style={{ paddingLeft: 30 }}
            placeholder="Search by name, ID, phone, or IP..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Suspect list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <AlertOctagon size={32} />
            <div className="empty-state-title">No Suspects Found</div>
            <div className="empty-state-sub">Adjust your search or risk filter.</div>
          </div>
        ) : (
          filtered.map(s => <SuspectCard key={s.id} suspect={s} />)
        )}
      </div>
    </div>
  );
}
