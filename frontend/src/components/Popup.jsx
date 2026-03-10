// Popup.jsx
// Reusable popup/modal for messages and overlays
import React from 'react';

function Popup({ open, message, type = 'info', onClose, children, testId }) {
  if (!open) return null;
  return (
    <div className="popup-overlay" onClick={onClose}>
      <div
        className={`popup-box popup-${type}`}
        data-testid={testId}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
         aria-label={type === 'error' ? 'Error message' : type === 'info' ? 'Information' : 'Dialog'}
         tabIndex={-1}
      >
        <span className="popup-message">{message}</span>
        {children}
        <button className="popup-close" onClick={onClose} aria-label="Close">×</button>
      </div>
    </div>
  );
}

export default Popup;
