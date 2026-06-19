import './AdminDashboard.css';
import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';

import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import ReportTable from '../components/ReportTable';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import API_URL from '../config';

const getMarkerIcon = (status) => {
    const color = status === 'VERIFIED' ? '#4caf50' : status === 'FALSE' ? '#f44336' : '#2196f3'; // Green, Red, Blue
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>`;
    return new L.DivIcon({
        html: svg,
        className: 'custom-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

const getSocialMarkerIcon = (sentiment) => {
    const color = sentiment === 'CRITICAL' ? '#ff2a5f' : sentiment === 'WARNING' ? '#ff9800' : '#b388ff'; // Pink-Red, Orange, Purple
    const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
        <path fill="${color}" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 14H6v-2h2v2zm0-3H6V9h2v2zm0-3H6V6h2v2zm7 6h-5v-2h5v2zm3-3h-8V9h8v2zm0-3h-8V6h8v2z"/>
    </svg>`;
    return new L.DivIcon({
        html: svg,
        className: 'custom-social-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
};

function AdminDashboard() {
    const [reports, setReports] = useState([]);
    const [socialPosts, setSocialPosts] = useState([]);
    const [filter, setFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [view, setView] = useState('map');
    const [map, setMap] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const vadodaraPosition = [20.59, 78.96]; // Center of India view
    const auth = useAuth();

    const fetchReports = useCallback(() => {
        if (!auth.token) return;
        
        const params = new URLSearchParams();
        if (filter) params.append('hazard_type', filter);
        if (statusFilter) params.append('status', statusFilter);
        const queryString = params.toString();

        fetch(`${API_URL}/api/reports/?${queryString}`, {
            headers: { 
                'Authorization': `Bearer ${auth.token}`
            },
            cache: 'no-cache' 
        })
        .then(response => {
            if (!response.ok) { throw new Error('Failed to fetch reports'); }
            return response.json();
        })
        .then(data => {
            setReports(data);
        })
        .catch(error => {
            console.error('Error fetching reports:', error);
            setReports([]);
        });
    }, [auth.token, filter, statusFilter]);

    const fetchSocialPosts = useCallback(() => {
        if (!auth.token) return;
        fetch(`${API_URL}/api/social-media/`, {
            headers: { 
                'Authorization': `Bearer ${auth.token}`
            }
        })
        .then(response => {
            if (!response.ok) { throw new Error('Failed to fetch social posts'); }
            return response.json();
        })
        .then(data => {
            setSocialPosts(data);
        })
        .catch(error => {
            console.error('Error fetching social posts:', error);
            setSocialPosts([]);
        });
    }, [auth.token]);

    const handleStatusUpdate = (reportId, newStatus) => {
        if (!auth.token) return;
        fetch(`${API_URL}/api/reports/${reportId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${auth.token}` },
            body: JSON.stringify({ status: newStatus }),
        })
        .then(response => response.json())
        .then(() => {
            toast.success(`Report status updated to ${newStatus}`);
            fetchReports();
        })
        .catch(error => {
            toast.error('Error updating status');
            console.error('Error updating report status:', error);
        });
    };

    const handleDeleteReport = (reportId) => {
        if (!auth.token) return;
        if (window.confirm(`Are you sure you want to delete report #${reportId}?`)) {
            fetch(`${API_URL}/api/reports/${reportId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${auth.token}` },
            })
            .then(response => {
                if (response.ok) { 
                    toast.success('Report deleted successfully');
                    fetchReports(); 
                } 
                else { 
                    toast.error('Failed to delete report.'); 
                }
            })
            .catch(error => console.error('Error deleting report:', error));
        }
    };

    const handleSyncSocial = () => {
        if (!auth.token) return;
        setSyncing(true);
        const syncPromise = fetch(`${API_URL}/api/social-media/sync`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error();
            return response.json();
        })
        .then(data => {
            fetchSocialPosts();
            setSyncing(false);
            return data.length;
        })
        .catch(err => {
            setSyncing(false);
            throw err;
        });

        toast.promise(syncPromise, {
            loading: 'Scraping and analyzing social media feeds...',
            success: (count) => `Successfully ingested & analyzed ${count} new hazard posts!`,
            error: 'Failed to sync social media feeds.'
        });
    };

    const handleVerifySocialPost = (postId) => {
        if (!auth.token) return;
        const verifyPromise = fetch(`${API_URL}/api/social-media/${postId}/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${auth.token}` }
        })
        .then(response => {
            if (!response.ok) throw new Error();
            return response.json();
        })
        .then(() => {
            fetchReports();
            fetchSocialPosts();
        });

        toast.promise(verifyPromise, {
            loading: 'Verifying and creating official report...',
            success: 'Post verified! Added as official system report.',
            error: 'Verification failed. Please check post details.'
        });
    };
    
    // Realtime websocket subscription
    useEffect(() => {
        if (!auth.token) return;
        const wsUrl = `${API_URL.replace(/^http/, 'ws')}/ws`;
        const socket = new WebSocket(wsUrl);
        
        socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                console.log("WebSocket Broadcast Received:", message);
                // Refresh data states
                fetchReports();
                fetchSocialPosts();
                toast('New crowdsourced updates received!', {
                    icon: '🌊',
                    style: { background: '#1e293b', color: '#f8fafc' }
                });
            } catch (err) {
                console.error("Error decoding websocket message:", err);
            }
        };

        return () => {
            socket.close();
        };
    }, [auth.token, fetchReports, fetchSocialPosts]);

    useEffect(() => {
        fetchReports();
        fetchSocialPosts();
    }, [filter, statusFilter, auth.token, fetchReports, fetchSocialPosts]);

    useEffect(() => {
        if (map) {
            setTimeout(() => { map.invalidateSize(); }, 100);
        }
    }, [map]);

    // Data analytics computations
    const unverifiedSocialPosts = socialPosts.filter(p => !p.is_verified);
    const criticalSentimentCount = socialPosts.filter(p => p.sentiment === 'CRITICAL').length;
    const warningSentimentCount = socialPosts.filter(p => p.sentiment === 'WARNING').length;
    const infoSentimentCount = socialPosts.filter(p => p.sentiment === 'INFO').length;

    // Calculate hazard types distribution for social posts
    const hazardCounts = {
        COASTAL_FLOODING: 0,
        HIGH_WAVES: 0,
        COASTAL_DAMAGE: 0,
        SWELL_SURGES: 0,
        UNUSUAL_TIDES: 0,
    };
    socialPosts.forEach(post => {
        if (post.hazard_type && hazardCounts[post.hazard_type] !== undefined) {
            hazardCounts[post.hazard_type]++;
        }
    });

    const heatmapPoints = Array.isArray(reports) ? reports.map(report => [report.latitude, report.longitude, 1]) : [];

    return (
        <div className="dashboard-layout">
            <Sidebar
                filter={filter}
                setFilter={setFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                showHeatmap={showHeatmap}
                setShowHeatmap={setShowHeatmap}
                view={view}
                setView={setView}
            />
            <div className="main-content">
                {view === 'map' ? (
                    <MapContainer center={vadodaraPosition} zoom={5} style={{ height: '100%', width: '100%' }} whenCreated={setMap}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' />
                        {showHeatmap && <HeatmapLayer points={heatmapPoints} longitudeExtractor={p => p[1]} latitudeExtractor={p => p[0]} intensityExtractor={p => p[2]} radius={25} blur={15} gradient={{ 0.4: 'blue', 0.6: 'lime', 0.8: 'yellow', 1.0: 'red' }} />}
                        {!showHeatmap && Array.isArray(reports) && reports.map(report => (
                            <Marker key={report.id} position={[report.latitude, report.longitude]} icon={getMarkerIcon(report.status)}>
                                <Popup>
                                    <div className="popup-card">
                                        <h4>Hazard: {report.hazard_type.replace('_', ' ')}</h4>
                                        <p className="popup-status">Status: <span className={`status-text-${report.status.toLowerCase()}`}>{report.status}</span></p>
                                        <p className="popup-desc">{report.description}</p>
                                        {report.media_url && (<img src={`${API_URL}${report.media_url}`} alt="Hazard media" style={{ width: '100%', borderRadius: '4px', marginTop: '10px' }} />)}
                                        <hr />
                                        <div className="popup-buttons">
                                            <button className="btn-verify" onClick={() => handleStatusUpdate(report.id, 'VERIFIED')}>Verify</button>
                                            <button className="btn-false" onClick={() => handleStatusUpdate(report.id, 'FALSE')}>Mark False</button>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                        {/* Render Geotagged Unverified Social Media Posts on Map */}
                        {!showHeatmap && Array.isArray(socialPosts) && socialPosts.filter(p => !p.is_verified && p.latitude && p.longitude).map(post => (
                            <Marker key={`social-${post.id}`} position={[post.latitude, post.longitude]} icon={getSocialMarkerIcon(post.sentiment)}>
                                <Popup>
                                    <div className="popup-card social-popup-card">
                                        <div className="social-header">
                                            <span className="social-platform-badge">{post.platform}</span>
                                            <span className="social-username">{post.username}</span>
                                        </div>
                                        <p className="popup-desc">"{post.post_text}"</p>
                                        <div className="social-meta">
                                            <span>Hazard: <b>{post.hazard_type ? post.hazard_type.replace('_', ' ') : 'N/A'}</b></span>
                                            <span>Sentiment: <b className={`sentiment-${post.sentiment.toLowerCase()}`}>{post.sentiment}</b></span>
                                        </div>
                                        <hr />
                                        <button className="btn-verify-social" onClick={() => handleVerifySocialPost(post.id)}>
                                            Verify & Import as Report
                                        </button>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                ) : view === 'table' ? (
                    <ReportTable reports={reports} onDelete={handleDeleteReport} />
                ) : (
                    /* --- Social Media Analytics View --- */
                    <div className="social-analytics-container">
                        <div className="analytics-header">
                            <div>
                                <h2>Social Media Analytics Feed</h2>
                                <p>Ingests, classifies, and verifies crowdsourced alerts from social networks.</p>
                            </div>
                            <button className="sync-button" onClick={handleSyncSocial} disabled={syncing}>
                                {syncing ? 'Syncing...' : 'Sync Live Social Data'}
                            </button>
                        </div>

                        {/* --- Summary Cards Grid --- */}
                        <div className="analytics-cards">
                            <div className="stat-card">
                                <h3>Total Crawled</h3>
                                <div className="stat-val">{socialPosts.length}</div>
                                <span className="stat-sub">Posts scraped total</span>
                            </div>
                            <div className="stat-card">
                                <h3>Unverified Alert Flags</h3>
                                <div className="stat-val warning-val">{unverifiedSocialPosts.length}</div>
                                <span className="stat-sub">Awaiting admin review</span>
                            </div>
                            <div className="stat-card">
                                <h3>Critical Threats</h3>
                                <div className="stat-val critical-val">{criticalSentimentCount}</div>
                                <span className="stat-sub">Require immediate inspection</span>
                            </div>
                        </div>

                        {/* --- Charts Section --- */}
                        <div className="analytics-charts-grid">
                            <div className="chart-card">
                                <h3>Hazard Mention Breakdown</h3>
                                <div className="bar-chart-container">
                                    {Object.entries(hazardCounts).map(([type, count]) => {
                                        const maxCount = Math.max(...Object.values(hazardCounts), 1);
                                        const percent = (count / maxCount) * 100;
                                        return (
                                            <div className="chart-bar-row" key={type}>
                                                <span className="chart-bar-label">{type.replace('_', ' ')}</span>
                                                <div className="chart-bar-bg">
                                                    <div className="chart-bar-fill" style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <span className="chart-bar-value">{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="chart-card">
                                <h3>Threat Severity Distribution</h3>
                                <div className="sentiment-doughnut-container">
                                    <div className="sentiment-rings">
                                        <div className="sentiment-ring-row">
                                            <span className="dot sentiment-critical"></span>
                                            <span className="label">Critical ({criticalSentimentCount})</span>
                                            <div className="bar-mini-container">
                                                <div className="bar-mini-fill bg-critical" style={{ width: `${(criticalSentimentCount / (socialPosts.length || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="sentiment-ring-row">
                                            <span className="dot sentiment-warning"></span>
                                            <span className="label">Warning ({warningSentimentCount})</span>
                                            <div className="bar-mini-container">
                                                <div className="bar-mini-fill bg-warning" style={{ width: `${(warningSentimentCount / (socialPosts.length || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                        <div className="sentiment-ring-row">
                                            <span className="dot sentiment-info"></span>
                                            <span className="label">Informational ({infoSentimentCount})</span>
                                            <div className="bar-mini-container">
                                                <div className="bar-mini-fill bg-info" style={{ width: `${(infoSentimentCount / (socialPosts.length || 1)) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* --- Social Posts List Feed --- */}
                        <div className="social-feed-section">
                            <h3>Live Social Feed</h3>
                            <div className="feed-list">
                                {socialPosts.length === 0 ? (
                                    <p className="no-posts">No social posts ingested yet. Click 'Sync Live Social Data' to scrape posts.</p>
                                ) : (
                                    socialPosts.map(post => (
                                        <div className={`feed-card ${post.is_verified ? 'verified-post' : ''}`} key={post.id}>
                                            <div className="feed-card-header">
                                                <div className="feed-user-details">
                                                    <span className="platform-tag">{post.platform}</span>
                                                    <strong className="user-handle">{post.username}</strong>
                                                    <span className="post-time">{new Date(post.timestamp).toLocaleString()}</span>
                                                </div>
                                                <div className="feed-badge-group">
                                                    <span className={`badge-sentiment badge-${post.sentiment.toLowerCase()}`}>
                                                        {post.sentiment}
                                                    </span>
                                                    {post.hazard_type && (
                                                        <span className="badge-hazard">
                                                            {post.hazard_type.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="feed-text">"{post.post_text}"</p>
                                            <div className="feed-footer">
                                                <div className="feed-coordinates">
                                                    {post.latitude && post.longitude ? (
                                                        <span>📍 Geotagged: {post.latitude.toFixed(4)}, {post.longitude.toFixed(4)}</span>
                                                    ) : (
                                                        <span>📍 No location metadata</span>
                                                    )}
                                                </div>
                                                <div className="feed-actions">
                                                    {post.is_verified ? (
                                                        <span className="status-verified-pill">✓ Verified & Logged</span>
                                                    ) : post.latitude && post.longitude && post.hazard_type ? (
                                                        <button className="verify-action-btn" onClick={() => handleVerifySocialPost(post.id)}>
                                                            Verify & Convert to Official Report
                                                        </button>
                                                    ) : (
                                                        <span className="action-disabled-text">Cannot verify (missing loc/hazard)</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;