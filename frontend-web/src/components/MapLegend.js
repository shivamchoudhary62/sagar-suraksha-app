import React from 'react';

function MapLegend({ showHeatmap }) {
  return (
    <div className="legend-container">
      <h4>Legend</h4>
      
      {/* This part of the legend shows only when the heatmap is OFF */}
      {!showHeatmap && (
        <div className="legend-section">
          <strong>Marker Status</strong>
          <div><span style={{background: 'green'}}></span> Verified</div>
          <div><span style={{background: 'blue'}}></span> Unverified</div>
          <div><span style={{background: 'red'}}></span> False Report</div>
        </div>
      )}

      {/* This part of the legend shows only when the heatmap is ON */}
      {showHeatmap && (
        <div className="legend-section">
          <strong>Report Density</strong>
          <div><span style={{background: 'red'}}></span> High</div>
          <div><span style={{background: 'yellow', color: '#333'}}></span> Medium</div>
          <div><span style={{background: 'lime', color: '#333'}}></span> Low</div>
        </div>
      )}
    </div>
  );
}

export default MapLegend;