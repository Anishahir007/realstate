import React from 'react';
import { Link } from 'react-router-dom';
import './CRMTestimonials.css';

const CRMTestimonials = () => {
  const testimonials = [
    {
      rating: 5,
      text: 'CRM with Integrated WhatsApp and telephony is a game changer for us',
      textMobile: 'CRM with Integrated WhatsApp and telephony is a game changer for us',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Residygroup.png',
      alt: 'Residy Group',
    },
    {
      rating: 5,
      text: 'All needed features for managing telecaller and sales team members',
      textMobile: 'All needed features for managing 1000+ users',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Century_real_estate.png',
      alt: 'Century Real Estate',
    },
    {
      rating: 5,
      text: 'We saved 70% on our monthly CRM bills',
      textMobile: 'We saved 70% on our monthly CRM bills',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Discounted-Logo.png',
      alt: 'Discounted Homes',
    },
    {
      rating: 5,
      text: 'Support is very responsive and good',
      textMobile: 'Support is very responsive and good',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/sherna-logo-new.png',
      alt: 'Sherna Properties',
    },
    {
      rating: 5,
      text: 'After evaluating 5+ vendors we found Cratio as best',
      textMobile: 'After evaluating 5+ vendors we found Cratio as best',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/Qubic.png',
      alt: 'Qubic Properties',
    },
    {
      rating: 5,
      text: 'Cratio is user friendly and flexible',
      textMobile: 'Cratio is user friendly and flexible',
      logo: 'https://cratiocrm.com/wp-content/uploads/2023/07/5elementsrealty-logo.png',
      alt: '5 Elements Realty',
    },
  ];

  const StarRating = ({ rating }) => {
    return (
      <div
        style={{
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: 'center',
          gap: 'clamp(2px, 0.3vw, 4px)',
          marginBottom: 'clamp(15px, 2vw, 20px)',
        }}
      >
        {[...Array(5)].map((_, i) => (
          <i
            key={i}
            className="fas fa-star"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: i < rating ? '#FFD700' : '#ddd',
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <section
      data-aos="fade-up"
      style={{
        boxSizing: 'border-box',
        paddingTop: '20px',
        paddingBottom: '10px',
        backgroundColor: '#d10000',
      }}
    >
      <div
        style={{
          boxSizing: 'border-box',
          margin: 'auto',
          maxWidth: '1240px',
          paddingLeft: 'calc(30px / 2)',
          paddingRight: 'calc(30px / 2)',
        }}
      >
        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: '0px',
          }}
        />

        {/* Heading - Desktop */}
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: 'clamp(20px, 3vw, 30px)',
            display: 'none',
          }}
          className="ul-desktop-only"
        >
          <h2
            className="testimonials-main-heading"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 700,
              color: '#fff',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            Here's why our customers love us
          </h2>
        </div>

        {/* Heading - Mobile */}
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: '0px',
          }}
          className="ul-mobile-only"
        >
          <h2
            className="testimonials-main-heading-mobile"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 700,
              color: '#fff',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            Here's why our
            <br />
            customers love us
          </h2>
        </div>

        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: '0px',
          }}
        />

        {/* First Row of Testimonials */}
        <div
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(20px, 3vw, 30px)',
            marginBottom: 'clamp(30px, 4vw, 40px)',
          }}
        >
          {testimonials.slice(0, 3).map((testimonial, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 100}
              style={{
                boxSizing: 'border-box',
                textAlign: 'center',
                padding: 'clamp(25px, 3vw, 35px)',
                backgroundColor: '#fff',
                borderRadius: 'clamp(12px, 1.5vw, 20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              <StarRating rating={testimonial.rating} />
              <h3
                className="testimonial-text ul-desktop-only"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(13px, 1.3vw, 18px)',
                  fontWeight: 600,
                  color: '#000',
                  marginBottom: 'clamp(20px, 2.5vw, 30px)',
                  lineHeight: 1.5,
                  display: 'none',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {testimonial.text}
              </h3>
              <h3
                className="testimonial-text ul-mobile-only"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(13px, 1.3vw, 18px)',
                  fontWeight: 600,
                  color: '#000',
                  marginBottom: 'clamp(20px, 2.5vw, 30px)',
                  lineHeight: 1.5,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {testimonial.textMobile}
              </h3>
              <div
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '50px',
                }}
              >
                <img
                  src={testimonial.logo}
                  alt={testimonial.alt}
                  style={{
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    height: '50px',
                    objectFit: 'contain',
                    filter: 'grayscale(0%)',
                    opacity: 1,
                    transition: 'filter 0.3s ease, opacity 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                    e.currentTarget.style.opacity = 1;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                    e.currentTarget.style.opacity = 1;
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Second Row of Testimonials */}
        <div
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(20px, 3vw, 30px)',
            marginBottom: 'clamp(40px, 5vw, 60px)',
          }}
        >
          {testimonials.slice(3, 6).map((testimonial, index) => (
            <div
              key={index + 3}
              data-aos="fade-up"
              data-aos-delay={(index + 3) * 100}
              style={{
                boxSizing: 'border-box',
                textAlign: 'center',
                padding: 'clamp(25px, 3vw, 35px)',
                backgroundColor: '#fff',
                borderRadius: 'clamp(12px, 1.5vw, 20px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              <StarRating rating={testimonial.rating} />
              <h3
                className="testimonial-text"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(13px, 1.3vw, 18px)',
                  fontWeight: 600,
                  color: '#000',
                  marginBottom: 'clamp(20px, 2.5vw, 30px)',
                  lineHeight: 1.5,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {testimonial.text}
              </h3>
              {index === 1 && (
                <div
                  style={{
                    boxSizing: 'border-box',
                    height: 'clamp(20px, 3vw, 30px)',
                  }}
                />
              )}
              <div
                style={{
                  boxSizing: 'border-box',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '50px',
                }}
              >
                <img
                  src={testimonial.logo}
                  alt={testimonial.alt}
                  style={{
                    boxSizing: 'border-box',
                    maxWidth: '100%',
                    height: '50px',
                    objectFit: 'contain',
                    filter: 'grayscale(0%)',
                    opacity: 1,
                    transition: 'filter 0.3s ease, opacity 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                    e.currentTarget.style.opacity = 1;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'grayscale(0%)';
                    e.currentTarget.style.opacity = 1;
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Rating Logo Image - Desktop */}
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: 'clamp(30px, 4vw, 40px)',
            display: 'none',
            backgroundColor: '#fff',
            borderRadius: 'clamp(12px, 1.5vw, 20px)',
            padding: '0px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
          className="ul-desktop-only"
        >
          <img
            src="https://cratiocrm.com/wp-content/uploads/2023/07/rating-logo.jpg"
            alt="Company Ratings"
            style={{
              boxSizing: 'border-box',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>

        {/* Rating Logo Image - Mobile */}
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: 'clamp(30px, 4vw, 40px)',
          }}
          className="ul-mobile-only"
        >
          <img
            src="https://cratiocrm.com/wp-content/uploads/2023/07/rating-logo.jpg"
            alt="Company Ratings"
            style={{
              boxSizing: 'border-box',
              maxWidth: '100%',
              height: 'auto',
            }}
          />
        </div>

        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: '0px',
          }}
        />

        {/* CTA Button */}
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: 'clamp(20px, 3vw, 30px)',
          }}
        >
          <Link
            to="/contact"
            className="testimonials-cta-button"
            style={{
              boxSizing: 'border-box',
              padding: 'clamp(12px, 1.5vw, 16px) clamp(30px, 4vw, 50px)',
              backgroundColor: '#fff',
              color: '#d10000',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 'clamp(14px, 1.5vw, 18px)',
              transition: '0.3s',
              display: 'inline-block',
              border: '2px solid #fff',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f0f0';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Request Demo & Trial
          </Link>
        </div>

        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: '0px',
          }}
        />
      </div>

      <style>{`
        @media (min-width: 768px) {
          .ul-desktop-only {
            display: block !important;
          }
          .ul-mobile-only {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .ul-desktop-only {
            display: none !important;
          }
          .ul-mobile-only {
            display: block !important;
          }
        }
      `}</style>
    </section>
  );
};

export default CRMTestimonials;
