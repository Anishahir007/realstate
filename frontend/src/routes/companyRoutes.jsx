import React from 'react';
import { Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute.jsx';
import CompanyDashboard from '../company/pages/Dashboard/Dashboard.jsx';
import CompanyLayout from '../company/components/Layout.jsx';
import { CompanyProvider } from '../context/CompanyContext.jsx';
import CompanyUsers from '../company/pages/users/User.jsx';
import CompanyCrm from '../company/pages/crm/Companycrm.jsx';
import CompanyLeadDetail from '../company/pages/crm/LeadDetail.jsx';
import CompanyPropertiesList from '../company/pages/properties/PropertiesList.jsx';
import CompanyTemplates from '../company/pages/templates/Templates.jsx';
import CompanyNewProperty from '../company/pages/properties/NewProperty.jsx';
import CompanyViewProfile from '../company/pages/settings/view-profile/ViewProfile.jsx';
import CompanyCustomize from '../company/pages/customize/Customize.jsx';
import CompanySearchResults from '../company/pages/search/SearchResults.jsx';

export function CompanyRoutes() {
  return (
    <>
      <Route path="/company/login" element={<Navigate to="/brokers/auth" replace />} />
      <Route path="/company" element={<Navigate to="/company/dashboard" replace />} />
      <Route
        path="/company"
        element={
          <CompanyProvider>
            <ProtectedRoute allow={['company']} redirectTo="/brokers/auth">
              <CompanyLayout />
            </ProtectedRoute>
          </CompanyProvider>
        }
      >
        <Route path="dashboard" element={<CompanyDashboard />} />
        <Route path="users" element={<CompanyUsers />} />
        <Route path="crm" element={<CompanyCrm />} />
        <Route path="crm/lead/:id" element={<CompanyLeadDetail />} />
        <Route path="properties" element={<CompanyPropertiesList />} />
        <Route path="properties/new" element={<CompanyNewProperty />} />
        <Route path="settings/view-profile" element={<CompanyViewProfile />} />
        <Route path="settings/customize" element={<CompanyCustomize />} />
        <Route path="templates" element={<CompanyTemplates />} />
        <Route path="search" element={<CompanySearchResults />} />
      </Route>
      <Route
        path="/company/*"
        element={
          <CompanyProvider>
            <ProtectedRoute allow={['company']} redirectTo="/brokers/auth">
              <Navigate to="/company/dashboard" replace />
            </ProtectedRoute>
          </CompanyProvider>
        }
      />
    </>
  );
}

