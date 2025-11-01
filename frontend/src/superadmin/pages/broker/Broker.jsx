import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import './broker.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

const COLUMN_OPTIONS = [
  { id: 'broker', label: 'Broker' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'licenseNo', label: 'License No' },
  { id: 'location', label: 'Location' },
  { id: 'company', label: 'Company' },
  { id: 'subscription', label: 'Subscription' },
  { id: 'status', label: 'Status' },
  { id: 'properties', label: 'Properties' },
  { id: 'leads', label: 'Leads' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_COLUMN_IDS = ['broker', 'company', 'subscription', 'status', 'properties', 'leads', 'actions'];

// Small helpers to create deterministic mock values for UI-only fields
function deriveSubscription(id) {
  const types = ['Basic', 'Premium', 'Pro'];
  return types[id % types.length];
}
function deriveCompany(name = '') {
  const base = (name || 'Realty').split(' ')[0];
  return {
    company: `${base} Realty Co.`,
    domain: `${base.toLowerCase()}realty.com`,
  };
}
function pseudoCount(id, max) {
  return (id % (max + 1));
}

export default function SuperAdminBroker() {
  const { token, apiBase } = useSuperAdmin();
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);

  const [formAdd, setFormAdd] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    license_no: '',
    location: '',
    company_name: '',
    status: 'active',
    photo: null,
  });
  const [formEdit, setFormEdit] = useState({
    id: null,
    full_name: '',
    email: '',
    phone: '',
    license_no: '',
    location: '',
    company_name: '',
    status: 'active',
    photo: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const columnButtonRef = useRef(null);
  const columnMenuRef = useRef(null);

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);
  const filteredBrokers = useMemo(() => {
    const list = brokers.filter((b) => {
      if (query && !(`${b.name || ''} ${b.email || ''}`.toLowerCase().includes(query.toLowerCase()))) return false;
      if (!statusFilter || statusFilter === 'All') return true;
      const target = String(statusFilter).toLowerCase();
      return String(b.status || 'active').toLowerCase() === target;
    });
    return list;
  }, [brokers, statusFilter, query]);

  const totals = useMemo(() => {
    const total = brokers.length;
    const active = brokers.filter((b) => String(b.status || '').toLowerCase() === 'active').length;
    const inactive = brokers.filter((b) => {
      const s = String(b.status || '').toLowerCase();
      return s === 'suspended' || s === 'inactive';
    }).length;
    const leads = brokers.reduce((sum, b) => sum + (Number(b.leadsCount) || 0), 0);
    return { total, active, inactive, leads };
  }, [brokers]);

  const visibleColumns = useMemo(
    () => COLUMN_OPTIONS.filter((col) => visibleColumnIds.includes(col.id)),
    [visibleColumnIds]
  );

  const getMinWidth = (colId) => {
    const widths = {
      broker: '180px',
      email: '180px',
      phone: '120px',
      licenseNo: '120px',
      location: '120px',
      company: '150px',
      subscription: '110px',
      status: '100px',
      properties: '110px',
      leads: '110px',
      actions: '100px',
    };
    return widths[colId] || '120px';
  };

  const getColumnSizes = (columns) => {
    // For default columns (7 or fewer), use flexible sizing without forcing min-width
    // This prevents unnecessary scrollbar when content fits
    // Broker column gets 2fr, others get 1fr
    if (columns.length <= 7) {
      return columns.map((col) => col.id === 'broker' ? '2fr' : '1fr').join(' ');
    }
    // For more columns, use minmax to ensure readability
    // Broker column gets 2fr, others get 1fr with min-width
    return columns.map((col) => {
      if (col.id === 'broker') {
        const minWidth = getMinWidth(col.id);
        return `minmax(${minWidth}, 2fr)`;
      }
      const minWidth = getMinWidth(col.id);
      return `minmax(${minWidth}, 1fr)`;
    }).join(' ');
  };

  const toggleColumn = (id) => {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id); else set.add(id);
      return COLUMN_OPTIONS.map((col) => col.id).filter((colId) => set.has(colId));
    });
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const params = {
          ...(query ? { q: query } : {}),
          ...((statusFilter && statusFilter !== 'All') ? { status: String(statusFilter).toLowerCase() } : {}),
        };
        const resp = await axios.get(`${apiBase}/api/broker/listbroker-with-stats`, { headers, params: Object.keys(params).length ? params : undefined });
        if (!cancelled) setBrokers(Array.isArray(resp.data?.data) ? resp.data.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token, query, statusFilter]);

  async function refreshList() {
    try {
      const params = {
        ...(query ? { q: query } : {}),
        ...((statusFilter && statusFilter !== 'All') ? { status: String(statusFilter).toLowerCase() } : {}),
      };
      const resp = await axios.get(`${apiBase}/api/broker/listbroker-with-stats`, { headers, params: Object.keys(params).length ? params : undefined });
      setBrokers(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch {}
  }

  function openAdd() {
    setFormAdd({ full_name: '', email: '', phone: '', password: '', license_no: '', location: '', company_name: '', status: 'active', photo: null });
    setShowAdd(true);
  }

  async function submitAdd(e) {
    e?.preventDefault?.();
    if (!token) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('full_name', formAdd.full_name);
      fd.append('email', formAdd.email);
      fd.append('phone', formAdd.phone || '');
      fd.append('password', formAdd.password);
      fd.append('license_no', formAdd.license_no || '');
      fd.append('location', formAdd.location || '');
      fd.append('company_name', formAdd.company_name || '');
      fd.append('status', formAdd.status || 'active');
      if (formAdd.photo) fd.append('photo', formAdd.photo);
      await axios.post(`${apiBase}/api/broker/createbroker`, fd, { headers: { ...headers } });
      setShowAdd(false);
      await refreshList();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Create failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function openView(brokerId) {
    if (!token) return;
    const seed = brokers.find((x) => x.id === brokerId) || null;
    if (seed) {
      setSelected(seed);
      setShowView(true);
    }
    try {
      const resp = await axios.get(`${apiBase}/api/broker/getbroker/${brokerId}`, { headers });
      setSelected((prev) => ({ ...(prev || {}), ...(resp.data?.data || {}) }));
    } catch (e) {
      if (!seed) alert(e?.response?.data?.message || e?.message || 'Failed to load broker');
    }
  }

  async function openEdit(brokerId) {
    if (!token) return;
    try {
      const resp = await axios.get(`${apiBase}/api/broker/getbroker/${brokerId}`, { headers });
      const b = resp.data?.data;
      if (b) {
        setFormEdit({ 
          id: b.id, 
          full_name: b.name || '', 
          email: b.email || '', 
          phone: b.phone || '', 
          license_no: b.licenseNo || '', 
          location: b.location || '', 
          company_name: b.companyName || '', 
          status: b.status || 'active', 
          photo: null 
        });
        setShowEdit(true);
      }
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to load broker');
    }
  }

  async function submitEdit(e) {
    e?.preventDefault?.();
    if (!token || !formEdit.id) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('full_name', formEdit.full_name);
      fd.append('email', formEdit.email);
      fd.append('phone', formEdit.phone || '');
      fd.append('license_no', formEdit.license_no || '');
      fd.append('location', formEdit.location || '');
      fd.append('company_name', formEdit.company_name || '');
      fd.append('status', formEdit.status || 'active');
      if (formEdit.photo) fd.append('photo', formEdit.photo);
      await axios.put(`${apiBase}/api/broker/updatebroker/${formEdit.id}`, fd, { headers: { ...headers } });
      setShowEdit(false);
      await refreshList();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  function exportCsv() {
    const rows = [
      ['ID','Name','Email','Status'],
      ...filteredBrokers.map(b => [b.id, b.name, b.email, b.status]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'brokers.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bm-root">
      <div className="bm-head">
        <div>
          <h1 className="bm-title">Broker Management</h1>
          <div className="bm-sub">Manage broker accounts & subscriptions</div>
        </div>
        <div className="bm-actions">
          <button className="bm-btn bm-btn-light" onClick={exportCsv}>Export Leads</button>
          <div className="bm-tableactions">
            <button
              type="button"
              ref={columnButtonRef}
              className="bm-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div 
                className="bm-colmenu" 
                ref={columnMenuRef} 
                role="menu"
              >
                <div className="bm-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="bm-colmenu-item">
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
          <button className="bm-btn bm-btn-primary" onClick={openAdd}>+ Add New Broker</button>
        </div>
      </div>

      <div className="bm-toolbar">
        <div className="bm-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
          <input placeholder="Search brokers by name, email, or company..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="bm-filter">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <div className="bm-cards">
        <div className="bm-card">
          <div className="bm-card-title">Total Brokers</div>
          <div className="bm-card-metric">{totals.total}</div>
        </div>
        <div className="bm-card">
          <div className="bm-card-title">Active Brokers</div>
          <div className="bm-card-metric">{totals.active}</div>
        </div>
        <div className="bm-card">
          <div className="bm-card-title">Inactive Brokers</div>
          <div className="bm-card-metric">{totals.inactive}</div>
        </div>
        <div className="bm-card">
          <div className="bm-card-title">Total Leads</div>
          <div className="bm-card-metric">{totals.leads.toLocaleString()}</div>
        </div>
      </div>

      <div className="bm-section">
        <div className="bm-section-head">
          <div>
            <h2>Broker Accounts</h2>
            <div className="bm-section-sub">Manage all broker accounts and their details</div>
          </div>
        </div>

        <div className="bm-table-wrap">
          <div className="bm-table">
            <div className="bm-thead" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
              {visibleColumns.map((col) => (
                <div key={col.id}>{col.label}</div>
              ))}
            </div>

            {loading && <div className="bm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}><div className="bm-loading" style={{ gridColumn: `1 / -1` }}>Loading...</div></div>}
            {!!error && !loading && <div className="bm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}><div className="bm-error" style={{ gridColumn: `1 / -1` }}>{error}</div></div>}
            {!loading && !error && filteredBrokers.length === 0 && <div className="bm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}><div style={{ gridColumn: `1 / -1` }}>No brokers found</div></div>}

          {!loading && !error && filteredBrokers.map((b) => {
            const sub = deriveSubscription(b.id);
            const companyName = b.companyName || deriveCompany(b.name).company;
            const properties = (typeof b.propertiesCount === 'number') ? b.propertiesCount : (10 + pseudoCount(b.id, 40));
            const leads = (typeof b.leadsCount === 'number') ? b.leadsCount : (15 + pseudoCount(b.id * 7, 30));
            
            const renderCell = (colId) => {
              switch (colId) {
                case 'broker':
                  return (
                    <div className="bm-broker">
                      <div className="bm-avatar" aria-hidden>{String(b.name || 'B').split(' ').map(x=>x[0]).slice(0,2).join('').toUpperCase()}</div>
                      <div className="bm-broker-info">
                        <div className="bm-broker-name">{b.name}</div>
                        {visibleColumnIds.includes('email') ? null : <div className="bm-broker-email">{b.email}</div>}
                      </div>
                    </div>
                  );
                case 'email':
                  return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.email || '—'}</div>;
                case 'phone':
                  return <div>{b.phone || '—'}</div>;
                case 'licenseNo':
                  return <div>{b.licenseNo || '—'}</div>;
                case 'location':
                  return <div>{b.location || '—'}</div>;
                case 'company':
                  return (
                    <div className="bm-company">
                      <div className="bm-company-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{companyName}</div>
                    </div>
                  );
                case 'subscription':
                  return (
                    <div>
                      <span className={`bm-tag bm-tag-${sub.toLowerCase()}`}>{sub}</span>
                    </div>
                  );
                case 'status':
                  return (
                    <div>
                      <span className={`bm-badge bm-badge-${String(b.status || 'active').toLowerCase()}`}>{String(b.status || 'active').charAt(0).toUpperCase() + String(b.status || 'active').slice(1)}</span>
                    </div>
                  );
                case 'properties':
                  return (
                    <div className="bm-col-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M3 11h18v2H3v-2Zm2 4h14v2H5v-2ZM7 7h10v2H7V7Z"/></svg>
                      <span>{properties}</span>
                    </div>
                  );
                case 'leads':
                  return (
                    <div className="bm-col-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M20 7H4v10h16V7Zm2-2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2ZM7 8h3v3H7V8Zm0 5h10v2H7v-2Zm5-5h5v3h-5V8Z"/></svg>
                      <span>{leads}</span>
                    </div>
                  );
                case 'actions':
                  return (
                    <div className="bm-actions-col">
                      <button className="bm-link" onClick={() => openView(b.id)} title="View" aria-label="View">👁️</button>
                      <button className="bm-link" onClick={() => openEdit(b.id)} title="Edit" aria-label="Edit">✏️</button>
                    </div>
                  );
                default:
                  return <div>—</div>;
              }
            };

            return (
              <div key={b.id} className="bm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
                {visibleColumns.map((col) => (
                  <div key={col.id} style={{ overflow: 'hidden' }}>{renderCell(col.id)}</div>
                ))}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="superadminbroker-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="superadminbroker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadminbroker-modal-header">
              <h3>Add Broker</h3>
              <button className="superadminbroker-iconbtn" onClick={() => setShowAdd(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitAdd}>
              <div className="superadminbroker-formrow">
                <label>Name</label>
                <input value={formAdd.full_name} onChange={(e) => setFormAdd({ ...formAdd, full_name: e.target.value })} required />
              </div>
              <div className="superadminbroker-formrow">
                <label>Email</label>
                <input type="email" value={formAdd.email} onChange={(e) => setFormAdd({ ...formAdd, email: e.target.value })} required />
              </div>
              <div className="superadminbroker-formrow">
                <label>Phone</label>
                <input value={formAdd.phone} onChange={(e) => setFormAdd({ ...formAdd, phone: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Password</label>
                <input type="password" value={formAdd.password} onChange={(e) => setFormAdd({ ...formAdd, password: e.target.value })} required />
              </div>
              <div className="superadminbroker-formrow">
                <label>License No</label>
                <input value={formAdd.license_no} onChange={(e) => setFormAdd({ ...formAdd, license_no: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Location</label>
                <input value={formAdd.location} onChange={(e) => setFormAdd({ ...formAdd, location: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Company Name</label>
                <input value={formAdd.company_name} onChange={(e) => setFormAdd({ ...formAdd, company_name: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Status</label>
                <select value={formAdd.status} onChange={(e) => setFormAdd({ ...formAdd, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending" disabled>Pending (auto)</option>
                </select>
              </div>
              <div className="superadminbroker-formrow">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setFormAdd({ ...formAdd, photo: e.target.files?.[0] || null })} />
              </div>
              <div className="superadminbroker-modal-actions">
                <button type="button" className="btn-light" onClick={() => setShowAdd(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showView && selected && (
        <div className="superadminbroker-modal-overlay" onClick={() => setShowView(false)}>
          <div className="superadminbroker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="bm-view-head">
              <div>
                <h3 className="bm-view-title">Broker Information</h3>
                <div className="bm-view-sub">Personal and business details</div>
              </div>
              <button className="superadminbroker-iconbtn" onClick={() => setShowView(false)} aria-label="Close">×</button>
            </div>

            {(() => {
              const sub = deriveSubscription(selected.id || 0);
              const comp = selected.companyName ? { company: selected.companyName, domain: `${(selected.companyName || '').split(' ')[0].toLowerCase()}realty.com` } : deriveCompany(selected.name);
              const totalProps = Number(selected.propertiesCount || 0);
              const totalLeads = Number(selected.leadsCount || 0);
              const created = selected.createdAt || selected.created_at || selected.created_at?.split('T')?.[0];
              const memberSince = created ? String(created).slice(0, 10) : '-';
              const status = String(selected.status || 'active');
              return (
                <div className="bm-view-grid">
                  <div className="bm-view-item"><div className="bm-view-label">Full Name</div><div className="bm-view-value">{selected.name || '-'}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">License Number</div><div className="bm-view-value">{selected.licenseNo || '-'}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Email Address</div><div className="bm-view-value">{selected.email || '-'}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Location</div><div className="bm-view-value">{selected.location || '-'}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Phone Number</div><div className="bm-view-value">{selected.phone || '-'}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Member Since</div><div className="bm-view-value">{memberSince}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Company Name</div><div className="bm-view-value">{comp.company}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Total Leads</div><div className="bm-view-value">{totalLeads}</div></div>
                  <div className="bm-view-item"><div className="bm-view-label">Total Properties</div><div className="bm-view-value">{totalProps}</div></div>
                </div>
              );
            })()}

            <hr className="bm-view-divider" />
            <div className="bm-view-bottom">
              <div>
                <div className="bm-view-label">Account Status</div>
                <span className={`bm-badge bm-badge-${String(selected.status || 'active').toLowerCase()}`}>{String(selected.status || 'active').charAt(0).toUpperCase() + String(selected.status || 'active').slice(1)}</span>
              </div>
              <div>
                <div className="bm-view-label">Subscription Plan</div>
                <span className={`bm-tag bm-tag-${deriveSubscription(selected.id || 0).toLowerCase()}`}>{deriveSubscription(selected.id || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="superadminbroker-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="superadminbroker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadminbroker-modal-header">
              <h3>Edit Broker</h3>
              <button className="superadminbroker-iconbtn" onClick={() => setShowEdit(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitEdit}>
              <div className="superadminbroker-formrow">
                <label>Name</label>
                <input value={formEdit.full_name} onChange={(e) => setFormEdit({ ...formEdit, full_name: e.target.value })} required />
              </div>
              <div className="superadminbroker-formrow">
                <label>Email</label>
                <input type="email" value={formEdit.email} onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })} required />
              </div>
              <div className="superadminbroker-formrow">
                <label>Phone</label>
                <input value={formEdit.phone} onChange={(e) => setFormEdit({ ...formEdit, phone: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>License No</label>
                <input value={formEdit.license_no} onChange={(e) => setFormEdit({ ...formEdit, license_no: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Location</label>
                <input value={formEdit.location} onChange={(e) => setFormEdit({ ...formEdit, location: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Company Name</label>
                <input value={formEdit.company_name} onChange={(e) => setFormEdit({ ...formEdit, company_name: e.target.value })} />
              </div>
              <div className="superadminbroker-formrow">
                <label>Status</label>
                <select value={formEdit.status} onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="superadminbroker-formrow">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setFormEdit({ ...formEdit, photo: e.target.files?.[0] || null })} />
              </div>
              <div className="superadminbroker-modal-actions">
                <button type="button" className="btn-light" onClick={() => setShowEdit(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
