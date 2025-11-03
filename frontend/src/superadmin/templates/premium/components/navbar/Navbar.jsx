import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiBase } from '../../../../../utils/apiBase.js';
import './navbar.css';

export default function Navbar({ site: siteProp }) {
  const { slug = '' } = useParams();
  const base = slug ? `/site/${slug}` : '';
  const [menuOpen, setMenuOpen] = useState(false);
  
  let brokerName = '';
  let brokerPhoto = '';
  
  try {
    const site = siteProp || {};
    brokerName = site?.broker?.full_name || 'Real Estate';
    let photo = site?.broker?.photo || '';
    if (photo) {
      const isHttp = photo.startsWith('http://') || photo.startsWith('https://');
      const baseApi = getApiBase();
      brokerPhoto = isHttp ? photo : `${baseApi}${photo.startsWith('/') ? photo : `/${photo}`}`;
    }
  } catch {}

  return (
    <nav className="premium-navbar">
      <div className="premium-navbar-container">
        <Link to={`${base}`} className="premium-navbar-brand">
          {brokerPhoto ? (
            <img src={brokerPhoto} alt={brokerName} className="premium-navbar-logo" />
          ) : (
            <div className="premium-navbar-logo-placeholder">
              {brokerName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="premium-navbar-brand-text">{brokerName}</span>
        </Link>
        
        <button 
          className="premium-navbar-toggle"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div className={`premium-navbar-menu ${menuOpen ? 'open' : ''}`}>
          <Link to={`${base}`} className="premium-navbar-link" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to={`${base}/properties`} className="premium-navbar-link" onClick={() => setMenuOpen(false)}>Properties</Link>
          <Link to={`${base}/about`} className="premium-navbar-link" onClick={() => setMenuOpen(false)}>About</Link>
          <Link to={`${base}/contact`} className="premium-navbar-link" onClick={() => setMenuOpen(false)}>Contact</Link>
        </div>
      </div>
    </nav>
  );
}

