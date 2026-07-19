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
      <div className="card-header" style={{ marginBottom: 16 }}>
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Link2 size={16} /> Evidence Chain of Custody</span>
        <div className="flex gap-2" style={{ gap: 8, display: 'flex' }}>
          <label
            id="evidence-upload-btn"
            className="btn btn-ghost btn-sm"
            style={{ cursor: 'pointer' }}
          >
            {uploading ? <span className="spinner" /> : <><Upload size={14} /> Upload Evidence</>}
            <input type="file" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
          <button
            id="verify-chain-btn"
            className="btn btn-primary btn-sm"
            onClick={verifyChain}
            disabled={verifying || evidence.length === 0}
          >
            {verifying ? <span className="spinner" /> : <><ShieldCheck size={14} /> Verify Chain</>}
          </button>
        </div>
      </div>

      {error && <div className="alert-banner critical" style={{ marginBottom: 16 }}>{error}</div>}

      {verifyResult && (
        <div className={`alert-banner ${verifyResult.valid ? 'info' : 'critical'}`} style={{ marginBottom: 20 }}>
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
        <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>
      ) : evidence.length === 0 ? (
        <div className="empty-state" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileDigit size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
          <div className="empty-title" style={{ fontWeight: 600 }}>No Evidence Attached</div>
          <div className="empty-sub" style={{ fontSize: '0.8rem' }}>Upload screenshots or logs to begin the hash chain.</div>
        </div>
      ) : (
        <div className="hash-timeline" style={{ position: 'relative', paddingLeft: 24, borderLeft: '2px solid var(--border)' }}>
          {evidence.map((ev, i) => (
            <div key={ev.file_hash} style={{ position: 'relative', marginBottom: 24 }}>
              <div style={{
                position: 'absolute', left: -31, top: 4, width: 12, height: 12,
                borderRadius: '50%', background: 'var(--bg-card)', border: '2px solid var(--blue)'
              }} />
              
              <div className="card" style={{ padding: 12, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                    <FileDigit size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} />
                    {ev.file_ref || 'Uploaded File'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={12} />
                    {ev.ntp_timestamp ? new Date(ev.ntp_timestamp).toLocaleString() : 'NTP Pending'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px 16px', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>FILE HASH</div>
                  <div style={{ color: 'var(--blue)' }} title={ev.file_hash}>{truncHash(ev.file_hash)}</div>
                  
                  <div style={{ color: 'var(--text-muted)' }}>PREV HASH</div>
                  <div style={{ color: 'var(--text-secondary)' }} title={ev.prev_hash}>{truncHash(ev.prev_hash)}</div>

                  <div style={{ color: 'var(--text-muted)' }}>CHAIN HASH</div>
                  <div style={{ color: 'var(--green)', fontWeight: 600 }} title={ev.chain_hash}>{truncHash(ev.chain_hash)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
