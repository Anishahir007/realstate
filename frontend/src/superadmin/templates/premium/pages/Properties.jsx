import React from 'react';
import { useOutletContext } from 'react-router-dom';
import PropertyCard from '../components/property/PropertyCard.jsx';
import '../components/property/property.css';

export default function PremiumProperties({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];

  return (
    <div className="premium-page">
      <div className="premium-page-header">
        <h1 className="premium-page-title">All Properties</h1>
        <p className="premium-page-subtitle">Browse our complete collection of properties</p>
      </div>
      {properties.length === 0 ? (
        <div className="premium-empty-state">
          <p>No properties available at the moment. Check back soon!</p>
        </div>
      ) : (
        <div className="premium-properties-grid">
          {properties.map((p) => (
            <PropertyCard key={p.id} property={p} />
          ))}
        </div>
      )}
    </div>
  );
}

