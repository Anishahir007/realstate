import React from 'react';
import './hero.css';

export default function Hero() {
  return (
    <section className="premium-hero">
      <div className="premium-hero-content">
        <h1 className="premium-hero-title">Find Your Dream Property</h1>
        <p className="premium-hero-subtitle">Discover premium real estate opportunities tailored to your needs</p>
        <div className="premium-hero-buttons">
          <a href="#properties" className="premium-hero-btn primary">Explore Properties</a>
          <a href="#contact" className="premium-hero-btn secondary">Contact Us</a>
        </div>
      </div>
      <div className="premium-hero-overlay"></div>
    </section>
  );
}

