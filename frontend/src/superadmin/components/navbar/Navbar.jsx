import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiUsers, FiHome, FiGlobe, FiBarChart2, FiBell, FiSettings, FiClipboard } from 'react-icons/fi';
import './navbar.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

export default function Navbar() {
  const superAdmin = useSuperAdmin();
  const name = superAdmin?.name;
  const email = superAdmin?.email;
  const photo = superAdmin?.photo;
  const initials = React.useMemo(() => {
    if (!name) return 'SA';
    const parts = String(name).trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const second = parts[1]?.[0] || '';
    return (first + second).toUpperCase() || 'SA';
  }, [name]);

  return (
    <aside className="superadminnavbar-sidebar">
      <div className="superadminnavbar-brand">
        <img src="/vite.svg" alt="Logo" />
        <span>Super Admin</span>
      </div>
      <nav className="superadminnavbar-nav">
        <NavLink to="/superadmin/dashboard" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiGrid /></span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/superadmin/brokers" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiUsers /></span>
          <span>Brokers</span>
        </NavLink>

        <NavLink to="/superadmin/crm" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiClipboard /></span>
          <span>CRM</span>
        </NavLink>

        <NavLink to="/superadmin/properties" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiHome /></span>
          <span>Manage Property</span>
        </NavLink>

        <NavLink to="/superadmin/manage-templates" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiGlobe /></span>
          <span>Manage Website</span>
        </NavLink>

        <NavLink to="/superadmin/reports" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiBarChart2 /></span>
          <span>Reports</span>
        </NavLink>

        <NavLink to="/superadmin/notifications" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiBell /></span>
          <span>Notifications</span>
        </NavLink>

        <NavLink to="/superadmin/settings/view-profile" className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}>
          <span className="superadminnavbar-icon"><FiSettings /></span>
          <span>System Settings</span>
        </NavLink>
      </nav>
      <div className="superadminnavbar-profile">
        <div className="superadminnavbar-profile-avatar">
          {(() => {
            const p = photo;
            if (!p) return <span>{initials}</span>;
            const isHttp = p.startsWith('http://') || p.startsWith('https://');
            const src = isHttp ? p : `${superAdmin.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
            return <img src={src} alt={name || 'User'} />;
          })()}
        </div>
        <div className="superadminnavbar-profile-info">
          <div className="superadminnavbar-profile-name">{name || 'Super Admin'}</div>
          <div className="superadminnavbar-profile-email">{email || 'admin@realestate.com'}</div>
        </div>
      </div>
    </aside>
  );
}


