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
        
        
        <Route path="properties" element={<SuperAdminProperties />} />
        <Route path="crm" element={<SuperAdminAdmincrm />} />
        <Route path="crm/lead/:id/:source" element={<LeadDetail />} />
        <Route path="reports" element={<Reports />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="manage-templates" element={<ManageTemplates />} />
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


