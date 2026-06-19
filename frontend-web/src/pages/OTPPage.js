// in src/pages/OTPPage.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API_URL from '../config';
import './LoginPage.css';

function OTPPage() {
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const { email } = location.state || {};

    const handleSubmit = async (e) => {
        e.preventDefault();
        const response = await fetch(`${API_URL}/verify-registration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, otp: otp }),
        });

        if (response.ok) {
            setSuccess('Account verified! Redirecting to login...');
            setTimeout(() => navigate('/user-login'), 2000);
        } else {
            setError('Invalid or expired OTP.');
        }
    };

    const handleResendOTP = async () => {
        setError('');
        setSuccess('');
        if (!email) {
            setError('User email not found. Please register again.');
            return;
        }
        try {
            const response = await fetch(`${API_URL}/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email }),
            });
            const data = await response.json();
            if (response.ok) {
                setSuccess('A new verification code has been sent to your email.');
            } else {
                setError(data.detail || 'Failed to resend OTP.');
            }
        } catch (err) {
            setError('Failed to contact server to resend OTP.');
        }
    };

    return (
        <div className="login-container">
            <h1 className="app-title">Sagar Suraksha</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Verify Your Account</h2>
                <p>A 6-digit code was sent to {email}</p>
                <div className="form-group">
                    <label>OTP Code:</label>
                    <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength="6" required />
                </div>
                {error && <p className="error-message">{error}</p>}
                {success && <p style={{ color: 'green' }}>{success}</p>}
                <button type="submit">Verify Account</button>
                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                    <button 
                        type="button" 
                        onClick={handleResendOTP} 
                        style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: '#42a5f5', 
                            cursor: 'pointer', 
                            textDecoration: 'underline',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}
                    >
                        Resend OTP Code
                    </button>
                </div>
            </form>
        </div>
    );
}
export default OTPPage;