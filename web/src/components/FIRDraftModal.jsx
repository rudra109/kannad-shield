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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(8, 13, 31, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', background: 'var(--stream-card)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--stream-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stream-dim)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="var(--accent)" />
            <h2 style={{ fontSize: '1.1rem', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--stream-text)', fontWeight: 800 }}>AI FIR Draft</h2>
          </div>
          <button className="btn btn-ghost-stream" style={{ padding: 6, borderRadius: '50%' }} onClick={onClose}><X size={18} /></button>
        </div>

        <div style={{ padding: 24, overflowY: 'auto', flex: 1, background: 'var(--stream-card)' }}>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center' }}>
              <span className="spinner" style={{ width: 24, height: 24, borderColor: 'var(--stream-muted)' }} />
              <div style={{ marginTop: 16, color: 'var(--stream-muted)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>GENERATING LEGAL DRAFT...</div>
            </div>
          ) : draft ? (
            <div>
              <div style={{ display: 'flex', gap: 14, marginBottom: 24 }}>
                <BrainCircuit size={40} style={{ opacity: 0.15, color: 'var(--accent)' }} />
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--stream-muted)', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Suggested Sections (BNS / IT Act)</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {draft.suggested_sections.map((sec, i) => (
                      <span key={i} style={{ padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, background: 'var(--warn-dim)', color: 'var(--warn)', border: '1px solid var(--warn-border)' }}>
                        {sec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ position: 'relative' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--stream-muted)', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Draft Narrative</div>
                <textarea
                  className="form-input"
                  style={{ width: '100%', minHeight: 280, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', lineHeight: 1.6, resize: 'vertical' }}
                  defaultValue={draft.draft_text}
                  readOnly
                />
              </div>

              <div className="alert alert-info" style={{ marginTop: 20 }}>
                <strong>Officer Sign-off Required:</strong> This draft was generated via Kanad LLM for efficiency. Please verify facts, names, and BNS sections before formal registry.
              </div>
            </div>
          ) : (
            <div className="alert alert-error">Failed to generate FIR draft.</div>
          )}
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--stream-border)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'var(--stream-dim)' }}>
          <button className="btn btn-ghost-stream" onClick={onClose}>Cancel</button>
          <button className="btn btn-accent" onClick={copyToClipboard} disabled={loading || !draft}>
            {copied ? <><Check size={16} /> Copied</> : <><Copy size={16} /> Copy to Clipboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}
