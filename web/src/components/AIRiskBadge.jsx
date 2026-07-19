// =============================================================
//  AI Risk Badge — score + confidence + top signals
// =============================================================
import { ShieldAlert, Fingerprint, Eye, Image, UserCheck, MessageSquareWarning } from 'lucide-react';

const MODULE_ICONS = {
  phishing:       <ShieldAlert size={14} />,
  fake_profile:   <UserCheck size={14} />,
  harassment_nlp: <MessageSquareWarning size={14} />,
  deepfake:       <Image size={14} />,
  social_scan:    <Eye size={14} />,
  facial_match:   <Fingerprint size={14} />,
};

const MODULE_LABELS = {
  phishing:       'Phishing URL',
  fake_profile:   'Fake Profile',
  harassment_nlp: 'Harassment',
  deepfake:       'Deepfake',
  social_scan:    'Social Scan',
  facial_match:   'Face Match',
};

export default function AIRiskBadge({ scoreData, expanded = false }) {
  const { module, risk_score, confidence, flag_for_review, details } = scoreData;
  const tier = risk_score >= 70 ? 'high' : risk_score >= 40 ? 'medium' : 'low';
  const color = tier === 'high' ? 'var(--red)' : tier === 'medium' ? 'var(--amber)' : 'var(--green)';

  if (!expanded) {
    return (
      <div
        className="status-pill"
        style={{ color, borderColor: color, background: `rgba(${color === 'var(--red)' ? '239, 68, 68' : '245, 158, 11'}, 0.1)` }}
        title={`${MODULE_LABELS[module] || module}: ${risk_score}% risk`}
      >
        {MODULE_ICONS[module]} <span style={{ marginLeft: 4 }}>{risk_score?.toFixed(0)}%</span>
      </div>
    );
  }

  return (
    <div className="card" style={{ background: 'var(--bg-surface)', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600, fontSize: '0.85rem' }}>
          {MODULE_ICONS[module]} {MODULE_LABELS[module] || module}
        </div>
        <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>
          {risk_score?.toFixed(0)}%
        </div>
      </div>

      <div style={{ height: 4, background: 'var(--bg-base)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${risk_score}%`, background: color }} />
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Confidence: {Math.round((confidence || 0) * 100)}%</span>
        {flag_for_review && <span style={{ color: 'var(--amber)', fontWeight: 600 }}>Human Review Required</span>}
      </div>

      {details?.top_signals?.length > 0 && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>TOP SIGNALS</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {details.top_signals.map((s, i) => (
              <span key={i} className="status-pill" style={{ color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
