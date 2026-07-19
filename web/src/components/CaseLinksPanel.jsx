// =============================================================
//  Case Links Panel — repeat offender entity resolution
// =============================================================
import { useState, useEffect } from 'react';
import { Network, Link2, AlertTriangle } from 'lucide-react';
import api from '../services/api.js';

export default function CaseLinksPanel({ incidentId }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!incidentId) return;
    setLoading(true);
    api.police.getCaseLinks(incidentId)
      .then(res => setLinks(res.linked_cases || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [incidentId]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}><span className="spinner" /></div>;

  if (links.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
        <Network size={32} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
        <div className="empty-title" style={{ fontWeight: 600 }}>No Links Found</div>
        <div className="empty-sub" style={{ fontSize: '0.8rem' }}>Entity resolution engine found no matching phones, IPs, or faces across the database.</div>
      </div>
    );
  }

  return (
    <div>
      <div className="card-header" style={{ marginBottom: 16 }}>
        <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Network size={16} /> Related Case Links</span>
        <span className="status-pill" style={{ color: 'var(--amber)', borderColor: 'var(--amber)' }}>{links.length} Matches</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {links.map((link, i) => (
          <div key={i} className="card" style={{ padding: 12, border: '1px solid var(--border-strong)', background: 'var(--bg-surface)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Link2 size={16} color="var(--blue)" />
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{link.link_type.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: link.confidence > 0.8 ? 'var(--red)' : 'var(--amber)' }}>
                {Math.round(link.confidence * 100)}% Match
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '4px 16px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', paddingLeft: 24 }}>
              <div style={{ color: 'var(--text-muted)' }}>CASE ID</div>
              <div style={{ color: 'var(--blue)', cursor: 'pointer', textDecoration: 'underline' }}>{link.linked_incident_id}</div>
              
              <div style={{ color: 'var(--text-muted)' }}>STATUS</div>
              <div style={{ color: link.status === 'open' ? 'var(--red)' : 'var(--green)' }}>{link.status.toUpperCase()}</div>
              
              <div style={{ color: 'var(--text-muted)' }}>CATEGORY</div>
              <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{link.category.replace(/_/g, ' ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
