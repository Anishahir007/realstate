import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiSettings, FiUsers, FiClipboard, FiHome, FiPlusSquare, FiLayout } from 'react-icons/fi';
import './navbar.css';
import { useBroker } from '../../../context/BrokerContext.jsx';

const BrokerPanelNavbar = () => {
  const broker = useBroker();
  const name = broker?.name;
  const email = broker?.email;
  const photo = broker?.photo;
  const initials = React.useMemo(() => {
    if (!name) return 'BR';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'BR';
  }, [name]);

  return (
    <aside className="brokerpanelnavbar-sidebar">
      <div className="brokerpanelnavbar-brand">
        <img src="/vite.svg" alt="Logo" />
        <span>Broker Panel</span>
      </div>
      <nav className="brokerpanelnavbar-nav">
        <NavLink to="/broker/dashboard" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiGrid /></span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/broker/users" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiUsers /></span>
          <span>Users</span>
        </NavLink>
        <NavLink to="/broker/crm" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiClipboard /></span>
          <span>CRM</span>
        </NavLink>
        <NavLink to="/broker/properties" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiHome /></span>
          <span>Properties</span>
        </NavLink>
        <NavLink to="/broker/properties/new" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiPlusSquare /></span>
          <span>Post Property</span>
        </NavLink>
        <NavLink to="/broker/templates" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiLayout /></span>
          <span>Templates</span>
        </NavLink>
        <NavLink to="/broker/settings/view-profile" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiSettings /></span>
          <span>Settings</span>
        </NavLink>
      </nav>
      <div className="brokerpanelnavbar-profile">
        <div className="brokerpanelnavbar-profile-avatar">
          {(() => {
            const p = photo;
            if (!p) return <span>{initials}</span>;
            const isHttp = p.startsWith('http://') || p.startsWith('https://');
            const src = isHttp ? p : `${broker.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
            return <img src={src} alt={name || 'User'} />;
          })()}
        </div>
        <div className="brokerpanelnavbar-profile-info">
          <div className="brokerpanelnavbar-profile-name">{name || 'Broker'}</div>
          <div className="brokerpanelnavbar-profile-email">{email || ''}</div>
        </div>
      </div>
    </aside>
  );
};

export default BrokerPanelNavbar;


