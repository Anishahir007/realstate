import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiSettings, FiUsers, FiClipboard, FiHome, FiLayout } from 'react-icons/fi';
import './navbar.css';
import { useCompany } from '../../../context/CompanyContext.jsx';

const CompanyPanelNavbar = () => {
  const company = useCompany();
  const name = company?.name;
  const email = company?.email;
  const photo = company?.photo;
  const initials = React.useMemo(() => {
    if (!name) return 'CO';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'CO';
  }, [name]);

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
        <NavLink to="/company/settings/view-profile" className={({ isActive }) => `companypanelnavbar-link${isActive ? ' companypanelnavbar-link-active' : ''}`}>
          <span className="companypanelnavbar-icon"><FiSettings /></span>
          <span>Settings</span>
        </NavLink>
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

