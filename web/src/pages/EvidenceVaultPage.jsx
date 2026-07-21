// =============================================================
//  Evidence Vault Page — Digital Evidence Viewer & Verification
//  Phase 1.3 of POLICE_DASHBOARD_EXPANSION_ROADMAP
// =============================================================
import { useState } from 'react';
import {
  ShieldCheck, Upload, FileImage, FileText, FileArchive, Video,
  Link2, Clock, CheckCircle2, AlertTriangle, Eye, Download,
  Brain, Lock, Hash, ChevronDown, ChevronUp, Filter
} from 'lucide-react';

const MOCK_EVIDENCE = [
  {
    id: 'ev-001',
    name: 'CHAT_LOGS_HARASSMENT.zip',
    type: 'archive',
    size: '3.2 MB',
    format: 'ZIP (AES-256 Encrypted)',
    uploaded: '2024-11-21 14:32:15 UTC',
    uploader: 'User #U-2024-5821 (Victim)',
    hash: 'a7f3e9c2b1d8f4a9',
    aiAnalysis: {
      label: 'Harassment Escalation Detected',
      findings: ['Threats identified: 8', 'Escalation pattern: SEVERE', 'Confidence: 94.7%'],
      action: 'Escalate to FIR',
      score: 94.7,
    },
    custody: [
      { step: 'Received by Platform', time: '2024-11-21 14:32:16', ok: true },
      { step: 'Scanned by AV Engine', time: '2024-11-21 14:32:45', ok: true },
      { step: 'Stored in Vault', time: '2024-11-21 14:33:02', ok: true },
      { step: 'Blockchain Notarized', time: '2024-11-21 14:33:45', ok: true },
      { step: 'Accessed by Investigator', time: '2024-11-22 09:15:30', ok: true },
      { step: 'Awaiting Lab Verification', time: null, ok: false },
    ],
    blockchain: { block: '847293', verified: true, admissible: true },
  },
  {
    id: 'ev-002',
    name: 'FAKE_PROFILE_SCREENSHOTS.png',
    type: 'image',
    size: '1.8 MB',
    format: 'PNG (Metadata preserved)',
    uploaded: '2024-11-21 14:40:10 UTC',
    uploader: 'SI Shreya Nair (Badge #1923)',
    hash: '3d9f2a8b5e1c7f2d',
    aiAnalysis: {
      label: 'Deepfake Detection: NOT DETECTED',
      findings: ['AI Score: 12%', 'Geolocation Metadata: Present (extractable)', 'EXIF Data: Camera model, timestamp, GPS available'],
      action: null,
      score: 12,
    },
    custody: [
      { step: 'Received by Platform', time: '2024-11-21 14:40:11', ok: true },
      { step: 'Scanned by AV Engine', time: '2024-11-21 14:40:38', ok: true },
      { step: 'Stored in Vault', time: '2024-11-21 14:40:55', ok: true },
      { step: 'Blockchain Notarized', time: '2024-11-21 14:41:30', ok: true },
      { step: 'Accessed by Investigator', time: '2024-11-22 09:15:30', ok: true },
      { step: 'Lab Analysis Complete', time: '2024-11-22 16:30:00', ok: true },
    ],
    blockchain: { block: '847311', verified: true, admissible: true },
  },
  {
    id: 'ev-003',
    name: 'PHISHING_LINK.txt',
    type: 'text',
    size: '2.1 KB',
    format: 'Plain Text / URL',
    uploaded: '2024-11-21 15:00:00 UTC',
    uploader: 'User #U-2024-5821 (Victim)',
    hash: 'b9c4d1e7f3a2e5d8',
    aiAnalysis: {
      label: 'Malicious URL Detected',
      findings: ['Maliciousness Score: 89.3%', 'Domain Registration: 2024-11-18 (NEW)', 'Hosting: Anonymous VPN (Traced)'],
      action: 'Block URL + Trace IP',
      score: 89.3,
    },
    custody: [
      { step: 'Received by Platform', time: '2024-11-21 15:00:01', ok: true },
      { step: 'Scanned by AV Engine', time: '2024-11-21 15:00:22', ok: true },
      { step: 'Stored in Vault', time: '2024-11-21 15:00:40', ok: true },
      { step: 'Blockchain Notarized', time: '2024-11-21 15:01:10', ok: true },
      { step: 'URL Reputation Check', time: '2024-11-21 15:01:45', ok: true },
      { step: 'Investigator Review', time: null, ok: false },
    ],
    blockchain: { block: '847398', verified: true, admissible: true },
  },
];

const FILE_ICONS = {
  archive: <FileArchive size={18} />,
  image:   <FileImage size={18} />,
  text:    <FileText size={18} />,
  video:   <Video size={18} />,
};

function EvidenceCard({ ev, selected, onSelect }) {
  const [showCustody, setShowCustody] = useState(false);
  const isSelected = selected === ev.id;

  const aiColor = ev.aiAnalysis.score >= 70 ? 'var(--critical)' :
                  ev.aiAnalysis.score >= 40 ? 'var(--warn)' : 'var(--safe)';

  return (
    <div
      style={{
        background: isSelected ? 'rgba(37,99,235,0.06)' : 'rgba(255,255,255,0.5)',
        border: `1px solid ${isSelected ? 'rgba(37,99,235,0.35)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 14,
        marginBottom: 14,
        overflow: 'hidden',
        boxShadow: isSelected ? '0 0 0 2px rgba(37,99,235,0.15)' : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.2s',
        cursor: 'pointer',
      }}
      onClick={() => onSelect(ev.id)}
    >
      {/* Header */}
      <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'var(--accent)', opacity: 0.8 }}>{FILE_ICONS[ev.type]}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{ev.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
              {ev.size} · {ev.format}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {ev.blockchain.verified && (
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--safe)', background: 'rgba(5,150,105,0.1)', padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(5,150,105,0.2)' }}>
              ⛓ CHAIN OK
            </span>
          )}
          <span style={{ fontSize: '0.65rem', fontWeight: 800, color: aiColor, background: `rgba(0,0,0,0.05)`, padding: '3px 8px', borderRadius: 6 }}>
            AI: {ev.aiAnalysis.score.toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Details (expanded) */}
      {isSelected && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid rgba(0,0,0,0.06)' }} onClick={e => e.stopPropagation()}>
          
          {/* Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14, marginBottom: 16 }}>
            {[
              { l: 'Uploaded', v: ev.uploaded },
              { l: 'Uploader', v: ev.uploader },
              { l: 'SHA-256 Hash', v: ev.hash + '...', mono: true },
              { l: 'Blockchain Block', v: `#${ev.blockchain.block}`, mono: true },
            ].map(r => (
              <div key={r.l} style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 12px' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>{r.l}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, fontFamily: r.mono ? 'var(--font-mono)' : 'inherit', color: r.mono ? 'var(--accent)' : 'var(--text-primary)' }}>{r.v}</div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 10, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Brain size={14} color={aiColor} />
              <span style={{ fontSize: '0.7rem', fontWeight: 800, color: aiColor, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Analysis — {ev.aiAnalysis.label}</span>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {ev.aiAnalysis.findings.map((f, i) => (
                <li key={i} style={{ fontSize: '0.78rem', color: 'var(--text-primary)', padding: '3px 0', display: 'flex', gap: 8 }}>
                  <span style={{ color: 'var(--accent)' }}>→</span> {f}
                </li>
              ))}
            </ul>
            {ev.aiAnalysis.action && (
              <div style={{ marginTop: 10, fontSize: '0.7rem', fontWeight: 800, color: 'var(--warn)', background: 'rgba(217,119,6,0.1)', padding: '6px 10px', borderRadius: 6, display: 'inline-block' }}>
                ⚠ Recommended: {ev.aiAnalysis.action}
              </div>
            )}
          </div>

          {/* Chain of Custody */}
          <button
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
            onClick={() => setShowCustody(!showCustody)}
          >
            <Link2 size={12} /> Chain of Custody
            {showCustody ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showCustody && (
            <div style={{ borderLeft: '2px solid var(--hud-border)', paddingLeft: 16, marginBottom: 14 }}>
              {ev.custody.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8, position: 'relative' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: c.ok ? 'var(--safe)' : 'rgba(0,0,0,0.15)', border: c.ok ? '2px solid var(--safe)' : '2px solid rgba(0,0,0,0.2)', marginTop: 3, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: c.ok ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{c.step}</div>
                    {c.time && <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 1 }}><Clock size={9} style={{ display: 'inline', marginRight: 3 }} />{c.time}</div>}
                    {!c.ok && <div style={{ fontSize: '0.65rem', color: 'var(--warn)', marginTop: 1 }}>⏳ Pending</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem' }}><Eye size={12} /> Preview</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem' }}><Download size={12} /> Download</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem' }}><Brain size={12} /> AI Analysis</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem' }}><Hash size={12} /> Chain Log</button>
            <button className="hud-btn hud-btn-ghost" style={{ padding: '6px 12px', fontSize: '0.7rem', color: 'var(--safe)' }}><Lock size={12} /> Release to Court</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvidenceVaultPage() {
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [evidence] = useState(MOCK_EVIDENCE);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleSelect = (id) => setSelected(prev => prev === id ? null : id);

  const handleVerify = async () => {
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1500));
    setVerified(true);
    setVerifying(false);
  };

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setTimeout(() => setUploading(false), 1800);
  };

  const filtered = filterType === 'all' ? evidence : evidence.filter(ev => ev.type === filterType);

  return (
    <div className="hud-panel animate-in" style={{
      position: 'absolute', top: 24, right: 24, bottom: 90, width: 600,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Header */}
      <div className="hud-panel-header">
        <div className="hud-panel-title"><Lock size={14} /> Evidence Vault — Chain of Custody</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="hud-btn hud-btn-ghost"
            style={{ padding: '4px 10px', fontSize: '0.65rem', color: verified ? 'var(--safe)' : undefined }}
            onClick={handleVerify}
            disabled={verifying}
          >
            {verifying ? <span className="spinner" /> : <><ShieldCheck size={12} /> {verified ? 'Verified ✓' : 'Verify Chain'}</>}
          </button>
          <label className="hud-btn hud-btn-primary" style={{ padding: '4px 10px', fontSize: '0.65rem', cursor: 'pointer' }}>
            {uploading ? <span className="spinner" /> : <><Upload size={12} /> Upload Evidence</>}
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ padding: '10px 18px', display: 'flex', gap: 20, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { label: 'Total Evidence', value: evidence.length, color: 'var(--text-primary)' },
          { label: 'Total Size', value: '7.1 MB', color: 'var(--text-secondary)' },
          { label: 'Chain Status', value: verified ? 'VERIFIED ✓' : 'UNVERIFIED', color: verified ? 'var(--safe)' : 'var(--warn)' },
          { label: 'Court-Ready', value: `${evidence.filter(e => e.blockchain.admissible).length}/${evidence.length}`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label}>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: s.color, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 18px', borderBottom: '1px solid var(--hud-border)', display: 'flex', gap: 6, alignItems: 'center' }}>
        <Filter size={12} style={{ color: 'var(--text-secondary)' }} />
        {['all', 'archive', 'image', 'text', 'video'].map(t => (
          <button
            key={t}
            className={`hud-btn ${filterType === t ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
            style={{ padding: '3px 10px', fontSize: '0.65rem', textTransform: 'capitalize' }}
            onClick={() => setFilterType(t)}
          >
            {t === 'all' ? 'All Types' : t}
          </button>
        ))}
      </div>

      {/* Evidence list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 18px' }}>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <FileText size={32} />
            <div className="empty-state-title">No Evidence Found</div>
            <div className="empty-state-sub">Try changing the filter or uploading new evidence.</div>
          </div>
        ) : (
          filtered.map(ev => (
            <EvidenceCard key={ev.id} ev={ev} selected={selected} onSelect={handleSelect} />
          ))
        )}
      </div>
    </div>
  );
}
