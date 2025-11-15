import React from 'react';
import { Outlet } from 'react-router-dom';
import './proclassic.css';
import Navbar from '../components/navbar/Navbar.jsx';
import Footer from '../components/footer/Footer.jsx';

export default function ProClassicLayout({ children, site: siteProp, properties: propertiesProp }) {
  return (
    <div className="proclassic-layout">
      <Navbar site={siteProp} />
      <main className="proclassic-container">
        {children ? children : <Outlet />}
      </main>
      <Footer site={siteProp} />
    </div>
  );
}


