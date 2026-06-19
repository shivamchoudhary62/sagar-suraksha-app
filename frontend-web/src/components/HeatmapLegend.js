import React from 'react';

function HeatmapLegend() {
  return (
    <div className="legend-container">
      <div><strong>Density</strong></div>
      <div><span style={{background: 'red'}}></span> High</div>
      <div><span style={{background: 'yellow'}}></span> Medium</div>
      <div><span style={{background: 'lime'}}></span> Low</div>
    </div>
  );
}

export default HeatmapLegend;