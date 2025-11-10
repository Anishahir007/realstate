import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext.jsx';

export const ROLE_FALLBACK_ROUTE = {
  sales: '/superadmin/crm',
  property_management: '/superadmin/properties',
  super_admin: '/superadmin/dashboard',
};

export function resolvePortalRole(rawRole) {
  if (!rawRole) return 'super_admin';
  return String(rawRole).trim().toLowerCase().replace(/\s+/g, '_') || 'super_admin';
}

export default function PortalRoleGate({ allow = ['super_admin'], children }) {
  const location = useLocation();
  const superAdmin = useSuperAdmin();
  const portalRole = resolvePortalRole(superAdmin?.portalRole);
  const allowedRoles = Array.isArray(allow) && allow.length > 0 ? allow : ['super_admin'];

  if (!allowedRoles.includes(portalRole)) {
    const fallback = ROLE_FALLBACK_ROUTE[portalRole] || ROLE_FALLBACK_ROUTE.super_admin;
    if (location.pathname === fallback) {
      return children ?? null;
    }
    return <Navigate to={fallback} replace />;
  }

  return children ?? null;
}

