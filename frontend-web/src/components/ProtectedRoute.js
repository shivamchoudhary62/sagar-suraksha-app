// in src/components/ProtectedRoute.js
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

// The component now accepts a 'roles' prop
function ProtectedRoute({ children, roles }) {
    const auth = useAuth();
    const location = useLocation();

    // 1. Check if the user is logged in
    if (!auth.token || !auth.user) {
        // Redirect them to the landing page if not logged in
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. Check if the user has the required role
    // The 'roles' prop is an array like ['admin'] or ['user']
    const hasRequiredRole = roles ? roles.includes(auth.user.role) : true;

    if (!hasRequiredRole) {
        // If logged in but wrong role, redirect to a safe page
        // For example, an admin trying to access a user-only page or vice versa
        return <Navigate to="/" replace />;
    }

    // 3. If all checks pass, show the page
    return children;
}

export default ProtectedRoute;