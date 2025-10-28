import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SuperAdminRoutes } from './routes/superadminRoutes.jsx';
import { BrokerRoutes } from './routes/brokerRoutes.jsx';
import { UserRoutes } from './routes/userRoutes.jsx';
import UnifiedAuth from './components/auth/UnifiedAuth.jsx';
import SiteRenderer from './superadmin/templates/SiteRenderer.jsx';
import DomainSiteRenderer from './superadmin/templates/DomainSiteRenderer.jsx';
import ProClassicLayout from './superadmin/templates/proclassic/layout/ProClassicLayout.jsx';
import ProClassicPrivacy from './superadmin/templates/proclassic/pages/Privacy.jsx';
import { HomeSwitch, PropertiesSwitch, AboutSwitch, ContactSwitch } from './superadmin/templates/SitePageSwitch.jsx';
import PreviewRenderer from './superadmin/templates/preview/PreviewRenderer.jsx';
import ClassicHome from './superadmin/templates/classic/pages/home/Home.jsx';
import ClassicProperties from './superadmin/templates/classic/pages/Properties.jsx';
import ClassicAbout from './superadmin/templates/classic/pages/About.jsx';
import ClassicContact from './superadmin/templates/classic/pages/Contact.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        
        {SuperAdminRoutes()}
        {/* Clean custom-domain routes */}
        <Route path="/" element={<DomainSiteRenderer />}>
          <Route index element={<HomeSwitch />} />
          <Route path="properties" element={<PropertiesSwitch />} />
          <Route path="about" element={<AboutSwitch />} />
          <Route path="contact" element={<ContactSwitch />} />
          <Route path="privacy" element={<ProClassicPrivacy />} />
        </Route>
        {/* Published sites */}
        <Route path="/site/:slug" element={<SiteRenderer />}>
          <Route index element={<ClassicHome />} />
          <Route path="properties" element={<ClassicProperties />} />
          <Route path="about" element={<ClassicAbout />} />
          <Route path="contact" element={<ClassicContact />} />
        </Route>
        {/* Template preview (uses broker context JSON) */}
        <Route path="/site/preview/:template" element={<PreviewRenderer />} />
    
        {BrokerRoutes()}
        {UserRoutes()}
        <Route path="/auth" element={<UnifiedAuth />} />
        <Route path="*" element={<div style={{ padding: 24 }}>Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

