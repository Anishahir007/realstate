import React from 'react';
import './LeadManagementSection.css';

const LeadManagementSection = () => {
  return (
    <section
      style={{
        boxSizing: 'border-box',
        paddingTop: '50px',
        paddingBottom: '0px',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          margin: 'auto',
          maxWidth: 'calc(clamp(940px, 61.48vw, 1170px) + 30px)',
          paddingLeft: 'calc(30px / 2)',
          paddingRight: 'calc(30px / 2)',
        }}
      >
        <div
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: 'clamp(40px, 5vw, 60px)',
            alignItems: 'center',
          }}
        >
          <div style={{ boxSizing: 'border-box' }}>
            <h2
              className="lead-management-heading"
              style={{
                boxSizing: 'border-box',
                fontSize: 'clamp(28px, 3.5vw, 48px)',
                fontWeight: 700,
                marginBottom: 'clamp(20px, 2.5vw, 30px)',
                color: '#000',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              Real Estate Specific Lead Management & CRM
            </h2>
            <ul
              style={{
                boxSizing: 'border-box',
                listStyle: 'none',
                padding: 0,
                margin: 0,
              }}
            >
              <li
                className="lead-management-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(10px, 1.5vw, 15px) 0',
                  fontSize: 'clamp(14px, 1.2vw, 18px)',
                  lineHeight: 1.6,
                  color: '#666',
                  display: 'flex',
                  alignItems: 'flex-start',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <span
                  style={{
                    boxSizing: 'border-box',
                    color: '#d10000',
                    marginRight: 'clamp(10px, 1.5vw, 15px)',
                    fontSize: 'clamp(16px, 1.5vw, 20px)',
                  }}
                >
                  •
                </span>
                <span>
                  Integrated with FB Ads, Google Ads, Magicbricks, 99acres,
                  Housing.com, & 30+ other sources
                </span>
              </li>
              <li
                className="lead-management-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(10px, 1.5vw, 15px) 0',
                  fontSize: 'clamp(14px, 1.2vw, 18px)',
                  lineHeight: 1.6,
                  color: '#666',
                  display: 'flex',
                  alignItems: 'flex-start',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <span
                  style={{
                    boxSizing: 'border-box',
                    color: '#d10000',
                    marginRight: 'clamp(10px, 1.5vw, 15px)',
                    fontSize: 'clamp(16px, 1.5vw, 20px)',
                  }}
                >
                  •
                </span>
                <span>
                  Effortlessly capture and assign leads to sales agents in
                  real-time
                </span>
              </li>
              <li
                className="lead-management-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(10px, 1.5vw, 15px) 0',
                  fontSize: 'clamp(14px, 1.2vw, 18px)',
                  lineHeight: 1.6,
                  color: '#666',
                  display: 'flex',
                  alignItems: 'flex-start',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <span
                  style={{
                    boxSizing: 'border-box',
                    color: '#d10000',
                    marginRight: 'clamp(10px, 1.5vw, 15px)',
                    fontSize: 'clamp(16px, 1.5vw, 20px)',
                  }}
                >
                  •
                </span>
                <span>
                  Manage Leads, Customers, Properties/ Projects Master, Sales
                  Follow-ups, and Reminders seamlessly
                </span>
              </li>
              <li
                className="lead-management-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(10px, 1.5vw, 15px) 0',
                  fontSize: 'clamp(14px, 1.2vw, 18px)',
                  lineHeight: 1.6,
                  color: '#666',
                  display: 'flex',
                  alignItems: 'flex-start',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                <span
                  style={{
                    boxSizing: 'border-box',
                    color: '#d10000',
                    marginRight: 'clamp(10px, 1.5vw, 15px)',
                    fontSize: 'clamp(16px, 1.5vw, 20px)',
                  }}
                >
                  •
                </span>
                <span>
                  Access Reports, Dashboards, and Over 100 CRM Features for
                  Enhanced Sales Performance
                </span>
              </li>
            </ul>
          </div>
          <div style={{ boxSizing: 'border-box', textAlign: 'center' }}>
            <div
              style={{
                boxSizing: 'border-box',
                width: '100%',
                maxWidth: '500px',
                margin: '0 auto',
                backgroundColor: '#f8f9fa',
                borderRadius: '20px',
                padding: 'clamp(30px, 4vw, 50px)',
              }}
            >
              <i
                className="fas fa-users"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(80px, 10vw, 120px)',
                  color: '#d10000',
                  marginBottom: 'clamp(20px, 2.5vw, 30px)',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeadManagementSection;

