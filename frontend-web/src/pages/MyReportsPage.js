// in src/pages/MyReportsPage.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // Import Link
import API_URL from '../config';
import './MyReportsPage.css';

function MyReportsPage() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();

    useEffect(() => {
        if (auth.token) {
            fetch(`${API_URL}/api/users/me/reports`, {
                headers: { 'Authorization': `Bearer ${auth.token}` }
            })
            .then(res => res.json())
            .then(data => {
                setReports(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching user reports:", error);
                setLoading(false);
            });
        }
    }, [auth.token, auth.refetchId]);

    if (loading) {
        return <div className="my-reports-container"><h2>Loading your reports...</h2></div>;
    }

    return (
        <div className="my-reports-container">
            {/* NEW: Page header with title and button */}
            <div className="page-header">
                <h2>My Submitted Reports</h2>
                <Link to="/report" className="new-report-button">Submit New Report</Link>
            </div>

            <div className="reports-grid">
                {reports.length > 0 ? reports.map(report => (
                    <div key={report.id} className="report-card">
                        <h3>{report.hazard_type.replace('_', ' ')}</h3>
                        <p>{report.description}</p>
                        {report.media_url && (
                            <img src={`${API_URL}${report.media_url}`} alt="Report media" />
                        )}
                        <div className={`status-badge status-${report.status.toLowerCase()}`}>
                            Status: {report.status}
                        </div>
                    </div>
                )) : <p>You have not submitted any reports yet.</p>}
            </div>
        </div>
    );
}

export default MyReportsPage;