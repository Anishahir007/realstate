import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileMenuDropdown, setMobileMenuDropdown] = useState(null);

  const handleDropdownEnter = (menuName) => {
    setActiveDropdown(menuName);
  };

  const handleDropdownLeave = () => {
    setActiveDropdown(null);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setMobileMenuDropdown(null); // Close any open dropdowns
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    setMobileMenuDropdown(null);
  };

  const toggleMobileDropdown = (menuName) => {
    setMobileMenuDropdown(mobileMenuDropdown === menuName ? null : menuName);
  };

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);


  return (
    <>
      <header className="ul-header ul-header--home">
        <div className="ul-header-bottom">
          <div className="ul-header-bottom-wrapper">
            {/* Logo */}
            <div className="header-bottom-left">
              <div className="logo-container">
                <Link
                  className="d-inline-block logo-link"
                  to="/"
                >
                  <img
                    className="logo"
                    alt="logo"
                    src="/assets/images/untitled-design.png"
                  />
                </Link>
              </div>
            </div>

            {/* Navigation */}
            <div className="ul-header-nav-wrapper">
              <div className="to-go-to-sidebar-in-mobile">
                <nav className="ul-header-nav">
                  {/* Home */}
                  <Link
                    to="/"
                    className="menu-item-link"
                  >
                    Home
                  </Link>

                  {/* About */}
                  <Link
                    to="/about-us"
                    className="menu-item-link"
                  >
                    About
                  </Link>

                  {/* Pages Dropdown - Mega Menu */}
                  <div
                    className="has-sub-menu"
                    onMouseEnter={() => handleDropdownEnter('pages')}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      type="button"
                      className="has-sub-menu-button"
                    >
                      Pages
                    </button>
                    <div
                      className={`ul-header-megamenu ${activeDropdown === 'pages' ? 'active' : ''}`}
                    >
                      <div className="ul-header-megamenu-grid">
                        {/* Column 1: Main Pages */}
                        <div className="ul-header-megamenu-column">
                          <h4 className="ul-header-megamenu-title">
                            <i className="fas fa-home" />
                            Main Pages
                          </h4>
                          <ul className="ul-header-megamenu-list">
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/services"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-briefcase" />
                                Services
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/agents"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-users" />
                                Team
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/testimonials"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-star" />
                                Testimonials
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/faq"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-question-circle" />
                                FAQ
                              </Link>
                            </li>
                          </ul>
                        </div>

                        {/* Column 2: Property Pages */}
                        <div className="ul-header-megamenu-column">
                          <h4 className="ul-header-megamenu-title">
                            <i className="fas fa-building" />
                            Properties
                          </h4>
                          <ul className="ul-header-megamenu-list">
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/properties"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-list" />
                                Property List
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/property/single"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-home" />
                                Single Property
                              </Link>
                            </li>
                          </ul>
                        </div>

                        {/* Column 3: Other Pages */}
                        <div className="ul-header-megamenu-column">
                          <h4 className="ul-header-megamenu-title">
                            <i className="fas fa-th" />
                            More Pages
                          </h4>
                          <ul className="ul-header-megamenu-list">
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/process"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-cogs" />
                                How it Works
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/partners"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-handshake" />
                                Partners
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/featured-box"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-box" />
                                Featured Box
                              </Link>
                            </li>
                            <li className="ul-header-megamenu-list-item">
                              <Link
                                to="/elements"
                                className="ul-header-megamenu-link"
                              >
                                <i className="fas fa-puzzle-piece" />
                                UI Elements
                              </Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Blog Dropdown */}
                  <div
                    className="has-sub-menu"
                    onMouseEnter={() => handleDropdownEnter('blog')}
                    onMouseLeave={handleDropdownLeave}
                  >
                    <button
                      type="button"
                      className="has-sub-menu-button"
                    >
                      Blog
                    </button>
                    <div
                      className={`ul-header-submenu ${activeDropdown === 'blog' ? 'active' : ''}`}
                    >
                      <ul>
                        <li>
                          <Link
                            to="/blog"
                            className="ul-header-submenu-link"
                          >
                            Blogs
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/blog/right-sidebar"
                            className="ul-header-submenu-link"
                          >
                            Blog layout 2
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/blog/single-post"
                            className="ul-header-submenu-link"
                          >
                            Blog Details
                          </Link>
                        </li>
                      </ul>
                    </div>
                  </div>

                  {/* Contact */}
                  <Link
                    to="/contact"
                    className="menu-item-link"
                  >
                    Contact
                  </Link>
                </nav>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="ul-header-actions">
              {/* Add Property Button */}
              <Link
                className="add-property-btn d-xxs-none"
                to="/brokers/auth"
              >
                <i className="fas fa-user" />
                <span className="login-text">
                  Login / Signup
                </span>
              </Link>

              {/* Menu Button */}
              <button
                className="ul-header-sidebar-opener"
                type="button"
                aria-label="Toggle menu"
                onClick={toggleMobileMenu}
              >
                <i
                  className={isMobileMenuOpen ? 'fas fa-times' : 'fas fa-bars'}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="mobile-menu-backdrop"
            onClick={closeMobileMenu}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9998,
              transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isMobileMenuOpen ? 1 : 0,
            }}
          />

          {/* Mobile Menu Sidebar */}
          <div
            className="mobile-menu-sidebar"
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 'clamp(280px, 85vw, 320px)',
              height: '100vh',
              backgroundColor: '#d10000',
              zIndex: 9999,
              overflowY: 'auto',
              boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.3)',
              transform: isMobileMenuOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease',
            }}
          >
            {/* Menu Header */}
            <div
              style={{
                padding: 'clamp(15px, 4vw, 20px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'border-color 0.3s ease',
              }}
            >
              <h3 style={{ margin: 0, color: '#fff', fontSize: '20px', fontWeight: 700, transition: 'color 0.3s ease' }}>Menu</h3>
              <button
                onClick={closeMobileMenu}
                type="button"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#fff',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
                aria-label="Close menu"
              >
                <i className="fas fa-times" />
              </button>
            </div>

            {/* Menu Items */}
            <nav
              style={{
                padding: 'clamp(15px, 4vw, 20px)',
              }}
            >
              {/* Home */}
              <div style={{ marginBottom: '15px' }}>
                <Link
                  to="/"
                  onClick={closeMobileMenu}
                  style={{
                    display: 'block',
                    padding: '12px 0',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffebee';
                    e.currentTarget.style.paddingLeft = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.paddingLeft = '0';
                  }}
                >
                  Home
                </Link>
              </div>

              {/* About */}
              <div style={{ marginBottom: '15px' }}>
                <Link
                  to="/about-us"
                  onClick={closeMobileMenu}
                  style={{
                    display: 'block',
                    padding: '12px 0',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffebee';
                    e.currentTarget.style.paddingLeft = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.paddingLeft = '0';
                  }}
                >
                  About
                </Link>
              </div>

              {/* Pages Dropdown */}
              <div style={{ marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={() => toggleMobileDropdown('pages')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffebee';
                    e.currentTarget.style.paddingLeft = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.paddingLeft = '0';
                  }}
                >
                  <span>Pages</span>
                  <i
                    className={`fas fa-chevron-${mobileMenuDropdown === 'pages' ? 'up' : 'down'}`}
                    style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </button>
                {mobileMenuDropdown === 'pages' && (
                  <div
                    style={{
                      paddingLeft: '20px',
                      marginTop: '5px',
                      animation: 'slideDown 0.3s ease',
                    }}
                  >
                    <Link
                      to="/services"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Services
                    </Link>
                    <Link
                      to="/agents"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Team
                    </Link>
                    <Link
                      to="/testimonials"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Testimonials
                    </Link>
                    <Link
                      to="/faq"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      FAQ
                    </Link>
                    <Link
                      to="/properties"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Property List
                    </Link>
                    <Link
                      to="/property/single"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Single Property
                    </Link>
                    <Link
                      to="/process"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Process
                    </Link>
                    <Link
                      to="/"
                      onClick={(e) => {
                        closeMobileMenu();
                        // Scroll to pricing section after navigation
                        setTimeout(() => {
                          const pricingSection = document.getElementById('pricing');
                          if (pricingSection) {
                            pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }, 100);
                      }}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Pricing
                    </Link>
                  </div>
                )}
              </div>

              {/* Blog Dropdown */}
              <div style={{ marginBottom: '15px' }}>
                <button
                  type="button"
                  onClick={() => toggleMobileDropdown('blog')}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 0',
                    background: 'none',
                    border: 'none',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffebee';
                    e.currentTarget.style.paddingLeft = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.paddingLeft = '0';
                  }}
                >
                  <span>Blog</span>
                  <i
                    className={`fas fa-chevron-${mobileMenuDropdown === 'blog' ? 'up' : 'down'}`}
                    style={{
                      marginLeft: '10px',
                      fontSize: '12px',
                      transition: 'transform 0.3s ease',
                    }}
                  />
                </button>
                {mobileMenuDropdown === 'blog' && (
                  <div
                    style={{
                      paddingLeft: '20px',
                      marginTop: '5px',
                      animation: 'slideDown 0.3s ease',
                    }}
                  >
                    <Link
                      to="/blog"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Blog List
                    </Link>
                    <Link
                      to="/blog/single-post"
                      onClick={closeMobileMenu}
                      style={{
                        display: 'block',
                        padding: '10px 0',
                        color: 'rgba(255, 255, 255, 0.9)',
                        textDecoration: 'none',
                        fontSize: '14px',
                        transition: 'all 0.3s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.paddingLeft = '8px';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                        e.currentTarget.style.paddingLeft = '0';
                      }}
                    >
                      Single Blog
                    </Link>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div style={{ marginBottom: '15px' }}>
                <Link
                  to="/contact"
                  onClick={closeMobileMenu}
                  style={{
                    display: 'block',
                    padding: '12px 0',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffebee';
                    e.currentTarget.style.paddingLeft = '8px';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#fff';
                    e.currentTarget.style.paddingLeft = '0';
                  }}
                >
                  Contact
                </Link>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
};

export default Header;
