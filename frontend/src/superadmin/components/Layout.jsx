import React from 'react';
import { Outlet } from 'react-router-dom';
import './superadminlayout.css';
import Navbar from './navbar/Navbar.jsx';
import Header from './header/Header.jsx';
import { SuperAdminProvider } from '../../context/SuperAdminContext.jsx';

export default function SuperAdminLayout() {
  return (
    <SuperAdminProvider>
      <div className="sa-layout">
        <Navbar />
        <div className="sa-main">
          <Header />
          <main className="sa-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SuperAdminProvider>
  );
}


