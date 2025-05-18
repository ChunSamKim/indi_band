import React from 'react';

const CustomToolbar = ({ label, onNavigate }) => {
  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button onClick={() => onNavigate('PREV')}>이전</button>
        <span className="rbc-toolbar-label">{label}</span>
        <button onClick={() => onNavigate('NEXT')}>다음</button>
      </span>
    </div>
  );
};

export default CustomToolbar;
