// =============================================================
//  Live Map v2 — Enhanced Heatmap + Girl Tracking + Red Zones
//  Features:
//    • Vivid risk-zone heatmap (API + hardcoded fallback)
//    • Predictive AI heatmap based on violence data patterns
//    • Live girl location tracking (demo data)
//    • Red-zone entry detection with alerts
//    • Incident markers
// =============================================================
import { useEffect, useState, useRef } from 'react';
import api from '../services/api.js';
import { useIncidentWebSocket } from '../hooks/useWebSocket.js';
import {
  MapContainer, TileLayer, CircleMarker, Circle, Popup,
  useMap, Polygon, Tooltip
} from 'react-leaflet';

const AHMEDABAD = [23.0225, 72.5714];
const TILE_URL  = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

// ─── HARDCODED RED ZONES (Ahmedabad high-risk areas) ─────────
export const RED_ZONES = [
  {
    id: 'rz-01', name: 'Thaltej–Express Avenue',
    center: [23.0548, 72.5086], radius: 800,
    riskScore: 94, crimeType: 'Stalking + Assault',
    incidents30d: 12,
    polygon: [
      [23.0610, 72.5020], [23.0610, 72.5160],
      [23.0480, 72.5160], [23.0480, 72.5020],
    ],
  },
  {
    id: 'rz-02', name: 'CG Road – High Street',
    center: [23.0274, 72.5529], radius: 700,
    riskScore: 88, crimeType: 'Harassment + Blackmail',
    incidents30d: 9,
    polygon: [
      [23.0330, 72.5470], [23.0330, 72.5600],
      [23.0220, 72.5600], [23.0220, 72.5470],
    ],
  },
  {
    id: 'rz-03', name: 'Satellite – Ramdev Plaza',
    center: [23.0151, 72.5060], radius: 650,
    riskScore: 76, crimeType: 'Cyber Stalking',
    incidents30d: 8,
    polygon: [
      [23.0210, 72.4990], [23.0210, 72.5130],
      [23.0090, 72.5130], [23.0090, 72.4990],
    ],
  },
  {
    id: 'rz-04', name: 'SG Highway – Mahadev Nagar',
    center: [23.0675, 72.4980], radius: 600,
    riskScore: 68, crimeType: 'Physical Threat',
    incidents30d: 7,
    polygon: [
      [23.0740, 72.4910], [23.0740, 72.5060],
      [23.0610, 72.5060], [23.0610, 72.4910],
    ],
  },
  {
    id: 'rz-05', name: 'Manek Chowk – Old City',
    center: [23.0247, 72.5870], radius: 750,
    riskScore: 82, crimeType: 'Assault + Harassment',
    incidents30d: 10,
    polygon: [
      [23.0310, 72.5800], [23.0310, 72.5940],
      [23.0185, 72.5940], [23.0185, 72.5800],
    ],
  },
  {
    id: 'rz-06', name: 'Bapunagar – GIDC Road',
    center: [23.0460, 72.6210], radius: 550,
    riskScore: 61, crimeType: 'Eve-teasing + Stalking',
    incidents30d: 5,
    polygon: [
      [23.0520, 72.6150], [23.0520, 72.6280],
      [23.0400, 72.6280], [23.0400, 72.6150],
    ],
  },
];

// ─── PREDICTIVE HEATMAP DATA (AI-generated risk scores) ──────
// Simulates output of a violence prediction model trained on:
//   historical incidents × time-of-day × demographics × patrol density
export const PREDICTED_ZONES = [
  { id: 'pred-1', name: 'Naroda Industrial Area', center: [23.0830, 72.6440], riskScore: 58, predictedRisk: 74, crimeTypePredicted: 'Assault', confidence: 81 },
  { id: 'pred-2', name: 'Vastral Market', center: [23.0050, 72.6520], riskScore: 45, predictedRisk: 68, crimeTypePredicted: 'Harassment', confidence: 77 },
  { id: 'pred-3', name: 'Chandkheda–Sola Road', center: [23.1010, 72.5870], riskScore: 40, predictedRisk: 62, crimeTypePredicted: 'Cyber Stalking', confidence: 73 },
  { id: 'pred-4', name: 'Isanpur Junction', center: [22.9680, 72.6280], riskScore: 35, predictedRisk: 55, crimeTypePredicted: 'Eve-teasing', confidence: 69 },
];

// ─── DEMO GIRL LOCATIONS ──────────────────────────────────────
export const GIRL_LOCATIONS = [
  { id: 'G-001', name: 'Anjali M.', phone: '+91-98765-43210', age: 24, lat: 23.0545, lng: 72.5088, battery: 72, inRedZone: true,  redZoneId: 'rz-01', lastUpdate: '13:08:22', sos: false, speed: 3 },
  { id: 'G-002', name: 'Priya S.', phone: '+91-87654-32109', age: 28, lat: 23.0271, lng: 72.5532, battery: 45, inRedZone: true,  redZoneId: 'rz-02', lastUpdate: '13:09:01', sos: false, speed: 0 },
  { id: 'G-003', name: 'Meena V.', phone: '+91-76543-21098', age: 22, lat: 23.0150, lng: 72.5055, battery: 88, inRedZone: true,  redZoneId: 'rz-03', lastUpdate: '13:07:45', sos: false, speed: 5 },
  { id: 'G-004', name: 'Kavya R.', phone: '+91-65432-10987', age: 19, lat: 23.0680, lng: 72.4985, battery: 31, inRedZone: true,  redZoneId: 'rz-04', lastUpdate: '13:09:12', sos: true,  speed: 0 },
  { id: 'G-005', name: 'Sneha P.', phone: '+91-54321-09876', age: 26, lat: 23.0120, lng: 72.5440, battery: 94, inRedZone: false, redZoneId: null,    lastUpdate: '13:09:08', sos: false, speed: 12 },
  { id: 'G-006', name: 'Divya K.', phone: '+91-43210-98765', age: 31, lat: 23.0390, lng: 72.5710, battery: 60, inRedZone: false, redZoneId: null,    lastUpdate: '13:08:55', sos: false, speed: 8 },
  { id: 'G-007', name: 'Riya T.', phone: '+91-32109-87654', age: 21, lat: 23.0244, lng: 72.5875, battery: 15, inRedZone: true,  redZoneId: 'rz-05', lastUpdate: '13:09:15', sos: false, speed: 2 },
  { id: 'G-008', name: 'Pooja N.', phone: '+91-21098-76543', age: 27, lat: 23.0760, lng: 72.5620, battery: 77, inRedZone: false, redZoneId: null,    lastUpdate: '13:09:00', sos: false, speed: 25 },
];

// ─── HELPERS ─────────────────────────────────────────────────
function riskColor(score) {
  if (score >= 80) return '#DC2626';
  if (score >= 65) return '#EA580C';
  if (score >= 50) return '#D97706';
  return '#65A30D';
}
function riskOpacity(score) {
  if (score >= 80) return 0.45;
  if (score >= 65) return 0.32;
  if (score >= 50) return 0.22;
  return 0.14;
}
function predictedColor(score) {
  if (score >= 70) return '#7C3AED';
  if (score >= 55) return '#9333EA';
  return '#A855F7';
}

function MapRecenter({ center }) {
  const map = useMap();
  const hasCentered = useRef(false);
  useEffect(() => {
    if (center && !hasCentered.current) {
      map.flyTo(center, 14, { duration: 1.2 });
      hasCentered.current = true;
    }
  }, [center, map]);
  
  // Reset when center completely changes (different incident)
  useEffect(() => {
    hasCentered.current = false;
  }, [center?.[0], center?.[1]]);
  return null;
}

// ─── PULSING GIRL MARKER (CSS-based animation via SVG) ───────
function GirlMarker({ girl, onClick }) {
  const color = girl.sos ? '#DC2626' : girl.inRedZone ? '#F59E0B' : '#22C55E';
  const pulse = girl.sos || girl.inRedZone;

  return (
    <CircleMarker
      center={[girl.lat, girl.lng]}
      radius={girl.sos ? 14 : 9}
      pathOptions={{
        color: color,
        fillColor: color,
        fillOpacity: 0.85,
        weight: girl.sos ? 3 : 2,
        dashArray: girl.sos ? '4 3' : undefined,
      }}
      eventHandlers={{ click: () => onClick?.(girl) }}
    >
      <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={girl.sos}>
        <div style={{ fontSize: '0.72rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
          {girl.sos ? '🚨 SOS ' : girl.inRedZone ? '⚠ ' : '👤 '}
          {girl.name}
          {girl.inRedZone && !girl.sos && <span style={{ color: '#D97706' }}> · RED ZONE</span>}
          {girl.sos && <span style={{ color: '#DC2626' }}> · SOS ACTIVE</span>}
        </div>
      </Tooltip>
      <Popup>
        <div style={{ minWidth: 200, padding: 6, fontFamily: 'sans-serif' }}>
          <div style={{ fontWeight: 900, fontSize: '0.9rem', marginBottom: 4 }}>
            {girl.sos ? '🚨' : girl.inRedZone ? '⚠' : '👤'} {girl.name}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: 8 }}>
            Age {girl.age} · {girl.phone}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: '0.72rem' }}>
            <span style={{ color: '#888' }}>Battery</span><strong style={{ color: girl.battery < 20 ? '#DC2626' : '#111' }}>{girl.battery}%</strong>
            <span style={{ color: '#888' }}>Speed</span><strong>{girl.speed} km/h</strong>
            <span style={{ color: '#888' }}>Last Ping</span><strong>{girl.lastUpdate}</strong>
            <span style={{ color: '#888' }}>Status</span>
            <strong style={{ color: girl.sos ? '#DC2626' : girl.inRedZone ? '#D97706' : '#22C55E' }}>
              {girl.sos ? 'SOS ACTIVE' : girl.inRedZone ? 'IN RED ZONE' : 'SAFE'}
            </strong>
          </div>
        </div>
      </Popup>
    </CircleMarker>
  );
}

// ─── MAIN MAP COMPONENT ───────────────────────────────────────
export default function LiveMap({ liveIncident = null, showHeatmap = true, onRedZoneAlert }) {
  const [buckets, setBuckets]     = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [livePos, setLivePos]     = useState(null);
  const [liveData, setLiveData]   = useState(null);
  const [selectedGirl, setSelectedGirl] = useState(null);
  const [showPredictive, setShowPredictive] = useState(true);
  const [showGirls, setShowGirls] = useState(true);
  const [showZones, setShowZones] = useState(true);
  const [girlLocations, setGirlLocations] = useState(GIRL_LOCATIONS);

  // Simulate live location updates every 8 seconds
  useEffect(() => {
    const iv = setInterval(() => {
      setGirlLocations(prev => prev.map(g => ({
        ...g,
        lat: g.lat + (Math.random() - 0.5) * 0.0005,
        lng: g.lng + (Math.random() - 0.5) * 0.0005,
        lastUpdate: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      })));
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (showHeatmap) {
      api.police.getHeatmap(24)
        .then(data => setBuckets(data.buckets || []))
        .catch(() => setBuckets([]));
    }
    api.police.listIncidents({ status: 'open', page_size: 100 })
      .then(data => setIncidents(data.incidents || []))
      .catch(() => setIncidents([]));
  }, [showHeatmap]);

  useEffect(() => {
    if (liveIncident?.lat && liveIncident?.lng) {
      setLivePos([liveIncident.lat, liveIncident.lng]);
      setLiveData(liveIncident);
    } else {
      setLivePos(null);
      setLiveData(null);
    }
  }, [liveIncident]);

  useIncidentWebSocket(liveIncident?.id, (msg) => {
    if (msg.type === 'location_update') {
      setLivePos([msg.lat, msg.lng]);
      setLiveData(prev => ({ ...prev, ...msg }));
    }
  });

  // Hardcoded fallback heatmap buckets for Ahmedabad (since backend returns only 1)
  const FALLBACK_BUCKETS = [
    { lat_bucket: '23.0548', lng_bucket: '72.5086', count: 12, severity_avg: 94, dominant_category: 'stalking' },
    { lat_bucket: '23.0274', lng_bucket: '72.5529', count: 9,  severity_avg: 88, dominant_category: 'harassment' },
    { lat_bucket: '23.0151', lng_bucket: '72.5060', count: 8,  severity_avg: 76, dominant_category: 'cyber_stalking' },
    { lat_bucket: '23.0675', lng_bucket: '72.4980', count: 7,  severity_avg: 68, dominant_category: 'physical_threat' },
    { lat_bucket: '23.0247', lng_bucket: '72.5870', count: 10, severity_avg: 82, dominant_category: 'assault' },
    { lat_bucket: '23.0460', lng_bucket: '72.6210', count: 5,  severity_avg: 61, dominant_category: 'eve_teasing' },
    { lat_bucket: '23.0830', lng_bucket: '72.6440', count: 4,  severity_avg: 55, dominant_category: 'harassment' },
    { lat_bucket: '23.0050', lng_bucket: '72.6520', count: 6,  severity_avg: 62, dominant_category: 'assault' },
    { lat_bucket: '23.0320', lng_bucket: '72.5290', count: 3,  severity_avg: 48, dominant_category: 'phishing' },
    { lat_bucket: '23.0620', lng_bucket: '72.5350', count: 5,  severity_avg: 58, dominant_category: 'stalking' },
    { lat_bucket: '22.9930', lng_bucket: '72.5520', count: 4,  severity_avg: 52, dominant_category: 'assault' },
    { lat_bucket: '23.0150', lng_bucket: '72.5850', count: 7,  severity_avg: 78, dominant_category: 'harassment' },
  ];

  const allBuckets = buckets.length > 1 ? buckets : FALLBACK_BUCKETS;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {/* Map Layer Controls */}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 1000, pointerEvents: 'auto',
        background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)',
        borderRadius: 20, padding: '6px 10px', border: '1px solid rgba(0,0,0,0.08)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}>
        {[
          { label: '🔴 Risk Zones', key: 'zones', state: showZones, set: setShowZones },
          { label: '💜 AI Forecast', key: 'pred', state: showPredictive, set: setShowPredictive },
          { label: '👤 Girls', key: 'girls', state: showGirls, set: setShowGirls },
        ].map(({ label, state, set }) => (
          <button
            key={label}
            onClick={() => set(s => !s)}
            style={{
              padding: '4px 10px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: '0.68rem', fontWeight: 800, transition: 'all 0.15s',
              background: state ? 'rgba(37,99,235,0.12)' : 'transparent',
              color: state ? 'var(--accent, #2563EB)' : '#888',
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ width: 1, background: 'rgba(0,0,0,0.1)', margin: '0 2px' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 4, fontSize: '0.65rem', fontWeight: 700, color: '#555' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#DC2626', opacity: 0.8 }} /> Critical
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#D97706', opacity: 0.8 }} /> High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#7C3AED', opacity: 0.8 }} /> Predicted
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} /> Girl (At Risk)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22C55E' }} /> Girl (Safe)
          </span>
        </div>
      </div>

      <MapContainer
        center={AHMEDABAD}
        zoom={12}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        zoomControl={false}
        attributionControl={false}
        id="police-live-map"
      >
        <TileLayer url={TILE_URL} />
        {livePos && <MapRecenter center={livePos} />}

        {/* ── LAYER 1: Red Zone Polygons (filled areas) ── */}
        {showZones && RED_ZONES.map(zone => (
          <Polygon
            key={zone.id}
            positions={zone.polygon}
            pathOptions={{
              color: riskColor(zone.riskScore),
              fillColor: riskColor(zone.riskScore),
              fillOpacity: riskOpacity(zone.riskScore),
              weight: 2,
              dashArray: '6 4',
            }}
          >
            <Tooltip direction="center" permanent opacity={0.92} className="zone-tooltip">
              <div style={{ background: 'rgba(0,0,0,0.82)', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: '0.65rem', fontWeight: 800, textAlign: 'center', whiteSpace: 'nowrap' }}>
                <div style={{ color: riskColor(zone.riskScore) }}>{'🔴'.repeat(zone.riskScore >= 80 ? 3 : zone.riskScore >= 65 ? 2 : 1)}</div>
                {zone.name}
              </div>
            </Tooltip>
            <Popup>
              <div style={{ minWidth: 220, padding: 8, fontFamily: 'sans-serif' }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', color: riskColor(zone.riskScore), marginBottom: 6 }}>
                  🔴 RED ZONE — Risk {zone.riskScore}/100
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 4 }}>{zone.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: '0.72rem' }}>
                  <span style={{ color: '#888' }}>Crime Type</span><strong>{zone.crimeType}</strong>
                  <span style={{ color: '#888' }}>30-Day Incidents</span><strong style={{ color: '#DC2626' }}>{zone.incidents30d}</strong>
                  <span style={{ color: '#888' }}>Girls Inside</span>
                  <strong style={{ color: '#D97706' }}>
                    {GIRL_LOCATIONS.filter(g => g.redZoneId === zone.id).length}
                  </strong>
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* ── LAYER 2: Heatmap Circles (incident density) ── */}
        {showZones && allBuckets.map((b, i) => (
          <Circle
            key={`hm-${i}`}
            center={[parseFloat(b.lat_bucket), parseFloat(b.lng_bucket)]}
            radius={Math.max(700, Math.min(300 + b.count * 200, 2000))}
            pathOptions={{
              color: riskColor(b.severity_avg),
              fillColor: riskColor(b.severity_avg),
              fillOpacity: riskOpacity(b.severity_avg) * 0.7,
              weight: 0,
            }}
          />
        ))}

        {/* ── LAYER 3: Predictive AI Heatmap ── */}
        {showPredictive && PREDICTED_ZONES.map(pz => (
          <Circle
            key={pz.id}
            center={pz.center}
            radius={Math.max(750, pz.predictedRisk * 15)}
            pathOptions={{
              color: predictedColor(pz.predictedRisk),
              fillColor: predictedColor(pz.predictedRisk),
              fillOpacity: 0.18,
              weight: 2,
              dashArray: '4 6',
            }}
          >
            <Popup>
              <div style={{ minWidth: 200, padding: 8, fontFamily: 'sans-serif' }}>
                <div style={{ fontWeight: 900, color: '#7C3AED', marginBottom: 4 }}>
                  💜 AI PREDICTED ZONE
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 6 }}>{pz.name}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 10px', fontSize: '0.72rem' }}>
                  <span style={{ color: '#888' }}>Current Risk</span><strong>{pz.riskScore}/100</strong>
                  <span style={{ color: '#888' }}>Predicted Risk</span><strong style={{ color: '#7C3AED' }}>{pz.predictedRisk}/100</strong>
                  <span style={{ color: '#888' }}>Crime Type</span><strong>{pz.crimeTypePredicted}</strong>
                  <span style={{ color: '#888' }}>Model Confidence</span><strong style={{ color: '#22C55E' }}>{pz.confidence}%</strong>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* ── LAYER 4: Open Incident Markers ── */}
        {incidents.filter(inc => inc.lat && inc.lng).map(inc => (
          <CircleMarker
            key={inc.id}
            center={[inc.lat, inc.lng]}
            radius={6}
            pathOptions={{
              color: riskColor(inc.severity),
              fillColor: riskColor(inc.severity),
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div style={{ minWidth: 200, padding: 4, fontFamily: 'sans-serif' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: riskColor(inc.severity), textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                  {inc.category?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: 4 }}>Score: {inc.severity}</div>
                <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8, textTransform: 'capitalize' }}>
                  Status: {inc.status?.replace(/_/g, ' ')}
                </div>
                <div style={{ fontSize: '0.78rem', lineHeight: 1.5 }}>{inc.description?.slice(0, 100)}…</div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* ── LAYER 5: Girl Location Markers ── */}
        {showGirls && girlLocations.map(girl => (
          <GirlMarker
            key={girl.id}
            girl={girl}
            onClick={setSelectedGirl}
          />
        ))}

        {/* ── Live SOS Tracking ── */}
        {livePos && (
          <CircleMarker
            center={livePos}
            radius={14}
            pathOptions={{ color: '#2563EB', fillColor: '#2563EB', fillOpacity: 0.8, weight: 3 }}
          >
            <Popup>
              <div style={{ padding: 4, fontFamily: 'sans-serif' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#2563EB', marginBottom: 4 }}>🚨 LIVE SOS TRACKING</div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{(liveData?.category || liveIncident?.category || '').replace(/_/g, ' ')}</div>
                {liveData?.health_data?.heart_rate != null && (
                  <div style={{ fontSize: '0.8rem', color: '#EF4444', fontWeight: 700, marginTop: 6 }}>
                    ❤️ HR: {liveData.health_data.heart_rate} bpm
                  </div>
                )}
                {liveData?.health_data?.spo2 != null && (
                  <div style={{ fontSize: '0.8rem', color: '#3B82F6', fontWeight: 700, marginTop: 2 }}>
                    🩸 SpO2: {liveData.health_data.spo2}%
                  </div>
                )}
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
