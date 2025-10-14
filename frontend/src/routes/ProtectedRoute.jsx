import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSuperAdmin } from '../context/SuperAdminContext.jsx';
import { useBroker } from '../context/BrokerContext.jsx';
import { useAppUser } from '../context/UserRoleContext.jsx';

export default function ProtectedRoute({ allow, redirectTo = '/auth', children }) {
  const location = useLocation();

  const sa = (() => { try { return useSuperAdmin(); } catch { return null; } })();
  const broker = (() => { try { return useBroker(); } catch { return null; } })();
  const appUser = (() => { try { return useAppUser(); } catch { return null; } })();

  const roleToState = {
    super_admin: sa,
    broker: broker,
    user: appUser,
  };

  const isAllowed = Array.isArray(allow) && allow.length > 0 ? allow.some((r) => roleToState[r]?.isAuthenticated) : (sa?.isAuthenticated || broker?.isAuthenticated || appUser?.isAuthenticated);

  if (!isAllowed) return <Navigate to={redirectTo} replace state={{ from: location }} />;
  return children;
}


