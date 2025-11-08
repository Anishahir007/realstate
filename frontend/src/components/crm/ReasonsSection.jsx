import React, { useState, useRef, useEffect } from 'react';
import './ReasonsSection.css';

const ReasonsSection = () => {
  const reasons = [
    {
      title: 'Not just yet another CRM',
      description:
        'All in One Sales Enablement Platform - Sales CRM + WhatsApp Marketing + Call Tracking & Analytics.',
    },
    {
      title: 'Get Guaranteed Success',
      description:
        'Get One-to-One dedicated experts to consult, customize & implement the CRM software for your business.',
    },
    {
      title: 'Simple, Pay as You Grow Pricing',
      description: 'Transparent & Upfront Pricing - Rs.299/user/month.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % reasons.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + reasons.length) % reasons.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }

    // Reset
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <section
      data-aos="fade-up"
      style={{
        boxSizing: 'border-box',
        paddingTop: '30px',
        paddingBottom: '30px',
        backgroundColor: '#f8f9fa',
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
            marginBottom: '20px',
          }}
        >
          <h2
            className="reasons-main-heading"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(26px, 4vw, 35px)',
              fontWeight: 700,
              marginBottom: '0px',
              color: '#000',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            3 Reasons to Consider
          </h2>
        </div>

        {/* Desktop/Tablet Grid Layout */}
        <div
          className="reasons-grid-desktop"
          style={{
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'clamp(30px, 4vw, 50px)',
          }}
        >
          {reasons.map((reason, index) => (
            <div
              key={index}
              data-aos="fade-up"
              data-aos-delay={index * 150}
              style={{
                boxSizing: 'border-box',
                padding: 'clamp(30px, 4vw, 50px)',
                backgroundColor: '#fff',
                borderRadius: 'clamp(15px, 2vw, 25px)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  boxSizing: 'border-box',
                  width: 'clamp(60px, 6vw, 80px)',
                  height: 'clamp(60px, 6vw, 80px)',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(209, 0, 0, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto clamp(20px, 2.5vw, 30px)',
                }}
              >
                <span
                  className="reasons-number"
                  style={{
                    boxSizing: 'border-box',
                    fontSize: 'clamp(28px, 3vw, 36px)',
                    fontWeight: 900,
                    color: '#d10000',
                  }}
                >
                  {index + 1}
                </span>
              </div>
              <h3
                className="reasons-card-title"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(20px, 2.5vw, 28px)',
                  fontWeight: 700,
                  marginBottom: 'clamp(15px, 2vw, 20px)',
                  color: '#000',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {reason.title}
              </h3>
              <p
                className="reasons-card-description"
                style={{
                  boxSizing: 'border-box',
                  fontSize: 'clamp(14px, 1.2vw, 18px)',
                  lineHeight: 1.6,
                  color: '#666',
                  margin: 0,
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                }}
              >
                {reason.description}
              </p>
            </div>
          ))}
        </div>

        {/* Mobile Carousel Layout */}
        <div className="reasons-carousel-mobile">
          <div
            ref={carouselRef}
            className="reasons-carousel-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <div
              className="reasons-carousel-track"
              style={{
                boxSizing: 'border-box',
                display: 'flex',
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: 'transform 0.4s ease-in-out',
              }}
            >
              {reasons.map((reason, index) => (
                <div
                  key={index}
                  className="reasons-carousel-slide"
                  style={{
                    boxSizing: 'border-box',
                    minWidth: '100%',
                    width: '100%',
                    flexShrink: 0,
                    padding: '0 10px',
                  }}
                >
                  <div
                    style={{
                      boxSizing: 'border-box',
                      padding: 'clamp(30px, 4vw, 50px)',
                      backgroundColor: '#fff',
                      borderRadius: 'clamp(15px, 2vw, 25px)',
                      textAlign: 'center',
                      margin: '0 auto',
                      maxWidth: '100%',
                    }}
                  >
                    <div
                      style={{
                        boxSizing: 'border-box',
                        width: 'clamp(60px, 6vw, 80px)',
                        height: 'clamp(60px, 6vw, 80px)',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(209, 0, 0, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto clamp(20px, 2.5vw, 30px)',
                      }}
                    >
                      <span
                        className="reasons-number"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(28px, 3vw, 36px)',
                          fontWeight: 900,
                          color: '#d10000',
                        }}
                      >
                        {index + 1}
                      </span>
                    </div>
                    <h3
                      className="reasons-card-title"
                      style={{
                        boxSizing: 'border-box',
                        fontSize: 'clamp(20px, 2.5vw, 28px)',
                        fontWeight: 700,
                        marginBottom: 'clamp(15px, 2vw, 20px)',
                        color: '#000',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {reason.title}
                    </h3>
                    <p
                      className="reasons-card-description"
                      style={{
                        boxSizing: 'border-box',
                        fontSize: 'clamp(14px, 1.2vw, 18px)',
                        lineHeight: 1.6,
                        color: '#666',
                        margin: 0,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Navigation Buttons */}
          <div
            className="reasons-carousel-nav"
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '20px',
              marginTop: 'clamp(20px, 3vw, 30px)',
            }}
          >
            <button
              onClick={prevSlide}
              className="reasons-carousel-btn reasons-carousel-btn-prev"
              aria-label="Previous slide"
              style={{
                boxSizing: 'border-box',
                width: 'clamp(40px, 5vw, 50px)',
                height: 'clamp(40px, 5vw, 50px)',
                borderRadius: '50%',
                border: '2px solid #d10000',
                backgroundColor: '#fff',
                color: '#d10000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(18px, 2.5vw, 24px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d10000';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#d10000';
              }}
            >
              ‹
            </button>

            {/* Dots Indicator */}
            <div
              className="reasons-carousel-dots"
              style={{
                boxSizing: 'border-box',
                display: 'flex',
                gap: 'clamp(8px, 1.5vw, 12px)',
              }}
            >
              {reasons.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className="reasons-carousel-dot"
                  aria-label={`Go to slide ${index + 1}`}
                  style={{
                    boxSizing: 'border-box',
                    width: currentSlide === index ? 'clamp(24px, 3vw, 32px)' : 'clamp(10px, 1.5vw, 12px)',
                    height: 'clamp(10px, 1.5vw, 12px)',
                    borderRadius: currentSlide === index ? 'clamp(12px, 1.5vw, 16px)' : '50%',
                    border: 'none',
                    backgroundColor: currentSlide === index ? '#d10000' : '#ccc',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    padding: 0,
                  }}
                />
              ))}
            </div>

            <button
              onClick={nextSlide}
              className="reasons-carousel-btn reasons-carousel-btn-next"
              aria-label="Next slide"
              style={{
                boxSizing: 'border-box',
                width: 'clamp(40px, 5vw, 50px)',
                height: 'clamp(40px, 5vw, 50px)',
                borderRadius: '50%',
                border: '2px solid #d10000',
                backgroundColor: '#fff',
                color: '#d10000',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'clamp(18px, 2.5vw, 24px)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d10000';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.color = '#d10000';
              }}
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ReasonsSection;

