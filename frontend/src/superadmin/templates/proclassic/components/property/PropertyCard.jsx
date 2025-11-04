import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { getApiBase } from '../../../../../utils/apiBase.js';
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
  
  // Console log property data for debugging
  console.log('PropertyCard - Full property data:', property);
  console.log('PropertyCard - Image fields:', {
    image_url: property.image_url,
    primary_image: property.primary_image,
    image: property.image,
    media: property.media,
    media_length: property.media?.length || 0
  });
  
  const to = `property/${property.id}`; // relative path works for both domain root and /site/:slug
  
  // Get API base URL (for constructing full image URLs)
  const apiBase = getApiBase() || window.location.origin;
  
  // Get image from multiple possible fields
  let img = undefined;
  let imgPath = undefined;
  
  if (property.image_url) imgPath = property.image_url;
  else if (property.primary_image) imgPath = property.primary_image;
  else if (property.image) imgPath = property.image;
  else if (property.media && Array.isArray(property.media) && property.media.length > 0) {
    // Try to get primary image or first image from media array
    const primary = property.media.find(m => m.is_primary) || property.media[0];
    if (primary) {
      imgPath = primary.file_url || primary.url;
    }
  }
  
  // Construct full URL if we have an image path
  if (imgPath) {
    // If already a full URL (starts with http/https), use as-is
    if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
      img = imgPath;
    } else {
      // If relative path, prepend apiBase
      img = imgPath.startsWith('/') ? `${apiBase}${imgPath}` : `${apiBase}/${imgPath}`;
    }
  }
  
  // Use expected_price or price field
  const priceValue = property.expected_price || property.price;
  const price = formatPriceINR(priceValue);
  
  // Use built_up_area or area field
  const areaValue = property.built_up_area || property.area;
  const areaUnit = property.area_unit || property.areaUnit;
  const size = areaValue ? `${areaValue} ${areaUnit || ''}` : '';
  
  // Use property_type or type field
  const type = property.property_type || property.type || 'Property';
  const city = [property.locality, property.city, property.state].filter(Boolean).join(', ');
  
  console.log('PropertyCard - Final values:', {
    img,
    price: priceValue,
    size,
    type,
    city
  });

  return (
    <div className="pc-prop-card">
      <div className="pc-prop-media">
        {img ? (
          <img src={img} alt={property.title || 'Property'} onError={(e) => {
            console.log('PropertyCard - Image load error for:', img);
            e.target.src = '/templates/proclassic/public/img/noimg.png';
          }} />
        ) : (
          <div style={{ width: '100%', height: '200px', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
            No Image
          </div>
        )}
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


