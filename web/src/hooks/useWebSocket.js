// =============================================================
//  useWebSocket — live incident tracking via WebSocket (Dev 1)
// =============================================================
import { useEffect, useRef, useCallback } from 'react';

const WS_BASE = import.meta.env.VITE_WS_URL || `ws://${window.location.host}/ws`;

export function useIncidentWebSocket(incidentId, onMessage) {
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  const connect = useCallback(() => {
    if (!incidentId) return;
    const url = `${WS_BASE}/track?incidentId=${incidentId}`;
    const ws = new WebSocket(url);

    ws.onopen = () => {
      console.log(`[WS] Connected to incident ${incidentId}`);
      clearTimeout(reconnectRef.current);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        onMessage?.(msg);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      console.log(`[WS] Disconnected from ${incidentId} — reconnecting in 3s`);
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = (err) => console.error('[WS] error', err);
    wsRef.current = ws;
  }, [incidentId, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}

// ── Broadcast live location (victim device side, not used in console) ──
export function sendLocationUpdate(ws, lat, lng) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'location_update', lat, lng, ts: Date.now() }));
  }
}
