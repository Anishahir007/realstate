import React from 'react';
import './WhatsAppSection.css';

const WhatsAppSection = () => {
  return (
    <section
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
              className="whatsapp-heading"
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
              WhatsApp Marketing
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
                className="whatsapp-item"
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
                  Integrated with Official WhatsApp Business API
                </span>
              </li>
              <li
                className="whatsapp-item"
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
                  Send offers, discount coupons, and festive greetings without
                  risking number blocking
                </span>
              </li>
              <li
                className="whatsapp-item"
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
                  Send automated follow-up messages to your leads till sales
                  closure
                </span>
              </li>
              <li
                className="whatsapp-item"
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
                  Other WhatsApp Features - Auto Responder, Chatbot, Shared Team
                  Inbox, Analytics and many more
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
                className="fab fa-whatsapp"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(80px, 10vw, 120px)',
                  color: '#25D366',
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

export default WhatsAppSection;

