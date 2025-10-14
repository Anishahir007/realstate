import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import BrokerDashboard from '../broker/components/Dashboard.jsx';
import { BrokerProvider } from '../context/BrokerContext.jsx';

export function BrokerRoutes() {
  return (
    <>
      <Route path="/broker/login" element={<Navigate to="/auth" replace />} />
      <Route path="/broker" element={<Navigate to="/broker/dashboard" replace />} />
      <Route
        path="/broker/dashboard"
        element={
          <BrokerProvider>
            <ProtectedRoute allow={[ 'broker' ]} redirectTo="/auth">
              <BrokerDashboard />
            </ProtectedRoute>
          </BrokerProvider>
        }
      />
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


