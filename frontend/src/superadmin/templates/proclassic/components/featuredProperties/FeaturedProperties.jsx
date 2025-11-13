import React, { useState, useEffect } from 'react';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import { getApiBase } from '../../../../../utils/apiBase.js';
import EnquiryModal from '../findProperty/EnquiryModal.jsx';
import './featuredProperties.css';

function formatPriceINR(num) {
  if (!num || Number.isNaN(Number(num))) return '—';
  const n = Number(num);
  if (n >= 10000000) return `₹ ${(n / 10000000).toFixed(2)} Cr.`;
  if (n >= 100000) return `₹ ${(n / 100000).toFixed(2)} Lac`;
  return `₹ ${n.toLocaleString('en-IN')}`;
}

export default function FeaturedPropertyCard({ property, site, tenantDb, onEnquiry }) {
  const { slug } = useParams();
  
  const to = `property/${property.id}`;
  
  // Get API base URL (for constructing full image URLs)
  const apiBase = getApiBase() || window.location.origin;
  
  const handleEnquiryClick = (e) => {
    e.preventDefault();
    if (onEnquiry) {
      onEnquiry(property);
    }
  };
  
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

  return (
    <div className="pc-featured-card">
      <div className="pc-featured-media">
        {img ? (
          <img src={img} alt={property.title || 'Property'} onError={(e) => {
            e.target.src = '/templates/proclassic/public/img/noimg.png';
          }} />
        ) : (
          <div className="pc-featured-noimg">
            No Image
          </div>
        )}
        <div className="pc-featured-badge">
          {(type || 'For Sale').toString().replace(/_/g, ' ').toUpperCase()}
        </div>
        <div className="pc-featured-price">{price}</div>
      </div>
      <div className="pc-featured-body">
        <div className="pc-featured-title">{property.title || '—'}</div>
        <div className="pc-featured-loc">{city}</div>
        <div className="pc-featured-meta">
          <div className="pc-featured-spec">
            <span>Area</span>
            <strong>{size || '—'}</strong>
          </div>
        </div>
      </div>
      <div className="pc-featured-actions">
        <Link to={to} state={{ property }} className="pc-featured-btn pc-featured-btn-primary">
          View Details
        </Link>
        <button 
          onClick={handleEnquiryClick}
          className="pc-featured-btn pc-featured-btn-secondary"
        >
          Send Enquiry
        </button>
      </div>
    </div>
  );
}

export function FeaturedPropertiesGrid({ properties: propsProps, title = 'Featured Properties' }) {
  const [featuredProps, setFeaturedProps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const ctx = useOutletContext?.() || {};
  const site = ctx.site || {};
  const properties = propsProps || ctx.properties || [];
  
  // Try to get tenant_db from context or URL
  const { slug } = useParams();
  const apiBase = getApiBase() || window.location.origin;
  
  const tenantDb = site?.tenant_db || 
                   site?.broker?.tenant_db || 
                   ctx.site?.tenant_db || 
                   ctx.site?.broker?.tenant_db ||
                   ctx.tenant_db;
  
  const handleEnquiry = (property) => {
    setSelectedProperty(property);
    setShowEnquiryModal(true);
  };

  const handleCloseEnquiry = () => {
    setShowEnquiryModal(false);
    setSelectedProperty(null);
  };
  
  useEffect(() => {
    async function fetchFeaturedProperties() {
      // First, try filtering from passed properties - get highest priced properties
      if (properties.length > 0) {
        const withPrice = properties
          .filter(p => {
            const price = p.expected_price || p.price || 0;
            return price > 0 && (p.status === 'active' || !p.status);
          })
          .sort((a, b) => {
            const priceA = a.expected_price || a.price || 0;
            const priceB = b.expected_price || b.price || 0;
            return priceB - priceA;
          })
          .slice(0, 8);
        
        if (withPrice.length > 0) {
          setFeaturedProps(withPrice);
          setLoading(false);
          return;
        }
      }
      
      // If no properties with price in props, try fetching from API
      try {
        // Get tenant_db from context or try to determine from slug/domain
        const tenantDb = ctx.site?.tenant_db || ctx.tenant_db;
        
        // Only make API request if tenant_db is available
        if (!tenantDb) {
          console.warn('FeaturedProperties: tenant_db not available in context, skipping API request');
          setLoading(false);
          return;
        }
        
        const headers = {
          'x-tenant-db': tenantDb
        };
        
        const response = await fetch(`${apiBase}/api/properties/featured?limit=8`, {
          headers
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error fetching featured properties:', response.status, errorData.message || 'Unknown error');
          setLoading(false);
          return;
        }
        
        const result = await response.json();
        if (result.data && result.data.length > 0) {
          setFeaturedProps(result.data);
        }
      } catch (err) {
        console.error('Error fetching featured properties:', err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchFeaturedProperties();
  }, [properties, ctx.site, ctx.tenant_db, apiBase]);

  if (loading) {
    return (
      <div className="pc-featured-header">
        <div className="pc-featured-empty">Loading featured properties...</div>
      </div>
    );
  }

  return (
    <>
      <div className="pc-featured-header">
        <div className="pc-featured-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M24 4L6 18V42H18V28H30V42H42V18L24 4Z" fill="#1e40af" stroke="#1e40af" strokeWidth="2"/>
            <rect x="20" y="24" width="8" height="8" fill="#f97316" stroke="#f97316" strokeWidth="1"/>
            <line x1="20" y1="24" x2="28" y2="24" stroke="#1e40af" strokeWidth="1"/>
            <line x1="20" y1="28" x2="28" y2="28" stroke="#1e40af" strokeWidth="1"/>
            <line x1="24" y1="24" x2="24" y2="32" stroke="#1e40af" strokeWidth="1"/>
            <path d="M24 8L12 16V38H20V26H28V38H36V16L24 8Z" fill="#fbbf24" opacity="0.8"/>
          </svg>
        </div>
        <h2 className="pc-featured-title-main">{title}</h2>
        <p className="pc-featured-subtitle">Top picks curated by price and location</p>
      </div>
      {featuredProps.length === 0 ? (
        <div className="pc-featured-empty">No featured properties yet. Please check back soon.</div>
      ) : (
        <div className="pc-featured-grid">
          {featuredProps.map((p) => (
            <FeaturedPropertyCard 
              key={p.id} 
              property={p} 
              site={site}
              tenantDb={tenantDb}
              onEnquiry={handleEnquiry}
            />
          ))}
        </div>
      )}
      
      {/* Enquiry Modal */}
      {showEnquiryModal && selectedProperty && (
        <EnquiryModal
          property={selectedProperty}
          site={site}
          tenantDb={tenantDb}
          onClose={handleCloseEnquiry}
        />
      )}
    </>
  );
}

