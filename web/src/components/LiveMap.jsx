// =============================================================
//  Live Map — Leaflet/OSM with incident markers + heat zones
// =============================================================
import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';

const AHMEDABAD = [23.0225, 72.5714];

// Light tile layer URL (CartoDB Positron) for the new white theme
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '© OpenStreetMap contributors © CARTO';

function severityColor(sev) {
  if (sev >= 70) return '#EF4444'; // --critical
  if (sev >= 40) return '#F59E0B'; // --warn
  return '#10B981'; // --safe
}

function MapRecenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, 14, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export default function LiveMap({ liveIncident = null, showHeatmap = true }) {
  const [buckets, setBuckets]   = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [livePos, setLivePos]   = useState(null);

  useEffect(() => {
    if (showHeatmap) {
      api.police.getHeatmap(24).then((data) => setBuckets(data.buckets || []));
    }
    api.police.listIncidents({ status: 'open', page_size: 100 })
      .then((data) => setIncidents(data.incidents || []));
  }, [showHeatmap]);

  // Live location from WebSocket updates
  useEffect(() => {
    if (liveIncident?.lat && liveIncident?.lng) {
      setLivePos([liveIncident.lat, liveIncident.lng]);
    }
  }, [liveIncident]);

  const mapCenter = livePos || (incidents[0] ? [incidents[0].lat, incidents[0].lng] : AHMEDABAD);

  return (
    <div className="map-container" style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}
        zoomControl={false}
        attributionControl={false}
        id="police-live-map"
      >
        <TileLayer url={TILE_URL} />
        <MapRecenter center={livePos} />

        {/* Heat-map buckets from /api/police/heatmap */}
        {buckets.map((b, i) => (
          <CircleMarker
            key={`hm-${i}`}
            center={[parseFloat(b.lat_bucket), parseFloat(b.lng_bucket)]}
            radius={Math.min(5 + b.count * 4, 40)}
            pathOptions={{
              color: severityColor(b.severity_avg),
              fillColor: severityColor(b.severity_avg),
              fillOpacity: 0.15,
              weight: 0,
            }}
          >
            <Popup>
              <div style={{ padding: '4px' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Hotspot Zone</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--stream-text)' }}>Incidents: <strong>{b.count}</strong></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--stream-text)' }}>Avg severity: <strong>{b.severity_avg?.toFixed(0)}</strong></div>
                <div style={{ fontSize: '0.8rem', color: 'var(--stream-text)' }}>Category: <span style={{ textTransform: 'capitalize' }}>{b.dominant_category?.replace(/_/g, ' ')}</span></div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Open incident markers */}
        {incidents
          .filter((inc) => inc.lat && inc.lng)
          .map((inc) => (
            <CircleMarker
              key={inc.id}
              center={[inc.lat, inc.lng]}
              radius={7}
              pathOptions={{
                color: severityColor(inc.severity),
                fillColor: severityColor(inc.severity),
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(inc) }}
            >
              <Popup>
                <div style={{ minWidth: 200, padding: 4 }}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: severityColor(inc.severity), textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                    {inc.category?.replace(/_/g, ' ')}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--stream-text)', marginBottom: 4 }}>Score: {inc.severity}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--stream-muted)', marginBottom: 8, textTransform: 'capitalize' }}>Status: {inc.status?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--stream-text)', lineHeight: 1.5 }}>
                    {inc.description?.slice(0, 100)}…
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Live tracking position (pulsing) */}
        {livePos && (
          <CircleMarker
            center={livePos}
            radius={12}
            pathOptions={{
              color: '#2563EB', // --accent
              fillColor: '#2563EB',
              fillOpacity: 0.8,
              weight: 3,
            }}
          >
            <Popup>
              <div style={{ padding: 4 }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  🚨 LIVE SOS TRACKING
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--stream-text)', fontWeight: 600 }}>
                  {liveIncident?.category?.replace(/_/g, ' ')}
                </div>
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
