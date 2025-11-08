import React from 'react';

const TrustSection = () => {
  return (
    <section
      style={{
        boxSizing: 'border-box',
        paddingTop: '50px',
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
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 700,
              marginBottom: 'clamp(15px, 2vw, 25px)',
              color: '#000',
            }}
          >
            Real Estate CRM Software Trusted by 100,000+ Users
          </h2>
          <p
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(16px, 1.5vw, 22px)',
              color: '#666',
              marginBottom: 'clamp(20px, 2.5vw, 30px)',
            }}
          >
            15+ Years Experience in Sales Automation. Loved by 1000+ Customers
            in India
          </p>
        </div>
      </div>
    </section>
  );
};

export default TrustSection;

