import React, { useEffect } from 'react';
import Header from '../../components/crm/Header.jsx';
import Footer from '../../components/crm/Footer.jsx';
import CRMHero from '../../components/crm/CRMHero.jsx';
import CRMFeatures from '../../components/crm/CRMFeatures.jsx';
import CRMPricing from '../../components/crm/CRMPricing.jsx';
import CRMTestimonials from '../../components/crm/CRMTestimonials.jsx';
import UltimateCRMSection from '../../components/crm/UltimateCRMSection.jsx';
import ReasonsSection from '../../components/crm/ReasonsSection.jsx';
import BrandsSection from '../../components/crm/BrandsSection.jsx';

const Home = () => {
  useEffect(() => {
    // Load external scripts after component mounts
    const loadScript = (src) => {
      return new Promise((resolve, reject) => {
        // Check if script is already loaded
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) {
          // Wait a bit to ensure script is fully loaded
          setTimeout(() => resolve(), 100);
          return;
        }

        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => {
          console.warn(`Failed to load script: ${src}`);
          resolve(); // Continue even if script fails
        };
        document.body.appendChild(script);
      });
    };

    // Sequential script loading to ensure dependencies are ready
    const loadScriptsSequentially = async () => {
      try {
        // 1. Load jQuery first
        if (!window.jQuery) {
          await loadScript('/assets/js/jquery.min.js');
          // Wait a bit for jQuery to be fully initialized
          let attempts = 0;
          while (!window.jQuery && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        }

        // 2. Load Magnific Popup (requires jQuery)
        if (!window.jQuery || !window.jQuery.fn.magnificPopup) {
          await loadScript('/assets/js/jquery.magnific-popup.min.js');
          // Wait a bit for Magnific Popup to be fully initialized
          let attempts = 0;
          while (window.jQuery && !window.jQuery.fn.magnificPopup && attempts < 50) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        }

        // 3. Load other scripts (can be parallel)
        await Promise.all([
          loadScript('/assets/js/bootstrap.bundle.min.js'),
          loadScript('/assets/js/jquery.countdown.js'),
          loadScript('/assets/js/jquery.countTo.js'),
          loadScript('/assets/js/lozad.min.js'),
          loadScript('/assets/js/aos.js'),
          loadScript('/assets/js/flickity.pkgd.min.js'),
          loadScript('/assets/js/masonry.pkgd.min.js'),
        ]);

        // 4. Load global.js last (requires all dependencies)
        await loadScript('/assets/js/global.js');

        // Initialize Bootstrap dropdowns after all scripts are loaded
        if (window.jQuery) {
          window.jQuery(document).ready(function($) {
            // Initialize dropdowns
            $('.dropdown-toggle').on('click', function(e) {
              e.preventDefault();
              $(this).next('.dropdown-menu').toggle();
            });
          });
        }
      } catch (error) {
        console.error('Error loading scripts:', error);
      }
    };

    // Start loading scripts
    loadScriptsSequentially();
  }, []);

  return (
    <div className="App" style={{ paddingTop: 0 }}>
      <Header />
      <article className="entry">
        <div className="entry-content">
          {/* CRM Hero Section */}
          <CRMHero />

          {/* Brands Section */}
          <BrandsSection />

          {/* CRM Pricing Section */}
          <CRMPricing />

          {/* CRM Testimonials Section */}
          <CRMTestimonials />

          {/* Ultimate CRM Section */}
          <UltimateCRMSection />

          {/* 3 Reasons Section */}
          <ReasonsSection />

          {/* CRM Features Section */}
          <CRMFeatures />
        </div>
      </article>
      <Footer />
    </div>
  );
};

export default Home;
