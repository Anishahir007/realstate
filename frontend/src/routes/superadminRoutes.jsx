import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import SuperAdminLogin from '../superadmin/superadminlogin.jsx';
import SuperAdminDashboard from '../superadmin/pages/dashboard/Dashboard.jsx';
import SuperAdminLayout from '../superadmin/components/Layout.jsx';
import SuperAdminBroker from '../superadmin/pages/broker/Broker.jsx';
import SuperAdminProperties from '../superadmin/pages/properties/Properties.jsx';
import SuperAdminViewProfile from '../superadmin/pages/settings/view-profile/ViewProfile.jsx';
import SuperAdminAdmincrm from '../superadmin/pages/crm/Admincrm.jsx';
import LeadDetail from '../superadmin/pages/crm/LeadDetail.jsx';
import Reports from '../superadmin/pages/reports/Reports.jsx';
import Notifications from '../superadmin/pages/notifications/Notifications.jsx';
import ManageTemplates from '../superadmin/pages/templates/ManageTemplates.jsx';
import SearchResults from '../superadmin/pages/search/SearchResults.jsx';
import { SuperAdminProvider, useSuperAdmin } from '../context/SuperAdminContext.jsx';
import PortalRoleGate, { ROLE_FALLBACK_ROUTE, resolvePortalRole } from '../superadmin/components/PortalRoleGate.jsx';
import UsersRole from '../superadmin/pages/usersrole/UsersRole.jsx';
import SuperAdminCompany from '../superadmin/pages/company/Company.jsx';

function SuperAdminLandingRedirect() {
  const superAdmin = useSuperAdmin();
  const portalRole = resolvePortalRole(superAdmin?.portalRole);
  const target = ROLE_FALLBACK_ROUTE[portalRole] || ROLE_FALLBACK_ROUTE.super_admin;
  return <Navigate to={target} replace />;
}

export function SuperAdminRoutes() {
  return (
    <>
      <Route path="/superadmin/login" element={<SuperAdminProvider><SuperAdminLogin /></SuperAdminProvider>} />
      <Route
        path="/superadmin"
        element={(
          <SuperAdminProvider>
            <ProtectedRoute allow={[ 'super_admin' ]} redirectTo="/superadmin/login">
              <SuperAdminLandingRedirect />
            </ProtectedRoute>
          </SuperAdminProvider>
        )}
      />
      <Route
        path="/superadmin"
        element={
          <SuperAdminProvider>
            <ProtectedRoute allow={[ 'super_admin' ]} redirectTo="/superadmin/login">
              <SuperAdminLayout />
            </ProtectedRoute>
          </SuperAdminProvider>
        }
      >
        <Route
          path="dashboard"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <SuperAdminDashboard />
            </PortalRoleGate>
          )}
        />
        <Route
          path="brokers"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <SuperAdminBroker />
            </PortalRoleGate>
          )}
        />
        <Route
          path="companies"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <SuperAdminCompany />
            </PortalRoleGate>
          )}
        />
        <Route
          path="properties"
          element={(
            <PortalRoleGate allow={['super_admin', 'property_management']}>
              <SuperAdminProperties />
            </PortalRoleGate>
          )}
        />
        <Route
          path="crm"
          element={(
            <PortalRoleGate allow={['super_admin', 'sales']}>
              <SuperAdminAdmincrm />
            </PortalRoleGate>
          )}
        />
        <Route
          path="crm/lead/:id/:source"
          element={(
            <PortalRoleGate allow={['super_admin', 'sales']}>
              <LeadDetail />
            </PortalRoleGate>
          )}
        />
        <Route
          path="reports"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <Reports />
            </PortalRoleGate>
          )}
        />
        <Route
          path="notifications"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <Notifications />
            </PortalRoleGate>
          )}
        />
        <Route
          path="manage-templates"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <ManageTemplates />
            </PortalRoleGate>
          )}
        />
        <Route
          path="user-roles"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <UsersRole />
            </PortalRoleGate>
          )}
        />
        <Route
          path="settings/view-profile"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <SuperAdminViewProfile />
            </PortalRoleGate>
          )}
        />
        <Route
          path="search"
          element={(
            <PortalRoleGate allow={['super_admin']}>
              <SearchResults />
            </PortalRoleGate>
          )}
        />
      </Route>
      <Route
        path="/superadmin/*"
        element={
          <SuperAdminProvider>
            <ProtectedRoute allow={[ 'super_admin' ]} redirectTo="/superadmin/login">
              <SuperAdminLandingRedirect />
            </ProtectedRoute>
          </SuperAdminProvider>
        }
      />
    </>
  );
}


