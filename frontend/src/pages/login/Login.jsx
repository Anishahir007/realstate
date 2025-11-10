import React from 'react';

import Header from '../../components/crm/Header.jsx';
import CRMHero from '../../components/crm/CRMHero.jsx';
import CRMFeatures from '../../components/crm/CRMFeatures.jsx';
import BrandsSection from '../../components/crm/BrandsSection.jsx';
import Banner from '../../components/crm/Banner.jsx';
import UltimateCRMSection from '../../components/crm/UltimateCRMSection.jsx';
import LeadManagementSection from '../../components/crm/LeadManagementSection.jsx';
import WhatsAppSection from '../../components/crm/WhatsAppSection.jsx';
import ReasonsSection from '../../components/crm/ReasonsSection.jsx';
import TrustSection from '../../components/crm/TrustSection.jsx';
import ComparisonSection from '../../components/crm/ComparisonSection.jsx';
import CRMTestimonials from '../../components/crm/CRMTestimonials.jsx';
import CRMPricing from '../../components/crm/CRMPricing.jsx';
import Footer from '../../components/crm/Footer.jsx';

const Login = () => {
  return (
    <div className="crm-page">
      <Header />
      <main>
        <CRMHero />
        <CRMFeatures />
        <BrandsSection />
        <Banner />
        <UltimateCRMSection />
        <LeadManagementSection />
        <WhatsAppSection />
        <ReasonsSection />
        <TrustSection />
        <ComparisonSection />
        <CRMTestimonials />
        <CRMPricing />
      </main>
      <Footer />
    </div>
  );
};

export default Login;


