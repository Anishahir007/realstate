import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import BrokerDashboard from '../broker/pages/Dashboard.jsx';
import BrokerLayout from '../broker/components/Layout.jsx';
import BrokerViewProfile from '../broker/pages/settings/view-profile/ViewProfile.jsx';
import { BrokerProvider } from '../context/BrokerContext.jsx';

export function BrokerRoutes() {
  return (
    <>
      <Route path="/broker/login" element={<Navigate to="/auth" replace />} />
      <Route path="/broker" element={<Navigate to="/broker/dashboard" replace />} />
      <Route
        path="/broker"
        element={
          <BrokerProvider>
            <ProtectedRoute allow={[ 'broker' ]} redirectTo="/auth">
              <BrokerLayout />
            </ProtectedRoute>
          </BrokerProvider>
        }
      >
        <Route path="dashboard" element={<BrokerDashboard />} />
        <Route path="settings/view-profile" element={<BrokerViewProfile />} />
      </Route>
      <Route
        path="/broker/*"
        element={
          <BrokerProvider>
            <ProtectedRoute allow={[ 'broker' ]} redirectTo="/auth">
              <Navigate to="/broker/dashboard" replace />
            </ProtectedRoute>
          </BrokerProvider>
        }
      />
    </>
  );
}


