// in src/pages/LandingPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    // in src/pages/LandingPage.js
    return (
        <div className="landing-container">
            <h1 className="app-title">Sagar Suraksha</h1>
    
            <div className="card-container">
                <div className="choice-card">
                    {/* NEW: Icon for Citizens */}
                    <div className="card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4zm-6 4c.22-.72 3.31-2 6-2 2.7 0 5.8 1.29 6 2z"/></svg>
                    </div>
                    <h2>For Citizens</h2>
                    <p>Report ocean hazards and help keep our coasts safe.</p>
                    <Link to="/user-login" className="choice-button">User Login / Register</Link>
                </div>
                <div className="choice-card">
                    {/* NEW: Icon for Officials */}
                    <div className="card-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                    </div>
                    <h2>For Officials</h2>
                    <p>Access the dashboard to monitor and manage reports.</p>
                    <Link to="/admin-login" className="choice-button">Admin Login</Link>
                </div>
            </div>
        </div>
    );
}

export default LandingPage;

