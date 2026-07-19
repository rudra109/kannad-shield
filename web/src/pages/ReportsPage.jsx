import React, { useState } from 'react';

const ReportBuilder = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [incidentType, setIncidentType] = useState('all');
  const [severity, setSeverity] = useState(0);

  return (
    <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h3>Report Filters</h3>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <label>Start Date: </label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div>
          <label>End Date: </label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <div>
          <label>Incident Type: </label>
          <select value={incidentType} onChange={e => setIncidentType(e.target.value)}>
            <option value="all">All</option>
            <option value="cyber">Cybercrime</option>
            <option value="physical">SOS Physical</option>
          </select>
        </div>
        <div>
          <label>Min Severity: </label>
          <input type="number" min="0" max="100" value={severity} onChange={e => setSeverity(e.target.value)} />
        </div>
      </div>
    </div>
  );
};

const ExportOptions = ({ formats }) => (
  <div style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
    <h3>Export Report</h3>
    <div style={{ display: 'flex', gap: '10px' }}>
      {formats.map(fmt => (
        <button key={fmt} style={{ padding: '10px 20px', cursor: 'pointer', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px' }}>
          Download {fmt}
        </button>
      ))}
    </div>
  </div>
);

const ScheduledReports = () => (
  <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
    <h3>Scheduled Deliveries</h3>
    <p>Setup automated daily or weekly email reports.</p>
    <button style={{ padding: '8px 16px' }}>+ New Schedule</button>
  </div>
);

export default function ReportsPage() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ marginBottom: '20px' }}>Generate Custom Reports</h1>
      <ReportBuilder />
      <ExportOptions formats={['PDF', 'CSV', 'JSON']} />
      <ScheduledReports />
    </div>
  );
}
