// ChitCard.jsx
// Displays a single chit fund card in the grid
import React from 'react';


function ChitCard({ chitFund, role, onClick }) {
  return (
    <button
      type="button"
      className="chit-card"
      style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px #0001',
        padding: 20,
        cursor: 'pointer',
        border: '1.5px solid #1976d2',
        transition: 'box-shadow 0.2s',
        textAlign: 'center',
        outline: 'none',
        appearance: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
        minWidth: 120,
        maxWidth: 260,
        maxHeight: 180,
      }}
      onClick={onClick}
      aria-label={`View details for ${chitFund?.name || 'chit fund'}`}
    >
      <div style={{
        fontWeight: 700,
        fontSize: 22,
        marginBottom: 10,
        color: '#1a237e',
        textOverflow: 'ellipsis',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        width: '100%',
        textAlign: 'center',
      }} title={chitFund?.name || 'Chit Fund'}>
        {chitFund?.name || 'Chit Fund'}
      </div>
      <div style={{ color: '#1976d2', fontWeight: 500, marginBottom: 4 }}>₹{chitFund?.monthlyAmount ?? '--'} per month</div>
      <div style={{ color: '#555', marginBottom: 4 }}>Chits Left: {chitFund?.chitsLeft ?? '--'}</div>
      <div style={{ color: '#888', fontSize: 14 }}>Role: <b>{role ?? '--'}</b></div>
    </button>
  );
}

export default ChitCard;
