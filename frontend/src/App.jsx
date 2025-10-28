import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminRoutes } from './routes/superadminRoutes.jsx';
import { BrokerRoutes } from './routes/brokerRoutes.jsx';
import { UserRoutes } from './routes/userRoutes.jsx';
import UnifiedAuth from './components/auth/UnifiedAuth.jsx';
const SiteRenderer = lazy(() => import('./superadmin/templates/SiteRenderer.jsx'));
const DomainSiteRenderer = lazy(() => import('./superadmin/templates/DomainSiteRenderer.jsx'));
const ProClassicPrivacy = lazy(() => import('./superadmin/templates/proclassic/pages/Privacy.jsx'));
const ViewProperty = lazy(() => import('./superadmin/templates/proclassic/pages/ViewProperty.jsx'));
import { HomeSwitch, PropertiesSwitch, AboutSwitch, ContactSwitch } from './superadmin/templates/SitePageSwitch.jsx';
import PreviewRenderer from './superadmin/templates/preview/PreviewRenderer.jsx';
import ClassicHome from './superadmin/templates/classic/pages/home/Home.jsx';
import ClassicProperties from './superadmin/templates/classic/pages/Properties.jsx';
import ClassicAbout from './superadmin/templates/classic/pages/About.jsx';
import ClassicContact from './superadmin/templates/classic/pages/Contact.jsx';

export default function App() {
  const host = typeof window !== 'undefined' ? window.location.host : '';
  const isMainHost = /(^|\.)proker\.xyz$/i.test(host);
  return (
    <BrowserRouter>
      <Suspense fallback={<div style={{ padding: 16 }}>Loading…</div>}>
      <Routes>
        
        {SuperAdminRoutes()}
        {/* Clean custom-domain routes (only on non-main hosts) */}
        {!isMainHost && (
          <Route path="*" element={<DomainSiteRenderer />}>
            <Route index element={<HomeSwitch />} />
            <Route path="properties" element={<PropertiesSwitch />} />
            <Route path="about" element={<AboutSwitch />} />
            <Route path="contact" element={<ContactSwitch />} />
            <Route path="privacy" element={<ProClassicPrivacy />} />
            <Route path="property/:id" element={<ViewProperty />} />
          </Route>
        )}
        {/* Published sites (slug) - dynamic pages by template */}
        <Route path="/site/:slug/*" element={<SiteRenderer />}>
          <Route index element={<HomeSwitch />} />
          <Route path="properties" element={<PropertiesSwitch />} />
          <Route path="about" element={<AboutSwitch />} />
          <Route path="contact" element={<ContactSwitch />} />
          <Route path="property/:id" element={<ViewProperty />} />
        </Route>
        {/* Template preview (uses broker context JSON) */}
        <Route path="/site/preview/:template" element={<PreviewRenderer />} />
    
        {BrokerRoutes()}
        {UserRoutes()}
        <Route path="/auth" element={<UnifiedAuth />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

