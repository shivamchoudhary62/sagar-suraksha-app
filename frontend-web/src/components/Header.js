// in src/components/Header.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom'; // useNavigate is no longer needed here
import './Header.css';

function Header() {
    const auth = useAuth();

    const handleLogout = () => {
        auth.logout();
        // The redirect is now handled automatically by ProtectedRoute
    };

    if (!auth.user) {
        return null;
    }

    return (
        <header className="app-header">
            <div className="logo">
                <Link to={auth.user.role === 'admin' ? '/dashboard' : '/report'}>
                    Sagar Suraksha
                </Link>
            </div>
            <div className="user-menu">
                <span>{auth.user.email}</span>
                {auth.user.role === 'user' && (
                    <Link to="/my-reports">My Reports</Link>
                )}
                <button onClick={handleLogout}>Logout</button>
            </div>
        </header>
    );
}

export default Header;