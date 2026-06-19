// in src/pages/RegisterPage.js
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from '../config';
import './LoginPage.css';

function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: password,
                role: 'user'
            }),
        });

        if (response.ok) {
            // This is the crucial part that takes the user to the OTP page
            navigate('/otp', { state: { email: email } });
        } else {
            const data = await response.json();
            setError(data.detail || 'Registration failed. The email may already be in use.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="login-container">
            <h1 className="app-title">Sagar Suraksha</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Register New User</h2>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <div className="password-wrapper">
                        {/* Password field with show/hide functionality can be added here if you want */}
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Registering...' : 'Register'}
                </button>
                <p style={{ marginTop: '1rem' }}>
                    Already have an account? <Link to="/user-login">Login here</Link>
                </p>
            </form>
            <div className="back-link">
                <Link to="/">Go Back to Main Page</Link>
            </div>
        </div>
    );
}

export default RegisterPage;