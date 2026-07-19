// =============================================================
//  FIR Draft Modal — Generates BNS/IT Act drafts via AI
// =============================================================
import { useState, useEffect } from 'react';
import { FileText, Copy, X, Check, BrainCircuit } from 'lucide-react';
import api from '../services/api.js';

export default function FIRDraftModal({ incidentId, onClose }) {
  const [draft, setDraft]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    api.police.draftFIR(incidentId)
      .then(setDraft)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  const copyToClipboard = () => {
    if (!draft) return;
    const text = `Sections: ${draft.suggested_sections.join(', ')}\n\n${draft.draft_text}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2, 6, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0 }}>
        
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="var(--blue)" />
            <h2 style={{ fontSize: '1.1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI FIR Draft</h2>
          </div>
          <button className="btn btn-ghost" style={{ padding: 4 }} onClick={onClose}><X size={20} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto', flex: 1, background: 'var(--bg-base)' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 24, height: 24 }} />
              <div style={{ marginTop: 16, color: 'var(--text-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>GENERATING LEGAL DRAFT...</div>
            </div>
          ) : draft ? (
            <div>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <BrainCircuit size={40} style={{ opacity: 0.2 }} />
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>SUGGESTED SECTIONS (BNS / IT ACT)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {draft.suggested_sections.map((sec, i) => (
                      <span key={i} className="status-pill" style={{ color: 'var(--amber)', borderColor: 'var(--amber-dim)', background: 'var(--amber-dim)' }}>
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>DRAFT NARRATIVE</div>
                <textarea
                  className="form-input"
                  style={{ width: '100%', minHeight: 250, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', lineHeight: 1.6, resize: 'vertical' }}
                  defaultValue={draft.draft_text}
                  readOnly
                />
              </div>

              <div className="alert-banner info" style={{ marginTop: 16 }}>
                <strong>Officer Sign-off Required:</strong> This draft was generated via Kanad LLM for efficiency. Please verify facts, names, and BNS sections before formal registry.
              </div>
            </div>
          ) : (
            <div className="alert-banner critical">Failed to generate FIR draft.</div>
          )}
        </div>

        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--bg-surface)' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={copyToClipboard} disabled={loading || !draft}>
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy to Clipboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}
