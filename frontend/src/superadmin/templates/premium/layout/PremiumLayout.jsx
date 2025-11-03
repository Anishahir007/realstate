import React from 'react';
import { Outlet, Link, useParams, useOutletContext } from 'react-router-dom';
import './premium.css';
import Navbar from '../components/navbar/Navbar.jsx';
import { getApiBase } from '../../../../utils/apiBase.js';

export default function PremiumLayout({ children, site: siteProp, properties: propertiesProp }) {
  const { slug = '' } = useParams();
  const base = slug ? `/site/${slug}` : '';
  let brokerName = '';
  let brokerPhoto = '';
  let brokerEmail = '';
  let brokerPhone = '';
  
  try {
    const ctx = useOutletContext?.() || {};
    const site = siteProp || ctx?.site || {};
    brokerName = site?.broker?.full_name || '';
    brokerEmail = site?.broker?.email || '';
    brokerPhone = site?.broker?.phone || '';
    let photo = site?.broker?.photo || '';
    if (photo) {
      const isHttp = photo.startsWith('http://') || photo.startsWith('https://');
      const baseApi = getApiBase();
      brokerPhoto = isHttp ? photo : `${baseApi}${photo.startsWith('/') ? photo : `/${photo}`}`;
    }
  } catch {}

  return (
    <div className="premium-layout">
      <Navbar site={siteProp} />
      <main className="premium-container">
        {children ? children : <Outlet />}
      </main>
      <footer className="premium-footer">
        <div className="premium-footer-content">
          <div className="premium-footer-col">
            <h4 className="premium-footer-title">Contact Us</h4>
            {brokerName && <p className="premium-footer-text">{brokerName}</p>}
            {brokerEmail && <p className="premium-footer-text">Email: {brokerEmail}</p>}
            {brokerPhone && <p className="premium-footer-text">Phone: {brokerPhone}</p>}
          </div>
          <div className="premium-footer-col">
            <h4 className="premium-footer-title">Quick Links</h4>
            <div className="premium-footer-links">
              <Link to={`${base}`}>Home</Link>
              <Link to={`${base}/properties`}>Properties</Link>
              <Link to={`${base}/about`}>About</Link>
              <Link to={`${base}/contact`}>Contact</Link>
            </div>
          </div>
          <div className="premium-footer-col">
            <h4 className="premium-footer-title">Stay Connected</h4>
            <p className="premium-footer-text">Follow us for the latest property updates</p>
          </div>
        </div>
        <div className="premium-footer-bottom">
          <p>&copy; {new Date().getFullYear()} {brokerName || 'Real Estate'}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

