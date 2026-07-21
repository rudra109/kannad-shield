// =============================================================
//  Incident Queue — HUD Panel Design
// =============================================================
import { useState, useEffect } from 'react';
import { RefreshCw, XCircle, FileText, ChevronRight, Filter, Cpu, CheckCircle2 } from 'lucide-react';
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

  function getSevClass(score) {
    return score >= 70 ? 'critical' : score >= 40 ? 'warn' : 'safe';
  }

  function timeSince(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 400px' : '1fr', gap: 0, alignItems: 'start', height: '100%', overflow: 'hidden' }}>
      
      {/* ── QUEUE LIST ────────────────────────────────────── */}
      <div style={{ padding: 0, overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--hud-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`hud-btn ${activeTab === 'open' ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '0.65rem' }}
              onClick={() => setActiveTab('open')}
            >
              Active ({activeTab === 'open' ? total : '?'})
            </button>
            <button
              className={`hud-btn ${activeTab === 'resolved' ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
              style={{ padding: '4px 10px', fontSize: '0.65rem' }}
              onClick={() => setActiveTab('resolved')}
            >
              Archive
            </button>
          </div>
          <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 10px', fontSize: '0.65rem' }} onClick={() => fetchIncidents()}>
            <RefreshCw size={12} className={loading ? 'spin' : ''} />
          </button>
        </div>

        <div className="case-strip" style={{ flex: 1, overflowY: 'auto' }}>
          {incidents.length === 0 ? (
            <div className="empty-state">
              <Filter size={32} />
              <div className="empty-state-title">No Case Files</div>
            </div>
          ) : (
            <>
              {/* Group incidents by priority */}
              {['critical', 'warn', 'safe'].map(priorityLevel => {
                const grouped = incidents.filter(inc => getSevClass(inc.severity) === priorityLevel);
                if (grouped.length === 0) return null;
                
                const groupTitle = priorityLevel === 'critical' ? '🔴 CRITICAL INCIDENTS (Respond Immediately)' : 
                                   priorityLevel === 'warn' ? '🟠 HIGH PRIORITY INCIDENTS (Within 15 min)' : 
                                   '🟢 STANDARD PRIORITY';
                                   
                return (
                  <div key={priorityLevel} style={{ marginBottom: 16 }}>
                    <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.02)', borderBottom: '1px solid var(--hud-border)', borderTop: '1px solid var(--hud-border)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                      {groupTitle}
                    </div>
                    {grouped.map(inc => {
                      const sc = getSevClass(inc.severity);
                      
                      // Mock additional fields if missing
                      const location = inc.location || 'Thaltej, Near Express Avenue';
                      const caller = inc.caller_name || 'Anjali M. (Age 24)';
                      const signal = inc.signal || 'Strong';
                      const battery = inc.battery || '87%';
                      const assigned = inc.assigned_officer || null;
                      const eta = inc.eta || '3 min 45 sec';

                      return (
                        <div
                          key={inc.id}
                          className={`case-file ${selected?.id === inc.id ? 'selected' : ''}`}
                          style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--hud-border)' }}
                          onClick={() => handleSelect(inc)}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <div className="case-num">
                              <div className="case-num-id">🆔 #{inc.id || 'SOS-004521'}</div>
                            </div>
                            <div className="case-num-time">[{timeSince(inc.created_at)}]</div>
                          </div>
                          
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                            <div style={{ marginBottom: 4 }}>📍 <b>Location:</b> {location}</div>
                            <div style={{ marginBottom: 4 }}>👤 <b>Caller:</b> {caller}</div>
                            <div style={{ marginBottom: 4 }}>🚨 <b>Threat:</b> {(inc.category || '').replace(/_/g, ' ')} - {inc.description || 'Physical assault + cyber stalking'}</div>
                            <div style={{ marginBottom: 4 }}>📱 <b>Signal:</b> {signal} | <b>Battery:</b> {battery}%</div>
                            {assigned ? (
                              <div style={{ marginBottom: 4 }}>👮 <b>Assigned:</b> {assigned}</div>
                            ) : (
                              <div style={{ marginBottom: 4, color: 'var(--warn)' }}>👮 <b>Assigned:</b> Unassigned</div>
                            )}
                            {assigned && <div style={{ marginBottom: 4 }}>✔️ <b>Status:</b> En-route (ETA: {eta})</div>}
                          </div>

                          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            {assigned ? (
                              <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>Track Officer</button>
                            ) : (
                              <button className="hud-btn hud-btn-primary" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>Assign Now</button>
                            )}
                            <button className="hud-btn hud-btn-ghost" style={{ padding: '4px 8px', fontSize: '0.65rem' }}>View Full Report</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}
        </div>
        
        {total > 15 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--hud-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button className="hud-btn hud-btn-ghost" disabled={page === 1} onClick={() => { setPage(page-1); fetchIncidents(page-1); }}>Prev</button>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Page {page}</span>
            <button className="hud-btn hud-btn-ghost" disabled={incidents.length < 15} onClick={() => { setPage(page+1); fetchIncidents(page+1); }}>Next</button>
          </div>
        )}
      </div>

      {/* ── DETAIL PANEL ──────────────────────────────────── */}
      {selected && (
        <div style={{ borderLeft: '1px solid var(--hud-border)', height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.2)' }}>
          
          <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--hud-border)' }}>
            <div>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: 2 }}>Case File</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{selected.id}</div>
            </div>
            <button className="hud-btn hud-btn-ghost" style={{ padding: 4 }} onClick={() => { setSelected(null); setDetailData(null); }}><XCircle size={16} /></button>
          </div>

          <div style={{ padding: '20px', borderBottom: '1px solid var(--hud-border)' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <span className={`status-stamp ${(selected.status || '').replace(/\s/g, '_')}`}>
                {(selected.status || '').replace(/_/g, ' ')}
              </span>
              <span className="status-stamp" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>
                {(selected.category || '').replace(/_/g, ' ')}
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6, marginBottom: 16 }}>
              {selected.description}
            </p>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              Filed: {new Date(selected.created_at).toLocaleString()}
            </div>
          </div>

          {/* Action Bar */}
          <div style={{ display: 'flex', gap: 8, padding: '12px 20px', borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.03)' }}>
            {selected.status === 'open' && (
              <button className="hud-btn hud-btn-ghost" onClick={() => handleStatusChange('under_review')} style={{ flex: 1, borderColor: 'rgba(245, 158, 11, 0.4)', color: 'var(--warn)' }}>
                Review
              </button>
            )}
            {(selected.status === 'open' || selected.status === 'under_review') && (
              <button className="hud-btn hud-btn-ghost" onClick={() => handleStatusChange('resolved')} style={{ flex: 1, borderColor: 'rgba(16, 185, 129, 0.4)', color: 'var(--safe)' }}>
                Resolve
              </button>
            )}
            <button className="hud-btn hud-btn-primary" onClick={() => setDraftingFir(true)} style={{ flex: 1 }}>
              <FileText size={14} /> Draft FIR
            </button>
          </div>

          {/* Details Tabs */}
          <div style={{ padding: '12px 20px 0', borderBottom: '1px solid var(--hud-border)', display: 'flex', gap: 8 }}>
            {['ai', 'evidence', 'links'].map((tab) => (
              <button
                key={tab}
                className={`hud-btn ${detailTab === tab ? 'hud-btn-primary' : 'hud-btn-ghost'}`}
                style={{ flex: 1, padding: '8px 0', borderRadius: '8px 8px 0 0', borderBottom: 'none' }}
                onClick={() => setDetailTab(tab)}
              >
                {tab === 'ai' ? 'Analysis' : tab === 'evidence' ? 'Evidence' : 'Links'}
              </button>
            ))}
          </div>

          <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
            {!detailData ? (
              <div className="empty-state"><span className="spinner" /></div>
            ) : detailTab === 'ai' ? (
              <div>
                {detailData.ai_scores?.length > 0 ? (
                  detailData.ai_scores.map((score, i) => (
                    <div key={i} style={{ marginBottom: 16 }}>
                      <AIRiskBadge scoreData={score} expanded />
                    </div>
                  ))
                ) : (
                  <div className="empty-state-sub">No AI analysis available for this incident.</div>
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
