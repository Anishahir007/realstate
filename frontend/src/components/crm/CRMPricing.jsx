import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './CRMPricing.css';

const CRMPricing = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  

  // Pricing plans for carousel
  const pricingPlans = [
    {
      id: 'basic',
      name: 'Free Plan',
      price: '₹0',
      period: '/user/year',
      oldPrice: '₹499/year',
      features: [
        'Lead Management',
        'Basic CRM Features',
        'Max 3 listings',
        'Up to 5 Users',
        'Email-only support',
      ],
      isPopular: false,
    },
    {
      id: 'advanced',
      name: 'Classic Plan',
      price: '₹4,999',
      period: '/user/year',
      oldPrice: '₹9,999/year',
      features: [
        'Lead Management',
        'Basic Role Management',
        'Max 100 listings',
        'Up to 10 Users',
        'Chat + Email',
      ],
      isPopular: true,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '₹9,999',
      period: '/user/month',
      oldPrice: '₹15,199/month',
      features: [
        'All Advanced Features',
        'unlimited listings',
        'Dedicated Manager, Admin, Agent, Viewer',
        '24/7 Support',
        '25 Users',
      ],
      isPopular: false,
    },
  ];

  // Auto-slide functionality (mobile only)
  useEffect(() => {
    const checkAndStartAutoSlide = () => {
      const isMobile = window.innerWidth <= 767;
      if (!isMobile || isPaused) return null;

      return setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % pricingPlans.length);
      }, 4000); // Auto-advance every 4 seconds
    };

    let timer = checkAndStartAutoSlide();

    // Handle window resize
    const handleResize = () => {
      if (timer) clearInterval(timer);
      timer = checkAndStartAutoSlide();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [isPaused, pricingPlans.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % pricingPlans.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + pricingPlans.length) % pricingPlans.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true); // Pause auto-slide on touch
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) {
      setTouchStart(0);
      setTouchEnd(0);
      setIsPaused(false); // Resume if no swipe
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    }
    if (isRightSwipe) {
      prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
    // Resume auto-slide after 5 seconds
    setTimeout(() => setIsPaused(false), 5000);
  };

  return (
    <section
      id="pricing"
      data-aos="fade-up"
      style={{
        boxSizing: 'border-box',
        backgroundColor: '#fff',
      }}
    >
      <div
        className="pricing-container"
        style={{
          boxSizing: 'border-box',
          margin: 'auto',
          maxWidth: '1200px',
          paddingLeft: 'clamp(15px, 3vw, 30px)',
          paddingRight: 'clamp(15px, 3vw, 30px)',
          width: '100%',
        }}
      >
        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: '20px',
          }}
        />

        {/* Pricing Plans Heading */}
        <div
          style={{
            boxSizing: 'border-box',
            textAlign: 'center',
            marginBottom: '10px',
          }}
        >
          <h2
            className="pricing-special-offer-heading"
            style={{
              boxSizing: 'border-box',
              fontSize: 'clamp(24px, 3vw, 36px)',
              fontWeight: 700,
              color: '#000',
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
            }}
          >
            Choose Your Plan
          </h2>
        </div>

        {/* Desktop/Tablet Grid Layout */}
        <div className="pricing-desktop-grid">
          <div
            className="pricing-grid-container"
            style={{
              boxSizing: 'border-box',
              display: 'grid',
              gap: 'clamp(20px, 3vw, 30px)',
              width: '100%',
            }}
          >
            {pricingPlans.map((plan) => (
              <div
                key={plan.id}
                className="pricing-plan-card"
                style={{
                  boxSizing: 'border-box',
                  background: plan.isPopular 
                    ? 'linear-gradient(135deg, rgba(209, 0, 0, 0.1) 0%, rgba(139, 0, 0, 0.15) 100%)' 
                    : 'linear-gradient(135deg, rgba(209, 0, 0, 0.05) 0%, rgba(139, 0, 0, 0.1) 100%)',
                  borderRadius: 'clamp(15px, 2vw, 25px)',
                  padding: 'clamp(25px, 3.5vw, 40px)',
                  border: plan.isPopular ? '3px solid #d10000' : '2px solid #e0e0e0',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 'clamp(450px, 50vw, 550px)',
                  width: '100%',
                }}
              >
                {plan.isPopular && (
                  <div
                    style={{
                      boxSizing: 'border-box',
                      position: 'absolute',
                      top: 'clamp(15px, 2vw, 20px)',
                      right: 'clamp(15px, 2vw, 20px)',
                      backgroundColor: '#d10000',
                      color: '#fff',
                      padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 16px)',
                      borderRadius: '20px',
                      fontSize: 'clamp(10px, 1.2vw, 12px)',
                      fontWeight: 600,
                    }}
                  >
                    Popular
                  </div>
                )}

                {/* Plan Name */}
                <div
                  style={{
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    marginTop: plan.isPopular ? 'clamp(35px, 5vw, 45px)' : '0',
                    marginBottom: 'clamp(20px, 3vw, 30px)',
                  }}
                >
                  <h2
                    className="pricing-discount-heading"
                    style={{
                      boxSizing: 'border-box',
                      fontSize: 'clamp(28px, 4vw, 36px)',
                      fontWeight: 700,
                      color: '#d10000',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {plan.name}
                  </h2>
                </div>

                {/* Pricing */}
                <div
                  style={{
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    marginBottom: 'clamp(20px, 3vw, 30px)',
                  }}
                >
                  <h2
                    className="pricing-old-price"
                    style={{
                      boxSizing: 'border-box',
                      fontSize: 'clamp(16px, 2vw, 20px)',
                      fontWeight: 400,
                      color: '#999',
                      textDecoration: 'line-through',
                      marginBottom: 'clamp(8px, 1vw, 12px)',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {plan.oldPrice}
                  </h2>

                  <h2
                    className="pricing-new-price"
                    style={{
                      boxSizing: 'border-box',
                      fontSize: 'clamp(36px, 5vw, 48px)',
                      fontWeight: 700,
                      color: '#d10000',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      marginBottom: 'clamp(8px, 1vw, 12px)',
                    }}
                  >
                    {plan.price}
                    <span style={{ fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 500 }}>
                      {plan.period}
                    </span>
                  </h2>
                </div>

                {/* Features */}
                <ul
                  style={{
                    boxSizing: 'border-box',
                    listStyle: 'none',
                    padding: 0,
                    margin: '0 0 clamp(25px, 4vw, 35px) 0',
                    flex: 1,
                  }}
                >
                  {plan.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="pricing-feature-text"
                      style={{
                        boxSizing: 'border-box',
                        padding: 'clamp(10px, 1.5vw, 14px) 0',
                        fontSize: 'clamp(14px, 1.8vw, 18px)',
                        lineHeight: 1.6,
                        color: '#333',
                        display: 'flex',
                        alignItems: 'flex-start',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                    >
                      <i
                        className="fas fa-check"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(14px, 1.8vw, 18px)',
                          color: '#d10000',
                          marginRight: 'clamp(10px, 1.5vw, 15px)',
                          marginTop: '2px',
                          flexShrink: 0,
                        }}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Link
                  to="/contact"
                  className="pricing-cta-button"
                  style={{
                    boxSizing: 'border-box',
                    padding: 'clamp(12px, 2vw, 16px) clamp(25px, 4vw, 40px)',
                    backgroundColor: plan.isPopular ? '#d10000' : '#fff',
                    color: plan.isPopular ? '#fff' : '#d10000',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: 'clamp(14px, 2vw, 18px)',
                    transition: '0.3s',
                    display: 'inline-block',
                    textAlign: 'center',
                    border: plan.isPopular ? 'none' : '2px solid #d10000',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#b00000';
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.borderColor = '#b00000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = plan.isPopular ? '#d10000' : '#fff';
                    e.currentTarget.style.color = plan.isPopular ? '#fff' : '#d10000';
                    e.currentTarget.style.borderColor = '#d10000';
                  }}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Carousel Layout */}
        <div className="pricing-carousel-mobile">
          <div
            ref={carouselRef}
            className="pricing-carousel-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            style={{
              boxSizing: 'border-box',
              position: 'relative',
              overflow: 'hidden',
              width: '100%',
            }}
          >
            <div
              className="pricing-carousel-track"
              style={{
                boxSizing: 'border-box',
                display: 'flex',
                transform: `translateX(-${currentSlide * 100}%)`,
                transition: 'transform 0.4s ease-in-out',
              }}
            >
              {pricingPlans.map((plan, index) => (
                <div
                  key={plan.id}
                  className="pricing-carousel-slide"
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
                      background: plan.isPopular 
                        ? 'linear-gradient(135deg, rgba(209, 0, 0, 0.1) 0%, rgba(139, 0, 0, 0.15) 100%)' 
                        : 'linear-gradient(135deg, rgba(209, 0, 0, 0.05) 0%, rgba(139, 0, 0, 0.1) 100%)',
                      borderRadius: 'clamp(15px, 2vw, 25px)',
                      padding: 'clamp(25px, 3.5vw, 40px)',
                      marginBottom: 'clamp(15px, 2vw, 25px)',
                      border: plan.isPopular ? '3px solid #d10000' : '2px solid #e0e0e0',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: 'clamp(400px, 70vw, 500px)',
                    }}
                  >
                    {plan.isPopular && (
                      <div
                        style={{
                          boxSizing: 'border-box',
                          position: 'absolute',
                          top: 'clamp(15px, 2vw, 20px)',
                          right: 'clamp(15px, 2vw, 20px)',
                          backgroundColor: '#d10000',
                          color: '#fff',
                          padding: 'clamp(4px, 0.8vw, 8px) clamp(12px, 2vw, 16px)',
                          borderRadius: '20px',
                          fontSize: 'clamp(10px, 1.2vw, 12px)',
                          fontWeight: 600,
                        }}
                      >
                        Popular
                      </div>
                    )}

                    {/* Plan Name */}
                    <div
                      style={{
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        marginTop: plan.isPopular ? 'clamp(35px, 5vw, 45px)' : '0',
                        marginBottom: 'clamp(20px, 3vw, 30px)',
                      }}
                    >
                      <h2
                        className="pricing-discount-heading"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(28px, 4vw, 36px)',
                          fontWeight: 700,
                          color: '#d10000',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {plan.name}
                      </h2>
                    </div>

                    {/* Pricing */}
                    <div
                      style={{
                        boxSizing: 'border-box',
                        textAlign: 'center',
                        marginBottom: 'clamp(20px, 3vw, 30px)',
                      }}
                    >
                      <h2
                        className="pricing-old-price"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(16px, 2vw, 20px)',
                          fontWeight: 400,
                          color: '#999',
                          textDecoration: 'line-through',
                          marginBottom: 'clamp(8px, 1vw, 12px)',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
                        {plan.oldPrice}
                      </h2>

                      <h2
                        className="pricing-new-price"
                        style={{
                          boxSizing: 'border-box',
                          fontSize: 'clamp(36px, 5vw, 48px)',
                          fontWeight: 700,
                          color: '#d10000',
                          wordWrap: 'break-word',
                          overflowWrap: 'break-word',
                          marginBottom: 'clamp(8px, 1vw, 12px)',
                        }}
                      >
                        {plan.price}
                        <span style={{ fontSize: 'clamp(14px, 2vw, 18px)', fontWeight: 500 }}>
                          {plan.period}
                        </span>
                      </h2>
                    </div>

                    {/* Features */}
                    <ul
                      style={{
                        boxSizing: 'border-box',
                        listStyle: 'none',
                        padding: 0,
                        margin: '0 0 clamp(25px, 4vw, 35px) 0',
                        flex: 1,
                      }}
                    >
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="pricing-feature-text"
                          style={{
                            boxSizing: 'border-box',
                            padding: 'clamp(10px, 1.5vw, 14px) 0',
                            fontSize: 'clamp(14px, 1.8vw, 18px)',
                            lineHeight: 1.6,
                            color: '#333',
                            display: 'flex',
                            alignItems: 'flex-start',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                          }}
                        >
                          <i
                            className="fas fa-check"
                            style={{
                              boxSizing: 'border-box',
                              fontSize: 'clamp(14px, 1.8vw, 18px)',
                              color: '#d10000',
                              marginRight: 'clamp(10px, 1.5vw, 15px)',
                              marginTop: '2px',
                              flexShrink: 0,
                            }}
                          />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Link
                      to="/contact"
                      className="pricing-cta-button"
                      style={{
                        boxSizing: 'border-box',
                        padding: 'clamp(12px, 2vw, 16px) clamp(25px, 4vw, 40px)',
                        backgroundColor: plan.isPopular ? '#d10000' : '#fff',
                        color: plan.isPopular ? '#fff' : '#d10000',
                        borderRadius: '999px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 'clamp(14px, 2vw, 18px)',
                        transition: '0.3s',
                        display: 'inline-block',
                        textAlign: 'center',
                        border: plan.isPopular ? 'none' : '2px solid #d10000',
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#b00000';
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = '#b00000';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = plan.isPopular ? '#d10000' : '#fff';
                        e.currentTarget.style.color = plan.isPopular ? '#fff' : '#d10000';
                        e.currentTarget.style.borderColor = '#d10000';
                      }}
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Navigation */}
          <div
            className="pricing-carousel-nav"
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 'clamp(15px, 2vw, 20px)',
              marginTop: 'clamp(15px, 2vw, 25px)',
            }}
          >
            <button
              onClick={() => {
                prevSlide();
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
              }}
              className="pricing-carousel-btn pricing-carousel-btn-prev"
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
              className="pricing-carousel-dots"
              style={{
                boxSizing: 'border-box',
                display: 'flex',
                gap: 'clamp(6px, 1.2vw, 10px)',
              }}
            >
              {pricingPlans.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    goToSlide(index);
                    setIsPaused(true);
                    setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
                  }}
                  className="pricing-carousel-dot"
                  aria-label={`Go to slide ${index + 1}`}
                  style={{
                    boxSizing: 'border-box',
                    width: currentSlide === index ? 'clamp(20px, 2.8vw, 28px)' : 'clamp(8px, 1.2vw, 10px)',
                    height: 'clamp(8px, 1.2vw, 10px)',
                    borderRadius: currentSlide === index ? 'clamp(10px, 1.4vw, 14px)' : '50%',
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
              onClick={() => {
                nextSlide();
                setIsPaused(true);
                setTimeout(() => setIsPaused(false), 5000); // Resume after 5 seconds
              }}
              className="pricing-carousel-btn pricing-carousel-btn-next"
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

        {/* Spacer */}
        <div
          style={{
            boxSizing: 'border-box',
            height: 'clamp(20px, 3vw, 40px)',
          }}
        />
      </div>
    </section>
  );
};

export default CRMPricing;
