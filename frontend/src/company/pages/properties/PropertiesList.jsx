import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCompany } from '../../../context/CompanyContext.jsx';
import './propertiesList.css';

const COLUMN_OPTIONS = [
  { id: 'type', label: 'Type' },
  { id: 'buildingType', label: 'Building Type' },
  { id: 'propertyFor', label: 'Property For' },
  { id: 'saleType', label: 'Sale Type' },
  { id: 'availability', label: 'Availability' },
  { id: 'approvingAuthority', label: 'Approving Authority' },
  { id: 'ownership', label: 'Ownership' },
  { id: 'reraStatus', label: 'RERA Status' },
  { id: 'reraNumber', label: 'RERA Number' },
  { id: 'floors', label: 'Floors' },
  { id: 'propertyOnFloor', label: 'Property on Floor' },
  { id: 'furnishingStatus', label: 'Furnishing' },
  { id: 'facing', label: 'Facing' },
  { id: 'flooringType', label: 'Flooring' },
  { id: 'ageYears', label: 'Age of Property' },
  { id: 'bedrooms', label: 'Bedrooms' },
  { id: 'bathrooms', label: 'Bathrooms' },
  { id: 'builtArea', label: 'Built-up Area' },
  { id: 'carpetArea', label: 'Carpet Area' },
  { id: 'superArea', label: 'Super Area' },
  { id: 'price', label: 'Price' },
  { id: 'bookingAmount', label: 'Booking Amount' },
  { id: 'maintenanceCharges', label: 'Maintenance' },
  { id: 'possessionBy', label: 'Possession By' },
  { id: 'location', label: 'Location' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Date' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_COLUMN_IDS = ['type', 'price', 'location', 'status', 'date', 'actions'];

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹—';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatArea = (value, unit) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '—';
  const safeUnit = unit ? String(unit).replace(/_/g, ' ') : 'sqft';
  return `${num.toLocaleString('en-IN')} ${safeUnit}`;
};

const statusColorClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'status-pill-active';
  if (normalized === 'inactive' || normalized === 'draft') return 'status-pill-inactive';
  if (normalized === 'sold') return 'status-pill-sold';
  return 'status-pill-neutral';
};

export default function PropertiesList() {
  const { token, apiBase } = useCompany();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [selected, setSelected] = useState(null);
  const [slideIdx, setSlideIdx] = useState(0);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const [columnFilters, setColumnFilters] = useState({});
  const [openFilterMenu, setOpenFilterMenu] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(10);
  const [stats, setStats] = useState({
    totalProperties: 0,
    publishedProperties: 0,
    highDemandProperties: 0,
    newThisWeek: 0,
    activeLeads: 0,
  });
  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);
  const columnButtonRef = useRef(null);
  const columnMenuRef = useRef(null);
  const filterMenuRefs = useRef({});

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${apiBase}/api/properties/listproperty`, {
          params: { page: 1, q: query },
          headers,
        });
        if (!cancelled) {
          // Transform data to match expected format
          // Note: listProperties returns limited fields, getPropertyById returns full details
          const transformed = (Array.isArray(data?.data) ? data.data : []).map(item => {
            // Features might be a nested object or flat fields
            const features = item.features || {};
            // listProperties returns expected_price, built_up_area, area_unit directly on item
            const itemPrice = item.expected_price || features.expected_price;
            const itemArea = item.built_up_area || features.built_up_area;
            const itemAreaUnit = item.area_unit || features.area_unit;
            
            return {
              id: item.id,
              title: item.title || 'Untitled property',
              type: item.property_type || '—',
              buildingType: item.building_type || '—',
              propertyFor: item.property_for || '—',
              locality: item.locality || '',
              city: item.city || '',
              state: item.state || '',
              area: itemArea,
              areaUnit: itemAreaUnit,
              carpetArea: features.carpet_area || item.carpet_area,
              carpetAreaUnit: features.carpet_area_unit || item.carpet_area_unit,
              superArea: features.super_area || item.super_area,
              superAreaUnit: features.super_area_unit || item.super_area_unit,
              price: itemPrice,
              expected_price: itemPrice,
              image: item.primary_image || null,
              features: features,
              status: item.status || 'published',
              createdAt: item.created_at || item.createdAt,
              media: item.media || [],
              // Map features to top level for easy access
              saleType: features.sale_type || '—',
              availability: features.availability || '—',
              approvingAuthority: features.approving_authority || '—',
              ownership: features.ownership || '—',
              reraStatus: features.rera_status || '—',
              reraNumber: features.rera_number || '—',
              floors: features.no_of_floors || item.floors || null,
              propertyOnFloor: features.property_on_floor || '—',
              furnishingStatus: features.furnishing_status || '—',
              facing: features.facing || '—',
              flooringType: features.flooring_type || '—',
              ageYears: features.age_years || '—',
              bedrooms: features.num_bedrooms || item.bedrooms || null,
              bathrooms: features.num_bathrooms || item.bathrooms || null,
              bookingAmount: features.booking_amount || null,
              maintenanceCharges: features.maintenance_charges || null,
              possessionBy: features.possession_by || '—',
            };
          });
          setItems(transformed);
          setDisplayLimit(10);
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load');
    } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token, query]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      if (!token) return;
      try {
        const { data } = await axios.get(`${apiBase}/api/properties/company/stats`, { headers });
        if (!cancelled && data?.data) {
          setStats(data.data);
        }
      } catch (e) {
        // Ignore stats errors
      }
    }
    loadStats();
    return () => { cancelled = true; };
  }, [apiBase, headers, token]);

  // Extract unique values for each filterable column
  const filterValues = useMemo(() => {
    const values = {
      type: [...new Set(items.map(x => x.type).filter(Boolean))].sort(),
      buildingType: [...new Set(items.map(x => x.buildingType).filter(Boolean))].sort(),
      propertyFor: [...new Set(items.map(x => x.propertyFor).filter(Boolean))].sort(),
      saleType: [...new Set(items.map(x => x.saleType).filter(Boolean))].sort(),
      availability: [...new Set(items.map(x => x.availability).filter(Boolean))].sort(),
      approvingAuthority: [...new Set(items.map(x => x.approvingAuthority).filter(Boolean))].sort(),
      ownership: [...new Set(items.map(x => x.ownership).filter(Boolean))].sort(),
      reraStatus: [...new Set(items.map(x => x.reraStatus).filter(Boolean))].sort(),
      reraNumber: [...new Set(items.map(x => x.reraNumber).filter(Boolean))].sort(),
      furnishingStatus: [...new Set(items.map(x => x.furnishingStatus).filter(Boolean))].sort(),
      facing: [...new Set(items.map(x => x.facing).filter(Boolean))].sort(),
      flooringType: [...new Set(items.map(x => x.flooringType).filter(Boolean))].sort(),
      location: [...new Set(items.map(x => [x.locality, x.city, x.state].filter(Boolean).join(', ')).filter(Boolean))].sort(),
      status: [...new Set(items.map(x => x.status).filter(Boolean))].sort(),
      price: [], // Range filter would be complex, skip for now
    };
    return values;
  }, [items]);

  const getColumnValue = (colId, p) => {
    switch (colId) {
      case 'type': return p.type;
      case 'buildingType': return p.buildingType;
      case 'propertyFor': return p.propertyFor;
      case 'saleType': return p.saleType;
      case 'availability': return p.availability;
      case 'approvingAuthority': return p.approvingAuthority;
      case 'ownership': return p.ownership;
      case 'reraStatus': return p.reraStatus;
      case 'reraNumber': return p.reraNumber;
      case 'furnishingStatus': return p.furnishingStatus;
      case 'facing': return p.facing;
      case 'flooringType': return p.flooringType;
      case 'location': return [p.locality, p.city, p.state].filter(Boolean).join(', ');
      case 'status': return p.status;
      default: return null;
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((x) => {
      if (typeFilter !== 'All Types' && x.type !== typeFilter) return false;
      
      // Apply column filters
      for (const [colId, filterValue] of Object.entries(columnFilters)) {
        if (filterValue && filterValue !== 'All') {
          const colValue = getColumnValue(colId, x);
          if (String(colValue) !== String(filterValue)) return false;
        }
      }
      
      if (!q) return true;
      return `${x.title} ${x.city} ${x.state}`.toLowerCase().includes(q);
    });
  }, [items, query, typeFilter, columnFilters]);

  // Reset pagination when filters change
  useEffect(() => {
    setDisplayLimit(10);
  }, [query, typeFilter, columnFilters]);

  // Get paginated results
  const paginatedFiltered = useMemo(() => {
    return filtered.slice(0, displayLimit);
  }, [filtered, displayLimit]);

  const hasMore = filtered.length > displayLimit;

  const handleSeeMore = () => {
    setDisplayLimit(prev => prev + 10);
  };

  useEffect(() => {
    if (!columnMenuOpen) return undefined;
    function handleClickOutside(event) {
      if (!columnMenuRef.current || !columnButtonRef.current) return;
      if (columnMenuRef.current.contains(event.target) || columnButtonRef.current.contains(event.target)) return;
      setColumnMenuOpen(false);
    }
    function handleEsc(event) {
      if (event.key === 'Escape') setColumnMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [columnMenuOpen]);

  // Handle click outside for filter menus
  useEffect(() => {
    if (openFilterMenu === null) return undefined;
    function handleClickOutside(event) {
      const menuRef = filterMenuRefs.current[openFilterMenu];
      const buttonRef = document.querySelector(`[data-filter-col="${openFilterMenu}"]`);
      if (!menuRef && !buttonRef) return;
      if (menuRef?.contains(event.target) || buttonRef?.contains(event.target)) return;
      setOpenFilterMenu(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openFilterMenu]);

  const toggleFilter = (colId) => {
    setOpenFilterMenu(openFilterMenu === colId ? null : colId);
  };

  const setFilter = (colId, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [colId]: value === 'All' ? undefined : value,
    }));
    setOpenFilterMenu(null);
  };

  const visibleColumns = useMemo(
    () => COLUMN_OPTIONS.filter((col) => visibleColumnIds.includes(col.id)),
    [visibleColumnIds]
  );

  const toggleColumn = (id) => {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id); else set.add(id);
      return COLUMN_OPTIONS.map((col) => col.id).filter((colId) => set.has(colId));
    });
  };

  async function openView(it) {
    setSelected({ loading: true, ...it });
    setSlideIdx(0);
    try {
      const { data } = await axios.get(`${apiBase}/api/properties/getproperty/${it.id}`, { headers });
      const details = data?.data || null;
      // Transform media URLs
      const media = Array.isArray(details?.media) ? details.media.map(m => ({
        ...m,
        file_url: m.file_url?.startsWith('http') ? m.file_url : `${apiBase}${m.file_url?.startsWith('/') ? '' : '/'}${m.file_url}`
      })) : [];
      setSelected((prev) => ({ ...(prev || {}), loading: false, details: { ...details, media } }));
    } catch (e) {
      setSelected((prev) => ({ ...(prev || {}), loading: false }));
      alert(e?.response?.data?.message || e?.message || 'Failed to fetch property');
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
    const base = String(apiBase || '').replace(/\/?$/, '');
    return `${base}${u.startsWith('/') ? '' : '/'}${u}`;
  }

  const renderCell = (key, p, helpers) => {
    const { location, builtUp, carpet, superArea, priceLabel, bookingLabel, maintenanceLabel, dateLabel } = helpers;
    switch (key) {
      case 'type': return p.type || '—';
      case 'buildingType': return p.buildingType || '—';
      case 'propertyFor': return p.propertyFor || '—';
      case 'saleType': return p.saleType || '—';
      case 'availability': return p.availability || '—';
      case 'approvingAuthority': return p.approvingAuthority || '—';
      case 'ownership': return p.ownership || '—';
      case 'reraStatus': return p.reraStatus || '—';
      case 'reraNumber': return p.reraNumber || '—';
      case 'floors': return p.floors ?? '—';
      case 'propertyOnFloor': return p.propertyOnFloor || '—';
      case 'furnishingStatus': return p.furnishingStatus || '—';
      case 'facing': return p.facing || '—';
      case 'flooringType': return p.flooringType || '—';
      case 'ageYears': return p.ageYears || '—';
      case 'bedrooms': return p.bedrooms ?? '—';
      case 'bathrooms': return p.bathrooms ?? '—';
      case 'builtArea': return builtUp;
      case 'carpetArea': return carpet;
      case 'superArea': return superArea;
      case 'price': return priceLabel;
      case 'bookingAmount': return bookingLabel;
      case 'maintenanceCharges': return maintenanceLabel;
      case 'possessionBy': return p.possessionBy || '—';
      case 'location': return location;
      case 'status':
        return (
          <span className={`status-pill ${statusColorClass(p.status)}`}>
            <span className="status-dot" />
            {String(p.status || 'published').replace(/_/g, ' ')}
          </span>
        );
      case 'date':
        return dateLabel;
      case 'actions':
        return (
          <div className="companyproperties-actions-col">
            <button
              className="companyproperties-link"
              onClick={() => openView(p)}
              title="View"
              aria-label="View"
            >
              👁️
            </button>
          </div>
        );
      default:
        return '—';
    }
  };

  return (
    <div className="companyproperties-root">
      <div className="companyproperties-head">
        <div>
          <h1 className="companyproperties-title">My Properties</h1>
          <div className="companyproperties-sub">Manage and view all your property listings</div>
        </div>
        <div className="companyproperties-actions">
          <div className="companyproperties-tableactions">
            <button
              type="button"
              className="companyproperties-post-btn"
              onClick={() => navigate('/company/properties/new')}
            >
              <span aria-hidden>➕</span>
              <span>Post Property</span>
            </button>
            <button
              type="button"
              ref={columnButtonRef}
              className="companyproperties-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div className="companyproperties-colmenu" ref={columnMenuRef} role="menu">
                <div className="companyproperties-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="companyproperties-colmenu-item">
                    <input
                      type="checkbox"
                      checked={visibleColumnIds.includes(col.id)}
                      onChange={() => toggleColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="companyproperties-stats">
        <div className="companyproperties-stat-card">
          <div className="companyproperties-stat-content">
            <div className="companyproperties-stat-title">Total Properties</div>
            <div className="companyproperties-stat-value">{stats.totalProperties}</div>
            <div className="companyproperties-stat-subtitle">+{stats.newThisWeek} new this week</div>
          </div>
          <div className="companyproperties-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>
        <div className="companyproperties-stat-card">
          <div className="companyproperties-stat-content">
            <div className="companyproperties-stat-title">High Demand property</div>
            <div className="companyproperties-stat-value">{stats.highDemandProperties}</div>
            <div className="companyproperties-stat-subtitle">Most viewed within 24 hours</div>
          </div>
          <div className="companyproperties-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <div className="companyproperties-stat-card">
          <div className="companyproperties-stat-content">
            <div className="companyproperties-stat-title">Published</div>
            <div className="companyproperties-stat-value">{stats.publishedProperties}</div>
            <div className="companyproperties-stat-subtitle">All active and published properties</div>
          </div>
          <div className="companyproperties-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
        <div className="companyproperties-stat-card">
          <div className="companyproperties-stat-content">
            <div className="companyproperties-stat-title">Active Leads</div>
            <div className="companyproperties-stat-value">{stats.activeLeads}</div>
            <div className="companyproperties-stat-subtitle">Leads from last 24 hours</div>
          </div>
          <div className="companyproperties-stat-icon" style={{ background: '#e9d5ff', color: '#8b5cf6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
        </div>
      </div>

      <div className="companyproperties-toolbar">
        <div className="companyproperties-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
          <input placeholder="Search properties by title, city, or state..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="companyproperties-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
          <option>All Types</option>
          {[...new Set(items.map(x => x.type))].filter(Boolean).map(t => (<option key={t}>{t}</option>))}
        </select>
        <select className="companyproperties-select" value={'Published'} readOnly>
          <option>Published</option>
        </select>
      </div>

      <div className="companyproperties-card">
        <div className="companyproperties-tablewrap">
          <table className="companyproperties-table" role="table">
            <thead>
              <tr>
                <th scope="col">Property</th>
                {visibleColumns.map((col) => {
                  const filterValuesForCol = filterValues[col.id] || [];
                  const hasFilter = filterValuesForCol.length > 0;
                  const currentFilter = columnFilters[col.id];
                  const isMenuOpen = openFilterMenu === col.id;
                  return (
                    <th key={col.id} scope="col" className={`col-${col.id}`}>
                      <div className="companyproperties-th-filter">
                        <span>{col.label}</span>
                        {hasFilter && (
                          <div className="companyproperties-th-filter-btn-wrap">
                            <button
                              type="button"
                              data-filter-col={col.id}
                              className={`companyproperties-th-filter-btn ${currentFilter ? 'active' : ''}`}
                              onClick={() => toggleFilter(col.id)}
                              title="Filter"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                              </svg>
                            </button>
                            {isMenuOpen && (
                              <div
                                className="companyproperties-filter-menu"
                                ref={(el) => { if (el) filterMenuRefs.current[col.id] = el; }}
                              >
                                <div className="companyproperties-filter-menu-item">
                                  <button
                                    type="button"
                                    className={!currentFilter ? 'active' : ''}
                                    onClick={() => setFilter(col.id, 'All')}
                                  >
                                    All
                                  </button>
                                </div>
                                {filterValuesForCol.map((val) => (
                                  <div key={val} className="companyproperties-filter-menu-item">
                                    <button
                                      type="button"
                                      className={currentFilter === val ? 'active' : ''}
                                      onClick={() => setFilter(col.id, val)}
                                    >
                                      {val}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="companyproperties-table-empty">Loading properties…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="companyproperties-error">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="companyproperties-table-empty">No properties found</td>
                </tr>
              ) : (
                paginatedFiltered.map((p) => {
                  const location = [p.locality, p.city, p.state].filter(Boolean).join(', ') || '—';
                  const builtUp = formatArea(p.area, p.areaUnit);
                  const carpet = formatArea(p.carpetArea, p.carpetAreaUnit);
                  const superArea = formatArea(p.superArea, p.superAreaUnit);
                  const priceLabel = formatCurrency(p.price || p.expected_price);
                  const bookingLabel = formatCurrency(p.bookingAmount);
                  const maintenanceLabel = formatCurrency(p.maintenanceCharges);
                  const dateLabel = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                  const helpers = { location, builtUp, carpet, superArea, priceLabel, bookingLabel, maintenanceLabel, dateLabel };
                  return (
                    <tr key={p.id}>
                      <td className="col-property">
                        <div className="property-cell">
                          <div className="property-thumb">
                            <img src={p.image ? buildMediaUrl(p.image) : `${apiBase}/templates/proclassic/public/img/noimg.png`} alt="" />
                          </div>
                          <div className="property-meta">
                            <div className="property-title">{p.title || 'Untitled property'}</div>
                            <div className="property-sub">{(p.area || '-')}{p.areaUnit ? ` ${p.areaUnit}` : ''}</div>
                          </div>
                        </div>
                      </td>
                      {visibleColumns.map((col) => (
                        <td key={col.id} className={`col-${col.id}`}>{renderCell(col.id, p, helpers)}</td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
            </div>
        {hasMore && (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <button
              onClick={handleSeeMore}
              className="companyproperties-btn companyproperties-btn-primary"
              style={{ minWidth: '150px' }}
            >
              See More
            </button>
          </div>
        )}
      </div>

      {selected && (
        <div className="companyproperties-modal-overlay" onClick={() => setSelected(null)}>
          <div className="companyproperties-modal" onClick={(e) => e.stopPropagation()}>
            <div className="companyproperties-view-head">
              <div>
                <h3 className="companyproperties-view-title">Property Details</h3>
                <div className="companyproperties-view-sub">Review property information</div>
              </div>
              <button className="companyproperties-iconbtn" onClick={() => setSelected(null)} aria-label="Close">×</button>
            </div>
            {selected.loading && <div className="companyproperties-loading">Loading...</div>}
            {!selected.loading && selected.details && (() => {
              const media = Array.isArray(selected.details?.media) ? selected.details.media : [];
              const urls = media.map(m => buildMediaUrl(m?.file_url)).filter(Boolean);
              if (urls.length === 0 && selected.image) urls.push(buildMediaUrl(selected.image));
              const total = Math.max(1, urls.length);
              const go = (d) => setSlideIdx((i) => (i + d + total) % total);
              const currentUrl = urls[Math.min(Math.max(slideIdx, 0), total - 1)] || '/templates/proclassic/public/img/noimg.png';
              return (
              <div className="companyproperties-detail">
                <div className="companyproperties-detail-left">
                  <div className="companyproperties-carousel">
                    <button className="companyproperties-nav companyproperties-prev" onClick={() => go(-1)} aria-label="Previous">‹</button>
                    <img className="companyproperties-detail-img" src={currentUrl} alt="" />
                    <button className="companyproperties-nav companyproperties-next" onClick={() => go(1)} aria-label="Next">›</button>
                  </div>
                  {urls.length > 1 && (
                    <div className="companyproperties-thumbs">
                      {urls.map((u, idx) => (
                        <img key={idx} src={u} className={`companyproperties-thumb ${idx === slideIdx ? 'active' : ''}`} onClick={() => setSlideIdx(idx)} alt="" />
                      ))}
                </div>
                  )}

                  {(() => {
                    const f = selected.details?.features || {};
                    const built = (f.built_up_area ? `${f.built_up_area}${f.area_unit ? ` ${f.area_unit}` : ''}` : '—');
                    const carpet = (f.carpet_area ? `${f.carpet_area}${f.carpet_area_unit ? ` ${f.carpet_area_unit}` : ''}` : '—');
                    const superA = (f.super_area ? `${f.super_area}${f.super_area_unit ? ` ${f.super_area_unit}` : ''}` : '—');
                    return (
                      <div className="companyproperties-miniinputs">
                        <div className="companyproperties-field">
                          <label className="companyproperties-label">Built-up Area</label>
                          <input disabled value={built} />
                        </div>
                        <div className="companyproperties-field">
                          <label className="companyproperties-label">Carpet Area</label>
                          <input disabled value={carpet} />
                        </div>
                        <div className="companyproperties-field">
                          <label className="companyproperties-label">Super Area</label>
                          <input disabled value={superA} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="companyproperties-detail-right">
                  <div className="companyproperties-summary">
                    <h2 className="companyproperties-detail-title">{selected.details.title || selected.title}</h2>
                    <div className="companyproperties-detail-price">₹{selected.details?.features?.expected_price || selected.price || selected.expected_price || '-'}</div>
                    <dl className="companyproperties-meta">
                      <div>
                        <dt>Type</dt>
                        <dd>{selected.details.property_type || selected.type}</dd>
                      </div>
                      <div>
                        <dt>Area</dt>
                        <dd>{(selected.details?.features?.built_up_area || selected.area || '-')}{selected.details?.features?.area_unit ? ` ${selected.details.features.area_unit}` : ''}</dd>
                      </div>
                      <div>
                        <dt>Bedrooms</dt>
                        <dd>{selected.details?.features?.num_bedrooms ?? selected.bedrooms ?? '-'}</dd>
                      </div>
                      <div>
                        <dt>Bathrooms</dt>
                        <dd>{selected.details?.features?.num_bathrooms ?? selected.bathrooms ?? '-'}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{[selected.details.locality || selected.locality, selected.details.city || selected.city, selected.details.state || selected.state].filter(Boolean).join(', ') || '—'}</dd>
                      </div>
                    </dl>
                  </div>
                  <div className="companyproperties-detail-desc">
                    <div className="companyproperties-view-label">Description</div>
                    <div> {selected.details.description || '—'} </div>
                  </div>

                  {(() => {
                    const f = selected.details?.features || {};
                    const pretty = (v) => (v === null || v === undefined || v === '' ? '—' : v);
                    const areaWithUnit = (val, unit) => (val ? `${val}${unit ? ` ${unit}` : ''}` : '—');
                    const rooms = asArray(f.additional_rooms);
                    const highlights = asArray(selected.details?.highlights);
                    const amenities = asArray(selected.details?.amenities);
                    const nearby = asArray(selected.details?.nearby_landmarks);
                    return (
                      <>
                        <div className="companyproperties-formgrid">
                          <div className="companyproperties-field"><label className="companyproperties-label">Property For</label><input disabled value={pretty(selected.details.property_for || selected.propertyFor || 'sell')} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Building Type</label><input disabled value={pretty(selected.details.building_type || selected.buildingType)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Sale Type</label><input disabled value={pretty(f.sale_type)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Availability</label><input disabled value={pretty(f.availability)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Approving Authority</label><input disabled value={pretty(f.approving_authority)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Ownership</label><input disabled value={pretty(f.ownership)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">RERA Status</label><input disabled value={pretty(f.rera_status)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">RERA Number</label><input disabled value={pretty(f.rera_number)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">No. of Floors</label><input disabled value={pretty(f.no_of_floors)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Property on Floor</label><input disabled value={pretty(f.property_on_floor)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Furnishing</label><input disabled value={pretty(f.furnishing_status)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Facing</label><input disabled value={pretty(f.facing)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Flooring</label><input disabled value={pretty(f.flooring_type)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Age of Property</label><input disabled value={pretty(f.age_years)} /></div>

                          <div className="companyproperties-field"><label className="companyproperties-label">Built-up Area</label><input disabled value={areaWithUnit(f.built_up_area, f.area_unit)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Carpet Area</label><input disabled value={areaWithUnit(f.carpet_area, f.carpet_area_unit)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Super Area</label><input disabled value={areaWithUnit(f.super_area, f.super_area_unit)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Booking Amount</label><input disabled value={pretty(f.booking_amount)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Maintenance</label><input disabled value={pretty(f.maintenance_charges)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Possession By</label><input disabled value={pretty(f.possession_by)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Bedrooms</label><input disabled value={pretty(f.num_bedrooms)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Bathrooms</label><input disabled value={pretty(f.num_bathrooms)} /></div>
                          <div className="companyproperties-field"><label className="companyproperties-label">Balconies</label><input disabled value={pretty(f.num_balconies)} /></div>
                        </div>

                        {rooms.length > 0 && (
                          <div className="companyproperties-section">
                            <div className="companyproperties-view-label">Additional Rooms</div>
                            <div className="companyproperties-chips">
                              {rooms.map((r, i) => (<span key={i} className="companyproperties-chip">{String(r)}</span>))}
                            </div>
                          </div>
                        )}

                        {amenities.length > 0 && (
                          <div className="companyproperties-section">
                            <div className="companyproperties-view-label">Amenities</div>
                            <div className="companyproperties-chips">
                              {amenities.map((a, i) => (<span key={i} className="companyproperties-chip">{String(a)}</span>))}
                            </div>
                          </div>
                        )}

                        {highlights.length > 0 && (
                          <div className="companyproperties-section">
                            <div className="companyproperties-view-label">Highlights</div>
                            <div className="companyproperties-chips">
                              {highlights.map((h, i) => (<span key={i} className="companyproperties-chip">{String(h)}</span>))}
                            </div>
                          </div>
                        )}

                        {nearby.length > 0 && (
                          <div className="companyproperties-section">
                            <div className="companyproperties-view-label">Nearby Landmarks</div>
                            <div className="companyproperties-chips">
                              {nearby.map((n, i) => (<span key={i} className="companyproperties-chip">{String(n)}</span>))}
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

