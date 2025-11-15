import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import './company.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import { FiEye, FiEyeOff, FiEdit2 } from 'react-icons/fi';

const COLUMN_OPTIONS = [
  { id: 'company', label: 'Company' },
  { id: 'email', label: 'Email' },
  { id: 'phone', label: 'Phone' },
  { id: 'location', label: 'Location' },
  { id: 'portalRole', label: 'Portal Role' },
  { id: 'status', label: 'Status' },
  { id: 'properties', label: 'Properties' },
  { id: 'leads', label: 'Leads' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_COLUMN_IDS = ['company', 'email', 'phone', 'location', 'status', 'properties', 'leads', 'actions'];
const DOCUMENT_TYPES = [
  { value: '', label: 'Select Document Type' },
  { value: 'aadhaar', label: 'Aadhaar' },
  { value: 'pan_card', label: 'PAN Card' },
  { value: 'driving_license', label: 'Driving License' },
  { value: 'voter_id', label: 'Voter ID' },
  { value: 'other', label: 'Other' },
];

const PORTAL_ROLE_OPTIONS = [
  { value: 'company', label: 'Company' },
  { value: 'company_admin', label: 'Company Admin' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const statusLabel = (variant) => variant.charAt(0).toUpperCase() + variant.slice(1);
const pseudoCount = (id, max) => id % (max + 1);

const createAddState = () => ({
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
  password: '',
  portal_role: 'company',
  location: '',
  address: '',
  store_name: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  youtube: '',
  whatsapp_number: '',
  status: 'active',
  photo: null,
  document_type: '',
  document_front: null,
  document_back: null,
});

const createEditState = () => ({
  id: null,
  full_name: '',
  company_name: '',
  email: '',
  phone: '',
  portal_role: 'company',
  location: '',
  address: '',
  store_name: '',
  instagram: '',
  facebook: '',
  linkedin: '',
  youtube: '',
  whatsapp_number: '',
  status: 'active',
  photo: null,
  document_type: '',
  document_front: null,
  document_back: null,
});

const getStatusVariant = (company) => {
  if (!company?.lastLoginAt) return 'pending';
  const normalized = String(company?.status || 'active').toLowerCase();
  if (normalized === 'suspended') return 'suspended';
  return 'active';
};

const formatPortalRole = (portalRole) => {
  if (!portalRole) return 'Company';
  return portalRole.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (value) => {
  if (!value) return '—';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '—';
  return dt.toLocaleDateString();
};

export default function SuperAdminCompany() {
  const { token, apiBase } = useSuperAdmin();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showAdd, setShowAdd] = useState(false);
  const [showView, setShowView] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formAdd, setFormAdd] = useState(() => createAddState());
  const [formEdit, setFormEdit] = useState(() => createEditState());
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const columnButtonRef = useRef(null);
  const columnMenuRef = useRef(null);

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

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

  const buildQueryParams = () => {
    const params = {};
    if (query) params.q = query.trim();
    if (statusFilter && statusFilter !== 'All') params.status = statusFilter.toLowerCase();
    return params;
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const params = buildQueryParams();
        const resp = await axios.get(`${apiBase}/api/company/listcompany-with-stats`, {
          headers,
          params: Object.keys(params).length ? params : undefined,
        });
        if (!cancelled) {
          setCompanies(Array.isArray(resp.data?.data) ? resp.data.data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.message || err?.message || 'Failed to load companies');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token, query, statusFilter]);

  const refreshList = async () => {
    try {
      const params = buildQueryParams();
      const resp = await axios.get(`${apiBase}/api/company/listcompany-with-stats`, {
        headers,
        params: Object.keys(params).length ? params : undefined,
      });
      setCompanies(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to refresh companies');
    }
  };

  const filteredCompanies = useMemo(() => companies, [companies]);

  const totals = useMemo(() => {
    const total = companies.length;
    const active = companies.filter((c) => getStatusVariant(c) === 'active').length;
    const pending = companies.filter((c) => getStatusVariant(c) === 'pending').length;
    const suspended = companies.filter((c) => getStatusVariant(c) === 'suspended').length;
    const leads = companies.reduce((sum, c) => sum + (Number(c.leadsCount) || 0), 0);
    const properties = companies.reduce((sum, c) => sum + (Number(c.propertiesCount) || 0), 0);
    return { total, active, pending, suspended, leads, properties };
  }, [companies]);

  const visibleColumns = useMemo(
    () => COLUMN_OPTIONS.filter((col) => visibleColumnIds.includes(col.id)),
    [visibleColumnIds]
  );

  const getColumnSizes = (columns) => {
    if (columns.length <= 7) {
      return columns.map((col) => (col.id === 'company' ? '2fr' : '1fr')).join(' ');
    }
    return columns.map((col) => (col.id === 'company'
      ? `minmax(200px, 2fr)`
      : `minmax(120px, 1fr)`)).join(' ');
  };

  const toggleColumn = (id) => {
    setVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id); else set.add(id);
      return COLUMN_OPTIONS.map((col) => col.id).filter((colId) => set.has(colId));
    });
  };

  const openAdd = () => {
    setFormAdd(createAddState());
    setShowPassword(false);
    setShowAdd(true);
  };

  const submitAdd = async (event) => {
    event?.preventDefault?.();
    if (!token) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('full_name', formAdd.full_name);
      fd.append('company_name', formAdd.company_name);
      fd.append('email', formAdd.email);
      fd.append('phone', formAdd.phone || '');
      fd.append('password', formAdd.password);
      fd.append('portal_role', formAdd.portal_role);
      fd.append('location', formAdd.location || '');
      fd.append('address', formAdd.address || '');
      fd.append('store_name', formAdd.store_name || '');
      fd.append('instagram', formAdd.instagram || '');
      fd.append('facebook', formAdd.facebook || '');
      fd.append('linkedin', formAdd.linkedin || '');
      fd.append('youtube', formAdd.youtube || '');
      fd.append('whatsapp_number', formAdd.whatsapp_number || '');
      fd.append('status', formAdd.status || 'active');
      if (formAdd.photo) fd.append('photo', formAdd.photo);
      if (formAdd.document_type) fd.append('document_type', formAdd.document_type);
      if (formAdd.document_front) fd.append('document_front', formAdd.document_front);
      if (formAdd.document_back) fd.append('document_back', formAdd.document_back);
      await axios.post(`${apiBase}/api/company/createcompany`, fd, { headers });
      setShowAdd(false);
      await refreshList();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to create company');
    } finally {
      setSubmitting(false);
    }
  };

  const openView = async (companyId) => {
    if (!token) return;
    setSelected(null);
    setShowView(true);
    try {
      const resp = await axios.get(`${apiBase}/api/company/getcompany/${companyId}`, { headers });
      setSelected(resp.data?.data || null);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to load company');
      setShowView(false);
    }
  };

  const openEdit = async (companyId) => {
    if (!token) return;
    try {
      const resp = await axios.get(`${apiBase}/api/company/getcompany/${companyId}`, { headers });
      const c = resp.data?.data;
      if (c) {
        setFormEdit({
          id: c.id,
          full_name: c.name || '',
          company_name: c.companyName || '',
          email: c.email || '',
          phone: c.phone || '',
          portal_role: c.portalRole || 'company',
          location: c.location || '',
          address: c.address || '',
          store_name: c.storeName || '',
          instagram: c.instagram || '',
          facebook: c.facebook || '',
          linkedin: c.linkedin || '',
          youtube: c.youtube || '',
          whatsapp_number: c.whatsappNumber || '',
          status: c.status || 'active',
          photo: null,
          document_type: c.documentType || '',
          document_front: null,
          document_back: null,
        });
        setShowEdit(true);
      }
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to load company');
    }
  };

  const submitEdit = async (event) => {
    event?.preventDefault?.();
    if (!token || !formEdit.id) return;
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('full_name', formEdit.full_name);
      fd.append('company_name', formEdit.company_name);
      fd.append('email', formEdit.email);
      fd.append('phone', formEdit.phone || '');
      fd.append('portal_role', formEdit.portal_role || 'company');
      fd.append('location', formEdit.location || '');
      fd.append('address', formEdit.address || '');
      fd.append('store_name', formEdit.store_name || '');
      fd.append('instagram', formEdit.instagram || '');
      fd.append('facebook', formEdit.facebook || '');
      fd.append('linkedin', formEdit.linkedin || '');
      fd.append('youtube', formEdit.youtube || '');
      fd.append('whatsapp_number', formEdit.whatsapp_number || '');
      fd.append('status', formEdit.status || 'active');
      if (formEdit.photo) fd.append('photo', formEdit.photo);
      if (formEdit.document_type !== undefined) fd.append('document_type', formEdit.document_type || '');
      if (formEdit.document_front) fd.append('document_front', formEdit.document_front);
      if (formEdit.document_back) fd.append('document_back', formEdit.document_back);
      await axios.put(`${apiBase}/api/company/updatecompany/${formEdit.id}`, fd, { headers });
      setShowEdit(false);
      await refreshList();
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to update company');
    } finally {
      setSubmitting(false);
    }
  };

  const exportCsv = () => {
    const rows = [
      ['ID', 'Company Name', 'Admin', 'Email', 'Status'],
      ...filteredCompanies.map((c) => [
        c.id,
        c.companyName || '—',
        c.name || '—',
        c.email || '—',
        statusLabel(getStatusVariant(c)),
      ]),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'companies.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderStatusBadge = (company) => {
    const variant = getStatusVariant(company);
    return (
      <span className={`cm-badge cm-badge-${variant}`}>
        {statusLabel(variant)}
      </span>
    );
  };

  return (
    <div className="cm-root">
      <div className="cm-head">
        <div>
          <h1 className="cm-title">Company Management</h1>
          <div className="cm-sub">Oversee company accounts and performance</div>
        </div>
        <div className="cm-actions">
          <button className="cm-btn cm-btn-light" onClick={exportCsv}>Export</button>
          <div className="cm-tableactions">
            <button
              type="button"
              ref={columnButtonRef}
              className="cm-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div className="cm-colmenu" ref={columnMenuRef} role="menu">
                <div className="cm-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="cm-colmenu-item">
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
          <button className="cm-btn cm-btn-primary" onClick={openAdd}>+ Add Company</button>
        </div>
      </div>

      <div className="cm-toolbar">
        <div className="cm-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
          <input placeholder="Search companies by name, email, or admin..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="cm-filter">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>
      </div>

      <div className="cm-cards">
        <div className="cm-card">
          <div className="cm-card-title">Total Companies</div>
          <div className="cm-card-metric">{totals.total}</div>
        </div>
        <div className="cm-card">
          <div className="cm-card-title">Active Companies</div>
          <div className="cm-card-metric">{totals.active}</div>
        </div>
        <div className="cm-card">
          <div className="cm-card-title">Pending Companies</div>
          <div className="cm-card-metric">{totals.pending}</div>
        </div>
        <div className="cm-card">
          <div className="cm-card-title">Total Leads</div>
          <div className="cm-card-metric">{totals.leads.toLocaleString()}</div>
        </div>
      </div>

      <div className="cm-section">
        <div className="cm-section-head">
          <div>
            <h2>Company Accounts</h2>
            <div className="cm-section-sub">Manage every company onboarding</div>
          </div>
        </div>

        <div className="cm-table-wrap">
          <div className="cm-table">
            <div className="cm-thead" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
              {visibleColumns.map((col) => (
                <div key={col.id}>{col.label}</div>
              ))}
            </div>

            {loading && (
              <div className="cm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
                <div className="cm-loading" style={{ gridColumn: '1 / -1' }}>Loading...</div>
              </div>
            )}
            {!!error && !loading && (
              <div className="cm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
                <div className="cm-error" style={{ gridColumn: '1 / -1' }}>{error}</div>
              </div>
            )}
            {!loading && !error && filteredCompanies.length === 0 && (
              <div className="cm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
                <div style={{ gridColumn: '1 / -1' }}>No companies found</div>
              </div>
            )}

            {!loading && !error && filteredCompanies.map((company) => {
              const properties = (typeof company.propertiesCount === 'number')
                ? company.propertiesCount
                : (15 + pseudoCount(company.id, 40));
              const leads = (typeof company.leadsCount === 'number')
                ? company.leadsCount
                : (20 + pseudoCount(company.id * 3, 60));
              const variant = getStatusVariant(company);

              const renderCell = (colId) => {
                switch (colId) {
                  case 'company':
                    return (
                      <div className="cm-company">
                        <div className="cm-avatar" aria-hidden>
                          {String(company.companyName || company.name || 'C').split(' ').map((x) => x[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()}
                        </div>
                        <div className="cm-company-info">
                          <div className="cm-company-name">{company.companyName || 'Unnamed Company'}</div>
                          <div className="cm-company-admin">{company.name || '—'}</div>
                        </div>
                      </div>
                    );
                  case 'email':
                    return <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{company.email || '—'}</div>;
                  case 'phone':
                    return <div>{company.phone || '—'}</div>;
                  case 'location':
                    return <div>{company.location || '—'}</div>;
                  case 'portalRole':
                    return <div>{formatPortalRole(company.portalRole)}</div>;
                  case 'status':
                    return renderStatusBadge(company);
                  case 'properties':
                    return (
                      <div className="cm-col-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M3 11h18v2H3v-2Zm2 4h14v2H5v-2ZM7 7h10v2H7V7Z"/></svg>
                        <span>{properties}</span>
                      </div>
                    );
                  case 'leads':
                    return (
                      <div className="cm-col-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M20 7H4v10h16V7Zm2-2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2ZM7 8h3v3H7V8Zm0 5h10v2H7v-2Zm5-5h5v3h-5V8Z"/></svg>
                        <span>{leads}</span>
                      </div>
                    );
                  case 'actions':
                    return (
                      <div className="cm-actions-col">
                        <button className="cm-link" onClick={() => openView(company.id)} title="View" aria-label="View">
                          <FiEye />
                        </button>
                        <button className="cm-link" onClick={() => openEdit(company.id)} title="Edit" aria-label="Edit">
                          <FiEdit2 />
                        </button>
                      </div>
                    );
                  default:
                    return <div>—</div>;
                }
              };

              return (
                <div key={company.id} className="cm-row" style={{ gridTemplateColumns: getColumnSizes(visibleColumns) }}>
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
        <div className="superadmincompany-modal-overlay">
          <div className="superadmincompany-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadmincompany-modal-header">
              <h3>Add Company</h3>
              <button className="superadmincompany-iconbtn" onClick={() => setShowAdd(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitAdd}>
              <div className="superadmincompany-formrow">
                <label>Admin Name</label>
                <input value={formAdd.full_name} onChange={(e) => setFormAdd({ ...formAdd, full_name: e.target.value })} required />
              </div>
              <div className="superadmincompany-formrow">
                <label>Company Name</label>
                <input value={formAdd.company_name} onChange={(e) => setFormAdd({ ...formAdd, company_name: e.target.value })} required />
              </div>
              <div className="superadmincompany-formrow">
                <label>Email</label>
                <input type="email" value={formAdd.email} onChange={(e) => setFormAdd({ ...formAdd, email: e.target.value })} required />
              </div>
              <div className="superadmincompany-formrow">
                <label>Phone</label>
                <input value={formAdd.phone} onChange={(e) => setFormAdd({ ...formAdd, phone: e.target.value })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formAdd.password}
                    onChange={(e) => setFormAdd({ ...formAdd, password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>
              <div className="superadmincompany-formrow">
                <label>Portal Role</label>
                <select value={formAdd.portal_role} onChange={(e) => setFormAdd({ ...formAdd, portal_role: e.target.value })}>
                  {PORTAL_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="superadmincompany-formrow">
                <label>Location</label>
                <input value={formAdd.location} onChange={(e) => setFormAdd({ ...formAdd, location: e.target.value })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Address</label>
                <textarea rows={3} value={formAdd.address} onChange={(e) => setFormAdd({ ...formAdd, address: e.target.value })} placeholder="Enter address" />
              </div>
              <div className="superadmincompany-formrow">
                <label>Store Name</label>
                <input value={formAdd.store_name} onChange={(e) => setFormAdd({ ...formAdd, store_name: e.target.value })} />
              </div>
              <div className="superadmincompany-formrow" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                  Social Media (Optional)
                </h4>
              </div>
              <div className="superadmincompany-formrow">
                <label>Instagram</label>
                <input type="url" value={formAdd.instagram} onChange={(e) => setFormAdd({ ...formAdd, instagram: e.target.value })} placeholder="https://www.instagram.com/yourprofile" />
              </div>
              <div className="superadmincompany-formrow">
                <label>Facebook</label>
                <input type="url" value={formAdd.facebook} onChange={(e) => setFormAdd({ ...formAdd, facebook: e.target.value })} placeholder="https://www.facebook.com/yourprofile" />
              </div>
              <div className="superadmincompany-formrow">
                <label>LinkedIn</label>
                <input type="url" value={formAdd.linkedin} onChange={(e) => setFormAdd({ ...formAdd, linkedin: e.target.value })} placeholder="https://linkedin.com/company/yourcompany" />
              </div>
              <div className="superadmincompany-formrow">
                <label>YouTube</label>
                <input type="url" value={formAdd.youtube} onChange={(e) => setFormAdd({ ...formAdd, youtube: e.target.value })} placeholder="https://www.youtube.com/@yourchannel" />
              </div>
              <div className="superadmincompany-formrow">
                <label>WhatsApp Number</label>
                <input type="tel" value={formAdd.whatsapp_number} onChange={(e) => setFormAdd({ ...formAdd, whatsapp_number: e.target.value })} placeholder="6377963711" />
              </div>
              <div className="superadmincompany-formrow">
                <label>Status</label>
                <select value={formAdd.status} onChange={(e) => setFormAdd({ ...formAdd, status: e.target.value })}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                  <option value="pending" disabled>Pending (auto)</option>
                </select>
              </div>
              <div className="superadmincompany-formrow">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setFormAdd({ ...formAdd, photo: e.target.files?.[0] || null })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Document Type</label>
                <select value={formAdd.document_type} onChange={(e) => setFormAdd({ ...formAdd, document_type: e.target.value })}>
                  {DOCUMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="superadmincompany-formrow">
                <label>Document (Front)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFormAdd({ ...formAdd, document_front: e.target.files?.[0] || null })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Document (Back)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFormAdd({ ...formAdd, document_back: e.target.files?.[0] || null })} />
              </div>
              <div className="superadmincompany-modal-actions">
                <button type="button" className="btn-light" onClick={() => setShowAdd(false)} disabled={submitting}>Cancel</button>
                <button type="submit" className="btn-dark" disabled={submitting}>{submitting ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showView && selected && (
        <div className="superadmincompany-modal-overlay">
          <div className="superadmincompany-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cm-view-head">
              <div>
                <h3 className="cm-view-title">Company Information</h3>
                <div className="cm-view-sub">Account and activity details</div>
              </div>
              <button className="superadmincompany-iconbtn" onClick={() => setShowView(false)} aria-label="Close">×</button>
            </div>

            <div className="cm-view-grid">
              <div className="cm-view-item"><div className="cm-view-label">Company Name</div><div className="cm-view-value">{selected.companyName || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Admin Name</div><div className="cm-view-value">{selected.name || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Email</div><div className="cm-view-value">{selected.email || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Phone</div><div className="cm-view-value">{selected.phone || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Location</div><div className="cm-view-value">{selected.location || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Address</div><div className="cm-view-value">{selected.address || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Store Name</div><div className="cm-view-value">{selected.storeName || '—'}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Portal Role</div><div className="cm-view-value">{formatPortalRole(selected.portalRole)}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Member Since</div><div className="cm-view-value">{formatDate(selected.createdAt)}</div></div>
              {selected.instagram && <div className="cm-view-item"><div className="cm-view-label">Instagram</div><div className="cm-view-value"><a href={selected.instagram} target="_blank" rel="noopener noreferrer">{selected.instagram}</a></div></div>}
              {selected.facebook && <div className="cm-view-item"><div className="cm-view-label">Facebook</div><div className="cm-view-value"><a href={selected.facebook} target="_blank" rel="noopener noreferrer">{selected.facebook}</a></div></div>}
              {selected.linkedin && <div className="cm-view-item"><div className="cm-view-label">LinkedIn</div><div className="cm-view-value"><a href={selected.linkedin} target="_blank" rel="noopener noreferrer">{selected.linkedin}</a></div></div>}
              {selected.youtube && <div className="cm-view-item"><div className="cm-view-label">YouTube</div><div className="cm-view-value"><a href={selected.youtube} target="_blank" rel="noopener noreferrer">{selected.youtube}</a></div></div>}
              {selected.whatsappNumber && <div className="cm-view-item"><div className="cm-view-label">WhatsApp</div><div className="cm-view-value">{selected.whatsappNumber}</div></div>}
              <div className="cm-view-item"><div className="cm-view-label">Total Properties</div><div className="cm-view-value">{selected.propertiesCount || 0}</div></div>
              <div className="cm-view-item"><div className="cm-view-label">Total Leads</div><div className="cm-view-value">{selected.leadsCount || 0}</div></div>
            </div>

            <hr className="cm-view-divider" />
            <div className="cm-view-bottom">
              <div>
                <div className="cm-view-label">Account Status</div>
                {renderStatusBadge(selected)}
              </div>
            </div>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="superadmincompany-modal-overlay">
          <div className="superadmincompany-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadmincompany-modal-header">
              <h3>Edit Company</h3>
              <button className="superadmincompany-iconbtn" onClick={() => setShowEdit(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitEdit}>
              <div className="superadmincompany-formrow">
                <label>Admin Name</label>
                <input value={formEdit.full_name} onChange={(e) => setFormEdit({ ...formEdit, full_name: e.target.value })} required />
              </div>
              <div className="superadmincompany-formrow">
                <label>Company Name</label>
                <input value={formEdit.company_name} onChange={(e) => setFormEdit({ ...formEdit, company_name: e.target.value })} required />
              </div>
              <div className="superadmincompany-formrow">
                <label>Email</label>
                <input type="email" value={formEdit.email} onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })} required />
              </div>
              <div className="superadmincompany-formrow">
                <label>Phone</label>
                <input value={formEdit.phone} onChange={(e) => setFormEdit({ ...formEdit, phone: e.target.value })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Portal Role</label>
                <select value={formEdit.portal_role} onChange={(e) => setFormEdit({ ...formEdit, portal_role: e.target.value })}>
                  {PORTAL_ROLE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="superadmincompany-formrow">
                <label>Location</label>
                <input value={formEdit.location} onChange={(e) => setFormEdit({ ...formEdit, location: e.target.value })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Address</label>
                <textarea rows={3} value={formEdit.address} onChange={(e) => setFormEdit({ ...formEdit, address: e.target.value })} placeholder="Enter address" />
              </div>
              <div className="superadmincompany-formrow">
                <label>Store Name</label>
                <input value={formEdit.store_name} onChange={(e) => setFormEdit({ ...formEdit, store_name: e.target.value })} />
              </div>
              <div className="superadmincompany-formrow" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e0e0e0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                  Social Media (Optional)
                </h4>
              </div>
              <div className="superadmincompany-formrow">
                <label>Instagram</label>
                <input type="url" value={formEdit.instagram} onChange={(e) => setFormEdit({ ...formEdit, instagram: e.target.value })} placeholder="https://www.instagram.com/yourprofile" />
              </div>
              <div className="superadmincompany-formrow">
                <label>Facebook</label>
                <input type="url" value={formEdit.facebook} onChange={(e) => setFormEdit({ ...formEdit, facebook: e.target.value })} placeholder="https://www.facebook.com/yourprofile" />
              </div>
              <div className="superadmincompany-formrow">
                <label>LinkedIn</label>
                <input type="url" value={formEdit.linkedin} onChange={(e) => setFormEdit({ ...formEdit, linkedin: e.target.value })} placeholder="https://linkedin.com/company/yourcompany" />
              </div>
              <div className="superadmincompany-formrow">
                <label>YouTube</label>
                <input type="url" value={formEdit.youtube} onChange={(e) => setFormEdit({ ...formEdit, youtube: e.target.value })} placeholder="https://www.youtube.com/@yourchannel" />
              </div>
              <div className="superadmincompany-formrow">
                <label>WhatsApp Number</label>
                <input type="tel" value={formEdit.whatsapp_number} onChange={(e) => setFormEdit({ ...formEdit, whatsapp_number: e.target.value })} placeholder="6377963711" />
              </div>
              <div className="superadmincompany-formrow">
                <label>Status</label>
                <select value={formEdit.status} onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value })}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="superadmincompany-formrow">
                <label>Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setFormEdit({ ...formEdit, photo: e.target.files?.[0] || null })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Document Type</label>
                <select value={formEdit.document_type} onChange={(e) => setFormEdit({ ...formEdit, document_type: e.target.value })}>
                  {DOCUMENT_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="superadmincompany-formrow">
                <label>Document (Front)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFormEdit({ ...formEdit, document_front: e.target.files?.[0] || null })} />
              </div>
              <div className="superadmincompany-formrow">
                <label>Document (Back)</label>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setFormEdit({ ...formEdit, document_back: e.target.files?.[0] || null })} />
              </div>
              <div className="superadmincompany-modal-actions">
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


