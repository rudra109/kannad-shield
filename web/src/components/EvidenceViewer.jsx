// =============================================================
//  Evidence Viewer — hash-chain display + verify endpoint
// =============================================================
import { useState, useEffect } from 'react';
import { Link2, Upload, ShieldCheck, CheckCircle2, AlertOctagon, FileDigit, Clock } from 'lucide-react';
import api from '../services/api.js';

export default function EvidenceViewer({ incidentId }) {
  const [evidence, setEvidence]   = useState([]);
  const [verifyResult, setVerify] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    api.evidence.list(incidentId)
      .then(setEvidence)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [incidentId]);

  async function verifyChain() {
    setVerifying(true);
    try {
      const res = await api.evidence.verify(incidentId);
      setVerify(res);
    } catch (e) {
      setError(e.message);
    } finally {
      setVerifying(false);
    }
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await api.evidence.upload(incidentId, file);
      setEvidence((prev) => [...prev, { ...res, ntp_timestamp: new Date().toISOString() }]);
      setVerify(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  const truncHash = (h) => h ? `${h.slice(0, 8)}…${h.slice(-8)}` : '—';

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--stream-muted)', textTransform: 'uppercase', letterSpacing: '0.14em', display: 'flex', alignItems: 'center', gap: 6 }}><Link2 size={14} /> Evidence Chain of Custody</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <label
            id="evidence-upload-btn"
            className="btn btn-ghost-stream btn-sm"
            style={{ cursor: 'pointer' }}
          >
            {uploading ? <span className="spinner" /> : <><Upload size={14} /> Upload Evidence</>}
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
          <button
            id="verify-chain-btn"
            className="btn btn-accent btn-sm"
            onClick={verifyChain}
            disabled={verifying || evidence.length === 0}
          >
            {verifying ? <span className="spinner" /> : <><ShieldCheck size={14} /> Verify Chain</>}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {verifyResult && (
        <div className={`alert ${verifyResult.valid ? 'alert-success' : 'alert-error'}`} style={{ marginBottom: 20 }}>
          {verifyResult.valid ? <CheckCircle2 size={16} /> : <AlertOctagon size={16} />}
          <div>
            <strong>{verifyResult.valid ? 'CHAIN VERIFIED' : 'CHAIN COMPROMISED'}</strong>
            <div style={{ fontSize: '0.75rem', marginTop: 4 }}>
              Checked {verifyResult.records_checked} records. 
              {verifyResult.valid ? ' All hashes match NTP timestamps.' : ' Cryptographic mismatch detected.'}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" style={{ borderColor: 'var(--stream-muted)' }} /></div>
      ) : evidence.length === 0 ? (
        <div className="empty-state">
          <FileDigit size={32} />
          <div className="empty-state-title">No Evidence Attached</div>
          <div className="empty-state-sub">Upload screenshots or logs to begin the hash chain.</div>
        </div>
      ) : (
        <div className="hash-timeline" style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--stream-border)' }}>
          {evidence.map((ev, i) => (
            <div key={ev.file_hash} style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{
                position: 'absolute', left: -31, top: 4, width: 12, height: 12,
                borderRadius: '50%', background: 'white', border: '2px solid var(--accent)'
              }} />
              
              <div style={{ padding: 12, border: '1px solid var(--stream-border)', borderRadius: 8, background: 'var(--stream-dim)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--stream-text)' }}>
                    <FileDigit size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                    {ev.file_ref || 'Uploaded File'}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--stream-muted)', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
                    <Clock size={12} />
                    {ev.ntp_timestamp ? new Date(ev.ntp_timestamp).toLocaleString() : 'NTP Pending'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 16px', fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ color: 'var(--stream-muted)', fontWeight: 600 }}>FILE HASH</div>
                  <div style={{ color: 'var(--accent)' }} title={ev.file_hash}>{truncHash(ev.file_hash)}</div>
                  
                  <div style={{ color: 'var(--stream-muted)', fontWeight: 600 }}>PREV HASH</div>
                  <div style={{ color: 'var(--stream-text)' }} title={ev.prev_hash}>{truncHash(ev.prev_hash)}</div>

                  <div style={{ color: 'var(--stream-muted)', fontWeight: 600 }}>CHAIN HASH</div>
                  <div style={{ color: 'var(--safe)', fontWeight: 700 }} title={ev.chain_hash}>{truncHash(ev.chain_hash)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
