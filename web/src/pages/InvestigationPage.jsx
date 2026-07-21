// =============================================================
//  Investigation Timeline Page — Phase 3.8
//  Case progress tracking, timeline view, milestones
// =============================================================
import { useState } from 'react';
import { CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, FileText, Shield, Layers } from 'lucide-react';

const CASES = [
  {
    id: 'FIR-2024-08821',
    complainant: 'Anjali Mishra',
    type: 'Cyber Stalking + Deepfake',
    severity: 'critical',
    status: 'under_investigation',
    progress: 65,
    investigator: 'SI Shreya Nair (#1923)',
    events: [
      { date: '2024-11-21 07:38', title: 'SOS Alert Triggered', status: 'done', notes: 'Caller: Anjali Mishra · Threat: online harassment + stalking · Dispatch: Shreya Nair (Beat-22)' },
      { date: '2024-11-21 07:52', title: 'Evidence Collection Initiated', status: 'done', notes: '12 files uploaded · Encrypted vault with CoC tracking · Duration: 14 min 23 sec' },
      { date: '2024-11-21 08:15', title: 'AI Threat Assessment Completed', status: 'done', notes: 'Harassment Escalation: EXTREME (94.7%) · Deepfake: POSITIVE (2/8 images) · Coordinated: NOT detected' },
      { date: '2024-11-21 09:10', title: 'Suspect Identification', status: 'active', notes: '2 of 4 suspects identified · IP traced to Amsterdam VPN · Device fingerprint matched to known offender' },
      { date: '2024-11-21 14:35', title: 'FIR Registered', status: 'done', notes: 'FIR #FIR-2024-08821 · IPC 354-D, 507, 509 · Registered by ASI Rajesh Patel' },
      { date: '2024-11-22 09:00', title: 'Lab Analysis Initiated', status: 'active', notes: 'Batch #LAB-2024-523 · 12 items submitted · Est. completion: 2024-11-23' },
      { date: '2024-12-05', title: 'Preliminary Investigation Complete', status: 'pending', notes: 'Target: 70% complete · Pending: suspect #3 & #4 identification' },
      { date: '2024-12-10', title: 'Prosecutor Review', status: 'pending', notes: 'Awaiting assignment to Cyber Crime Prosecutor' },
    ],
  },
  {
    id: 'FIR-2024-08799',
    complainant: 'Meena Shah',
    type: 'Blackmail + Morphed Images',
    severity: 'critical',
    status: 'closed',
    progress: 100,
    investigator: 'SI Amit Verma (#2156)',
    events: [
      { date: '2024-11-15 09:00', title: 'SOS Alert Triggered', status: 'done', notes: 'Blackmail demand: ₹200k · 3 morphed images sent to family' },
      { date: '2024-11-15 10:00', title: 'Evidence Collection', status: 'done', notes: '9 files · Chat logs, images, payment demands' },
      { date: '2024-11-16 11:00', title: 'AI Threat Assessment', status: 'done', notes: 'Deepfake confirmed · Device: iPhone 13 · GPS: Ahmedabad Satellite' },
      { date: '2024-11-17 14:00', title: 'Suspect Identified', status: 'done', notes: 'Arjun Sharma (S-2024-1847) · IP trace + device match' },
      { date: '2024-11-18 09:00', title: 'Arrest Made', status: 'done', notes: 'Arrested at Satellite area · Evidence seized · Bail denied' },
      { date: '2024-11-20 09:00', title: 'FIR Registered + Charges Filed', status: 'done', notes: 'IPC 383, 386, 67A IT Act · Fast-track prosecution initiated' },
      { date: '2024-12-10', title: 'Court Hearing', status: 'done', notes: 'Charge sheet submitted · Next hearing: Jan 2025' },
    ],
  },
  {
    id: 'FIR-2024-08819',
    complainant: 'Priya Desai',
    type: 'Financial Fraud via Phishing',
    severity: 'warn',
    status: 'under_investigation',
    progress: 45,
    investigator: 'SI Amit Verma (#2156)',
    events: [
      { date: '2024-11-20 10:22', title: 'Complaint Registered', status: 'done', notes: 'Victim transferred ₹45,000 · Fraudulent SMS received' },
      { date: '2024-11-20 11:00', title: 'Evidence Collection', status: 'done', notes: '5 files: SMS screenshots, bank statements, URLs' },
      { date: '2024-11-20 13:00', title: 'Phishing URL Analysis', status: 'done', notes: 'Maliciousness: 89.3% · Domain: 3 days old · Hosting: anonymous VPN' },
      { date: '2024-11-21 09:00', title: 'Bank Coordination', status: 'active', notes: 'Request sent to freeze fraudulent account · Awaiting bank response' },
      { date: '2024-11-25', title: 'Suspect Identification', status: 'pending', notes: 'IP trace + phone number reverse lookup in progress' },
      { date: '2024-12-01', title: 'Arrest & Prosecution', status: 'pending', notes: 'Pending suspect identification' },
    ],
  },
];

const evConfig = {
  done:    { color: 'var(--safe)',   icon: <CheckCircle2 size={13} />, bg: 'rgba(5,150,105,0.1)'  },
  active:  { color: 'var(--accent)', icon: <Clock size={13} />,        bg: 'rgba(37,99,235,0.1)'  },
  pending: { color: 'rgba(0,0,0,0.25)', icon: <Clock size={13} />,     bg: 'rgba(0,0,0,0.04)'    },
};

const sevColor = (s) => s === 'critical' ? 'var(--critical)' : s === 'warn' ? 'var(--warn)' : 'var(--safe)';

function CaseTimeline({ c }) {
  const [open, setOpen] = useState(c.status !== 'closed');

  return (
    <div style={{ background: 'rgba(255,255,255,0.55)', border: '1px solid var(--hud-border)', borderRadius: 12, marginBottom: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onClick={() => setOpen(!open)}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: sevColor(c.severity), flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{c.id}</div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-primary)', marginTop: 2 }}>{c.complainant} · {c.type}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 2 }}>Investigator: {c.investigator}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: c.status === 'closed' ? 'var(--safe)' : 'var(--accent)', background: c.status === 'closed' ? 'rgba(5,150,105,0.1)' : 'rgba(37,99,235,0.1)', padding: '2px 8px', borderRadius: 5 }}>
            {c.status === 'closed' ? '✅ CLOSED' : '🔄 ACTIVE'}
          </span>
          {open ? <ChevronUp size={13} color="var(--text-secondary)" /> : <ChevronDown size={13} color="var(--text-secondary)" />}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 18px 12px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Investigation Progress</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: c.progress === 100 ? 'var(--safe)' : 'var(--accent)' }}>{c.progress}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.08)' }}>
          <div style={{ height: '100%', width: `${c.progress}%`, background: c.progress === 100 ? 'var(--safe)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.6s' }} />
        </div>
      </div>

      {/* Timeline */}
      {open && (
        <div style={{ padding: '0 18px 18px 30px', borderTop: '1px solid var(--hud-border)' }}>
          <div style={{ position: 'relative', paddingLeft: 20, marginTop: 14 }}>
            <div style={{ position: 'absolute', left: 6, top: 0, bottom: 0, width: 2, background: 'rgba(0,0,0,0.08)', borderRadius: 2 }} />
            {c.events.map((ev, i) => {
              const ec = evConfig[ev.status];
              return (
                <div key={i} style={{ position: 'relative', marginBottom: 14 }}>
                  <div style={{ position: 'absolute', left: -27, top: 2, width: 22, height: 22, borderRadius: '50%', background: ec.bg, border: `2px solid ${ec.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: ec.color }}>
                    {ec.icon}
                  </div>
                  <div style={{ background: ec.bg, border: `1px solid ${ec.color}25`, borderRadius: 8, padding: '8px 12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.78rem', color: 'var(--text-primary)' }}>{ev.title}</span>
                      <span style={{ fontSize: '0.62rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>{ev.date}</span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ev.notes}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvestigationPage() {
  const [filter, setFilter] = useState('all');
  const shown = filter === 'all' ? CASES : CASES.filter(c => c.status === filter);

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 640,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><Layers size={14} /> Investigation Timeline & Progress</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { v: 'all', l: 'All' },
            { v: 'under_investigation', l: 'Active' },
            { v: 'closed', l: 'Closed' },
          ].map(f => (
            <button key={f.v} className={`hud-btn ${filter === f.v ? 'hud-btn-primary' : 'hud-btn-ghost'}`} style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={() => setFilter(f.v)}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 24, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { l: 'Active Cases', v: CASES.filter(c => c.status !== 'closed').length, c: 'var(--accent)' },
          { l: 'Avg Progress', v: Math.round(CASES.reduce((a, c) => a + c.progress, 0) / CASES.length) + '%', c: 'var(--text-primary)' },
          { l: 'Closed', v: CASES.filter(c => c.status === 'closed').length, c: 'var(--safe)' },
          { l: 'SOS→Arrest Avg', v: '8 days', c: 'var(--text-secondary)' },
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {shown.map(c => <CaseTimeline key={c.id} c={c} />)}
      </div>
    </div>
  );
}
