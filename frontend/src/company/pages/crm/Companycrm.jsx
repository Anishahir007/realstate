import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './companycrm.css';
import { useCompany } from '../../../context/CompanyContext.jsx';

const COLUMN_OPTIONS = [
  { id: 'lead', label: 'Lead' },
  { id: 'contact', label: 'Contact' },
  { id: 'status', label: 'Status' },
  { id: 'propertyInterest', label: 'Property Interest' },
  { id: 'score', label: 'Score' },
  { id: 'source', label: 'Source' },
  { id: 'city', label: 'City' },
  { id: 'assignedTo', label: 'Assigned To' },
  { id: 'createdAt', label: 'Created At' },
  { id: 'actions', label: 'Actions' },
];

const DEFAULT_COLUMN_IDS = ['lead', 'contact', 'status', 'propertyInterest', 'score', 'source', 'actions'];

// Calculate lead score based on multiple factors
function calculateLeadScore(lead) {
  let score = 0;
  
  // Contact completeness (0-30 points)
  if (lead.full_name) score += 5;
  if (lead.email) score += 10;
  if (lead.phone) score += 10;
  if (lead.city) score += 5;
  
  // Status scoring (0-30 points)
  const statusScores = {
    'qualified': 30,
    'proposal': 25,
    'contacted': 15,
    'new': 10,
    'closed': 5,
    'lost': 0
  };
  score += statusScores[lead.status?.toLowerCase()] || 10;
  
  // Source scoring (0-20 points)
  const sourceScores = {
    'referral': 20,
    'call': 15,
    'website': 10,
    'social_media': 8
  };
  score += sourceScores[lead.source?.toLowerCase()] || 10;
  
  // Property interest (0-10 points)
  if (lead.property_interest) score += 10;
  
  // Recent activity bonus (0-10 points) - leads from last 24 hours
  if (lead.created_at) {
    const created = new Date(lead.created_at);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    if (hoursDiff <= 24) score += 10;
    else if (hoursDiff <= 72) score += 5;
  }
  
  return Math.min(100, Math.max(0, score));
}

export default function CompanyPanelCompanycrm() {
  const { token, apiBase } = useCompany();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [leads, setLeads] = useState([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [visibleColumnIds, setVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const columnButtonRef = useRef(null);
  const columnMenuRef = useRef(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);

  const [formAdd, setFormAdd] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    property_interest: '',
    source: 'website',
    status: 'new',
    message: '',
    assigned_to: '',
  });

  const [formEdit, setFormEdit] = useState({
    id: null,
    full_name: '',
    email: '',
    phone: '',
    city: '',
    property_interest: '',
    source: 'website',
    status: 'new',
    message: '',
    assigned_to: '',
  });

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

  // Add lead scores to leads
  const leadsWithScores = useMemo(() => 
    leads.map(l => ({ ...l, lead_score: calculateLeadScore(l) })), 
    [leads]
  );

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = leadsWithScores.length;
    const qualified = leadsWithScores.filter(l => l.status?.toLowerCase() === 'qualified').length;
    const avgScore = total > 0 
      ? Math.round(leadsWithScores.reduce((sum, l) => sum + (l.lead_score || 0), 0) / total)
      : 0;
    const now = new Date();
    const active = leadsWithScores.filter(l => {
      if (!l.created_at) return false;
      const created = new Date(l.created_at);
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }).length;
    
    // Calculate new leads this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = leadsWithScores.filter(l => {
      if (!l.created_at) return false;
      return new Date(l.created_at) >= weekAgo;
    }).length;
    
    return { total, qualified, avgScore, active, newThisWeek };
  }, [leadsWithScores]);

  // Filter leads
  const filteredLeads = useMemo(() => 
    filterLeads(leadsWithScores, query, statusFilter), 
    [leadsWithScores, query, statusFilter]
  );

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
        const resp = await axios.get(`${apiBase}/api/leads/company`, { headers: { ...headers, 'Content-Type': 'application/json' } });
        if (cancelled) return;
        setLeads(Array.isArray(resp.data?.data) ? resp.data.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load leads');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token]);

  async function refresh() {
    try {
      const resp = await axios.get(`${apiBase}/api/leads/company`, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setLeads(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch {
      // ignore
    }
  }

  function openAdd() {
    setFormAdd({ full_name: '', email: '', phone: '', city: '', property_interest: '', source: 'website', status: 'new', message: '', assigned_to: '' });
    setShowAdd(true);
  }

  function openView(lead) {
    navigate(`/company/crm/lead/${lead.id}`);
  }

  function openEdit(lead) {
    setFormEdit({
      id: lead.id,
      full_name: lead.full_name || '',
      email: lead.email || '',
      phone: lead.phone || '',
      city: lead.city || '',
      property_interest: lead.property_interest || '',
      source: lead.source || 'website',
      status: lead.status || 'new',
      message: lead.message || '',
      assigned_to: lead.assigned_to || '',
    });
    setShowEdit(true);
  }

  async function submitAdd(e) {
    e?.preventDefault?.();
    if (!token) return;
    try {
      await axios.post(`${apiBase}/api/leads/company`, formAdd, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setShowAdd(false);
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Create failed');
    }
  }

  async function submitEdit(e) {
    e?.preventDefault?.();
    if (!token || !formEdit.id) return;
    try {
      const payload = { ...formEdit };
      delete payload.id;
      await axios.patch(`${apiBase}/api/leads/company/${formEdit.id}`, payload, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setShowEdit(false);
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    }
  }

  function exportCsv() {
    const headersCsv = ['id','full_name','email','phone','city','property_interest','source','status','assigned_to','lead_score','created_at'];
    const csv = [
      headersCsv.join(','), 
      ...filteredLeads.map(r => headersCsv.map(h => toCsv(String(r[h] ?? ''))).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="companycrm-root">
      <div className="companycrm-head">
        <div>
          <h2 className="companycrm-title">CRM - Lead Management</h2>
          <p className="companycrm-sub">Manage your leads and track activities</p>
        </div>
        <div className="companycrm-actions">
          <button className="companycrm-btn" onClick={exportCsv}>Export</button>
          <button className="companycrm-btn primary" onClick={openAdd}>
            <span style={{ marginRight: '6px' }}>+</span>Add New Lead
          </button>
        </div>
      </div>

      <div className="companycrm-toolbar">
        <div className="companycrm-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
          <input placeholder="Search leads by name, email, phone, or city..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="companycrm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="closed">Closed</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      {/* Metrics Cards */}
      <div className="companycrm-metrics">
        <div className="companycrm-metric-card">
          <div className="companycrm-metric-icon" style={{ background: '#fff4e6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="companycrm-metric-content">
            <div className="companycrm-metric-label">Total Leads</div>
            <div className="companycrm-metric-value">{metrics.total}</div>
            <div className="companycrm-metric-sub">+{metrics.newThisWeek} new this week</div>
          </div>
        </div>
        
        <div className="companycrm-metric-card">
          <div className="companycrm-metric-icon" style={{ background: '#dcfce7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="companycrm-metric-content">
            <div className="companycrm-metric-label">Qualified Leads</div>
            <div className="companycrm-metric-value">{metrics.qualified}</div>
            <div className="companycrm-metric-sub">
              {metrics.total > 0 ? Math.round((metrics.qualified / metrics.total) * 100) : 0}% qualification rate
            </div>
          </div>
        </div>
        
        <div className="companycrm-metric-card">
          <div className="companycrm-metric-icon" style={{ background: '#dbeafe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="companycrm-metric-content">
            <div className="companycrm-metric-label">Avg. Lead Score</div>
            <div className="companycrm-metric-value">{metrics.avgScore}</div>
            <div className="companycrm-metric-sub">Quality indicator</div>
          </div>
        </div>
        
        <div className="companycrm-metric-card">
          <div className="companycrm-metric-icon" style={{ background: '#ede9fe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="companycrm-metric-content">
            <div className="companycrm-metric-label">Active Leads</div>
            <div className="companycrm-metric-value">{metrics.active}</div>
            <div className="companycrm-metric-sub">Leads from last 24 hours</div>
          </div>
        </div>
      </div>

      {/* Leads Section */}
      <section className="companycrm-card">
        <div className="companycrm-section-header">
          <div>
            <h3 className="companycrm-sectiontitle">My Leads ({filteredLeads.length})</h3>
            <p className="companycrm-subtle">Manage and update your leads</p>
          </div>
          <div className="companycrm-tableactions">
            <button
              type="button"
              ref={columnButtonRef}
              className="companycrm-columns-btn"
              onClick={() => setColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {columnMenuOpen && (
              <div className="companycrm-colmenu" ref={columnMenuRef} role="menu">
                <div className="companycrm-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="companycrm-colmenu-item">
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
        <div className="companycrm-tablewrap">
          <table className="companycrm-table">
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th key={col.id} scope="col">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={visibleColumns.length} className="companycrm-table-empty">Loading leads…</td>
                </tr>
              )}
              {!!error && !loading && (
                <tr>
                  <td colSpan={visibleColumns.length} className="companycrm-error">{error}</td>
                </tr>
              )}
              {!loading && !error && filteredLeads.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.length} className="companycrm-table-empty">No leads</td>
                </tr>
              )}
              {!loading && !error && filteredLeads.map((l) => (
                <tr key={l.id}>
                  {visibleColumns.map((col) => {
                    switch (col.id) {
                      case 'lead':
                        return (
                          <td key={col.id}>
                            <div className="companycrm-leadcell">
                              <div className="companycrm-avatar">{initials(l.full_name)}</div>
                              <div>
                                <div 
                                  className="companycrm-textbold" 
                                  style={{ cursor: 'pointer', color: '#2563eb' }}
                                  onClick={() => openView(l)}
                                >
                                  {l.full_name}
                                </div>
                                <div className="companycrm-textmuted">{l.city || '-'}</div>
                              </div>
                            </div>
                          </td>
                        );
                      case 'contact':
                        return (
                          <td key={col.id}>
                            <div className="companycrm-textbold">{l.email}</div>
                            <div className="companycrm-textmuted">{l.phone || '-'}</div>
                          </td>
                        );
                      case 'status':
                        return (
                          <td key={col.id}>
                            <span className={`companycrm-badge status-${(l.status || 'new').toLowerCase()}`}>
                              {labelize(l.status)}
                            </span>
                          </td>
                        );
                      case 'propertyInterest':
                        return <td key={col.id}>{l.property_interest || '-'}</td>;
                      case 'score':
                        return (
                          <td key={col.id}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: '#64748b' }}>
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                              <span style={{ fontWeight: 600 }}>{l.lead_score || 0}</span>
                            </div>
                          </td>
                        );
                      case 'source':
                        return <td key={col.id}>{labelize(l.source)}</td>;
                      case 'city':
                        return <td key={col.id}>{l.city || '-'}</td>;
                      case 'assignedTo':
                        return <td key={col.id}>{l.assigned_to || '-'}</td>;
                      case 'createdAt':
                        return (
                          <td key={col.id}>
                            {l.created_at
                              ? new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                              : '-'}
                          </td>
                        );
                      case 'actions':
                        return (
                          <td key={col.id}>
                            <div className="companycrm-actions-col">
                              <button
                                className="companycrm-link"
                                onClick={() => openView(l)}
                                title="View"
                                aria-label="View"
                                style={{ fontSize: '18px', padding: '4px' }}
                              >
                                👁️
                              </button>
                              <button
                                className="companycrm-link"
                                onClick={() => openEdit(l)}
                                title="Edit"
                                aria-label="Edit"
                                style={{ fontSize: '18px', padding: '4px' }}
                              >
                                ✏️
                              </button>
                            </div>
                          </td>
                        );
                      default:
                        return <td key={col.id}>—</td>;
                    }
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showAdd && (
        <div className="companycrm-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="companycrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="companycrm-modal-header">
              <h3>New Lead</h3>
              <button className="companycrm-iconbtn" onClick={() => setShowAdd(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitAdd} className="companycrm-formgrid">
              <input placeholder="Full name" value={formAdd.full_name} onChange={(e) => setFormAdd({ ...formAdd, full_name: e.target.value })} required />
              <input type="email" placeholder="Email" value={formAdd.email} onChange={(e) => setFormAdd({ ...formAdd, email: e.target.value })} required />
              <input placeholder="Phone" value={formAdd.phone} onChange={(e) => setFormAdd({ ...formAdd, phone: e.target.value })} required />
              <input placeholder="City" value={formAdd.city} onChange={(e) => setFormAdd({ ...formAdd, city: e.target.value })} />
              <input placeholder="Property interest" value={formAdd.property_interest} onChange={(e) => setFormAdd({ ...formAdd, property_interest: e.target.value })} />
              <select value={formAdd.source} onChange={(e) => setFormAdd({ ...formAdd, source: e.target.value })}>
                <option value="website">Website</option>
                <option value="call">Call</option>
                <option value="social_media">Social media</option>
                <option value="referral">Referral</option>
              </select>
              <select value={formAdd.status} onChange={(e) => setFormAdd({ ...formAdd, status: e.target.value })}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
              <input placeholder="Assigned to" value={formAdd.assigned_to} onChange={(e) => setFormAdd({ ...formAdd, assigned_to: e.target.value })} />
              <textarea placeholder="Message" value={formAdd.message} onChange={(e) => setFormAdd({ ...formAdd, message: e.target.value })} rows={3} />
              <div className="companycrm-modal-actions">
                <button type="button" className="companycrm-btn-light" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="companycrm-btn-dark">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="companycrm-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="companycrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="companycrm-modal-header">
              <h3>Edit Lead</h3>
              <button className="companycrm-iconbtn" onClick={() => setShowEdit(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitEdit} className="companycrm-formgrid">
              <input placeholder="Full name" value={formEdit.full_name} onChange={(e) => setFormEdit({ ...formEdit, full_name: e.target.value })} required />
              <input type="email" placeholder="Email" value={formEdit.email} onChange={(e) => setFormEdit({ ...formEdit, email: e.target.value })} required />
              <input placeholder="Phone" value={formEdit.phone} onChange={(e) => setFormEdit({ ...formEdit, phone: e.target.value })} required />
              <input placeholder="City" value={formEdit.city} onChange={(e) => setFormEdit({ ...formEdit, city: e.target.value })} />
              <input placeholder="Property interest" value={formEdit.property_interest} onChange={(e) => setFormEdit({ ...formEdit, property_interest: e.target.value })} />
              <select value={formEdit.source} onChange={(e) => setFormEdit({ ...formEdit, source: e.target.value })}>
                <option value="website">Website</option>
                <option value="call">Call</option>
                <option value="social_media">Social media</option>
                <option value="referral">Referral</option>
              </select>
              <select value={formEdit.status} onChange={(e) => setFormEdit({ ...formEdit, status: e.target.value })}>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="closed">Closed</option>
                <option value="lost">Lost</option>
              </select>
              <input placeholder="Assigned to" value={formEdit.assigned_to} onChange={(e) => setFormEdit({ ...formEdit, assigned_to: e.target.value })} />
              <textarea placeholder="Message" value={formEdit.message} onChange={(e) => setFormEdit({ ...formEdit, message: e.target.value })} rows={3} />
              <div className="companycrm-modal-actions">
                <button type="button" className="companycrm-btn-light" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="companycrm-btn-dark">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

function filterLeads(list, q, status) {
  const term = String(q || '').toLowerCase();
  const byStatus = String(status || 'All Status').toLowerCase();
  return list.filter((l) => {
    const matchesQ = !term || [
      l.full_name, 
      l.email, 
      l.phone, 
      l.city, 
      l.property_interest,
      l.source
    ].some((v) => String(v || '').toLowerCase().includes(term));
    const matchesStatus = !byStatus || byStatus === 'all status' || String(l.status || '').toLowerCase() === byStatus;
    return matchesQ && matchesStatus;
  });
}

function labelize(v) {
  if (!v) return '-';
  return String(v).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
}

function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase?.() || '').join('') || 'NA';
}

function toCsv(v) {
  if (v.includes(',') || v.includes('\n') || v.includes('"')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

