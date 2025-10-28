import React from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import { getApiBase } from '../../../../utils/apiBase.js';
import './viewproperty.css';

export default function ViewProperty(props) {
  const { id } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const ctx = useOutletContext?.() || {};
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
      <div style={{ padding: 16 }}>
        <p>Property not found.</p>
        <button onClick={() => nav(-1)}>Go Back</button>
      </div>
    );
  }
  let cover = undefined;
  if (current.image_url) cover = current.image_url;
  else if (current.image) cover = current.image;

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

  const f = current.features || {};

  return (
    <div className="pc-view">
      <div className="pc-view__media">
        {cover ? <img src={cover} alt={current.title} /> : null}
      </div>
      <div className="pc-view__content">
        <h1 className="pc-view__title">{current.title}</h1>
        <div className="pc-view__meta">
          <span>{current.property_type}</span>
          <span>•</span>
          <span>{f.built_up_area || current.built_up_area} {f.area_unit || current.area_unit}</span>
          <span>•</span>
          <span>{[current.city, current.state].filter(Boolean).join(', ')}</span>
        </div>

        {/* Media strip */}
        {Array.isArray(current.media) && current.media.length > 0 && (
          <div style={{ margin: '10px 0', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {current.media.map((m) => (
              <img key={m.id} src={buildMediaUrl(m.file_url)} alt="media" style={{ width: 120, height: 90, objectFit: 'cover', borderRadius: 6, border: '1px solid #e5e7eb' }} />
            ))}
          </div>
        )}

        {/* Specs (mirror of PropertiesList) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <div><span>Property For</span><b style={{ marginLeft: 6 }}>{current.property_for || current.property_for}</b></div>
          <div><span>Type</span><b style={{ marginLeft: 6 }}>{`${current.building_type || ''} ${current.property_type ? `/ ${current.property_type}` : ''}`}</b></div>
          {f.expected_price != null && (<div><span>Price</span><b style={{ marginLeft: 6 }}>₹ {Number(f.expected_price).toLocaleString('en-IN')}</b></div>)}
          {f.built_up_area != null && (<div><span>Built-up</span><b style={{ marginLeft: 6 }}>{f.built_up_area} {f.area_unit}</b></div>)}
          {f.carpet_area && (<div><span>Carpet</span><b style={{ marginLeft: 6 }}>{f.carpet_area} {f.carpet_area_unit || ''}</b></div>)}
          {f.super_area && (<div><span>Super</span><b style={{ marginLeft: 6 }}>{f.super_area} {f.super_area_unit || ''}</b></div>)}
          {f.sale_type && (<div><span>Sale Type</span><b style={{ marginLeft: 6 }}>{String(f.sale_type).replaceAll('_',' ')}</b></div>)}
          {f.availability && (<div><span>Availability</span><b style={{ marginLeft: 6 }}>{String(f.availability).replaceAll('_',' ')}</b></div>)}
          {f.no_of_floors != null && (<div><span>No. of Floors</span><b style={{ marginLeft: 6 }}>{f.no_of_floors}</b></div>)}
          {f.property_on_floor && (<div><span>On Floor</span><b style={{ marginLeft: 6 }}>{f.property_on_floor}</b></div>)}
          {f.furnishing_status && (<div><span>Furnishing</span><b style={{ marginLeft: 6 }}>{String(f.furnishing_status).replaceAll('_','-')}</b></div>)}
          {f.facing && (<div><span>Facing</span><b style={{ marginLeft: 6 }}>{f.facing}</b></div>)}
          {f.flooring_type && (<div><span>Flooring</span><b style={{ marginLeft: 6 }}>{f.flooring_type}</b></div>)}
          {f.num_bedrooms != null && (<div><span>Bedrooms</span><b style={{ marginLeft: 6 }}>{f.num_bedrooms}</b></div>)}
          {f.num_bathrooms != null && (<div><span>Bathrooms</span><b style={{ marginLeft: 6 }}>{f.num_bathrooms}</b></div>)}
          {f.num_balconies != null && (<div><span>Balconies</span><b style={{ marginLeft: 6 }}>{f.num_balconies}</b></div>)}
          {f.booking_amount && (<div><span>Booking Amount</span><b style={{ marginLeft: 6 }}>₹ {Number(f.booking_amount).toLocaleString('en-IN')}</b></div>)}
          {f.maintenance_charges && (<div><span>Maintenance</span><b style={{ marginLeft: 6 }}>₹ {Number(f.maintenance_charges).toLocaleString('en-IN')}</b></div>)}
          {f.ownership && (<div><span>Ownership</span><b style={{ marginLeft: 6 }}>{String(f.ownership).replaceAll('_',' ')}</b></div>)}
          {f.rera_status && (<div><span>RERA</span><b style={{ marginLeft: 6 }}>{String(f.rera_status).replaceAll('_',' ')}</b></div>)}
          {f.rera_number && (<div><span>RERA No.</span><b style={{ marginLeft: 6 }}>{f.rera_number}</b></div>)}
          {f.age_years && (<div><span>Age of Property</span><b style={{ marginLeft: 6 }}>{f.age_years}</b></div>)}
          {f.possession_by && (<div><span>Possession By</span><b style={{ marginLeft: 6 }}>{f.possession_by}</b></div>)}
          {f.approving_authority && (<div><span>Approving Authority</span><b style={{ marginLeft: 6 }}>{f.approving_authority}</b></div>)}
        </div>

        {current.description && (<p className="pc-view__desc" style={{ marginTop: 12 }}>{current.description}</p>)}

        {!!asArray(f.additional_rooms).length && (
          <div className="pc-view__chips"><div style={{ fontWeight: 700 }}>Additional Rooms</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{asArray(f.additional_rooms).map((t,i)=> <span key={`r-${i}`} className="pc-view__btn" style={{ textDecoration: 'none' }}>{t}</span>)}</div></div>
        )}
        {!!asArray(current.highlights).length && (
          <div className="pc-view__chips"><div style={{ fontWeight: 700 }}>Highlights</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{asArray(current.highlights).map((t,i)=> <span key={`h-${i}`} className="pc-view__btn" style={{ textDecoration: 'none' }}>{t}</span>)}</div></div>
        )}
        {!!asArray(current.amenities).length && (
          <div className="pc-view__chips"><div style={{ fontWeight: 700 }}>Amenities</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{asArray(current.amenities).map((t,i)=> <span key={`a-${i}`} className="pc-view__btn" style={{ textDecoration: 'none' }}>{t}</span>)}</div></div>
        )}
        {!!asArray(current.nearby_landmarks).length && (
          <div className="pc-view__chips"><div style={{ fontWeight: 700 }}>Nearby</div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{asArray(current.nearby_landmarks).map((t,i)=> <span key={`n-${i}`} className="pc-view__btn" style={{ textDecoration: 'none' }}>{t}</span>)}</div></div>
        )}

        <div className="pc-view__actions" style={{ marginTop: 12 }}>
          {current.contact_phone ? (<a className="pc-view__btn" href={`tel:${current.contact_phone}`}>Call</a>) : null}
          {current.contact_email ? (<a className="pc-view__btn" href={`mailto:${current.contact_email}`}>Email</a>) : null}
        </div>
      </div>
    </div>
  );
}


