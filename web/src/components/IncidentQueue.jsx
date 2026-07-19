// =============================================================
//  Incident Queue — Tabular List + Detail Panel
// =============================================================
import { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, XCircle, FileText, ChevronRight, Filter } from 'lucide-react';
import api from '../services/api.js';
import AIRiskBadge from './AIRiskBadge.jsx';
import EvidenceViewer from './EvidenceViewer.jsx';
import CaseLinksPanel from './CaseLinksPanel.jsx';
import FIRDraftModal from './FIRDraftModal.jsx';

export default function IncidentQueue({ onSelectIncident }) {
  const [incidents, setIncidents]   = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(true);
  const [page, setPage]             = useState(1);
  const [activeTab, setActiveTab]   = useState('open'); // open | resolved
  const [selected, setSelected]     = useState(null);
  
  // Detail panel state
  const [detailData, setDetailData]   = useState(null);
  const [detailTab, setDetailTab]     = useState('ai');
  const [draftingFir, setDraftingFir] = useState(false);

  const fetchIncidents = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.police.listIncidents({
        status: activeTab === 'open' ? 'open,under_review' : 'resolved,closed',
        page: p,
        page_size: 15,
      });
      setIncidents(res.incidents || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error('Failed to fetch incidents', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents(1);
    setPage(1);
    setSelected(null);
    setDetailData(null);
    const interval = setInterval(() => fetchIncidents(page), 10000); // 10s poll
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleSelect = async (inc) => {
    setSelected(inc);
    if (onSelectIncident) onSelectIncident(inc);
    try {
      const res = await api.police.getIncident(inc.id);
      setDetailData(res);
      setDetailTab('ai');
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (status) => {
    if (!selected) return;
    try {
      await api.police.updateStatus(selected.id, status);
      await fetchIncidents();
      setSelected(null);
      setDetailData(null);
    } catch (e) {
      alert('Update failed: ' + e.message);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 16, alignItems: 'start' }}>
      
      {/* ── QUEUE LIST ────────────────────────────────────── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="card-header" style={{ padding: '12px 16px', margin: 0, background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <button
              id="filter-open"
              className={`tab ${activeTab === 'open' ? 'active' : ''}`}
              style={{ padding: '8px 0', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('open')}
            >
              Open/Review ({total})
            </button>
            <button
              id="filter-resolved"
              className={`tab ${activeTab === 'resolved' ? 'active' : ''}`}
              style={{ padding: '8px 0', fontSize: '0.8rem' }}
              onClick={() => setActiveTab('resolved')}
            >
              Closed
            </button>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => fetchIncidents()}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 100 }}>INCIDENT ID</th>
                <th style={{ width: 100 }}>TIME</th>
                <th style={{ width: 120 }}>CATEGORY</th>
                <th style={{ width: 80 }}>SEVERITY</th>
                <th>DESCRIPTION</th>
                <th style={{ width: 100 }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No incidents found.
                  </td>
                </tr>
              ) : (
                incidents.map(inc => (
                  <tr key={inc.id} onClick={() => handleSelect(inc)} className={selected?.id === inc.id ? 'selected' : ''}>
                    <td className="mono-id">{inc.id.split('-')[0]}...</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{new Date(inc.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td style={{ textTransform: 'capitalize' }}>{inc.category?.replace(/_/g, ' ')}</td>
                    <td>
                      <div className={`severity-indicator sev-${inc.severity >= 70 ? 'high' : inc.severity >= 40 ? 'medium' : 'low'}`}>
                        <div className="sev-dot" />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{inc.severity}</span>
                      </div>
                    </td>
                    <td style={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.description}
                    </td>
                    <td><span className={`status-pill status-${inc.status}`}>{inc.status.replace(/_/g, ' ')}</span></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {total > 15 && (
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', background: 'var(--bg-surface)' }}>
            <button className="btn btn-outline btn-sm" disabled={page === 1} onClick={() => { setPage(page-1); fetchIncidents(page-1); }}>Prev</button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page}</span>
            <button className="btn btn-outline btn-sm" disabled={incidents.length < 15} onClick={() => { setPage(page+1); fetchIncidents(page+1); }}>Next</button>
          </div>
        )}
      </div>

      {/* ── DETAIL PANEL ──────────────────────────────────── */}
      {selected && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '16px', margin: 0, background: 'var(--bg-surface)' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>INCIDENT DETAILS</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{selected.id}</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { setSelected(null); setDetailData(null); }}><XCircle size={16} /></button>
          </div>

          <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <span className={`status-pill status-${selected.status}`}>{selected.status.replace(/_/g, ' ')}</span>
              <span className="status-pill">{selected.category?.replace(/_/g, ' ')}</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 12 }}>{selected.description}</p>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Reported: {new Date(selected.created_at).toLocaleString()}</span>
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: 8, padding: 12, borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
            {selected.status === 'open' && (
              <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('under_review')} style={{ flex: 1, borderColor: 'var(--amber)', color: 'var(--amber)' }}>
                Mark Under Review
              </button>
            )}
            {(selected.status === 'open' || selected.status === 'under_review') && (
              <button className="btn btn-outline btn-sm" onClick={() => handleStatusChange('resolved')} style={{ flex: 1, borderColor: 'var(--green)', color: 'var(--green)' }}>
                Resolve
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={() => setDraftingFir(true)} style={{ flex: 1 }}>
              <FileText size={14} /> Draft FIR
            </button>
          </div>

          {/* Details Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }}>
            {['ai', 'evidence', 'links'].map((tab) => (
              <button
                key={tab}
                className={`tab ${detailTab === tab ? 'active' : ''}`}
                style={{ flex: 1, padding: '8px 0', fontSize: '0.75rem', justifyContent: 'center' }}
                onClick={() => setDetailTab(tab)}
              >
                {tab === 'ai' ? 'AI Analysis' : tab === 'evidence' ? 'Evidence' : 'Case Links'}
              </button>
            ))}
          </div>

          <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            {!detailData ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}><span className="spinner" /></div>
            ) : detailTab === 'ai' ? (
              <div>
                {detailData.ai_scores?.length > 0 ? (
                  detailData.ai_scores.map((score, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <AIRiskBadge scoreData={score} expanded />
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>No AI analysis available for this incident.</div>
                )}
              </div>
            ) : detailTab === 'evidence' ? (
              <EvidenceViewer incidentId={selected.id} />
            ) : detailTab === 'links' ? (
              <CaseLinksPanel incidentId={selected.id} />
            ) : null}
          </div>
        </div>
      )}

      {/* FIR Modal */}
      {draftingFir && selected && (
        <FIRDraftModal
          incidentId={selected.id}
          onClose={() => setDraftingFir(false)}
        />
      )}
    </div>
  );
}
