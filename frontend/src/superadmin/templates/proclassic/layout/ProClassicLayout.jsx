import React from 'react';
import { Outlet, Link, useParams, useOutletContext } from 'react-router-dom';
import './proclassic.css';
import Navbar from '../components/navbar/Navbar.jsx';
import { getApiBase } from '../../../../utils/apiBase.js';

export default function ProClassicLayout({ children, site: siteProp, properties: propertiesProp }) {
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
    <div className="proclassic-layout">
      <Navbar site={siteProp} />
      <main className="proclassic-container">
        {children ? children : <Outlet />}
      </main>
      <footer className="proclassic-footer">
        <div className="proclassic-cols">
          <div>
            <h4>Contact</h4>
            {brokerEmail ? <div>Email: {brokerEmail}</div> : null}
            {brokerPhone ? <div>Phone: {brokerPhone}</div> : null}
          </div>
          <div>
            <h4>Links</h4>
            <div className="proclassic-links">
              <Link to={`${base}`}>Home</Link>
              <Link to={`${base}/properties`}>Find Property</Link>
              <Link to={`${base}/about`}>About</Link>
              <Link to={`${base}/contact`}>Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


