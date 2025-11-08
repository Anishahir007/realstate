import React from 'react';
import './ComparisonSection.css';

const ComparisonSection = () => {
  return (
    <section
      data-aos="fade-up"
      style={{
        boxSizing: 'border-box',
        paddingTop: '30px',
        paddingBottom: '0px',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          margin: '0 auto',
          width: '90%',
          maxWidth: '100%',
        }}
      >
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: 'clamp(40px, 5vw, 60px)',
          }}
        >
          <h2
            className="comparison-main-heading"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(24px, 3.5vw, 30px)',
              fontWeight: 700,
              marginBottom: 'clamp(15px, 2vw, 25px)',
              color: '#000',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            Save 70% on CRM Cost. Pay After Successful Implementation.
          </h2>
        </div>

        <div
          className="comparison-grid"
          style={{
            boxSizing: 'border-box',
            marginBottom: 'clamp(40px, 5vw, 60px)',
          }}
        >
          {/* Other CRM */}
          <div
            style={{
              boxSizing: 'border-box',
              padding: 'clamp(12px, 1.5vw, 18px)',
              backgroundColor: '#f8f9fa',
              borderRadius: 'clamp(10px, 1.2vw, 15px)',
              border: '2px solid #e0e0e0',
            }}
          >
            <h3
              className="comparison-card-title"
              style={{
                boxSizing: 'border-box',
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 700,
                marginBottom: 'clamp(8px, 1vw, 12px)',
                marginTop: 0,
                color: '#000',
                textAlign: 'center',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              Other CRM
            </h3>
            <ul
              style={{
                boxSizing: 'border-box',
                listStyle: 'none',
                padding: 0,
                margin: '0 0 clamp(8px, 1vw, 12px) 0',
              }}
            >
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • Lead Management
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • CRM & Automation
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • WhatsApp Marketing
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • Tele Sales Tracking
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • Field Sales Tracking
              </li>
            </ul>
            <div
              style={{
                boxSizing: 'border-box',
                textAlign: 'center',
                paddingTop: 'clamp(8px, 1vw, 12px)',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <div
                className="comparison-label"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(14px, 1.5vw, 18px)',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: 'clamp(4px, 0.6vw, 8px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                Total Cost
              </div>
              <div
                className="comparison-price"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  fontWeight: 700,
                  color: '#d10000',
                  marginBottom: 'clamp(4px, 0.6vw, 8px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                Rs.5,600/User/Month
              </div>
              <div
                className="comparison-note"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#999',
                  marginTop: 'clamp(2px, 0.3vw, 4px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                One Time Implementation Cost
                <br />
                25K to 1.5L
              </div>
            </div>
          </div>

          {/* Cratio CRM */}
          <div
            style={{
              boxSizing: 'border-box',
              padding: 'clamp(12px, 1.5vw, 18px)',
              backgroundColor: '#fff',
              borderRadius: 'clamp(10px, 1.2vw, 15px)',
              border: '3px solid #d10000',
            }}
          >
            <h3
              className="comparison-card-title"
              style={{
                boxSizing: 'border-box',
                fontSize: 'clamp(16px, 2vw, 22px)',
                fontWeight: 700,
                marginBottom: 'clamp(8px, 1vw, 12px)',
                marginTop: 0,
                color: '#000',
                textAlign: 'center',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
              }}
            >
              Cratio CRM
            </h3>
            <ul
              style={{
                boxSizing: 'border-box',
                listStyle: 'none',
                padding: 0,
                margin: '0 0 clamp(8px, 1vw, 12px) 0',
              }}
            >
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • Lead Management
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • CRM & Automation
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • WhatsApp Marketing
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • Tele Sales Tracking
              </li>
              <li
                className="comparison-item"
                style={{
                  boxSizing: 'border-box',
                  padding: 'clamp(2px, 0.4vw, 4px) 0',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#666',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                • Field Sales Tracking
              </li>
            </ul>
            <div
              style={{
                boxSizing: 'border-box',
                textAlign: 'center',
                paddingTop: 'clamp(8px, 1vw, 12px)',
                borderTop: '1px solid #e0e0e0',
              }}
            >
              <div
                className="comparison-label"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(14px, 1.5vw, 18px)',
                  fontWeight: 600,
                  color: '#666',
                  marginBottom: 'clamp(4px, 0.6vw, 8px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                Total Cost
              </div>
              <div
                className="comparison-price"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(24px, 3vw, 36px)',
                  fontWeight: 700,
                  color: '#d10000',
                  marginBottom: 'clamp(4px, 0.6vw, 8px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                Rs.499/User/Month
              </div>
              <div
                className="comparison-note"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(12px, 1vw, 14px)',
                  color: '#999',
                  marginTop: 'clamp(2px, 0.3vw, 4px)',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                One Time Implementation Cost
                <br />
                NIL
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;

