import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './properties.css';

export default function SuperAdminProperties() {
  const { token, apiBase } = useSuperAdmin();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [selected, setSelected] = useState(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`${apiBase}/api/properties/admin/all`, { headers });
        if (!cancelled) setItems(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      if (typeFilter !== 'All Types' && x.type !== typeFilter) return false;
      if (!q) return true;
      return `${x.title} ${x.brokerName} ${x.city} ${x.state}`.toLowerCase().includes(q);
    });
  }, [items, query, typeFilter]);

  async function openView(it) {
    setSelected({ loading: true, ...it });
    setSlideIdx(0);
    try {
      const { data } = await axios.get(`${apiBase}/api/properties/admin/${it.brokerId}/${it.id}`, { headers });
      setSelected((prev) => ({ ...(prev || {}), loading: false, details: data?.data || null }));
    } catch (e) {
      setSelected((prev) => ({ ...(prev || {}), loading: false }));
      alert(e?.response?.data?.message || e?.message || 'Failed to fetch property');
    }
  }

  return (
    <div className="superadminbrokerproperties-root">
      <div className="superadminbrokerproperties-head">
        <div>
          <h1 className="superadminbrokerproperties-title">Property Management</h1>
          <div className="superadminbrokerproperties-sub">Review and manage property listings from brokers</div>
        </div>
        <div className="superadminbrokerproperties-actions">
          <button className="superadminbrokerproperties-btn superadminbrokerproperties-btn-primary">+ Add New Property</button>
        </div>
      </div>

      <div className="superadminbrokerproperties-toolbar">
        <div className="superadminbrokerproperties-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
        <input placeholder="Search brokers by name, email, or company..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="superadminbrokerproperties-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>All Types</option>
          {[...new Set(items.map(x => x.type))].filter(Boolean).map(t => (<option key={t}>{t}</option>))}
        </select>
        <select className="superadminbrokerproperties-select" value={'Published'} readOnly>
          <option>Published</option>
        </select>
      </div>

      <div className="superadminbrokerproperties-card">
        <div className="superadminbrokerproperties-thead">
          <div>Property</div>
          <div>Type</div>
          <div>Price</div>
          <div>Location</div>
          <div>Broker</div>
          <div>Status</div>
          <div>Actions</div>
        </div>

        {loading && <div className="superadminbrokerproperties-row"><div className="superadminbrokerproperties-loading">Loading...</div></div>}
        {!!error && !loading && <div className="superadminbrokerproperties-row"><div className="superadminbrokerproperties-error">{error}</div></div>}
        {!loading && !error && filtered.length === 0 && <div className="superadminbrokerproperties-row"><div>No properties found</div></div>}

        {!loading && !error && filtered.map((p) => (
          <div key={`${p.tenantDb}:${p.id}`} className="superadminbrokerproperties-row">
            <div className="superadminbrokerproperties-prop">
              <img src={p.image ? `${apiBase}${p.image}` : '/templates/proclassic/public/img/noimg.png'} alt="" />
              <div className="superadminbrokerproperties-prop-info">
                <div className="superadminbrokerproperties-prop-title">{p.title}</div>
                <div className="superadminbrokerproperties-prop-meta">{(p.area || '-')}{p.areaUnit ? ` ${p.areaUnit}` : ''}</div>
              </div>
            </div>
            <div>{p.type}</div>
            <div>₹{p.price || '-'}</div>
            <div>{[p.locality, p.city, p.state].filter(Boolean).join(', ')}</div>
            <div>{p.brokerName}</div>
            <div><span className="superadminbrokerproperties-badge superadminbrokerproperties-badge-published">Published</span></div>
            <div className="superadminbrokerproperties-actions-col">
              <button className="superadminbrokerproperties-link" onClick={() => openView(p)} title="View" aria-label="View">👁️</button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="superadminbroker-modal-overlay" onClick={() => setSelected(null)}>
          <div className="superadminbroker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bm-view-head">
              <div>
                <h3 className="bm-view-title">Property Details</h3>
                <div className="bm-view-sub">Review property information</div>
              </div>
              <button className="superadminbroker-iconbtn" onClick={() => setSelected(null)} aria-label="Close">×</button>
            </div>
            {selected.loading && <div className="superadminbrokerproperties-loading">Loading...</div>}
            {!selected.loading && selected.details && (() => {
              const media = Array.isArray(selected.details?.media) ? selected.details.media : [];
              const urls = media.map(m => m?.file_url).filter(Boolean);
              if (urls.length === 0 && selected.image) urls.push(selected.image);
              const total = Math.max(1, urls.length);
              const go = (d) => setSlideIdx((i) => (i + d + total) % total);
              const currentUrl = urls[Math.min(Math.max(slideIdx, 0), total - 1)];
              return (
              <div className="superadminbrokerproperties-detail">
                <div className="superadminbrokerproperties-detail-left">
                  <div className="superadminbrokerproperties-carousel">
                    <button className="superadminbrokerproperties-nav superadminbrokerproperties-prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
                    <img className="superadminbrokerproperties-detail-img" src={currentUrl ? `${apiBase}${currentUrl}` : ''} alt="" />
                    <button className="superadminbrokerproperties-nav superadminbrokerproperties-next" onClick={() => go(1)} aria-label="Next">›</button>
                  </div>
                  {urls.length > 1 && (
                    <div className="superadminbrokerproperties-thumbs">
                      {urls.map((u, idx) => (
                        <img key={idx} src={`${apiBase}${u}`} className={`superadminbrokerproperties-thumb ${idx === slideIdx ? 'active' : ''}`} onClick={() => setSlideIdx(idx)} alt="" />
                      ))}
                    </div>
                  )}

                  {(() => {
                    const f = selected.details?.features || {};
                    const built = (f.built_up_area ? `${f.built_up_area}${f.area_unit ? ` ${f.area_unit}` : ''}` : '—');
                    const carpet = (f.carpet_area ? `${f.carpet_area}${f.carpet_area_unit ? ` ${f.carpet_area_unit}` : ''}` : '—');
                    const superA = (f.super_area ? `${f.super_area}${f.super_area_unit ? ` ${f.super_area_unit}` : ''}` : '—');
                    return (
                      <div className="superadminbrokerproperties-miniinputs">
                        <div className="superadminbrokerproperties-field">
                          <label className="superadminbrokerproperties-label">Built-up Area</label>
                          <input disabled value={built} />
                        </div>
                        <div className="superadminbrokerproperties-field">
                          <label className="superadminbrokerproperties-label">Carpet Area</label>
                          <input disabled value={carpet} />
                        </div>
                        <div className="superadminbrokerproperties-field">
                          <label className="superadminbrokerproperties-label">Super Area</label>
                          <input disabled value={superA} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="superadminbrokerproperties-detail-right">
                  <div className="superadminbrokerproperties-summary">
                    <h2 className="superadminbrokerproperties-detail-title">{selected.details.title}</h2>
                    <div className="superadminbrokerproperties-detail-price">₹{selected.details?.features?.expected_price || selected.price || '-'}</div>
                    <dl className="superadminbrokerproperties-meta">
                      <div>
                        <dt>Type</dt>
                        <dd>{selected.type}</dd>
                      </div>
                      <div>
                        <dt>Area</dt>
                        <dd>{(selected.details?.features?.built_up_area || selected.area || '-')}{selected.details?.features?.area_unit ? ` ${selected.details.features.area_unit}` : ''}</dd>
                      </div>
                      <div>
                        <dt>Bedrooms</dt>
                        <dd>{selected.details?.features?.num_bedrooms ?? '-'}</dd>
                      </div>
                      <div>
                        <dt>Bathrooms</dt>
                        <dd>{selected.details?.features?.num_bathrooms ?? '-'}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{[selected.details.locality, selected.details.city, selected.details.state].filter(Boolean).join(', ') || '—'}</dd>
                      </div>
                      <div>
                        <dt>Broker</dt>
                        <dd>{selected.details.brokerName || selected.brokerName}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="superadminbrokerproperties-detail-desc">
                    <div className="bm-view-label">Description</div>
                    <div> {selected.details.description || '—'} </div>
                  </div>

                  {(() => {
                    const f = selected.details?.features || {};
                    const pretty = (v) => (v === null || v === undefined || v === '' ? '—' : v);
                    const areaWithUnit = (val, unit) => (val ? `${val}${unit ? ` ${unit}` : ''}` : '—');
                    const rooms = Array.isArray(f.additional_rooms)
                      ? f.additional_rooms
                      : (typeof f.additional_rooms === 'string' && f.additional_rooms.trim().startsWith('[')
                          ? (()=>{try{return JSON.parse(f.additional_rooms);}catch{return [];}})()
                          : (f.additional_rooms ? [String(f.additional_rooms)] : []));
                    const highlights = Array.isArray(selected.details?.highlights) ? selected.details.highlights : [];
                    const amenities = Array.isArray(selected.details?.amenities) ? selected.details.amenities : [];
                    const nearby = Array.isArray(selected.details?.nearby_landmarks) ? selected.details.nearby_landmarks : [];
                    return (
                      <>
                        <div className="superadminbrokerproperties-formgrid">
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Property For</label><input disabled value={pretty(selected.details.property_for || 'sell')} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Building Type</label><input disabled value={pretty(selected.details.building_type)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Sale Type</label><input disabled value={pretty(f.sale_type)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Availability</label><input disabled value={pretty(f.availability)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Approving Authority</label><input disabled value={pretty(f.approving_authority)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Ownership</label><input disabled value={pretty(f.ownership)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">RERA Status</label><input disabled value={pretty(f.rera_status)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">RERA Number</label><input disabled value={pretty(f.rera_number)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">No. of Floors</label><input disabled value={pretty(f.no_of_floors)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Property on Floor</label><input disabled value={pretty(f.property_on_floor)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Furnishing</label><input disabled value={pretty(f.furnishing_status)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Facing</label><input disabled value={pretty(f.facing)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Flooring</label><input disabled value={pretty(f.flooring_type)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Age of Property</label><input disabled value={pretty(f.age_years)} /></div>

                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Built-up Area</label><input disabled value={areaWithUnit(f.built_up_area, f.area_unit)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Carpet Area</label><input disabled value={areaWithUnit(f.carpet_area, f.carpet_area_unit)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Super Area</label><input disabled value={areaWithUnit(f.super_area, f.super_area_unit)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Booking Amount</label><input disabled value={pretty(f.booking_amount)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Maintenance</label><input disabled value={pretty(f.maintenance_charges)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Possession By</label><input disabled value={pretty(f.possession_by)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Bedrooms</label><input disabled value={pretty(f.num_bedrooms)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Bathrooms</label><input disabled value={pretty(f.num_bathrooms)} /></div>
                          <div className="superadminbrokerproperties-field"><label className="superadminbrokerproperties-label">Balconies</label><input disabled value={pretty(f.num_balconies)} /></div>
                        </div>

                        {rooms.length > 0 && (
                          <div className="superadminbrokerproperties-section">
                            <div className="bm-view-label">Additional Rooms</div>
                            <div className="superadminbrokerproperties-chips">
                              {rooms.map((r, i) => (<span key={i} className="superadminbrokerproperties-chip">{String(r)}</span>))}
                            </div>
                          </div>
                        )}

                        {amenities.length > 0 && (
                          <div className="superadminbrokerproperties-section">
                            <div className="bm-view-label">Amenities</div>
                            <div className="superadminbrokerproperties-chips">
                              {amenities.map((a, i) => (<span key={i} className="superadminbrokerproperties-chip">{String(a)}</span>))}
                            </div>
                          </div>
                        )}

                        {highlights.length > 0 && (
                          <div className="superadminbrokerproperties-section">
                            <div className="bm-view-label">Highlights</div>
                            <div className="superadminbrokerproperties-chips">
                              {highlights.map((h, i) => (<span key={i} className="superadminbrokerproperties-chip">{String(h)}</span>))}
                            </div>
                          </div>
                        )}

                        {nearby.length > 0 && (
                          <div className="superadminbrokerproperties-section">
                            <div className="bm-view-label">Nearby Landmarks</div>
                            <div className="superadminbrokerproperties-chips">
                              {nearby.map((n, i) => (<span key={i} className="superadminbrokerproperties-chip">{String(n)}</span>))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
