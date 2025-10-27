import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './navbar.css'

const Navbar = () => {
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { label: 'For Buyers', to: '#buyers' },
    { label: 'For Tenants', to: '#tenants' },
    { label: 'For Owners', to: '#owners' },
    { label: 'For Dealers / Builders', to: '#dealers' },
    { label: 'Insights', to: '#insights', badge: 'NEW', badgeVariant: 'new' },
    { label: 'Post property', to: '/broker/login', badge: 'FREE', kind: 'button' },
  ]

  const closeMobile = () => setIsMobileOpen(false)

  return (
    <header className="nav-root">
      <div className="nav-container">
        <div className="brand">
          <Link to="/" onClick={closeMobile} className="brand-link" aria-label="Go to home">
            <span className="brand-logo" aria-hidden>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M12 3l8 7h-3v8h-4v-5H11v5H7v-8H4l8-7z"></path>
              </svg>
            </span>
            <span className="brand-text">Logic <span className="brand-dot">Infosoft</span></span>
          </Link>
        </div>

        <nav className="nav-desktop" aria-label="Primary">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.label} className="nav-item">
                {item.kind === 'button' ? (
                  <a href={item.to} className="nav-btn">{item.label}</a>
                ) : item.to.startsWith('#') ? (
                  <a href={item.to} className="nav-link">{item.label}</a>
                ) : (
                  <Link to={item.to} className={`nav-link${location.pathname === item.to ? ' active' : ''}`}>
                    {item.label}
                    {item.badge && <span className={`badge${item.badgeVariant === 'new' ? ' badge--new' : ''}`}>{item.badge}</span>}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-right">
          <Link to="/broker/login" className="login-btn">Login</Link>
          <button
            className="menu-toggle"
            aria-label="Open menu"
            aria-expanded={isMobileOpen}
            onClick={() => setIsMobileOpen(!isMobileOpen)}
          >
            <span className="hamburger" aria-hidden>
              <span></span>
              <span></span>
              <span></span>
            </span>
          </button>
        </div>
      </div>

      <div className={`mobile-sheet${isMobileOpen ? ' open' : ''}`}>
        <div className="mobile-header">
          <span className="mobile-title">Menu</span>
          <button className="mobile-close" aria-label="Close menu" onClick={closeMobile}>✕</button>
        </div>
        <ul className="mobile-list">
          {navItems.map((item) => (
            <li key={`m-${item.label}`} className="mobile-item">
              {item.kind === 'button' ? (
                <a href={item.to} className="mobile-link mobile-btn" onClick={closeMobile}>{item.label}</a>
              ) : item.to.startsWith('#') ? (
                <a href={item.to} className="mobile-link" onClick={closeMobile}>{item.label}</a>
              ) : (
                <Link to={item.to} className="mobile-link" onClick={closeMobile}>
                  {item.label}
                  {item.badge && <span className={`badge${item.badgeVariant === 'new' ? ' badge--new' : ''}`}>{item.badge}</span>}
                </Link>
              )}
            </li>
          ))}
          <li className="mobile-divider" aria-hidden></li>
          <li className="mobile-item">
            <Link to="/superadmin/login" className="mobile-link" onClick={closeMobile}>Super Admin</Link>
          </li>
          <li className="mobile-item">
            <Link to="/broker/login" className="mobile-link" onClick={closeMobile}>Broker Login</Link>
          </li>
        </ul>
      </div>
    </header>
  )
}

export default Navbar

