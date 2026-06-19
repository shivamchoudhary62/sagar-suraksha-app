import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

function UserLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const auth = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // RESTORED: This is the login logic that was missing
        const { success } = await auth.userLogin(email, password);
        if (success) {
            navigate('/report');
        } else {
            setError('Failed to log in. Please check credentials or verify your account.');
        }
    };

    return (
        <div className="login-container">
            <h1 className="app-title">Sagar Suraksha</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>User Login</h2>
                <div className="form-group">
                    <label>Email:</label>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Password:</label>
                    <div className="password-wrapper">
                        <input 
                            type={showPassword ? 'text' : 'password'}
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                        />
                        <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? '🙈' : '👁️'}
                        </span>
                    </div>
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Login</button>
                <p style={{ marginTop: '1rem' }}>
                    Don't have an account? <Link to="/register">Register here</Link>
                </p>
            </form>
            <div className="back-link">
                <Link to="/">Go Back to Main Page</Link>
            </div>
        </div>
    );
}
export default UserLoginPage;