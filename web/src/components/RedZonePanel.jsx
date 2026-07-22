// =============================================================
//  Red Zone Panel — Active Girls + AI Predictive Analysis
//  Shows: girls in red zones, alerts, AI risk model output
// =============================================================
import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, MapPin, Battery, Wifi, Radio, Phone, MessageSquare,
  Brain, TrendingUp, Activity, ShieldAlert, Bell, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { GIRL_LOCATIONS, RED_ZONES, PREDICTED_ZONES } from './LiveMap.jsx';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';

// ── ARIMA Time-Series Model (Frontend Implementation) ───────────
// Simulates an ARIMA(1,1,1) model for forecasting crime hotspots based on
// a generated 30-day historical time-series array of incidents.

// Generate realistic past 30 days of incident data for a zone
function generateTimeSeries(baseRisk) {
  const data = [];
  let current = baseRisk * 0.5; // Scale down for daily incidents
  for (let i = 0; i < 30; i++) {
    // Add natural variance, weekend spikes (every 7 days), and noise
    const noise = (Math.random() - 0.5) * 15;
    const weekendSpike = (i % 7 === 5 || i % 7 === 6) ? 20 : 0;
    current = Math.max(10, Math.min(100, current * 0.8 + 0.2 * baseRisk + noise + weekendSpike));
    data.push(Math.round(current));
  }
  return data;
}

// Simple ARIMA(1,1,0) forecast implementation
function runArimaForecast(zone, currentHour = new Date().getHours()) {
  const ts = generateTimeSeries(zone.riskScore);
  const n = ts.length;
  
  // 1. Differencing (d=1)
  const diff = [];
  for (let i = 1; i < n; i++) diff.push(ts[i] - ts[i - 1]);
  
  // 2. Auto-Regression (AR) - calculate phi
  let num = 0, den = 0;
  const meanDiff = diff.reduce((a, b) => a + b, 0) / diff.length;
  for (let i = 1; i < diff.length; i++) {
    num += (diff[i] - meanDiff) * (diff[i - 1] - meanDiff);
    den += Math.pow(diff[i - 1] - meanDiff, 2);
  }
  const phi = den === 0 ? 0 : num / den;
  
  // 3. Forecast next diff
  const lastDiff = diff[diff.length - 1];
  const nextDiff = meanDiff + phi * (lastDiff - meanDiff);
  
  // 4. Final Prediction (Integration)
  let rawPrediction = ts[n - 1] + nextDiff;
  
  // 5. Apply real-time contextual weights (Time of day + Live exposure)
  const timeRisk = (currentHour >= 20 || currentHour <= 6) ? 1.25 : (currentHour >= 17 && currentHour < 20) ? 1.1 : 1.0;
  const girlsInZone = GIRL_LOCATIONS.filter(g => g.redZoneId === zone.id).length;
  const exposureFactor = 1 + (girlsInZone * 0.05);
  
  const finalPrediction = Math.min(99, Math.round(rawPrediction * timeRisk * exposureFactor));
  const delta = finalPrediction - zone.riskScore;
  const alertLevel = finalPrediction >= 85 ? 'CRITICAL' : finalPrediction >= 70 ? 'HIGH' : 'MEDIUM';

  return {
    ts, // Historical data
    predictedScore: finalPrediction,
    delta,
    alertLevel,
    timeRisk: timeRisk.toFixed(2),
    exposureFactor: exposureFactor.toFixed(2),
    girlsInZone,
    arimaPhi: phi.toFixed(3),
    nextDiff: nextDiff.toFixed(2)
  };
}

// ── Battery color helper ─────────────────────────────────────
const battColor = (b) => b < 20 ? '#DC2626' : b < 40 ? '#D97706' : '#22C55E';

// ── Alert card for SOS girls ─────────────────────────────────
function SOSAlert({ girl }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div style={{
      background: 'rgba(220,38,38,0.08)', border: '1.5px solid rgba(220,38,38,0.5)',
      borderRadius: 12, padding: '12px 14px', marginBottom: 10,
      animation: 'pulse-border 1.5s ease infinite',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#DC2626', animation: 'pulse-dot 1s ease infinite' }} />
          <span style={{ fontWeight: 900, fontSize: '0.88rem', color: '#DC2626' }}>🚨 SOS ACTIVE — {girl.name}</span>
        </div>
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.78rem', color: '#DC2626' }}>{fmt(elapsed)}</span>
      </div>
      <div style={{ fontSize: '0.72rem', color: '#333', marginBottom: 8 }}>
        📍 {RED_ZONES.find(z => z.id === girl.redZoneId)?.name || 'Unknown Zone'} ·
        🔋 <span style={{ color: battColor(girl.battery) }}>{girl.battery}%</span> ·
        📞 {girl.phone}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, padding: '6px', borderRadius: 8, background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}>
          <Phone size={11} style={{ display: 'inline', marginRight: 4 }} /> Call Now
        </button>
        <button style={{ flex: 1, padding: '6px', borderRadius: 8, background: 'rgba(220,38,38,0.1)', color: '#DC2626', border: '1px solid rgba(220,38,38,0.3)', cursor: 'pointer', fontWeight: 800, fontSize: '0.7rem' }}>
          <Radio size={11} style={{ display: 'inline', marginRight: 4 }} /> Dispatch
        </button>
      </div>
    </div>
  );
}

// ── Girl row in red zone ────────────────────────────────────
function GirlRow({ girl }) {
  const zone = RED_ZONES.find(z => z.id === girl.redZoneId);
  const riskColor = zone?.riskScore >= 80 ? '#DC2626' : zone?.riskScore >= 65 ? '#EA580C' : '#D97706';

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 10, marginBottom: 6,
      background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(0,0,0,0.07)',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* Avatar */}
      <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${riskColor}20`, border: `2px solid ${riskColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>
        👩
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: '0.8rem', color: '#111', display: 'flex', alignItems: 'center', gap: 6 }}>
          {girl.name}
          <span style={{ fontSize: '0.58rem', fontWeight: 800, color: riskColor, background: `${riskColor}15`, padding: '1px 5px', borderRadius: 4 }}>
            {zone?.name.split('–')[0].trim()}
          </span>
        </div>
        <div style={{ fontSize: '0.65rem', color: '#666', marginTop: 2 }}>
          📞 {girl.phone} · Age {girl.age} · Updated {girl.lastUpdate}
        </div>
      </div>

      {/* Status icons */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
        <div title={`Battery ${girl.battery}%`} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.62rem', fontWeight: 800, color: battColor(girl.battery) }}>
          <Battery size={11} />{girl.battery}%
        </div>
        <div title={`Speed ${girl.speed} km/h`} style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.62rem', fontWeight: 700, color: '#666' }}>
          <Activity size={10} />{girl.speed > 0 ? `${girl.speed}km/h` : 'Still'}
        </div>
        <button style={{ padding: '3px 7px', borderRadius: 6, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', cursor: 'pointer', color: '#2563EB', fontWeight: 800, fontSize: '0.6rem' }}>
          <Phone size={9} />
        </button>
      </div>
    </div>
  );
}

// ── AI Model Zone Card ────────────────────────────────────────
function AIZoneCard({ zone, prediction }) {
  const [open, setOpen] = useState(false);
  const alertColor = prediction.alertLevel === 'CRITICAL' ? '#DC2626' : prediction.alertLevel === 'HIGH' ? '#D97706' : '#7C3AED';
  const alertBg    = prediction.alertLevel === 'CRITICAL' ? 'rgba(220,38,38,0.08)' : prediction.alertLevel === 'HIGH' ? 'rgba(217,119,6,0.08)' : 'rgba(124,58,237,0.08)';

  const chartData = prediction.ts.map((val, i) => ({ day: `Day ${i + 1}`, value: val }));
  chartData.push({ day: 'Predicted', value: prediction.predictedScore });

  return (
    <div style={{ background: alertBg, border: `1px solid ${alertColor}30`, borderRadius: 10, marginBottom: 8, overflow: 'hidden' }}>
      <div style={{ padding: '10px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.78rem', color: '#111', marginBottom: 2 }}>{zone.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.66rem' }}>
            <span style={{ color: '#888' }}>Current: <strong style={{ color: '#111' }}>{zone.riskScore}</strong></span>
            <span style={{ color: '#888' }}>→</span>
            <span style={{ color: alertColor, fontWeight: 900 }}>Predicted: {prediction.predictedScore}</span>
            {prediction.delta > 0 && <span style={{ color: '#DC2626', fontWeight: 800 }}>▲{prediction.delta}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 800, color: alertColor, background: `${alertColor}15`, padding: '2px 7px', borderRadius: 4 }}>
            {prediction.alertLevel}
          </span>
          {open ? <ChevronUp size={12} color="#888" /> : <ChevronDown size={12} color="#888" />}
        </div>
      </div>
      {open && (
        <div style={{ padding: '0 12px 12px', borderTop: `1px solid ${alertColor}15` }}>
          <div style={{ height: 70, marginTop: 12, marginBottom: 8 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={`grad-${zone.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={alertColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={alertColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip 
                  contentStyle={{ background: 'var(--hud-panel)', border: '1px solid var(--hud-border)', borderRadius: 8, fontSize: '0.7rem', padding: '4px 8px' }}
                  itemStyle={{ color: alertColor, fontWeight: 700 }}
                  labelStyle={{ color: 'var(--text-secondary)', marginBottom: 2 }}
                />
                <Area type="monotone" dataKey="value" stroke={alertColor} strokeWidth={2} fill={`url(#grad-${zone.id})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10 }}>
            {[
              { l: 'ARIMA AR(φ)', v: prediction.arimaPhi },
              { l: 'ARIMA Diff(t+1)', v: prediction.nextDiff },
              { l: 'Exposure Factor', v: `×${prediction.exposureFactor}` },
              { l: 'Girls in Zone', v: prediction.girlsInZone },
              { l: 'Historical (n=30)', v: 'Processed' },
              { l: 'Crime Type', v: zone.crimeType },
            ].map(d => (
              <div key={d.l} style={{ background: 'rgba(255,255,255,0.5)', borderRadius: 6, padding: '6px 8px' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{d.l}</div>
                <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#111', fontFamily: 'monospace' }}>{d.v}</div>
              </div>
            ))}
          </div>
          {prediction.alertLevel === 'CRITICAL' && (
            <div style={{ marginTop: 10, background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.25)', borderRadius: 7, padding: '8px 10px', fontSize: '0.72rem', fontWeight: 700, color: '#DC2626' }}>
              ⚠ Recommendation: Increase patrol frequency + deploy female officer to zone immediately
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────
export default function RedZonePanel({ onClose }) {
  const [tab, setTab] = useState('redzone');
  const girlsInZone   = GIRL_LOCATIONS.filter(g => g.inRedZone);
  const girlsSafe     = GIRL_LOCATIONS.filter(g => !g.inRedZone);
  const sosGirls      = GIRL_LOCATIONS.filter(g => g.sos);
  const lowBattery    = girlsInZone.filter(g => g.battery < 25);

  // Run ARIMA model for each zone
  const predictions = RED_ZONES.map(z => ({ zone: z, prediction: runArimaForecast(z) }));
  const criticalPreds = predictions.filter(p => p.prediction.alertLevel === 'CRITICAL');

  const [currentHour] = useState(new Date().getHours());
  const timeLabel = currentHour >= 20 || currentHour <= 6 ? '🌙 Night (High Risk)' : currentHour >= 17 ? '🌆 Evening (Elevated)' : '☀ Day';

  return (
    <div className="hud-panel animate-in" style={{
      position: 'relative',
      width: 440, maxHeight: 'calc(100vh - 200px)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div className="hud-panel-header" style={{ borderBottom: '1px solid var(--hud-border)', display: 'flex', flexWrap: 'wrap', gap: '8px 4px', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <ShieldAlert size={14} color="#DC2626" style={{ flexShrink: 0 }} />
          <span style={{ fontWeight: 900, fontSize: '0.75rem', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>Red Zone Monitor</span>
          {sosGirls.length > 0 && (
            <span style={{ background: '#DC2626', color: '#fff', fontSize: '0.55rem', fontWeight: 900, padding: '2px 6px', borderRadius: 10, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {sosGirls.length} SOS
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {[{ v: 'redzone', l: 'Tracking' }, { v: 'ai', l: '🤖 AI Model' }].map(t => (
            <button
              key={t.v}
              onClick={() => setTab(t.v)}
              style={{ padding: '4px 8px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.6rem', fontWeight: 800, background: tab === t.v ? 'rgba(37,99,235,0.12)' : 'transparent', color: tab === t.v ? '#2563EB' : '#888', transition: 'all 0.15s', whiteSpace: 'nowrap' }}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--hud-border)', background: 'rgba(255,255,255,0.3)' }}>
        {[
          { l: 'In Red Zone', v: girlsInZone.length, c: '#DC2626' },
          { l: 'SOS Active', v: sosGirls.length, c: '#DC2626' },
          { l: 'Low Battery', v: lowBattery.length, c: '#D97706' },
          { l: 'Safe', v: girlsSafe.length, c: '#22C55E' },
        ].map((s, i) => (
          <div key={s.l} style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--hud-border)' : 'none' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 900, fontFamily: 'monospace', color: s.c, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: '0.55rem', fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

        {/* ── TRACKING TAB ── */}
        {tab === 'redzone' && (
          <>
            {/* SOS Alerts */}
            {sosGirls.length > 0 && (
              <section style={{ marginBottom: 14 }}>
                {sosGirls.map(g => <SOSAlert key={g.id} girl={g} />)}
              </section>
            )}

            {/* Low battery warning */}
            {lowBattery.length > 0 && (
              <div style={{ background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: '0.72rem', fontWeight: 700, color: '#D97706' }}>
                🔋 {lowBattery.length} girl{lowBattery.length > 1 ? 's' : ''} in red zone with battery below 25% —
                <span style={{ color: '#111', fontWeight: 600, marginLeft: 4 }}>{lowBattery.map(g => g.name).join(', ')}</span>
              </div>
            )}

            {/* Girls in red zone */}
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
              <AlertTriangle size={11} /> Girls in Red Zone ({girlsInZone.length})
            </div>
            {girlsInZone.filter(g => !g.sos).map(g => <GirlRow key={g.id} girl={g} />)}

            {/* Girls safe */}
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#22C55E', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '12px 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
              ✓ Girls Outside Red Zones ({girlsSafe.length})
            </div>
            {girlsSafe.map(g => (
              <div key={g.id} style={{ padding: '8px 12px', borderRadius: 9, marginBottom: 4, background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '2px solid #22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>👩</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#111' }}>{g.name}</div>
                  <div style={{ fontSize: '0.62rem', color: '#888' }}>Updated {g.lastUpdate} · 🔋 {g.battery}%</div>
                </div>
                <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#22C55E' }}>✓ SAFE</span>
              </div>
            ))}
          </>
        )}

        {/* ── AI MODEL TAB ── */}
        {tab === 'ai' && (
          <>
            {/* Model info */}
            <div style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Brain size={14} color="#7C3AED" />
                <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#7C3AED' }}>ARIMA TIME-SERIES FORECASTER v3.0</span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#555', lineHeight: 1.5 }}>
                Predicts zone risk using an <strong>ARIMA(1,1,0)</strong> autoregressive statistical model on a generated <strong>30-day historical time-series</strong> dataset.
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#888' }}>
                  🕐 Current: <strong style={{ color: '#111' }}>{timeLabel}</strong>
                </div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#888' }}>
                  ⚠ Critical zones: <strong style={{ color: '#DC2626' }}>{criticalPreds.length}</strong>
                </div>
              </div>
            </div>

            {/* Model Factor Legend */}
            <div style={{ background: 'rgba(0,0,0,0.03)', borderRadius: 8, padding: '8px 10px', marginBottom: 12, fontSize: '0.65rem', color: '#555', lineHeight: 1.7 }}>
              <strong style={{ color: '#111' }}>ARIMA Logic (p=1, d=1, q=0):</strong><br />
              <code style={{ fontFamily: 'monospace', color: '#7C3AED', fontSize: '0.7rem' }}>
                Ŷ(t+1) = Y(t) + μ + φ * [Y(t) - Y(t-1)]
              </code>
            </div>

            {/* Zone predictions */}
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>
              Zone Risk Predictions (Next 2 Hours)
            </div>
            {predictions
              .sort((a, b) => b.prediction.predictedScore - a.prediction.predictedScore)
              .map(({ zone, prediction }) => (
                <AIZoneCard key={zone.id} zone={zone} prediction={prediction} />
              ))
            }

            {/* Emerging zones */}
            <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#7C3AED', textTransform: 'uppercase', letterSpacing: '0.12em', margin: '12px 0 8px' }}>
              Emerging Zones (Not Yet Designated)
            </div>
            {PREDICTED_ZONES.map(pz => (
              <div key={pz.id} style={{ padding: '9px 12px', borderRadius: 9, marginBottom: 6, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#111' }}>{pz.name}</div>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: '0.78rem', color: '#7C3AED' }}>{pz.predictedRisk}/100</span>
                </div>
                <div style={{ display: 'flex', gap: 10, fontSize: '0.64rem', color: '#888' }}>
                  <span>Crime: <strong style={{ color: '#111' }}>{pz.crimeTypePredicted}</strong></span>
                  <span>Confidence: <strong style={{ color: '#22C55E' }}>{pz.confidence}%</strong></span>
                </div>
                <div style={{ marginTop: 6, height: 4, background: 'rgba(0,0,0,0.07)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pz.predictedRisk}%`, background: '#7C3AED', borderRadius: 2 }} />
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
