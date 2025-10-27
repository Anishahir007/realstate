import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';
import './propertiesList.css';

export default function PropertiesList() {
  const { token, apiBase } = useBroker();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState('');
  const [viewData, setViewData] = useState(null);

  async function load(page = 1) {
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${apiBase}/api/properties/listproperty`, {
        params: { page, q },
        headers: { Authorization: `Bearer ${token}` },
      });
      setItems(data?.data || []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function openView(id) {
    setViewError('');
    setViewLoading(true);
    setViewOpen(true);
    try {
      const { data } = await axios.get(`${apiBase}/api/properties/getproperty/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setViewData(data?.data || null);
    } catch (err) {
      setViewError(err?.response?.data?.message || err?.message || 'Failed to load details');
    } finally {
      setViewLoading(false);
    }
  }

  function asArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  function buildMediaUrl(url) {
    const u = String(url || '');
    if (!u) return '';
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('//')) return u;
    // Ensure apiBase has no trailing slash
    const base = String(apiBase || '').replace(/\/?$/, '');
    return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  useEffect(() => { load(1); }, []);

  return (
    <div className="pl-wrap">
      <div className="pl-header">
        <h2>My Properties</h2>
        <div className="pl-search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search city/locality/address/title" />
          <button onClick={() => load(1)}>Search</button>
        </div>
      </div>
      {loading && <p className="pl-muted">Loading...</p>}
      {error && <p className="pl-error">{error}</p>}
      <div className="pl-grid">
        {items.map((p) => (
          <div key={p.id} className="pl-card">
            <div className="pl-card-title">{p.title || `${p.property_type} in ${p.city}`}</div>
            <div className="pl-card-sub">{[p.locality, p.city, p.state].filter(Boolean).join(', ')}</div>
            <div className="pl-card-body">
              {p.expected_price != null && (
                <div className="pl-row"><span>Price</span><b>₹ {Number(p.expected_price).toLocaleString('en-IN')}</b></div>
              )}
              {p.built_up_area != null && (
                <div className="pl-row"><span>Area</span><b>{p.built_up_area} {p.area_unit}</b></div>
              )}
            </div>
            <div className="pl-card-actions">
              <button onClick={() => openView(p.id)}>View</button>
            </div>
          </div>
        ))}
      </div>

      {viewOpen && (
        <div className="pl-modal-backdrop" onClick={() => { setViewOpen(false); setViewData(null); }}>
          <div className="pl-modal" onClick={(e)=> e.stopPropagation()}>
            <div className="pl-modal-header">
              <div className="pl-modal-title">{viewData?.title || 'Property Details'}</div>
              <button className="pl-close" onClick={() => { setViewOpen(false); setViewData(null); }}>×</button>
            </div>
            <div className="pl-modal-sub">{[viewData?.locality, viewData?.city, viewData?.state].filter(Boolean).join(', ')}</div>
            {viewLoading && <div className="pl-muted">Loading details…</div>}
            {viewError && <div className="pl-error">{viewError}</div>}
            {!viewLoading && viewData && (
              <div className="pl-detail-grid">
                <div className="pl-media">
                  <div className="pl-media-strip">
                    {(viewData.media || []).map(m => (
                      <img key={m.id} src={buildMediaUrl(m.file_url)} className={`pl-thumb${m.is_primary ? ' pl-thumb--primary' : ''}`} alt="media" />
                    ))}
                    {!(viewData.media||[]).length && (
                      <div className="pl-thumb pl-thumb--placeholder">No Image</div>
                    )}
                  </div>
                </div>
                <div className="pl-specs">
                  <div className="pl-spec"><span>Property For</span><b>{viewData.property_for}</b></div>
                  <div className="pl-spec"><span>Type</span><b>{viewData.building_type} / {viewData.property_type}</b></div>
                  {viewData.features?.expected_price != null && (
                    <div className="pl-spec"><span>Price</span><b>₹ {Number(viewData.features.expected_price).toLocaleString('en-IN')}</b></div>
                  )}
                  {viewData.features?.built_up_area != null && (
                    <div className="pl-spec"><span>Built-up</span><b>{viewData.features.built_up_area} {viewData.features.area_unit}</b></div>
                  )}
                  {viewData.features?.carpet_area && (
                    <div className="pl-spec"><span>Carpet</span><b>{viewData.features.carpet_area} {viewData.features.carpet_area_unit || ''}</b></div>
                  )}
                  {viewData.features?.super_area && (
                    <div className="pl-spec"><span>Super</span><b>{viewData.features.super_area} {viewData.features.super_area_unit || ''}</b></div>
                  )}
                  {viewData.features?.sale_type && (
                    <div className="pl-spec"><span>Sale Type</span><b>{viewData.features.sale_type.replaceAll('_',' ')}</b></div>
                  )}
                  {viewData.features?.availability && (
                    <div className="pl-spec"><span>Availability</span><b>{viewData.features.availability.replaceAll('_',' ')}</b></div>
                  )}
                  {viewData.features?.no_of_floors != null && (
                    <div className="pl-spec"><span>No. of Floors</span><b>{viewData.features.no_of_floors}</b></div>
                  )}
                  {viewData.features?.property_on_floor && (
                    <div className="pl-spec"><span>On Floor</span><b>{viewData.features.property_on_floor}</b></div>
                  )}
                  {viewData.features?.furnishing_status && (
                    <div className="pl-spec"><span>Furnishing</span><b>{viewData.features.furnishing_status.replaceAll('_','-')}</b></div>
                  )}
                  {viewData.features?.facing && (
                    <div className="pl-spec"><span>Facing</span><b>{viewData.features.facing}</b></div>
                  )}
                  {viewData.features?.flooring_type && (
                    <div className="pl-spec"><span>Flooring</span><b>{viewData.features.flooring_type}</b></div>
                  )}
                  {viewData.features?.num_bedrooms && (
                    <div className="pl-spec"><span>Bedrooms</span><b>{viewData.features.num_bedrooms}</b></div>
                  )}
                  {viewData.features?.num_bathrooms != null && (
                    <div className="pl-spec"><span>Bathrooms</span><b>{viewData.features.num_bathrooms}</b></div>
                  )}
                  {viewData.features?.num_balconies != null && (
                    <div className="pl-spec"><span>Balconies</span><b>{viewData.features.num_balconies}</b></div>
                  )}
                  {viewData.features?.booking_amount && (
                    <div className="pl-spec"><span>Booking Amount</span><b>₹ {Number(viewData.features.booking_amount).toLocaleString('en-IN')}</b></div>
                  )}
                  {viewData.features?.maintenance_charges && (
                    <div className="pl-spec"><span>Maintenance</span><b>₹ {Number(viewData.features.maintenance_charges).toLocaleString('en-IN')}</b></div>
                  )}
                  {viewData.features?.ownership && (
                    <div className="pl-spec"><span>Ownership</span><b>{viewData.features.ownership.replaceAll('_',' ')}</b></div>
                  )}
                  {viewData.features?.rera_status && (
                    <div className="pl-spec"><span>RERA</span><b>{viewData.features.rera_status.replaceAll('_',' ')}</b></div>
                  )}
                  {viewData.features?.rera_number && (
                    <div className="pl-spec"><span>RERA No.</span><b>{viewData.features.rera_number}</b></div>
                  )}
                  {viewData.features?.age_years && (
                    <div className="pl-spec"><span>Age of Property</span><b>{viewData.features.age_years}</b></div>
                  )}
                  {viewData.features?.possession_by && (
                    <div className="pl-spec"><span>Possession By</span><b>{viewData.features.possession_by}</b></div>
                  )}
                  {viewData.features?.approving_authority && (
                    <div className="pl-spec"><span>Approving Authority</span><b>{viewData.features.approving_authority}</b></div>
                  )}
                  {viewData.description && (
                    <div className="pl-desc">{viewData.description}</div>
                  )}
                  {!!asArray(viewData?.features?.additional_rooms).length && (
                    <div className="pl-chip-group"><div className="pl-chip-title">Additional Rooms</div><div className="pl-chip-wrap">{asArray(viewData?.features?.additional_rooms).map((t,i)=> <span key={`r-${i}`} className="pl-chip">{t}</span>)}</div></div>
                  )}
                </div>
                <div className="pl-tags">
                  {!!asArray(viewData?.highlights).length && (
                    <div className="pl-tag-group"><div className="pl-tag-title">Highlights</div><div className="pl-tag-wrap">{asArray(viewData?.highlights).map((t,i)=> <span key={`h-${i}`} className="pl-tag">{t}</span>)}</div></div>
                  )}
                  {!!asArray(viewData?.amenities).length && (
                    <div className="pl-tag-group"><div className="pl-tag-title">Amenities</div><div className="pl-tag-wrap">{asArray(viewData?.amenities).map((t,i)=> <span key={`a-${i}`} className="pl-tag">{t}</span>)}</div></div>
                  )}
                  {!!asArray(viewData?.nearby_landmarks).length && (
                    <div className="pl-tag-group"><div className="pl-tag-title">Nearby</div><div className="pl-tag-wrap">{asArray(viewData?.nearby_landmarks).map((t,i)=> <span key={`n-${i}`} className="pl-tag">{t}</span>)}</div></div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


