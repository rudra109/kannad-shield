import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { GoogleMap, HeatmapLayer } from '@react-google-maps/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const KPICard = ({ label, value, trend, alert }) => (
  <div style={{
    padding: '20px', 
    border: `1px solid ${alert ? 'red' : '#ddd'}`, 
    borderRadius: '8px', 
    background: alert ? '#fee' : '#fff'
  }}>
    <h3 style={{ margin: 0, color: '#555', fontSize: '14px' }}>{label}</h3>
    <div style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>{value}</div>
    {trend && <div style={{ fontSize: '12px', color: trend.includes('↓') ? 'green' : 'red' }}>{trend}</div>}
  </div>
);

const PerpetratorNetwork = ({ data }) => (
  <div style={{ height: '300px', border: '1px solid #ddd', borderRadius: '8px', padding: '10px' }}>
    <h4>Repeat Offenders</h4>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {data.map((item, idx) => (
        <li key={idx} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
          <strong>Phone:</strong> {item.perpetrator_phone || 'Unknown'} | <strong>Incidents:</strong> {item.incident_count} | <strong>Max Severity:</strong> {item.max_severity}
        </li>
      ))}
    </ul>
  </div>
);

export default function AnalyticsDashboard() {
  const [metrics, setMetrics] = useState({
    avgResponseTime: 0,
    activeIncidents: { physical: 0, cyber: 0 },
    heatmapData: [],
    riskDistribution: [],
    trendData: [],
    topRepeatOffenders: [],
  });

  const [map, setMap] = useState(null);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch('/api/police/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (e) {
      console.error("Failed to fetch analytics", e);
    }
  };

  const mapHeatmapData = metrics.heatmapData.map(point => ({
    location: new window.google.maps.LatLng(point.lat, point.lng),
    weight: point.intensity
  }));

  const pieData = [
    { name: 'SOS (Physical)', value: metrics.activeIncidents.physical || 0 },
    { name: 'Cybercrime', value: metrics.activeIncidents.cyber || 0 },
  ];

  const totalActive = (metrics.activeIncidents.physical || 0) + (metrics.activeIncidents.cyber || 0);

  return (
    <div className="analytics-dashboard" style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Real-Time Operations Analytics</h1>
      
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <KPICard label="Avg Response Time" value={`${metrics.avgResponseTime.toFixed(1)}m`} trend="↓ 5%" />
        <KPICard label="Active Incidents" value={totalActive} />
        <KPICard label="Repeat Offenders Identified" value={metrics.topRepeatOffenders.length} alert={metrics.topRepeatOffenders.length > 0} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Incident Heatmap */}
        <div style={{ height: '400px', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
          {window.google ? (
            <GoogleMap
              center={{ lat: 23.022, lng: 72.571 }}
              zoom={12}
              mapContainerStyle={{ width: '100%', height: '100%' }}
              onLoad={map => setMap(map)}
            >
              <HeatmapLayer data={mapHeatmapData} options={{ radius: 20 }} />
            </GoogleMap>
          ) : (
            <div style={{ padding: '20px' }}>Loading Google Maps...</div>
          )}
        </div>

        {/* 7-Day Trend */}
        <div style={{ height: '400px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>7-Day Trend</h4>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={metrics.trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="sos" stroke="#8884d8" name="SOS" />
              <Line type="monotone" dataKey="cyber" stroke="#82ca9d" name="Cybercrime" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
        {/* Incident Type Distribution */}
        <div style={{ height: '300px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>Active Incidents Split</h4>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Risk Score Distribution */}
        <div style={{ height: '300px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
          <h4 style={{ marginTop: 0 }}>Risk Distribution</h4>
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={metrics.riskDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="risk_bucket" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ff7300" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Perpetrators */}
        <PerpetratorNetwork data={metrics.topRepeatOffenders} />
      </div>
    </div>
  );
}
