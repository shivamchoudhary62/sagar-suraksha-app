// in src/components/Layout.js
import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
// No longer importing NavSidebar or Layout.css

function Layout() {
    return (
        <div>
            <Header />
            {/* The Outlet will now render the entire page, e.g., AdminDashboard */}
            <Outlet />
        </div>
    );
}
export default Layout;