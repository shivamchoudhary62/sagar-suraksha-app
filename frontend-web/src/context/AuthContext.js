// in src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import API_URL from '../config';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [user, setUser] = useState(null);
    const [refetchId, setRefetchId] = useState(0);

    useEffect(() => {
        if (token) {
            try {
                const decodedUser = jwtDecode(token);
                setUser({ email: decodedUser.sub, role: decodedUser.role });
            } catch (error) {
                console.error("Invalid token:", error);
                localStorage.removeItem('token');
                setToken(null);
            }
        }
    }, [token]);

    const saveTokenAndUser = (newToken) => {
        localStorage.setItem('token', newToken);
        const decodedUser = jwtDecode(newToken);
        setToken(newToken);
        setUser({ email: decodedUser.sub, role: decodedUser.role });
        return { success: true, role: decodedUser.role };
    };

    const adminLogin = async (email, password) => {
        const response = await fetch(`${API_URL}/admin/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: email, password: password }),
        });
        if (response.ok) {
            const data = await response.json();
            return saveTokenAndUser(data.access_token);
        }
        return { success: false };
    };

    const userLogin = async (email, password) => {
        const response = await fetch(`${API_URL}/user/token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ username: email, password: password }),
        });
        if (response.ok) {
            const data = await response.json();
            return saveTokenAndUser(data.access_token);
        }
        return { success: false };
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
    };
    
    const triggerRefetch = () => {
        setRefetchId(prevId => prevId + 1);
    };

    return (
        <AuthContext.Provider 
            // CORRECTED: Added refetchId and triggerRefetch to the value object
            value={{ token, user, adminLogin, userLogin, logout, refetchId, triggerRefetch }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};