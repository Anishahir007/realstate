import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../components/hero/Hero.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import '../components/property/property.css';

export default function PremiumHome({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];

  return (
    <div className="premium-home">
      <Hero />
      <section className="premium-section" id="properties">
        <div className="premium-section-header">
          <h2 className="premium-section-title">Featured Properties</h2>
          <p className="premium-section-subtitle">Explore our handpicked selection of premium properties</p>
        </div>
        {properties.length === 0 ? (
          <div className="premium-empty-state">
            <p>No properties available at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="premium-properties-grid">
            {properties.slice(0, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

