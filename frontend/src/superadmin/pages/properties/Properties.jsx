import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import { FiPrinter } from 'react-icons/fi';
import './properties.css';

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
  { id: 'broker', label: 'Broker' },
  { id: 'company', label: 'Company' },
  { id: 'status', label: 'Status' },
  { id: 'date', label: 'Date' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_COLUMN_IDS = ['type', 'price', 'location', 'broker', 'company', 'status', 'date', 'actions'];

const truncateTitle = (title, maxWords = 20) => {
  if (!title) return 'Untitled property';
  const words = title.trim().split(/\s+/);
  if (words.length <= maxWords) return title;
  return words.slice(0, maxWords).join(' ') + '...';
};

const formatCurrency = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return '₹—';
  return `₹${num.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatArea = (value, unit) => {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '—';
  const safeUnit = unit ? String(unit).replace(/_/g, ' ') : 'sqft';
  return `${num.toFixed(2)} ${safeUnit}`;
};

const statusColorClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active' || normalized === 'published') return 'status-pill-active';
  if (normalized === 'inactive' || normalized === 'draft') return 'status-pill-inactive';
  if (normalized === 'sold') return 'status-pill-sold';
  return 'status-pill-neutral';
};

export default function SuperAdminProperties() {
  const { token, apiBase } = useSuperAdmin();
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
  const exportInProgressRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await axios.get(`${apiBase}/api/properties/admin/all`, { headers });
        if (!cancelled) {
          setItems(Array.isArray(data?.data) ? data.data : []);
          setDisplayLimit(10); // Reset pagination when new data loads
        }
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token]);

  useEffect(() => {
    let cancelled = false;
    async function loadStats() {
      if (!token) return;
      try {
        const { data } = await axios.get(`${apiBase}/api/properties/admin/stats`, { headers });
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
      broker: [...new Set(items.map(x => x.brokerName).filter(Boolean))].sort(),
      company: [...new Set(items.map(x => x.companyName).filter(Boolean))].sort(),
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
      case 'broker': return p.brokerName;
      case 'company': return p.companyName;
      case 'status': return p.status;
      default: return null;
    }
  };

  const buildImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const base = apiBase ? apiBase.replace(/\/+$/, '') : '';
    const path = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${base}${path}`;
  }, [apiBase]);

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
      return `${x.title} ${x.brokerName || ''} ${x.companyName || ''} ${x.city} ${x.state}`.toLowerCase().includes(q);
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

  const handleExport = useCallback(() => {
    if (exportInProgressRef.current) return;
    exportInProgressRef.current = true;
    try {
      if (!filtered.length) {
        alert('No properties available to export.');
        return;
      }
      const headers = [
        'Title',
        'Type',
        'Building Type',
        'Property For',
        'Sale Type',
        'Location',
        'Price',
        'Area',
        'Bedrooms',
        'Bathrooms',
        'Broker',
        'Status',
        'Date'
      ];
      const rows = filtered.map((p) => {
        const location = [p.locality, p.city, p.state].filter(Boolean).join(', ') || '—';
        const price = p.price ? formatCurrency(p.price) : '—';
        const area = p.builtArea ? formatArea(p.builtArea, p.areaUnit) : '—';
        const date = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—';
        return [
          truncateTitle(p.title),
          p.type || '—',
          p.buildingType || '—',
          p.propertyFor || '—',
          p.saleType || '—',
          location,
          price,
          area,
          p.bedrooms || '—',
          p.bathrooms || '—',
          p.brokerName || '—',
          p.status || '—',
          date,
        ];
      });
      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `properties-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } finally {
      exportInProgressRef.current = false;
    }
  }, [filtered]);

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
      const { data } = await axios.get(`${apiBase}/api/properties/admin/${it.brokerId}/${it.id}`, { headers });
      setSelected((prev) => ({ ...(prev || {}), loading: false, details: data?.data || null }));
    } catch (e) {
      setSelected((prev) => ({ ...(prev || {}), loading: false }));
      alert(e?.response?.data?.message || e?.message || 'Failed to fetch property');
    }
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
      case 'broker': return p.brokerName || '—';
      case 'company': return p.companyName || '—';
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
          <div className="superadminbrokerproperties-actions-col">
            <button
              className="superadminbrokerproperties-link"
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
    <div className="superadminbrokerproperties-root">
      <div className="superadminbrokerproperties-head">
        <div>
          <h1 className="superadminbrokerproperties-title">Property Management</h1>
          <div className="superadminbrokerproperties-sub">Review and manage property listings from brokers</div>
        </div>
        <div className="superadminbrokerproperties-actions">
          {/* <button className="superadminbrokerproperties-btn superadminbrokerproperties-btn-primary">+ Add New Property</button> */}
          <div className="superadminbrokerproperties-tableactions">
            <button
              type="button"
              ref={columnButtonRef}
              className="superadminbrokerproperties-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div className="superadminbrokerproperties-colmenu" ref={columnMenuRef} role="menu">
                <div className="superadminbrokerproperties-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="superadminbrokerproperties-colmenu-item">
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
      <div className="superadminbrokerproperties-stats">
        <div className="superadminbrokerproperties-stat-card">
          <div className="superadminbrokerproperties-stat-content">
            <div className="superadminbrokerproperties-stat-title">Total Properties</div>
            <div className="superadminbrokerproperties-stat-value">{stats.totalProperties}</div>
            <div className="superadminbrokerproperties-stat-subtitle">+{stats.newThisWeek} new this week</div>
          </div>
          <div className="superadminbrokerproperties-stat-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>
        <div className="superadminbrokerproperties-stat-card">
          <div className="superadminbrokerproperties-stat-content">
            <div className="superadminbrokerproperties-stat-title">High Demand property</div>
            <div className="superadminbrokerproperties-stat-value">{stats.highDemandProperties}</div>
            <div className="superadminbrokerproperties-stat-subtitle">Most viewed within 24 hours</div>
          </div>
          <div className="superadminbrokerproperties-stat-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </div>
        <div className="superadminbrokerproperties-stat-card">
          <div className="superadminbrokerproperties-stat-content">
            <div className="superadminbrokerproperties-stat-title">Published</div>
            <div className="superadminbrokerproperties-stat-value">{stats.publishedProperties}</div>
            <div className="superadminbrokerproperties-stat-subtitle">All active and published properties</div>
          </div>
          <div className="superadminbrokerproperties-stat-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
        </div>
        <div className="superadminbrokerproperties-stat-card">
          <div className="superadminbrokerproperties-stat-content">
            <div className="superadminbrokerproperties-stat-title">Active Leads</div>
            <div className="superadminbrokerproperties-stat-value">{stats.activeLeads}</div>
            <div className="superadminbrokerproperties-stat-subtitle">Leads from last 24 hours</div>
          </div>
          <div className="superadminbrokerproperties-stat-icon" style={{ background: '#e9d5ff', color: '#8b5cf6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
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
        <button type="button" className="superadminbrokerproperties-export-btn" onClick={handleExport}>
          <FiPrinter /> Export
        </button>
      </div>

      <div className="superadminbrokerproperties-card">
        <div className="superadminbrokerproperties-tablewrap">
          <table className="superadminbrokerproperties-table" role="table">
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
                      <div className="superadminbrokerproperties-th-filter">
                        <span>{col.label}</span>
                        {hasFilter && (
                          <div className="superadminbrokerproperties-th-filter-btn-wrap">
                            <button
                              type="button"
                              data-filter-col={col.id}
                              className={`superadminbrokerproperties-th-filter-btn ${currentFilter ? 'active' : ''}`}
                              onClick={() => toggleFilter(col.id)}
                              title="Filter"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                              </svg>
                            </button>
                            {isMenuOpen && (
                              <div
                                className="superadminbrokerproperties-filter-menu"
                                ref={(el) => { if (el) filterMenuRefs.current[col.id] = el; }}
                              >
                                <div className="superadminbrokerproperties-filter-menu-item">
                                  <button
                                    type="button"
                                    className={!currentFilter ? 'active' : ''}
                                    onClick={() => setFilter(col.id, 'All')}
                                  >
                                    All
                                  </button>
                                </div>
                                {filterValuesForCol.map((val) => (
                                  <div key={val} className="superadminbrokerproperties-filter-menu-item">
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
                  <td colSpan={visibleColumns.length + 1} className="superadminbrokerproperties-table-empty">Loading properties…</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="superadminbrokerproperties-error">{error}</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + 1} className="superadminbrokerproperties-table-empty">No properties found</td>
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
                  const dateLabel = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
                  const helpers = {
                    location,
                    builtUp,
                    carpet,
                    superArea,
                    priceLabel,
                    bookingLabel,
                    maintenanceLabel,
                    dateLabel,
                    normalizeImage: buildImageUrl,
                  };
                  return (
                    <tr key={`${p.tenantDb}:${p.id}`}>
                      <td className="col-property">
                        <div className="property-cell">
                          <div className="property-thumb">
                            {p.image && helpers.normalizeImage(p.image) ? (
                              <img
                                src={helpers.normalizeImage(p.image)}
                                alt=""
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                  const noImg = event.currentTarget.nextElementSibling;
                                  if (noImg) noImg.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="property-no-image" style={{ display: p.image && helpers.normalizeImage(p.image) ? 'none' : 'flex' }}>
                              No Image
                            </div>
                          </div>
                          <div className="property-meta">
                            <div className="property-title">{truncateTitle(p.title)}</div>
                            <div className="property-sub">{formatArea(p.builtArea || p.area, p.areaUnit || p.builtAreaUnit)}</div>
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
              className="superadminbrokerproperties-btn superadminbrokerproperties-btn-primary"
              style={{ minWidth: '150px' }}
            >
              See More
            </button>
          </div>
        )}
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
                    {currentUrl && buildImageUrl(currentUrl) ? (
                      <img 
                        className="superadminbrokerproperties-detail-img" 
                        src={buildImageUrl(currentUrl)} 
                        alt=""
                        onError={(event) => {
                          event.currentTarget.style.display = 'none';
                          const noImg = event.currentTarget.nextElementSibling;
                          if (noImg) noImg.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="superadminbrokerproperties-no-image" style={{ display: currentUrl && buildImageUrl(currentUrl) ? 'none' : 'flex' }}>
                      No Image
                    </div>
                    <button className="superadminbrokerproperties-nav superadminbrokerproperties-next" onClick={() => go(1)} aria-label="Next">›</button>
                  </div>
                  {urls.length > 1 && (
                    <div className="superadminbrokerproperties-thumbs">
                      {urls.map((u, idx) => {
                        const imgUrl = buildImageUrl(u);
                        return (
                          <div key={idx} className={`superadminbrokerproperties-thumb-wrapper ${idx === slideIdx ? 'active' : ''}`}>
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                className="superadminbrokerproperties-thumb"
                                onClick={() => setSlideIdx(idx)}
                                alt=""
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                  const noImg = event.currentTarget.nextElementSibling;
                                  if (noImg) noImg.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div className="superadminbrokerproperties-thumb-no-image" style={{ display: imgUrl ? 'none' : 'flex' }}>
                              No Image
                            </div>
                          </div>
                        );
                      })}
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
