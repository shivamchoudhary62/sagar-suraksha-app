import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import './LoginPage.css';

function AdminLoginPage() {
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
        const { success, role } = await auth.adminLogin(email, password);
        if (success && role === 'admin') {
            navigate('/dashboard');
        } else {
            setError('Access denied. Please check admin credentials.');
        }
    };

    return (
        <div className="login-container">
            <h1 className="app-title">Sagar Suraksha</h1>
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Admin Login</h2>
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
            </form>
            <div className="back-link">
                <Link to="/">Go Back to Main Page</Link>
            </div>
        </div>
    );
}
export default AdminLoginPage;