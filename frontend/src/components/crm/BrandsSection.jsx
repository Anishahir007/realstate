import React from 'react';
import './BrandsSection.css';

const BrandsSection = () => {
  const brands = [
    {
      name: 'RAHEJA UNIVERSAL',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Raheja.png',
    },
    {
      name: 'Vardhan Group',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/varadhan_group.png',
    },
    {
      name: 'ABI Infrastructure',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Abi_infrastructure.png',
    },
    {
      name: 'TopPropMart',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Top-Prop_mart.png',
    },
    {
      name: 'PARKER Premier Real Estate',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/parker-premier.png',
    },
    {
      name: 'Godrej PROPERTIES',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/godrej-properties-logo_new.png',
    },
    {
      name: 'Discounted Homes',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Discounted-Logo.png',
    },
    {
      name: 'HOLISTIC NATURE HOMES',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Holistic_Nature_homes-1-new.png',
    },
    {
      name: 'QUBIC PROPERTIES',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Qubic.png',
    },
    {
      name: 're-live Solutions',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Relivesolution.jpg',
    },
  ];


  return (
    <section
      data-aos="fade-up"
      style={{
        boxSizing: 'border-box',
        paddingTop: '0px',
        paddingBottom: '0px',
        backgroundColor: '#d10000',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          margin: 'auto',
          maxWidth: '1200px',
          paddingLeft: '15px',
          paddingRight: '15px',
        }}
      >
        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: 'clamp(30px, 4vw, 50px)',
          }}
        />

        {/* Main Heading */}
        <h2
          className="brands-section-heading"
          style={{
            boxSizing: 'border-box',
            fontSize: 'clamp(22px, 4vw, 35px)',
            fontWeight: 700,
            textAlign: 'center',
            margin: 0,
            color: '#fff',
            lineHeight: 1.3,
            padding: '0 clamp(10px, 2vw, 20px)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          Real Estate CRM Software Trusted by 100,000+ Users
        </h2>

        {/* Subheading */}
        <p
          className="brands-section-subheading"
          style={{
            boxSizing: 'border-box',
            fontSize: 'clamp(14px, 2.2vw, 20px)',
            fontWeight: 700,
            textAlign: 'center',
            margin: 'clamp(8px, 1.5vw, 15px) 0',
            color: '#fff',
            lineHeight: 1.5,
            padding: '0 clamp(10px, 2vw, 20px)',
            wordWrap: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          15+ Years Experience in Sales Automation. Loved by 1000+ Customers in India
        </p>

        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: 'clamp(30px, 4vw, 50px)',
          }}
        />

        {/* Brands Grid - 2 rows, 5 columns (works for all devices) */}
        <div
          className="brands-grid"
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gridTemplateRows: 'repeat(2, 1fr)',
            gap: 'clamp(10px, 2vw, 30px)',
          }}
        >
          {brands.map((brand, index) => (
            <div
              key={index}
              className="brand-card"
              data-aos="zoom-in"
              data-aos-delay={index * 50}
              style={{
                boxSizing: 'border-box',
                backgroundColor: '#fff',
                borderRadius: 'clamp(12px, 1.5vw, 24px)',
                padding: 'clamp(12px, 2vw, 30px)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                aspectRatio: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <img
                src={brand.logo}
                alt={brand.name}
                loading="lazy"
                className="brand-logo"
                style={{
                  boxSizing: 'border-box',
                  maxWidth: '90%',
                  maxHeight: '90%',
                  height: 'auto',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                }}
              />
            </div>
          ))}
        </div>

        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: 'clamp(30px, 4vw, 50px)',
          }}
        />
      </div>
    </section>
  );
};

export default BrandsSection;
