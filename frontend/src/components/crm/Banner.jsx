import React from 'react';
import { Link } from 'react-router-dom';
import './Banner.css';

const Banner = () => {
  return (
    <div
      className="swiper-slide swiper-slide-active"
      aria-label="1 / 3"
      role="group"
      style={{
        boxSizing: 'border-box',
        flexShrink: 0,
        height: '100%',
        position: 'relative',
        transitionProperty: 'transform',
        display: 'block',
        transform: 'translateZ(0px)',
        backfaceVisibility: 'hidden',
        width: '100%',
        listStyleType: 'none',
        listStyle: 'outside none none',
      }}
    >
      <div
        className="ul-banner-slide"
        style={{
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
          padding: 'clamp(150px, 16.29vw, 310px) clamp(15px, 5.25vw, 100px) clamp(180px, 12.61vw, 240px)',
        }}
      >
        {/* Blurred background layer */}
        <div
          className="ul-banner-slide-bg"
          style={{
            background: 'url("/assets/images/home/banner-slide-1.jpg") center center / cover no-repeat',
          }}
        />
        <div
          className="ul-banner-container"
          style={{
            boxSizing: 'border-box',
            margin: 'auto',
            maxWidth: '1920px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            className="row align-items-center flex-sm-row flex-column-reverse"
            style={{
              boxSizing: 'border-box',
              display: 'flex',
              flexWrap: 'wrap',
              marginTop: '0px',
              marginRight: 'calc(-.5 * 1.5rem)',
              marginLeft: 'calc(-.5 * 1.5rem)',
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <div
              className="col-md-9 col-sm-8"
              style={{
                boxSizing: 'border-box',
                maxWidth: '100%',
                paddingRight: 'calc(1.5rem * .5)',
                paddingLeft: 'calc(1.5rem * .5)',
                marginTop: '0',
                flex: '0 0 auto',
                flexShrink: 0,
                width: '75%',
              }}
            >
              <span
                className="ul-banner-slide-shadow-title"
                style={{
                  boxSizing: 'border-box',
                  WebkitTextStroke: '2px rgba(255, 255, 255, 0.46)',
                  position: 'absolute',
                  top: '-40px',
                  left: '-20px',
                  fontWeight: 800,
                  fontSize: 'clamp(50px, 15.76vw, 300px)',
                  lineHeight: '100%',
                  letterSpacing: '-0.03em',
                  color: 'transparent',
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              >
                PROKER
              </span>
              <div
                className="ul-banner-slide-txt wow animate__fadeInUp"
                style={{
                  boxSizing: 'border-box',
                  color: '#fff',
                  visibility: 'visible',
                  animationName: 'fadeInUp',
                  animationDuration: '1s',
                }}
              >
                <span
                  className="ul-banner-slide-sub-title"
                  style={{
                    boxSizing: 'border-box',
                    fontWeight: 400,
                    fontSize: 'clamp(13px, 0.84vw, 16px)',
                    letterSpacing: '0.25em',
                    textTransform: 'uppercase',
                    marginBottom: 'clamp(10px, 1.26vw, 24px)',
                    display: 'inline-block',
                  }}
                >
                  your Luxury Residence
                </span>
                <h1
                  className="ul-banner-slide-title"
                  style={{
                    boxSizing: 'border-box',
                    marginTop: '0px',
                    fontSize: 'clamp(30px, 5.25vw, 100px)',
                    fontWeight: 900,
                    lineHeight: '112%',
                    letterSpacing: '-0.02em',
                    marginBottom: 'clamp(7px, 0.89vw, 17px)',
                    maxWidth: '70%',
                    color: '#fff',
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  All-in-one ERP for real estate.
                </h1>
                <p
                  className="ul-banner-slide-descr"
                  style={{
                    boxSizing: 'border-box',
                    marginTop: '0px',
                    lineHeight: 1.75,
                    fontSize: 'clamp(16px, 1.16vw, 22px)',
                    marginBottom: 'clamp(20px, 2.89vw, 55px)',
                    maxWidth: '55%',
                  }}
                >
                  Build websites, list properties, manage leads and teams, 
                  and close more deals — all from one dashboard.
                </p>
                <div
                  className="ul-banner-slide-btns"
                  style={{ boxSizing: 'border-box' }}
                >
                  <Link
                    className="ul-btn"
                    to="/properties"
                    style={{
                      boxSizing: 'border-box',
                      transition: '0.4s',
                      textDecoration: 'none',
                      borderRadius: '999px',
                      gap: 'clamp(12px, 1.05vw, 20px)',
                      padding: '0px clamp(15px, 1.26vw, 24px)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 'clamp(45px, 2.84vw, 54px)',
                      fontWeight: 600,
                      fontSize: 'clamp(13px, 0.84vw, 16px)',
                      position: 'relative',
                      backgroundColor: '#d10000',
                      color: '#fff',
                      border: '1px solid #d10000',
                    }}
                  >
                    Explore Pricing
                  </Link>
                </div>
              </div>
            </div>
            <div
              className="col-md-3 col-sm-4"
              style={{
                boxSizing: 'border-box',
                maxWidth: '100%',
                paddingRight: 'calc(1.5rem * .5)',
                paddingLeft: 'calc(1.5rem * .5)',
                marginTop: '0',
                flex: '0 0 auto',
                flexShrink: 0,
                width: '25%',
              }}
            >
              <div
                className="ul-banner-slide-img wow animate__fadeInUp"
                style={{
                  boxSizing: 'border-box',
                  position: 'relative',
                  width: 'max-content',
                  maxWidth: '100%',
                  marginLeft: 'clamp(0px, 2.63vw, 50px)',
                  visibility: 'visible',
                  animationName: 'fadeInUp',
                  animationDuration: '1s',
                }}
              >
                <img
                  alt="Banner Image"
                  src="/assets/images/home/h1.jpg"
                  style={{
                    boxSizing: 'border-box',
                    verticalAlign: 'middle',
                    transition: '0.4s',
                    maxWidth: '100%',
                    borderRadius: '999px',
                    width: 'clamp(178px, 12.51vw, 238px)',
                    aspectRatio: '1 / 1',
                    objectFit: 'cover',
                  }}
                />
                <a
                  className="ul-banner-slide-video-btn"
                  href="https://youtu.be/4jnzf1yj48M?si=owDQ6MQLmVy0r56E"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    boxSizing: 'border-box',
                    transition: '0.4s',
                    textDecoration: 'none',
                    background: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '50%',
                    position: 'absolute',
                    width: 'clamp(52px, 4.83vw, 92px)',
                    aspectRatio: '1 / 1',
                    right: '0px',
                    top: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#d10000',
                  }}
                >
                  <i
                    className="fas fa-play"
                    style={{
                      boxSizing: 'border-box',
                      display: 'inline-flex',
                      fontSize: 'clamp(16px, 1.58vw, 30px)',
                      marginLeft: '4px',
                    }}
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Banner;

