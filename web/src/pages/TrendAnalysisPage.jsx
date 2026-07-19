import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TrendAnalysisPage() {
  const [forecasts, setForecasts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/police/analytics/forecasts/incident-spike', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setForecasts(data.forecasts || []);
      }
    } catch (e) {
      console.error("Failed to fetch forecasts", e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Trend Analysis & Forecasting</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        <div style={{ height: '400px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h4>7-Day Incident Trend</h4>
          <p>Placeholder for Trend Line Chart</p>
        </div>
        
        <div style={{ height: '400px', border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h4>Geographic Hotspots</h4>
          <p>Placeholder for Choropleth Map</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h4>Time-of-Day Patterns</h4>
          <p>Placeholder for Heatmap (Hour vs Day)</p>
        </div>

        <div style={{ border: '1px solid #ddd', borderRadius: '8px', padding: '20px' }}>
          <h4>Forecasted Incident Spikes</h4>
          {loading ? <p>Loading predictions...</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {forecasts.map((f, i) => (
                <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                  <strong>Region:</strong> {f.region} <br />
                  <strong>Probability:</strong> {(f.probability * 100).toFixed(0)}% <br />
                  <strong>Expected Time:</strong> {new Date(f.expected_time).toLocaleString()}
                </li>
              ))}
              {forecasts.length === 0 && <p>No forecasted spikes detected.</p>}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
