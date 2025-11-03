import React from 'react';
import { NavLink, Link, useParams, useOutletContext } from 'react-router-dom';
import './navbar.css';
import { getApiBase } from '../../../../../utils/apiBase.js';

export default function Navbar({ site: siteProp }) {
  const { slug = '' } = useParams();
  const base = slug ? `/site/${slug}` : '';
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};

  const name = site?.broker?.full_name || 'Real Estate';
  let logo = site?.broker?.photo || '';
  if (logo && !(logo.startsWith('http://') || logo.startsWith('https://'))) {
    const api = getApiBase();
    logo = `${api}${logo.startsWith('/') ? logo : `/${logo}`}`;
  }

  return (
    <div className="pc-nav-root">
      <div className="pc-nav-strip" />
      <div className="pc-nav">
        <Link to={base || '/'} className="pc-brand">
          {logo ? (
            <img className="pc-brand-logo" src={logo} alt={name} />
          ) : (
            <div className="pc-brand-logo pc-brand-fallback">{(name || 'R')[0]}</div>
          )}
          <div className="pc-brand-text">{name}</div>
        </Link>
        <nav className="pc-links">
          <NavLink to={`${base || '/'}`} end className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to={`${base}/about`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>About Us</NavLink>
          <NavLink to={`${base}/properties`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Find Properties</NavLink>
          <NavLink to={`${base}/contact`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Contact Us</NavLink>
          <NavLink to={`${base}/privacy`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Privacy</NavLink>
        </nav>
        <button className="pc-search" aria-label="Search">🔍</button>
      </div>
    </div>
  );
}


