import React from 'react';
import { Outlet, Link, useParams, useOutletContext } from 'react-router-dom';
import './classic.css';
import { getApiBase } from '../../../../utils/apiBase.js';

export default function ClassicLayout({ children }) {
  const { slug = '' } = useParams();
  const base = slug ? `/site/${slug}` : '';
  // Try to read site context from Outlet (SiteRenderer provides it)
  let brokerName = '';
  let brokerPhoto = '';
  let brokerEmail = '';
  let brokerPhone = '';
  
  try {
    const ctx = useOutletContext?.() || {};
    brokerName = ctx?.site?.broker?.full_name || '';
    brokerEmail = ctx?.site?.broker?.email || '';
    brokerPhone = ctx?.site?.broker?.phone || '';
    let photo = ctx?.site?.broker?.photo || '';
    if (photo) {
      const isHttp = photo.startsWith('http://') || photo.startsWith('https://');
      const base = getApiBase();
      brokerPhoto = isHttp ? photo : `${base}${photo.startsWith('/') ? photo : `/${photo}`}`;
    }
  } catch {}
  return (
    <div className="classic-layout">
      <header className="classic-navbar">
        <div className="classic-navbar__brand">
          {brokerPhoto ? (
            <img className="classic-navbar__avatar" src={brokerPhoto} alt={brokerName || 'Broker'} />
          ) : null}
          <span>{brokerName}</span>
        </div>
        <nav className="classic-navbar__nav">
          <Link className="classic-navbar__link" to={`${base}`}>Home</Link>
          <Link className="classic-navbar__link" to={`${base}/properties`}>Properties</Link>
          <Link className="classic-navbar__link" to={`${base}/about`}>About</Link>
          <Link className="classic-navbar__link" to={`${base}/contact`}>Contact</Link>
        </nav>
      </header>
      <main className="classic-container">
        {children ? children : <Outlet />}
      </main>
      <footer className="classic-footer">
        <div className="classic-footer__columns">
          <div className="classic-footer__col">
            <h4 className="classic-footer__title">Contact Us</h4>
            {brokerEmail ? (
              <p className="classic-footer__text">Email: {brokerEmail}</p>
            ) : null}
            {brokerPhone ? (
              <p className="classic-footer__text">Phone: {brokerPhone}</p>
            ) : null}
          </div>
          <div className="classic-footer__col">
            <h4 className="classic-footer__title">Links</h4>
            <div className="classic-footer__links">
              <Link to={`${base}`}>Home</Link>
              <Link to={`${base}/properties`}>Find Property</Link>
              <Link to={`${base}/about`}>About</Link>
              <Link to={`${base}/contact`}>Contact</Link>
            </div>
          </div>
          <div className="classic-footer__col">
            <h4 className="classic-footer__title">Newsletter</h4>
            <form className="classic-footer__newsletter" onSubmit={(e) => { e.preventDefault(); alert('Subscribed!'); }}>
              <input type="email" placeholder="Enter Email" />
              <button type="submit">Submit</button>
            </form>
          </div>
        </div>
      </footer>
    </div>
  );
}


