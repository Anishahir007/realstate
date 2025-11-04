import React, { useState } from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { getApiBase } from '../../../../utils/apiBase.js';
import './viewproperty.css';

export default function ViewProperty(props) {
  const { id } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const ctx = useOutletContext?.() || {};
  const [slideIdx, setSlideIdx] = useState(0);
  const list = Array.isArray(props?.properties)
    ? props.properties
    : (Array.isArray(ctx?.properties) ? ctx.properties : []);

  let current = state?.property || null;
  if (!current && list && list.length) {
    for (let i = 0; i < list.length; i += 1) {
      const p = list[i];
      if (String(p?.id) === String(id)) { current = p; break; }
    }
  }
  if (!current) {
    return (
      <div className="pc-view-notfound">
        <p>Property not found.</p>
        <button onClick={() => nav(-1)}>Go Back</button>
      </div>
    );
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try { const p = JSON.parse(value); return Array.isArray(p) ? p : []; } catch { return []; }
    }
    return [];
  }

  function buildMediaUrl(url) {
    const u = String(url || '');
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('//')) return u;
    const base = String(getApiBase() || '').replace(/\/?$/, '');
    return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  function formatCurrency(value) {
    if (!value || value === null || value === undefined) return '—';
    const num = Number(value);
    if (!Number.isFinite(num)) return '—';
    return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
  }

  function formatArea(value, unit) {
    if (!value || value === null || value === undefined) return '—';
    const num = Number(value);
    if (!Number.isFinite(num) || num <= 0) return '—';
    const safeUnit = unit ? String(unit).replace(/_/g, ' ') : 'sqft';
    return `${num.toLocaleString('en-IN')} ${safeUnit}`;
  }

  function pretty(value) {
    if (value === null || value === undefined || value === '') return '—';
    return String(value).replace(/_/g, ' ');
  }

  // Get all media URLs
  const media = Array.isArray(current.media) ? current.media : [];
  const urls = media.map(m => m?.file_url || m?.url).filter(Boolean);
  if (urls.length === 0) {
    if (current.image_url) urls.push(current.image_url);
    else if (current.image) urls.push(current.image);
    else if (current.primary_image) urls.push(current.primary_image);
  }
  const total = Math.max(1, urls.length);
  const go = (d) => setSlideIdx((i) => (i + d + total) % total);
  const currentUrl = urls[Math.min(Math.max(slideIdx, 0), total - 1)];

  // Get features from current object or nested features object
  const f = current.features || {};
  const features = {
    ...f,
    // Fallback to direct properties if not in features
    expected_price: f.expected_price || current.expected_price || current.price,
    built_up_area: f.built_up_area || current.built_up_area || current.area,
    area_unit: f.area_unit || current.area_unit || current.areaUnit,
    carpet_area: f.carpet_area || current.carpet_area || current.carpetArea,
    carpet_area_unit: f.carpet_area_unit || current.carpet_area_unit || current.carpetAreaUnit,
    super_area: f.super_area || current.super_area || current.superArea,
    super_area_unit: f.super_area_unit || current.super_area_unit || current.superAreaUnit,
    num_bedrooms: f.num_bedrooms || current.num_bedrooms || current.bedrooms,
    num_bathrooms: f.num_bathrooms || current.num_bathrooms || current.bathrooms,
    num_balconies: f.num_balconies || current.num_balconies || current.balconies,
    booking_amount: f.booking_amount || current.booking_amount || current.bookingAmount,
    maintenance_charges: f.maintenance_charges || current.maintenance_charges || current.maintenanceCharges,
  };

  const location = [current.locality, current.city, current.state].filter(Boolean).join(', ') || '—';
  const price = formatCurrency(features.expected_price);
  const builtUp = formatArea(features.built_up_area, features.area_unit);
  const carpet = formatArea(features.carpet_area, features.carpet_area_unit);
  const superArea = formatArea(features.super_area, features.super_area_unit);
  const bookingAmount = formatCurrency(features.booking_amount);
  const maintenance = formatCurrency(features.maintenance_charges);

  const rooms = asArray(features.additional_rooms || current.additional_rooms);
  const highlights = asArray(current.highlights);
  const amenities = asArray(current.amenities);
  const nearby = asArray(current.nearby_landmarks);

  return (
    <div className="pc-view">
      <div className="pc-view__left">
        {/* Image Carousel */}
        <div className="pc-view__carousel">
          {total > 1 && (
            <button className="pc-view__nav pc-view__nav-prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
          )}
          <img 
            className="pc-view__main-img" 
            src={currentUrl ? buildMediaUrl(currentUrl) : '/templates/proclassic/public/img/noimg.png'} 
            alt={current.title || 'Property'} 
            onError={(e) => { e.target.src = '/templates/proclassic/public/img/noimg.png'; }}
          />
          {total > 1 && (
            <button className="pc-view__nav pc-view__nav-next" onClick={() => go(1)} aria-label="Next">›</button>
          )}
        </div>

        {/* Thumbnails */}
        {urls.length > 1 && (
          <div className="pc-view__thumbs">
            {urls.map((u, idx) => (
              <img 
                key={idx} 
                src={buildMediaUrl(u)} 
                className={`pc-view__thumb ${idx === slideIdx ? 'active' : ''}`} 
                onClick={() => setSlideIdx(idx)} 
                alt={`Thumbnail ${idx + 1}`}
                onError={(e) => { e.target.src = '/templates/proclassic/public/img/noimg.png'; }}
              />
            ))}
          </div>
        )}

        {/* Area Summary */}
        <div className="pc-view__area-summary">
          <div className="pc-view__area-item">
            <label className="pc-view__area-label">Built-up Area</label>
            <div className="pc-view__area-value">{builtUp}</div>
          </div>
          <div className="pc-view__area-item">
            <label className="pc-view__area-label">Carpet Area</label>
            <div className="pc-view__area-value">{carpet}</div>
          </div>
          <div className="pc-view__area-item">
            <label className="pc-view__area-label">Super Area</label>
            <div className="pc-view__area-value">{superArea}</div>
          </div>
        </div>
      </div>

      <div className="pc-view__right">
        {/* Header */}
        <div className="pc-view__header">
          <h1 className="pc-view__title">{current.title || 'Untitled Property'}</h1>
          <div className="pc-view__price">{price}</div>
          <div className="pc-view__meta">
            <div className="pc-view__meta-item">
              <span className="pc-view__meta-label">Type</span>
              <span className="pc-view__meta-value">{current.property_type || current.type || '—'}</span>
            </div>
            <div className="pc-view__meta-item">
              <span className="pc-view__meta-label">Area</span>
              <span className="pc-view__meta-value">{builtUp}</span>
            </div>
            <div className="pc-view__meta-item">
              <span className="pc-view__meta-label">Bedrooms</span>
              <span className="pc-view__meta-value">{features.num_bedrooms ?? '—'}</span>
            </div>
            <div className="pc-view__meta-item">
              <span className="pc-view__meta-label">Bathrooms</span>
              <span className="pc-view__meta-value">{features.num_bathrooms ?? '—'}</span>
            </div>
            <div className="pc-view__meta-item">
              <span className="pc-view__meta-label">Location</span>
              <span className="pc-view__meta-value">{location}</span>
            </div>
            {current.brokerName && (
              <div className="pc-view__meta-item">
                <span className="pc-view__meta-label">Broker</span>
                <span className="pc-view__meta-value">{current.brokerName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {current.description && (
          <div className="pc-view__section">
            <div className="pc-view__section-title">Description</div>
            <div className="pc-view__section-content">{current.description}</div>
          </div>
        )}

        {/* Property Details Grid */}
        <div className="pc-view__section">
          <div className="pc-view__section-title">Property Details</div>
          <div className="pc-view__grid">
            <div className="pc-view__field">
              <label className="pc-view__field-label">Property For</label>
              <div className="pc-view__field-value">{pretty(current.property_for || 'sell')}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Building Type</label>
              <div className="pc-view__field-value">{pretty(current.building_type || current.buildingType)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Sale Type</label>
              <div className="pc-view__field-value">{pretty(features.sale_type || current.sale_type || current.saleType)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Availability</label>
              <div className="pc-view__field-value">{pretty(features.availability || current.availability)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Approving Authority</label>
              <div className="pc-view__field-value">{pretty(features.approving_authority || current.approvingAuthority)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Ownership</label>
              <div className="pc-view__field-value">{pretty(features.ownership || current.ownership)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">RERA Status</label>
              <div className="pc-view__field-value">{pretty(features.rera_status || current.rera_status || current.reraStatus)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">RERA Number</label>
              <div className="pc-view__field-value">{pretty(features.rera_number || current.rera_number || current.reraNumber)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">No. of Floors</label>
              <div className="pc-view__field-value">{pretty(features.no_of_floors || current.no_of_floors || current.floors)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Property on Floor</label>
              <div className="pc-view__field-value">{pretty(features.property_on_floor || current.property_on_floor || current.propertyOnFloor)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Furnishing</label>
              <div className="pc-view__field-value">{pretty(features.furnishing_status || current.furnishing_status || current.furnishingStatus)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Facing</label>
              <div className="pc-view__field-value">{pretty(features.facing || current.facing)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Flooring</label>
              <div className="pc-view__field-value">{pretty(features.flooring_type || current.flooring_type || current.flooringType)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Age of Property</label>
              <div className="pc-view__field-value">{pretty(features.age_years || current.age_years || current.ageYears)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Built-up Area</label>
              <div className="pc-view__field-value">{builtUp}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Carpet Area</label>
              <div className="pc-view__field-value">{carpet}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Super Area</label>
              <div className="pc-view__field-value">{superArea}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Booking Amount</label>
              <div className="pc-view__field-value">{bookingAmount}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Maintenance</label>
              <div className="pc-view__field-value">{maintenance}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Possession By</label>
              <div className="pc-view__field-value">{pretty(features.possession_by || current.possession_by || current.possessionBy)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Bedrooms</label>
              <div className="pc-view__field-value">{pretty(features.num_bedrooms)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Bathrooms</label>
              <div className="pc-view__field-value">{pretty(features.num_bathrooms)}</div>
            </div>
            <div className="pc-view__field">
              <label className="pc-view__field-label">Balconies</label>
              <div className="pc-view__field-value">{pretty(features.num_balconies)}</div>
            </div>
          </div>
        </div>

        {/* Additional Rooms */}
        {rooms.length > 0 && (
          <div className="pc-view__section">
            <div className="pc-view__section-title">Additional Rooms</div>
            <div className="pc-view__chips">
              {rooms.map((r, i) => (
                <span key={`r-${i}`} className="pc-view__chip">{String(r)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="pc-view__section">
            <div className="pc-view__section-title">Amenities</div>
            <div className="pc-view__chips">
              {amenities.map((a, i) => (
                <span key={`a-${i}`} className="pc-view__chip">{String(a)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Highlights */}
        {highlights.length > 0 && (
          <div className="pc-view__section">
            <div className="pc-view__section-title">Highlights</div>
            <div className="pc-view__chips">
              {highlights.map((h, i) => (
                <span key={`h-${i}`} className="pc-view__chip">{String(h)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Nearby Landmarks */}
        {nearby.length > 0 && (
          <div className="pc-view__section">
            <div className="pc-view__section-title">Nearby Landmarks</div>
            <div className="pc-view__chips">
              {nearby.map((n, i) => (
                <span key={`n-${i}`} className="pc-view__chip">{String(n)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Contact Actions */}
        <div className="pc-view__actions">
          {current.contact_phone && (
            <a className="pc-view__btn pc-view__btn-primary" href={`tel:${current.contact_phone}`}>
              📞 Call
            </a>
          )}
          {current.contact_email && (
            <a className="pc-view__btn pc-view__btn-primary" href={`mailto:${current.contact_email}`}>
              ✉️ Email
            </a>
          )}
          <button className="pc-view__btn" onClick={() => nav(-1)}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
