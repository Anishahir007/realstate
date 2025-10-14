import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiSettings } from 'react-icons/fi';
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


