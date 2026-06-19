// in src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute'; 

import LandingPage from './pages/LandingPage';
import AdminLoginPage from './pages/AdminLoginPage';
import UserLoginPage from './pages/UserLoginPage';
import RegisterPage from './pages/RegisterPage';
import OTPPage from './pages/OTPPage';
import AdminDashboard from './pages/AdminDashboard';
import SubmitReportPage from './pages/SubmitReportPage';
import MyReportsPage from './pages/MyReportsPage';

function App() {
    return (
        <AuthProvider>
            <Toaster position="top-center" />
            <BrowserRouter>
                <Routes>
                    {/* --- Public Routes --- */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/admin-login" element={<AdminLoginPage />} />
                    <Route path="/user-login" element={<UserLoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/otp" element={<OTPPage />} />

                    {/* --- Protected Routes with Layout --- */}
                    <Route element={<Layout />}>
                        {/* Admin-Only Route */}
                        <Route 
                            path="/dashboard" 
                            element={
                                <ProtectedRoute roles={['admin']}>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            } 
                        />
                        {/* User-Only Routes */}
                        <Route 
                            path="/report" 
                            element={
                                <ProtectedRoute roles={['user']}>
                                    <SubmitReportPage />
                                </ProtectedRoute>
                            } 
                        />
                        <Route 
                            path="/my-reports" 
                            element={
                                <ProtectedRoute roles={['user']}>
                                    <MyReportsPage />
                                </ProtectedRoute>
                            } 
                        />
                    </Route>
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;