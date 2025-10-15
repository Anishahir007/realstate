import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import SuperAdminLogin from '../superadmin/superadminlogin.jsx';
import SuperAdminDashboard from '../superadmin/pages/dashboard/Dashboard.jsx';
import SuperAdminLayout from '../superadmin/components/Layout.jsx';
import SuperAdminBroker from '../superadmin/pages/broker/Broker.jsx';
import SuperAdminViewProfile from '../superadmin/pages/settings/view-profile/ViewProfile.jsx';
import SuperAdminAdmincrm from '../superadmin/pages/crm/Admincrm.jsx';
import { SuperAdminProvider } from '../context/SuperAdminContext.jsx';

export function SuperAdminRoutes() {
  return (
    <>
      <Route path="/superadmin/login" element={<SuperAdminProvider><SuperAdminLogin /></SuperAdminProvider>} />
      <Route path="/superadmin" element={<Navigate to="/superadmin/dashboard" replace />} />
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
        <Route path="dashboard" element={<SuperAdminDashboard />} />
        <Route path="brokers" element={<SuperAdminBroker />} />
        <Route path="crm" element={<SuperAdminAdmincrm />} />
        <Route path="settings/view-profile" element={<SuperAdminViewProfile />} />
      </Route>
      <Route
        path="/superadmin/*"
        element={
          <SuperAdminProvider>
            <ProtectedRoute allow={[ 'super_admin' ]} redirectTo="/superadmin/login">
              <Navigate to="/superadmin/dashboard" replace />
            </ProtectedRoute>
          </SuperAdminProvider>
        }
      />
    </>
  );
}


