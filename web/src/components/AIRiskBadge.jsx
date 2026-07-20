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
    <div style={{ background: 'var(--stream-dim)', border: '1px solid var(--stream-border)', borderRadius: 12, padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.8rem', color: 'var(--stream-text)' }}>
          {MODULE_ICONS[module]} {MODULE_LABELS[module] || module}
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 900, color, fontFamily: 'var(--font-mono)' }}>
          {risk_score?.toFixed(0)}%
        </div>
      </div>

      <div style={{ height: 4, background: 'var(--stream-border)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${risk_score}%`, background: color }} />
      </div>

      <div style={{ fontSize: '0.72rem', color: 'var(--stream-muted)', display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
        <span>Confidence: {Math.round((confidence || 0) * 100)}%</span>
        {flag_for_review && <span style={{ color: 'var(--warn)', fontWeight: 700 }}>Human Review Required</span>}
      </div>

      {details?.top_signals?.length > 0 && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--stream-border)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--stream-muted)', marginBottom: 8, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Top Threat Signals</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {details.top_signals.map((s, i) => (
              <span key={i} style={{ padding: '4px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 700, background: 'var(--stream-card)', color: 'var(--stream-text)', border: '1px solid var(--stream-border)' }}>
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
