// Simple, dependency-free bar chart for React
// Usage: <BarChart data={[{label: 'A', value: 10}, ...]} title="..." />
import React from 'react';
import './BarChart.css';

export default function BarChart({ data, title, color = '#1976d2', height = 180 }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="bar-chart-container">
      {title && <div className="bar-chart-title">{title}</div>}
      <div className="bar-chart" style={{ height }}>
        {data.map((d, i) => (
          <div key={i} className="bar-chart-bar-wrap">
            <div
              className="bar-chart-bar"
              style={{
                height: `${(d.value / max) * 100}%`,
                background: color,
                transition: 'height 0.3s',
              }}
              title={`${d.label}: ${d.value}`}
            />
            <div className="bar-chart-label">{d.label}</div>
            <div className="bar-chart-value">{d.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
