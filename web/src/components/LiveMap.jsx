// =============================================================
//  Live Map — Leaflet/OSM with incident markers + heat zones
// =============================================================
import { useEffect, useRef, useState } from 'react';
import api from '../services/api.js';

// Leaflet is loaded globally via index.html CDN link
// We import the React wrapper here for proper integration
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';

const AHMEDABAD = [23.0225, 72.5714];

// Dark tile layer URL (CartoDB dark matter)
const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '© OpenStreetMap contributors © CARTO';

function severityColor(sev) {
  if (sev >= 70) return '#ff3d71';
  if (sev >= 40) return '#ffb800';
  return '#00e096';
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

  // Live location from WebSocket updates (passed in via liveIncident)
  useEffect(() => {
    if (liveIncident?.lat && liveIncident?.lng) {
      setLivePos([liveIncident.lat, liveIncident.lng]);
    }
  }, [liveIncident]);

  const mapCenter = livePos || (incidents[0] ? [incidents[0].lat, incidents[0].lng] : AHMEDABAD);

  return (
    <div className="map-container" style={{ height: 420 }}>
      <MapContainer
        center={AHMEDABAD}
        zoom={12}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        id="police-live-map"
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
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
              fillOpacity: 0.25,
              weight: 1,
              opacity: 0.5,
            }}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: 12 }}>
                <strong>📍 Hotspot Zone</strong><br />
                Incidents: <strong>{b.count}</strong><br />
                Avg severity: <strong>{b.severity_avg?.toFixed(0)}</strong><br />
                Category: {b.dominant_category}
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
              radius={8}
              pathOptions={{
                color: severityColor(inc.severity),
                fillColor: severityColor(inc.severity),
                fillOpacity: 0.9,
                weight: 2,
              }}
              eventHandlers={{ click: () => setSelected(inc) }}
            >
              <Popup>
                <div style={{ color: '#000', fontSize: 12, minWidth: 180 }}>
                  <strong>{inc.category?.toUpperCase()}</strong>
                  <br />Severity: <strong>{inc.severity}</strong>
                  <br />Status: {inc.status}
                  <br />{inc.description?.slice(0, 100)}…
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
              color: '#ff3d71',
              fillColor: '#ff3d71',
              fillOpacity: 0.8,
              weight: 3,
            }}
          >
            <Popup>
              <div style={{ color: '#000', fontSize: 12 }}>
                🚨 <strong>LIVE SOS</strong><br />
                {liveIncident?.category?.toUpperCase()}<br />
                Real-time tracking active
              </div>
            </Popup>
          </CircleMarker>
        )}
      </MapContainer>
    </div>
  );
}
