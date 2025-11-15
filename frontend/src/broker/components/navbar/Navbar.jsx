import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiGrid, FiSettings, FiUsers, FiClipboard, FiHome, FiLayout, FiChevronDown, FiUser, FiSliders } from 'react-icons/fi';
import './navbar.css';
import { useBroker } from '../../../context/BrokerContext.jsx';

const BrokerPanelNavbar = () => {
  const broker = useBroker();
  const location = useLocation();
  const name = broker?.name;
  const email = broker?.email;
  const photo = broker?.photo;
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const initials = React.useMemo(() => {
    if (!name) return 'BR';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'BR';
  }, [name]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Check if any settings route is active
  const isSettingsActive = location.pathname.startsWith('/broker/settings');

  const handleSettingsClick = (e) => {
    e.preventDefault();
    setOpenDropdown(openDropdown === 'settings' ? null : 'settings');
  };

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
        <NavLink to="/broker/templates" className={({ isActive }) => `brokerpanelnavbar-link${isActive ? ' brokerpanelnavbar-link-active' : ''}`}>
          <span className="brokerpanelnavbar-icon"><FiLayout /></span>
          <span>Templates</span>
        </NavLink>
        <div className="brokerpanelnavbar-item-wrapper" ref={dropdownRef}>
          <div
            onClick={handleSettingsClick}
            className={`brokerpanelnavbar-link${isSettingsActive ? ' brokerpanelnavbar-link-active' : ''}`}
          >
            <span className="brokerpanelnavbar-icon"><FiSettings /></span>
            <span>Settings</span>
            <span className="brokerpanelnavbar-dropdown-arrow">
              <FiChevronDown style={{ transform: openDropdown === 'settings' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </span>
          </div>
          {openDropdown === 'settings' && (
            <div className="brokerpanelnavbar-dropdown">
              <NavLink
                to="/broker/settings/view-profile"
                className={({ isActive }) => `brokerpanelnavbar-dropdown-item${isActive ? ' brokerpanelnavbar-dropdown-item-active' : ''}`}
                onClick={() => setOpenDropdown(null)}
              >
                <span className="brokerpanelnavbar-icon"><FiUser /></span>
                <span>Profile</span>
              </NavLink>
              <NavLink
                to="/broker/settings/customize"
                className={({ isActive }) => `brokerpanelnavbar-dropdown-item${isActive ? ' brokerpanelnavbar-dropdown-item-active' : ''}`}
                onClick={() => setOpenDropdown(null)}
              >
                <span className="brokerpanelnavbar-icon"><FiSliders /></span>
                <span>Customize</span>
              </NavLink>
            </div>
          )}
        </div>
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


