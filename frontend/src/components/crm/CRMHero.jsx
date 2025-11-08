import React from 'react';
import { Link } from 'react-router-dom';
import './CRMHero.css';

const CRMHero = () => {
  const topFeatures = [
    {
      icon: 'fas fa-users',
      title: 'Lead Management & Sales CRM',
      alt: 'Cratio Automated Lead Distribution',
    },
    {
      icon: 'fas fa-sync-alt',
      title: 'Sales Workflows & Automation',
      alt: 'Sales Workflows',
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'CRM Sim Based Dialer',
      alt: 'Cratio Mobile Auto Dialer',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Call Tracking & Analytics',
      alt: 'Cratio Call Tracking',
    },
  ];

  const bottomFeatures = [
    {
      icon: 'fab fa-whatsapp',
      title: 'WhatsApp Campaigns',
      alt: 'Cratio WhatsApp marketing',
    },
    {
      icon: 'fas fa-comments',
      title: 'Chatbots & Auto Responders',
      alt: 'Chatbots',
    },
    {
      icon: 'fas fa-bell',
      title: 'Sales Alerts & Reminders',
      alt: 'Reminder',
    },
    {
      icon: 'fas fa-project-diagram',
      title: 'Pre-build Real Estate Workflows',
      alt: 'Real_estate-WorkFlow',
    },
  ];

  return (
    <section
      className="ul-crm-hero"
      data-aos="fade-in"
    >
      {/* Blurred Background Image */}
      <div className="ul-crm-hero-bg" />

      <div className="ul-container">
        {/* White Card Container */}
        <div
          className="ul-crm-hero-card"
          data-aos="fade-up"
          data-aos-duration="800"
        >
        {/* Main Heading */}
        <div className="ul-crm-hero-heading-wrapper">
          <h2 className="ul-crm-hero-heading">
            India's #1 CRM Software for
            <br />
            <span className="hero-highlight">Real Estate Business</span>
          </h2>
        </div>

        {/* Spacer */}
        <div className="ul-crm-hero-spacer ul-crm-hero-spacer-small" />

        {/* Subheading */}
        <div className="ul-crm-hero-subheading-wrapper">
          <h2 className="ul-crm-hero-subheading">
            Designed specifically for real estate developers, agents, and consultants
            handling property sales via Calls and WhatsApp.
          </h2>
        </div>

        {/* Features Grid - 4 columns on desktop */}
        <section className="ul-crm-hero-features-section">
          <div className="ul-crm-hero-features-grid">
            {topFeatures.map((feature, index) => (
              <div
                key={index}
                className="ul-crm-hero-feature-item"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                {/* Top Spacer */}
                <div className="ul-crm-hero-spacer ul-crm-hero-spacer-small" />

                {/* Icon */}
                <div className="ul-crm-hero-icon-wrapper-container">
                  <div className="ul-crm-hero-icon-wrapper">
                    <i className={`${feature.icon} ul-crm-hero-icon`} />
                  </div>
                </div>

                {/* Title */}
                <h2 className="ul-crm-hero-feature-title">
                  {feature.title}
                </h2>
              </div>
            ))}
            {bottomFeatures.map((feature, index) => (
              <div
                key={index + topFeatures.length}
                className="ul-crm-hero-feature-item"
                data-aos="fade-up"
                data-aos-delay={(index + topFeatures.length) * 100}
              >
                {/* Icon */}
                <div className="ul-crm-hero-icon-wrapper-container ul-crm-hero-icon-wrapper-bottom">
                  <div className="ul-crm-hero-icon-wrapper">
                    <i className={`${feature.icon} ul-crm-hero-icon`} />
                  </div>
                </div>

                {/* Title */}
                <h2 className="ul-crm-hero-feature-title">
                  {feature.title}
                </h2>
              </div>
            ))}
          </div>
        </section>

        {/* Spacer before button */}
        <div className="ul-crm-hero-spacer ul-crm-hero-spacer-large" />

        {/* CTA Button */}
        <div className="ul-crm-hero-cta-wrapper">
          <Link
            to="/contact"
            className="elementor-button elementor-button-link elementor-size-sm"
          >
            <span className="elementor-button-content-wrapper">
              <span className="elementor-button-text">Request Demo & Trial</span>
            </span>
          </Link>
        </div>
        </div>
        {/* End White Card Container */}
      </div>
    </section>
  );
};

export default CRMHero;
