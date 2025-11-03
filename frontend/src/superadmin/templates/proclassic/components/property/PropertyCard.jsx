import React from 'react';
import { Link, useParams } from 'react-router-dom';
import './property.css';

function formatPriceINR(num) {
  if (!num || Number.isNaN(Number(num))) return '—';
  const n = Number(num);
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr.`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} Lac`;
  return `₹ ${n.toLocaleString('en-IN')}`;
}


export default function PropertyCard({ property }) {
  const { slug } = useParams();
  const to = `property/${property.id}`; // relative path works for both domain root and /site/:slug
  let img = undefined;
  if (property.image_url) img = property.image_url;
  else if (property.image) img = property.image;
  const price = formatPriceINR(property.expected_price);
  const size = property.built_up_area ? `${property.built_up_area} ${property.area_unit || ''}` : '';
  const type = property.property_type || 'Property';
  const city = [property.locality, property.city, property.state].filter(Boolean).join(', ');

  return (
    <div className="pc-prop-card">
      <div className="pc-prop-media">
        {img ? <img src={img} alt={property.title || 'Property'} /> : null}
        <div className="pc-prop-price">{price}</div>
      </div>
      <div className="pc-prop-body">
        <div className="pc-prop-type">{type}</div>
        <div className="pc-prop-title">{property.title || '—'}</div>
        <div className="pc-prop-meta">{size}</div>
        <div className="pc-prop-loc">{city}</div>
      </div>
      <div className="pc-prop-actions">
        <Link to={to} state={{ property }} className="pc-prop-btn">View Details</Link>
      </div>
    </div>
  );
}


