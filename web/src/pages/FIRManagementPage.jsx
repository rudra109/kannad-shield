// =============================================================
//  FIR Management Page — FIR List + Auto-Draft + Status Tracking
//  Phase 2.6 of POLICE_DASHBOARD_EXPANSION_ROADMAP
// =============================================================
import { useState } from 'react';
import { FileText, Plus, Filter, ChevronDown, ChevronUp, CheckCircle2, Clock, AlertTriangle, XCircle, BrainCircuit, Copy, Check } from 'lucide-react';

const FIR_DATA = [
  {
    id: 'FIR-2024-08821',
    complainant: 'Anjali Mishra (Age 24)',
    offense: 'Cyber Stalking + Online Harassment',
    ipc: '354-D, 507, 509 (BNS 2023)',
    registered: '2024-11-21 14:35:47',
    registeredBy: 'ASI Rajesh Patel (Badge #2847)',
    severity: 'critical',
    status: 'registered',
    investigator: 'SI Shreya Nair (Badge #1923)',
    evidence: 12,
    progressPct: 70,
    progress: ['Evidence Collected ✅ (12/12)', 'AI Threat Assessment ✅ (Severity: EXTREME)', 'Suspect Identification 🔄 (2/4)', 'Preliminary Investigation 🔄 (70%)', 'Prosecutor Review ⏳'],
    nextHearing: 'TBD',
    description: 'Anjali reported receiving harassing messages and deepfake morphing attacks via WhatsApp & Instagram from unknown perpetrators since 2024-11-15. Suspect demands ₹100k.',
  },
  {
    id: 'FIR-2024-08819',
    complainant: 'Priya Desai (Age 31)',
    offense: 'Financial Fraud via Phishing',
    ipc: 'BNS 318(4), IT Act 66D',
    registered: '2024-11-20 10:22:00',
    registeredBy: 'SI Shreya Nair (Badge #1923)',
    severity: 'warn',
    status: 'under_investigation',
    investigator: 'SI Amit Verma (Badge #2156)',
    evidence: 5,
    progressPct: 45,
    progress: ['Evidence Collected ✅ (5/5)', 'AI Threat Assessment ✅', 'Suspect Identification ⏳ (0/1)', 'Bank Coordination 🔄', 'Prosecutor Review ⏳'],
    nextHearing: 'TBD',
    description: 'Victim received a fake bank SMS with a malicious link and transferred ₹45,000 to fraudulent account.',
  },
  {
    id: 'FIR-2024-08799',
    complainant: 'Meena Shah (Age 27)',
    offense: 'Blackmail + Deepfake Images',
    ipc: '383, 386, 67A IT Act',
    registered: '2024-11-15 09:00:00',
    registeredBy: 'ASI Rajesh Patel (Badge #2847)',
    severity: 'critical',
    status: 'closed',
    investigator: 'SI Shreya Nair (Badge #1923)',
    evidence: 9,
    progressPct: 100,
    progress: ['Evidence Collected ✅', 'AI Threat Assessment ✅', 'Suspect Identified ✅', 'Arrest Made ✅', 'Prosecution Filed ✅'],
    nextHearing: '2024-12-10',
    description: 'Suspect created morphed images and demanded ₹200k. Suspect arrested after IP trace.',
  },
];

const STATUS_CONFIG = {
  registered: { label: 'Registered', color: 'var(--accent)', icon: <FileText size={10} /> },
  under_investigation: { label: 'Under Investigation', color: 'var(--warn)', icon: <Clock size={10} /> },
  closed: { label: 'Closed', color: 'var(--safe)', icon: <CheckCircle2 size={10} /> },
  escalated: { label: 'Escalated', color: 'var(--critical)', icon: <AlertTriangle size={10} /> },
};

const riskColor = (r) => r === 'critical' ? 'var(--critical)' : r === 'warn' ? 'var(--warn)' : 'var(--safe)';

function FIRCard({ fir }) {
  const [expanded, setExpanded] = useState(false);
  const sc = STATUS_CONFIG[fir.status] || STATUS_CONFIG.registered;

  return (
    <div style={{
      border: '1px solid var(--hud-border)',
      background: 'rgba(255,255,255,0.55)',
      borderRadius: 12, marginBottom: 12, overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div
        style={{ padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, background: riskColor(fir.severity), flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>📝 {fir.id}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.62rem', fontWeight: 800, color: sc.color, background: `${sc.color}15`, padding: '2px 7px', borderRadius: 5, border: `1px solid ${sc.color}25` }}>
                {sc.icon} {sc.label}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{fir.complainant}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: 2 }}>{fir.offense}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--accent)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{fir.ipc}</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: riskColor(fir.severity) }}>
              {fir.severity === 'critical' ? '🔴 HIGH' : '🟠 MEDIUM'}
            </span>
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>{expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ paddingLeft: 30, paddingRight: 16, paddingBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Investigation Progress</span>
          <span style={{ fontSize: '0.65rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: fir.progressPct === 100 ? 'var(--safe)' : 'var(--accent)' }}>{fir.progressPct}%</span>
        </div>
        <div style={{ height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${fir.progressPct}%`, background: fir.progressPct === 100 ? 'var(--safe)' : 'var(--accent)', borderRadius: 3, transition: 'width 0.6s ease' }} />
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: '0 16px 16px 30px', borderTop: '1px solid var(--hud-border)' }}>
          {/* Description */}
          <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '10px 12px', marginTop: 12, marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Case Description</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0 }}>{fir.description}</p>
          </div>

          {/* Metadata grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Registered On', value: fir.registered },
              { label: 'Registered By', value: fir.registeredBy },
              { label: 'Investigator', value: fir.investigator },
              { label: 'Evidence Files', value: `${fir.evidence} files linked` },
              { label: 'Next Hearing', value: fir.nextHearing },
              { label: 'IPC Sections', value: fir.ipc },
            ].map(m => (
              <div key={m.label} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{m.label}</div>
                <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-primary)' }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Investigation checklist */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Investigation Status</div>
            {fir.progress.map((p, i) => (
              <div key={i} style={{ fontSize: '0.76rem', color: 'var(--text-primary)', padding: '3px 0', display: 'flex', gap: 8 }}>
                <span style={{ color: p.includes('✅') ? 'var(--safe)' : p.includes('🔄') ? 'var(--accent)' : 'var(--text-secondary)' }}>├─</span>
                {p}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}><FileText size={11} /> View Full</button>
            {fir.status !== 'closed' && <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}>Edit</button>}
            <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem' }}><BrainCircuit size={11} /> Generate Report</button>
            {fir.status !== 'closed' && (
              <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem', color: 'var(--warn)' }}>Transfer</button>
            )}
            {fir.status !== 'closed' && (
              <button className="hud-btn hud-btn-ghost" style={{ padding: '5px 10px', fontSize: '0.65rem', color: 'var(--critical)' }}>Close</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Auto-draft panel
function AutoDraftPanel({ onClose }) {
  const [copied, setCopied] = useState(false);
  const DRAFT = {
    sections: ['IPC 354-D', 'IPC 383', 'IPC 386', 'IPC 507', 'IPC 509', 'IT Act 67A'],
    narrative: `FIR DRAFT — READY TO REGISTER\n\nCOMPLAINANT INFORMATION:\nName: Priya Sharma | Age: 28 | Contact: +91-98765-43210\nAddress: 304, Radiant Apartments, Satellite, Ahmedabad - 380015\n\nOFFENSE DETAILS:\nPrimary Offense: Cyber Stalking (IPC 354-D)\nSecondary Offense: Online Harassment (IPC 507, 509)\nTertiary Offense: Blackmail (IPC 383, 386)\n\nDETAILED NARRATIVE:\nComplainant Priya Sharma reported receiving harassing messages from unknown account @anonymous.\nThe perpetrator has created 3 fake profiles impersonating her and sent morphed images to family members\nwith blackmail demands. The suspect threatened to upload explicit content unless ₹200k is paid.\n\nEVIDENCE SUMMARY:\n• Chat logs (Full thread, 47 messages)\n• Screenshots of morphed images (8)\n• Fake profile records (3 profiles)\n• Blackmail demand recordings (3 audio files)\n• Digital timestamps (Blockchain verified)\n\nAI-GENERATED THREAT ASSESSMENT:\nThreat Level: CRITICAL | Violence Risk: MODERATE | Financial Risk: HIGH\nEscalation Probability: 78% | Recommended Sections: 354-D, 383, 386, 507, 509`,
  };

  const copyText = () => {
    navigator.clipboard.writeText(DRAFT.narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 24 }}>
      <div style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--hud-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrainCircuit size={18} color="var(--accent)" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🤖 AI FIR Auto-Draft</span>
          </div>
          <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px' }} onClick={onClose}>
            <XCircle size={16} />
          </button>
        </div>
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Recommended IPC Sections</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DRAFT.sections.map(s => (
                <span key={s} style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: 'var(--warn-dim)', color: 'var(--warn)', border: '1px solid rgba(217,119,6,0.2)' }}>{s}</span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Draft Narrative</div>
            <textarea
              style={{ width: '100%', minHeight: 320, fontFamily: 'var(--font-mono)', fontSize: '0.78rem', lineHeight: 1.7, padding: 14, borderRadius: 10, border: '1px solid var(--hud-border)', background: 'rgba(0,0,0,0.02)', resize: 'vertical', color: 'var(--text-primary)' }}
              defaultValue={DRAFT.narrative}
            />
          </div>
          <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: '0.76rem', color: 'var(--text-primary)' }}>
            ⚠ <strong>Officer Sign-off Required:</strong> This draft was generated by Kanad AI. Please verify facts, names, and IPC sections before formal registry.
          </div>
        </div>
        <div style={{ padding: '14px 22px', borderTop: '1px solid var(--hud-border)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="hud-btn hud-btn-ghost" onClick={onClose}>Discard</button>
          <button className="hud-btn hud-btn-primary" onClick={copyText}>
            {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy to Clipboard</>}
          </button>
          <button className="hud-btn hud-btn-primary" style={{ background: 'var(--safe)' }}>
            <CheckCircle2 size={14} /> Approve & Register
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FIRManagementPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDraft, setShowDraft] = useState(false);

  const filtered = statusFilter === 'all' ? FIR_DATA : FIR_DATA.filter(f => f.status === statusFilter);

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 620,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="hud-panel-header">
        <div className="hud-panel-title"><FileText size={14} /> FIR / Complaint Management</div>
        <button className="hud-btn hud-btn-primary" style={{ padding: '5px 12px', fontSize: '0.68rem' }} onClick={() => setShowDraft(true)}>
          <Plus size={13} /> Auto-Draft FIR
        </button>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 24, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { label: 'Total FIRs', value: '488', color: 'var(--text-primary)' },
          { label: 'Active', value: '189', color: 'var(--accent)' },
          { label: 'Closed', value: '254', color: 'var(--safe)' },
          { label: 'Escalated', value: '45', color: 'var(--critical)' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 900, fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--hud-border)', display: 'flex', gap: 6 }}>
        {[
          { label: 'All', value: 'all' },
          { label: 'Registered', value: 'registered' },
          { label: 'Investigating', value: 'under_investigation' },
          { label: 'Closed', value: 'closed' },
        ].map(f => (
          <button
            key={f.value}
            className={`hud-btn ${statusFilter === f.value ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.65rem' }}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* FIR List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {filtered.map(f => <FIRCard key={f.id} fir={f} />)}
      </div>

      {showDraft && <AutoDraftPanel onClose={() => setShowDraft(false)} />}
    </div>
  );
}
