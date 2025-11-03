import React from 'react';
import './property.css';
import { Link, useParams } from 'react-router-dom';

export default function PropertyCard({ property }) {
  const { slug = '' } = useParams();
  const base = slug ? `/site/${slug}` : '';
  
  const formatPrice = (price) => {
    if (!price) return 'Price on Request';
    const num = Number(price);
    if (isNaN(num)) return 'Price on Request';
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatArea = (area, unit) => {
    if (!area) return '-';
    return `${area} ${unit || 'sqft'}`;
  };

  return (
    <div className="premium-property-card">
      <div className="premium-property-image">
        {property.image_url ? (
          <img src={property.image_url} alt={property.title || 'Property'} />
        ) : (
          <div className="premium-property-image-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        )}
      </div>
      <div className="premium-property-content">
        <h3 className="premium-property-title">{property.title || 'Property'}</h3>
        <div className="premium-property-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{property.city || ''} {property.locality || ''}</span>
        </div>
        <div className="premium-property-details">
          <div className="premium-property-detail-item">
            <span className="premium-property-detail-label">Price</span>
            <span className="premium-property-detail-value">{formatPrice(property.expected_price)}</span>
          </div>
          <div className="premium-property-detail-item">
            <span className="premium-property-detail-label">Area</span>
            <span className="premium-property-detail-value">{formatArea(property.built_up_area, property.area_unit)}</span>
          </div>
        </div>
        <Link to={`${base}/properties/${property.id}`} className="premium-property-btn">
          View Details
        </Link>
      </div>
    </div>
  );
}

