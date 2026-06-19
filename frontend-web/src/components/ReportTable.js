// in src/components/ReportTable.js
import React from 'react';

function ReportTable({ reports, onDelete }) { // Accept onDelete prop
  return (
    <div className="table-container">
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Hazard Type</th>
            <th>Description</th>
            <th>Status</th>
            <th>Coordinates</th>
            <th>Actions</th> {/* New Column */}
          </tr>
        </thead>
        <tbody>
          {Array.isArray(reports) && reports.map(report => (
            <tr key={report.id}>
              <td>{report.id}</td>
              <td>{report.hazard_type}</td>
              <td>{report.description}</td>
              <td>{report.status}</td>
              <td>{report.latitude.toFixed(4)}, {report.longitude.toFixed(4)}</td>
              {/* New Actions Cell */}
              <td>
                <button 
                  className="delete-button" 
                  onClick={() => onDelete(report.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ReportTable;