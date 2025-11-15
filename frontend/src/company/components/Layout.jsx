import React from 'react';
import './companylayout.css';
import CompanyPanelNavbar from './navbar/Navbar.jsx';
import CompanyPanelHeader from './header/Header.jsx';
import { Outlet } from 'react-router-dom';
import { CompanyProvider } from '../../context/CompanyContext.jsx';

const CompanyLayout = () => {
  return (
    <CompanyProvider>
      <div className="companylayout-root">
        <CompanyPanelNavbar />
        <div className="companylayout-main">
          <CompanyPanelHeader />
          <main className="companylayout-content">
            <Outlet />
          </main>
        </div>
      </div>
    </CompanyProvider>
  );
};

export default CompanyLayout;

