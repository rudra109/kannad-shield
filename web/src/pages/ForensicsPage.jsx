// =============================================================
//  Digital Forensics Lab — Phase 5.11
//  Lab queue, analysis pipeline, forensic reports
// =============================================================
import { useState } from 'react';
import { Microscope, CheckCircle2, Clock, AlertTriangle, FileText, Download, ChevronDown, ChevronUp, Shield, Hash } from 'lucide-react';

const LAB_QUEUE = [
  {
    id: 'LAB-2024-524',
    case: '#FIR-2024-08821',
    submitted: '2024-11-21 14:35',
    by: 'SI Shreya Nair',
    items: 12,
    size: '245 MB',
    analyst: 'Dr. Vikram Patel',
    tests: [
      { name: 'Virus Scan', status: 'done', result: 'Clean' },
      { name: 'Image Authentication (Deepfake)', status: 'active', result: '45% complete' },
      { name: 'Metadata Extraction (EXIF)', status: 'pending', result: null },
      { name: 'Communication Trail Analysis', status: 'pending', result: null },
      { name: 'IP Geolocation Tracing', status: 'pending', result: null },
    ],
    eta: '2024-11-23 18:00',
    priority: 'critical',
  },
  {
    id: 'LAB-2024-523',
    case: '#FIR-2024-08819',
    submitted: '2024-11-20 11:00',
    by: 'SI Amit Verma',
    items: 5,
    size: '32 MB',
    analyst: 'Dr. Priya Mehta',
    tests: [
      { name: 'Virus Scan', status: 'done', result: 'Clean' },
      { name: 'URL/Phishing Analysis', status: 'done', result: 'MALICIOUS (89.3%)' },
      { name: 'Metadata Extraction', status: 'done', result: 'GPS: Ahmedabad' },
      { name: 'Device Fingerprinting', status: 'active', result: '70% complete' },
    ],
    eta: '2024-11-22 14:00',
    priority: 'warn',
  },
];

const COMPLETED_REPORTS = [
  {
    id: 'FOR-2024-08799-01',
    case: '#FIR-2024-08799',
    completed: '2024-11-22 16:30',
    analyst: 'Dr. Vikram Patel',
    integrity: 'FULLY VERIFIED',
    admissible: true,
    strength: 5,
    convictionProb: 92,
    findings: [
      'Morphed images (deepfake) confirmed — 8/12 images',
      'Creation device: iPhone 13 (UDID linked to suspect)',
      'Location metadata: Ahmedabad Satellite area',
      'Morphing tool: Photoshop v24.x (professional skill)',
      'Timeline: Images created 2024-11-19',
      'No evidence corruption (blockchain verified)',
    ],
    charges: ['IPC 354-D (Cyber stalking)', 'IPC 383/386 (Blackmail)', 'BNS 2023 Sec 67(A) (Morphed images)', 'BNS 2023 Sec 69 (Identity theft)'],
    sections: [
      { title: 'Image Authentication', status: 'done', summary: 'MORPHED IMAGE confirmed (96.8% confidence) · Deepfake indicators: 12 · Skin texture, lighting, iris mismatch detected' },
      { title: 'Metadata Extraction', status: 'done', summary: 'GPS: 23.0225°N, 72.5247°E (Satellite, Ahmedabad) · Device: iPhone 13 · Created: 2024-11-19 22:34:12' },
      { title: 'Hash Verification (Blockchain)', status: 'done', summary: 'All 12 files: SHA-256 MATCH ✅ · Block #847293 · Tampering Risk: ZERO' },
    ],
  },
];

const statusConfig = {
  done:    { icon: <CheckCircle2 size={12} />, color: 'var(--safe)' },
  active:  { icon: <Clock size={12} />,        color: 'var(--accent)' },
  pending: { icon: <Clock size={12} />,        color: 'rgba(0,0,0,0.3)' },
};

function LabCard({ item }) {
  const [open, setOpen] = useState(true);
  const done = item.tests.filter(t => t.status === 'done').length;
  const pct = Math.round((done / item.tests.length) * 100);
  const sc = item.priority === 'critical' ? { color: 'var(--critical)', bg: 'var(--critical-dim)' } : { color: 'var(--warn)', bg: 'var(--warn-dim)' };

  return (
    <div style={{ background: sc.bg, border: `1px solid ${sc.color}30`, borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ display: 'flex', align: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-primary)' }}>📦 {item.id}</span>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: sc.color, marginLeft: 8 }}>Case: {item.case}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            {item.items} items · {item.size} · Analyst: {item.analyst} · ETA: {item.eta}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: sc.color }}>{pct}%</div>
            <div style={{ fontSize: '0.58rem', color: 'var(--text-secondary)' }}>complete</div>
          </div>
          {open ? <ChevronUp size={13} color="var(--text-secondary)" /> : <ChevronDown size={13} color="var(--text-secondary)" />}
        </div>
      </div>
      <div style={{ marginLeft: 16, marginRight: 16, marginBottom: 10 }}>
        <div style={{ height: 5, background: 'rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: sc.color, borderRadius: 3, transition: 'width 0.6s' }} />
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 16px 14px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ marginTop: 10 }}>
            {item.tests.map((t, i) => {
              const tc = statusConfig[t.status];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 7, marginBottom: 4, background: 'rgba(255,255,255,0.4)' }}>
                  <span style={{ color: tc.color, flexShrink: 0 }}>{tc.icon}</span>
                  <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>{t.name}</span>
                  {t.result && <span style={{ fontSize: '0.68rem', fontWeight: 700, color: tc.color, fontFamily: 'var(--font-mono)' }}>{t.result}</span>}
                  {!t.result && t.status === 'pending' && <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>⏳ Queued</span>}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}><AlertTriangle size={11} /> Request Priority</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}>View Details</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ForensicReport({ r }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: 'rgba(5,150,105,0.05)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 12, marginBottom: 12, overflow: 'hidden' }}>
      <div style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 4 }}>📊 {r.id} — Case {r.case}</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Completed: {r.completed} · Analyst: {r.analyst}</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--safe)', background: 'rgba(5,150,105,0.1)', padding: '2px 6px', borderRadius: 4 }}>✅ {r.integrity}</span>
            {r.admissible && <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--accent)', background: 'rgba(37,99,235,0.1)', padding: '2px 6px', borderRadius: 4 }}>⚖️ Court-Admissible</span>}
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--warn)', background: 'rgba(217,119,6,0.1)', padding: '2px 6px', borderRadius: 4 }}>{'⭐'.repeat(r.strength)} {r.convictionProb}% conviction</span>
          </div>
        </div>
        {open ? <ChevronUp size={13} color="var(--text-secondary)" /> : <ChevronDown size={13} color="var(--text-secondary)" />}
      </div>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(5,150,105,0.1)' }}>
          {/* Sections */}
          {r.sections.map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '10px 12px', marginTop: 10 }}>
              <div style={{ fontWeight: 800, fontSize: '0.75rem', color: 'var(--text-primary)', marginBottom: 4 }}>📋 SECTION {i + 1}: {s.title}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.summary}</div>
            </div>
          ))}
          {/* Findings */}
          <div style={{ marginTop: 12, background: 'rgba(255,255,255,0.5)', borderRadius: 8, padding: '10px 12px' }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Key Findings</div>
            {r.findings.map((f, i) => (
              <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text-primary)', padding: '2px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: 'var(--safe)' }}>✓</span> {f}
              </div>
            ))}
          </div>
          {/* Charges */}
          <div style={{ marginTop: 10 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Recommended Charges</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {r.charges.map((c, i) => (
                <span key={i} style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--warn)', background: 'var(--warn-dim)', padding: '3px 8px', borderRadius: 5, border: '1px solid var(--warn-border)' }}>{c}</span>
              ))}
            </div>
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="hud-btn hud-btn-primary" style={{ padding: '6px 12px', fontSize: '0.68rem' }}><Download size={11} /> Download PDF</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.68rem' }}>Send to Prosecutor</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.68rem' }}><Shield size={11} /> Release Seal</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ForensicsPage() {
  const [tab, setTab] = useState('queue');
  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 660,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div className="hud-panel-header">
        <div className="hud-panel-title"><Microscope size={14} /> Digital Forensics Lab</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ v: 'queue', l: 'Lab Queue' }, { v: 'reports', l: 'Reports' }].map(t => (
            <button key={t.v} className={`hud-btn ${tab === t.v ? 'hud-btn-primary' : 'hud-btn-ghost'}`} style={{ padding: '3px 10px', fontSize: '0.65rem' }} onClick={() => setTab(t.v)}>{t.l}</button>
          ))}
        </div>
      </div>
      <div style={{ padding: '10px 18px', display: 'flex', gap: 24, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { l: 'In Queue', v: LAB_QUEUE.length, c: 'var(--accent)' },
          { l: 'In Analysis', v: LAB_QUEUE.filter(q => q.tests.some(t => t.status === 'active')).length, c: 'var(--warn)' },
          { l: 'Reports Ready', v: COMPLETED_REPORTS.length, c: 'var(--safe)' },
          { l: 'Court-Admissible', v: COMPLETED_REPORTS.filter(r => r.admissible).length, c: 'var(--safe)' },
        ].map(s => (
          <div key={s.l}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.l}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {tab === 'queue' && LAB_QUEUE.map(item => <LabCard key={item.id} item={item} />)}
        {tab === 'reports' && COMPLETED_REPORTS.map(r => <ForensicReport key={r.id} r={r} />)}
      </div>
    </div>
  );
}
