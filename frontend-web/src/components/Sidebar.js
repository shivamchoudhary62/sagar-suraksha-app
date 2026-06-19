// in src/components/Sidebar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

function Sidebar(props) {
    const { filter, setFilter, statusFilter, setStatusFilter, showHeatmap, setShowHeatmap, view, setView } = props;
    const auth = useAuth();

    return (
        <div className="sidebar">
            {/* --- Main Navigation Section --- */}
            <div className="sidebar-nav">
                {auth.user?.role === 'admin' && (
                    <NavLink to="/dashboard" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Dashboard</NavLink>
                )}
                {auth.user?.role === 'user' && (
                    <>
                        <NavLink to="/report" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>Submit Report</NavLink>
                        <NavLink to="/my-reports" className={({isActive}) => isActive ? "nav-link active" : "nav-link"}>My Reports</NavLink>
                    </>
                )}
            </div>

            {/* --- Controls Section (Only for Admins on Dashboard) --- */}
            {auth.user?.role === 'admin' && (
                <div className="sidebar-controls">
                    <h3>Controls</h3>
                    <div className="control-group">
                        <label>Hazard Type</label>
                        <select onChange={(e) => setFilter(e.target.value)} value={filter}>
                            <option value="">All Types</option>
                            <option value="COASTAL_FLOODING">Coastal Flooding</option>
                            <option value="HIGH_WAVES">High Waves</option>
                            <option value="COASTAL_DAMAGE">Coastal Damage</option>
                            <option value="SWELL_SURGES">Swell Surges</option>
                            <option value="UNUSUAL_TIDES">Unusual Tides</option>
                        </select>
                    </div>
                    <div className="control-group">
                        <label>Report Status</label>
                        <select onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
                            <option value="">All Statuses</option>
                            <option value="UNVERIFIED">Unverified</option>
                            <option value="VERIFIED">Verified</option>
                            <option value="FALSE">False</option>
                        </select>
                    </div>
                    <div className="control-group">
                        <label>View Mode</label>
                        <div className="view-toggle">
                            <button onClick={() => setView('map')} className={view === 'map' ? 'active' : ''}>Map</button>
                            <button onClick={() => setView('table')} className={view === 'table' ? 'active' : ''}>Table</button>
                            <button onClick={() => setView('social')} className={view === 'social' ? 'active' : ''}>Social Feed</button>
                        </div>
                    </div>
                    {view === 'map' && (
                        <div className="control-group">
                            <label>Map Options</label>
                            <div className="heatmap-toggle">
                                <input type="checkbox" id="heatmap" checked={showHeatmap} onChange={() => setShowHeatmap(!showHeatmap)} />
                                <label htmlFor="heatmap">Show Heatmap</label>
                            </div>
                        </div>
                    )}
                    {/* --- Integrated Legend Section --- */}
                    {view === 'map' && (
                        <div className="legend">
                            <h4>Legend</h4>
                            {showHeatmap ? (
                                <div className="legend-section">
                                    <strong>Report Density</strong>
                                    <div className="legend-item"><span className="legend-color-box" style={{background: 'red'}}></span> High</div>
                                    <div className="legend-item"><span className="legend-color-box" style={{background: 'yellow'}}></span> Medium</div>
                                    <div className="legend-item"><span className="legend-color-box" style={{background: 'lime'}}></span> Low</div>
                                </div>
                            ) : (
                                <div className="legend-section">
                                    <strong>Marker Status</strong>
                                    <div className="legend-item"><span className="legend-color-box" style={{background: 'green'}}></span> Verified</div>
                                    <div className="legend-item"><span className="legend-color-box" style={{background: 'blue'}}></span> Unverified</div>
                                    <div className="legend-item"><span className="legend-color-box" style={{background: 'red'}}></span> False Report</div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Sidebar;