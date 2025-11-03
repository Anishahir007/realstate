import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../components/hero/Hero.jsx';
import PropertyCard from '../components/property/PropertyCard.jsx';
import '../components/property/property.css';

export default function ProClassicHome({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];
  return (
    <div>
      <Hero />
      <h2 style={{ marginTop: 0 }}>Latest Properties</h2>
      {properties.length === 0 ? (<div>No properties yet.</div>) : (
        <div className="pc-prop-grid">
          {properties.map((p) => (<PropertyCard key={p.id} property={p} />))}
        </div>
      )}
    </div>
  );
}


