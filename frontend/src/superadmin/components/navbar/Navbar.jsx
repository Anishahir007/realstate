import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiGrid, FiUsers, FiHome, FiGlobe, FiBarChart2, FiBell, FiSettings, FiClipboard, FiShield } from 'react-icons/fi';
import './navbar.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

const NAV_ITEMS = [
  {
    key: 'dashboard',
    to: '/superadmin/dashboard',
    label: 'Dashboard',
    icon: <FiGrid />,
    roles: ['super_admin'],
  },
  {
    key: 'brokers',
    to: '/superadmin/brokers',
    label: 'Brokers',
    icon: <FiUsers />,
    roles: ['super_admin'],
  },
  {
    key: 'crm',
    to: '/superadmin/crm',
    label: 'CRM',
    icon: <FiClipboard />,
    roles: ['super_admin', 'sales'],
  },
  {
    key: 'properties',
    to: '/superadmin/properties',
    label: 'Manage Property',
    icon: <FiHome />,
    roles: ['super_admin', 'property_management'],
  },
  {
    key: 'templates',
    to: '/superadmin/manage-templates',
    label: 'Manage Website',
    icon: <FiGlobe />,
    roles: ['super_admin'],
  },
  {
    key: 'user-roles',
    to: '/superadmin/user-roles',
    label: 'User Roles',
    icon: <FiShield />,
    roles: ['super_admin'],
  },
  {
    key: 'reports',
    to: '/superadmin/reports',
    label: 'Reports',
    icon: <FiBarChart2 />,
    roles: ['super_admin'],
  },
  {
    key: 'notifications',
    to: '/superadmin/notifications',
    label: 'Notifications',
    icon: <FiBell />,
    roles: ['super_admin'],
  },
  {
    key: 'settings',
    to: '/superadmin/settings/view-profile',
    label: 'System Settings',
    icon: <FiSettings />,
    roles: ['super_admin'],
  },
];

export default function Navbar() {
  const superAdmin = useSuperAdmin();
  const name = superAdmin?.name;
  const email = superAdmin?.email;
  const photo = superAdmin?.photo;
  const portalRole = superAdmin?.portalRole || 'super_admin';
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
        {NAV_ITEMS.filter(item => item.roles.includes(portalRole)).map(item => (
          <NavLink
            key={item.key}
            to={item.to}
            className={({ isActive }) => `superadminnavbar-link${isActive ? ' superadminnavbar-link-active' : ''}`}
          >
            <span className="superadminnavbar-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
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


