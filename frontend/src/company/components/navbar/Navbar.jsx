import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { FiGrid, FiSettings, FiUsers, FiClipboard, FiHome, FiLayout, FiChevronDown, FiUser, FiSliders } from 'react-icons/fi';
import './navbar.css';
import { useCompany } from '../../../context/CompanyContext.jsx';

const CompanyPanelNavbar = () => {
  const company = useCompany();
  const location = useLocation();
  const name = company?.name;
  const email = company?.email;
  const photo = company?.photo;
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  const initials = React.useMemo(() => {
    if (!name) return 'CO';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'CO';
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
  const isSettingsActive = location.pathname.startsWith('/company/settings');

  const handleSettingsClick = (e) => {
    e.preventDefault();
    setOpenDropdown(openDropdown === 'settings' ? null : 'settings');
  };

  return (
    <aside className="companypanelnavbar-sidebar">
      <div className="companypanelnavbar-brand">
        <img src="/vite.svg" alt="Logo" />
        <span>Company Panel</span>
      </div>
      <nav className="companypanelnavbar-nav">
        <NavLink to="/company/dashboard" className={({ isActive }) => `companypanelnavbar-link${isActive ? ' companypanelnavbar-link-active' : ''}`}>
          <span className="companypanelnavbar-icon"><FiGrid /></span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/company/users" className={({ isActive }) => `companypanelnavbar-link${isActive ? ' companypanelnavbar-link-active' : ''}`}>
          <span className="companypanelnavbar-icon"><FiUsers /></span>
          <span>Users</span>
        </NavLink>
        <NavLink to="/company/crm" className={({ isActive }) => `companypanelnavbar-link${isActive ? ' companypanelnavbar-link-active' : ''}`}>
          <span className="companypanelnavbar-icon"><FiClipboard /></span>
          <span>CRM</span>
        </NavLink>
        <NavLink to="/company/properties" className={({ isActive }) => `companypanelnavbar-link${isActive ? ' companypanelnavbar-link-active' : ''}`}>
          <span className="companypanelnavbar-icon"><FiHome /></span>
          <span>Properties</span>
        </NavLink>
        <NavLink to="/company/templates" className={({ isActive }) => `companypanelnavbar-link${isActive ? ' companypanelnavbar-link-active' : ''}`}>
          <span className="companypanelnavbar-icon"><FiLayout /></span>
          <span>Templates</span>
        </NavLink>
        <div className="companypanelnavbar-item-wrapper" ref={dropdownRef}>
          <div
            onClick={handleSettingsClick}
            className={`companypanelnavbar-link${isSettingsActive ? ' companypanelnavbar-link-active' : ''}`}
          >
            <span className="companypanelnavbar-icon"><FiSettings /></span>
            <span>Settings</span>
            <span className="companypanelnavbar-dropdown-arrow">
              <FiChevronDown style={{ transform: openDropdown === 'settings' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
            </span>
          </div>
          {openDropdown === 'settings' && (
            <div className="companypanelnavbar-dropdown">
              <NavLink
                to="/company/settings/view-profile"
                className={({ isActive }) => `companypanelnavbar-dropdown-item${isActive ? ' companypanelnavbar-dropdown-item-active' : ''}`}
                onClick={() => setOpenDropdown(null)}
              >
                <span className="companypanelnavbar-icon"><FiUser /></span>
                <span>Profile</span>
              </NavLink>
              <NavLink
                to="/company/settings/customize"
                className={({ isActive }) => `companypanelnavbar-dropdown-item${isActive ? ' companypanelnavbar-dropdown-item-active' : ''}`}
                onClick={() => setOpenDropdown(null)}
              >
                <span className="companypanelnavbar-icon"><FiSliders /></span>
                <span>Customize</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>
      <div className="companypanelnavbar-profile">
        <div className="companypanelnavbar-profile-avatar">
          {(() => {
            const p = photo;
            if (!p) return <span>{initials}</span>;
            const isHttp = p.startsWith('http://') || p.startsWith('https://');
            const src = isHttp ? p : `${company.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
            return <img src={src} alt={name || 'User'} />;
          })()}
        </div>
        <div className="companypanelnavbar-profile-info">
          <div className="companypanelnavbar-profile-name">{name || 'Company'}</div>
          <div className="companypanelnavbar-profile-email">{email || ''}</div>
        </div>
      </div>
    </aside>
  );
};

export default CompanyPanelNavbar;

