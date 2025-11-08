import React from 'react';
import './CRMFeatures.css';

const CRMFeatures = () => {
  const features = [
    {
      icon: 'fas fa-user-friends',
      title: 'Sales Leads',
    },
    {
      icon: 'fas fa-calendar-check',
      title: 'Property Booking',
    },
    {
      icon: 'fas fa-building',
      title: 'Properties/Projects Master',
    },
    {
      icon: 'fas fa-file-contract',
      title: 'Real Estate Specific Fields',
    },
    {
      icon: 'fas fa-handshake',
      title: 'Sales Follow-ups',
    },
    {
      icon: 'fas fa-comments',
      title: 'One Click Communication',
    },
    {
      icon: 'fas fa-phone-alt',
      title: 'Built-in Phone dialer',
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Call Tracking & Analytics',
    },
    {
      icon: 'fab fa-whatsapp',
      title: 'WhatsApp Campaigns',
    },
    {
      icon: 'fas fa-sync-alt',
      title: 'WhatsApp Automation',
    },
    {
      icon: 'fas fa-inbox',
      title: 'WhatsApp Team Inbox',
    },
    {
      icon: 'fas fa-robot',
      title: 'WhatsApp Chatbots',
    },
    {
      icon: 'fas fa-star',
      title: 'Lead Scoring/Distribution',
    },
    {
      icon: 'fas fa-chart-bar',
      title: 'Sales Forecasting',
    },
    {
      icon: 'fas fa-bell',
      title: 'Reminders/Notifications',
    },
    {
      icon: 'fas fa-paperclip',
      title: 'Document/File Attachments',
    },
    {
      icon: 'fas fa-chart-pie',
      title: 'Dashboard/Analytics',
    },
    {
      icon: 'fas fa-cogs',
      title: 'CRM Customizations',
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Field-level security',
    },
    {
      icon: 'fas fa-sitemap',
      title: 'Hierarchy-based Restrictions',
    },
    {
      icon: 'fas fa-map-marker-alt',
      title: 'Location-based Restrictions',
    },
    {
      icon: 'fas fa-plug',
      title: 'Native Integrations',
    },
    {
      icon: 'fas fa-cloud',
      title: 'API & Webhooks',
    },
    {
      icon: 'fas fa-database',
      title: 'Data Administration',
    },
  ];

  return (
    <section
      className="crm-features-section"
      data-aos="fade-up"
    >
      <div className="crm-features-container">
        {/* Heading */}
        <div className="crm-features-title-wrapper">
          <h2 className="crm-features-heading">
            All The CRM Features You Need For High Sales Efficiency
          </h2>
        </div>

        {/* Subtitle */}
        <div className="crm-features-subtitle-wrapper">
          <p className="crm-features-subtitle">
            Proker offers everything you need to increase leads, accelerate
            sales, and measure your sales team performance.
          </p>
        </div>

        {/* Features Grid */}
        <div className="crm-features-grid">
          {features.map((feature, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 50}
              className="crm-feature-card"
            >
              {/* Icon */}
              <div className="crm-feature-icon-wrapper">
                <i className={feature.icon} />
              </div>

              {/* Title */}
              <h3 className="crm-feature-title">
                {feature.title}
              </h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CRMFeatures;
