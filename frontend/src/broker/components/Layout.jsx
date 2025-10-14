import React from 'react';
import './brokerlayout.css';
import BrokerPanelNavbar from './navbar/Navbar.jsx';
import BrokerPanelHeader from './header/Header.jsx';
import { Outlet } from 'react-router-dom';
import { BrokerProvider } from '../../context/BrokerContext.jsx';

const BrokerLayout = () => {
  return (
    <BrokerProvider>
      <div className="brokerlayout-root">
        <BrokerPanelNavbar />
        <div className="brokerlayout-main">
          <BrokerPanelHeader />
          <main className="brokerlayout-content">
            <Outlet />
          </main>
        </div>
      </div>
    </BrokerProvider>
  );
};

export default BrokerLayout;


