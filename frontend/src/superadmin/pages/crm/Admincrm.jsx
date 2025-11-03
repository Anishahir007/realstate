import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './admincrm.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

const COLUMN_OPTIONS = [
  { id: 'lead', label: 'Lead' },
  { id: 'contact', label: 'Contact' },
  { id: 'status', label: 'Status' },
  { id: 'propertyInterest', label: 'Property Interest' },
  { id: 'score', label: 'Score' },
  { id: 'source', label: 'Source' },
  { id: 'brokerName', label: 'Broker Name' },
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

export default function SuperAdminAdmincrm() {
  const { token, apiBase } = useSuperAdmin();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [adminLeads, setAdminLeads] = useState([]);
  const [brokerLeads, setBrokerLeads] = useState([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [brokerColumnMenuOpen, setBrokerColumnMenuOpen] = useState(false);
  const [adminColumnMenuOpen, setAdminColumnMenuOpen] = useState(false);
  const [brokerVisibleColumnIds, setBrokerVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const [adminVisibleColumnIds, setAdminVisibleColumnIds] = useState(() => DEFAULT_COLUMN_IDS);
  const brokerColumnButtonRef = useRef(null);
  const brokerColumnMenuRef = useRef(null);
  const adminColumnButtonRef = useRef(null);
  const adminColumnMenuRef = useRef(null);

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

  // Combine all leads with calculated scores
  const allLeads = useMemo(() => {
    const admin = adminLeads.map(l => ({ ...l, lead_score: calculateLeadScore(l) }));
    const broker = brokerLeads.map(l => ({ ...l, lead_score: calculateLeadScore(l) }));
    return [...admin, ...broker];
  }, [adminLeads, brokerLeads]);

  // Calculate metrics
  const metrics = useMemo(() => {
    const total = allLeads.length;
    const qualified = allLeads.filter(l => l.status?.toLowerCase() === 'qualified').length;
    const avgScore = total > 0 
      ? Math.round(allLeads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / total)
      : 0;
    const now = new Date();
    const active = allLeads.filter(l => {
      if (!l.created_at) return false;
      const created = new Date(l.created_at);
      const hoursDiff = (now - created) / (1000 * 60 * 60);
      return hoursDiff <= 24;
    }).length;
    
    // Calculate new leads this week
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const newThisWeek = allLeads.filter(l => {
      if (!l.created_at) return false;
      return new Date(l.created_at) >= weekAgo;
    }).length;
    
    return { total, qualified, avgScore, active, newThisWeek };
  }, [allLeads]);

  // Separate broker and admin leads with scores
  const brokerLeadsWithScores = useMemo(() => 
    brokerLeads.map(l => ({ ...l, lead_score: calculateLeadScore(l) })), 
    [brokerLeads]
  );
  const adminLeadsWithScores = useMemo(() => 
    adminLeads.map(l => ({ ...l, lead_score: calculateLeadScore(l) })), 
    [adminLeads]
  );

  // Filter broker and admin leads separately
  const filteredBrokerLeads = useMemo(() => 
    filterLeads(brokerLeadsWithScores, query, statusFilter), 
    [brokerLeadsWithScores, query, statusFilter]
  );
  const filteredAdminLeads = useMemo(() => 
    filterLeads(adminLeadsWithScores, query, statusFilter), 
    [adminLeadsWithScores, query, statusFilter]
  );

  const brokerVisibleColumns = useMemo(
    () => COLUMN_OPTIONS.filter((col) => brokerVisibleColumnIds.includes(col.id)),
    [brokerVisibleColumnIds]
  );
  const adminVisibleColumns = useMemo(
    () => COLUMN_OPTIONS.filter((col) => adminVisibleColumnIds.includes(col.id)),
    [adminVisibleColumnIds]
  );

  const toggleBrokerColumn = (id) => {
    setBrokerVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id); else set.add(id);
      return COLUMN_OPTIONS.map((col) => col.id).filter((colId) => set.has(colId));
    });
  };

  const toggleAdminColumn = (id) => {
    setAdminVisibleColumnIds((prev) => {
      const set = new Set(prev);
      if (set.has(id)) set.delete(id); else set.add(id);
      return COLUMN_OPTIONS.map((col) => col.id).filter((colId) => set.has(colId));
    });
  };

  useEffect(() => {
    if (!brokerColumnMenuOpen) return undefined;
    function handleClickOutside(event) {
      if (!brokerColumnMenuRef.current || !brokerColumnButtonRef.current) return;
      if (brokerColumnMenuRef.current.contains(event.target) || brokerColumnButtonRef.current.contains(event.target)) return;
      setBrokerColumnMenuOpen(false);
    }
    function handleEsc(event) {
      if (event.key === 'Escape') setBrokerColumnMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [brokerColumnMenuOpen]);

  useEffect(() => {
    if (!adminColumnMenuOpen) return undefined;
    function handleClickOutside(event) {
      if (!adminColumnMenuRef.current || !adminColumnButtonRef.current) return;
      if (adminColumnMenuRef.current.contains(event.target) || adminColumnButtonRef.current.contains(event.target)) return;
      setAdminColumnMenuOpen(false);
    }
    function handleEsc(event) {
      if (event.key === 'Escape') setAdminColumnMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [adminColumnMenuOpen]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true);
      setError('');
      try {
        const [adminRes, allSourcesRes] = await Promise.all([
          axios.get(`${apiBase}/api/leads/admin`, { headers: { ...headers, 'Content-Type': 'application/json' } }),
          axios.get(`${apiBase}/api/leads/admin/all-sources`, { headers: { ...headers, 'Content-Type': 'application/json' } }),
        ]);
        if (cancelled) return;
        const admin = Array.isArray(adminRes.data?.data) ? adminRes.data.data : [];
        const all = Array.isArray(allSourcesRes.data?.data) ? allSourcesRes.data.data : [];
        const brokersOnly = all.filter((x) => x.lead_source_type === 'broker');
        setAdminLeads(admin);
        setBrokerLeads(brokersOnly);
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
      const [adminRes, allSourcesRes] = await Promise.all([
        axios.get(`${apiBase}/api/leads/admin`, { headers: { ...headers, 'Content-Type': 'application/json' } }),
        axios.get(`${apiBase}/api/leads/admin/all-sources`, { headers: { ...headers, 'Content-Type': 'application/json' } }),
      ]);
      const admin = Array.isArray(adminRes.data?.data) ? adminRes.data.data : [];
      const all = Array.isArray(allSourcesRes.data?.data) ? allSourcesRes.data.data : [];
      setAdminLeads(admin);
      setBrokerLeads(all.filter((x) => x.lead_source_type === 'broker'));
    } catch {
      // ignore
    }
  }

  function openAdd() {
    setFormAdd({ full_name: '', email: '', phone: '', city: '', property_interest: '', source: 'website', status: 'new', message: '', assigned_to: '' });
    setShowAdd(true);
  }

  function openView(lead) {
    const source = lead.lead_source_type === 'broker' ? 'broker' : 'admin';
    navigate(`/superadmin/crm/lead/${lead.id}/${source}`);
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
      await axios.post(`${apiBase}/api/leads/admin`, formAdd, { headers: { ...headers, 'Content-Type': 'application/json' } });
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
      await axios.patch(`${apiBase}/api/leads/admin/${formEdit.id}`, payload, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setShowEdit(false);
      await refresh();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    }
  }

  function exportCsv() {
    const headersCsv = ['id','full_name','email','phone','city','property_interest','source','status','assigned_to','lead_score','created_at','broker_name'];
    const csv = [
      headersCsv.join(','), 
      ...allLeads.map(r => headersCsv.map(h => toCsv(String(r[h] ?? ''))).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="superadminadmincrm-root">
      <div className="superadminadmincrm-head">
        <div>
          <h2 className="superadminadmincrm-title">CRM-Lead Management</h2>
          <p className="superadminadmincrm-sub">Manage leads, activities, and deals across all brokers</p>
        </div>
        <div className="superadminadmincrm-actions">
          <button className="superadminadmincrm-btn" onClick={exportCsv}>Export</button>
          <button className="superadminadmincrm-btn primary" onClick={openAdd}>
            <span style={{ marginRight: '6px' }}>+</span>Add New Lead
          </button>
        </div>
      </div>

      <div className="superadminadmincrm-toolbar">
        <div className="superadminadmincrm-search">
          <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path fill="#64748b" d="M21 20l-5.6-5.6a7 7 0 10-1.4 1.4L20 21zM4 10a6 6 0 1112 0A6 6 0 014 10z"/></svg>
          <input placeholder="Search brokers by name, email, or company..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className="superadminadmincrm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
      <div className="superadminadmincrm-metrics">
        <div className="superadminadmincrm-metric-card">
          <div className="superadminadmincrm-metric-icon" style={{ background: '#fff4e6' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="superadminadmincrm-metric-content">
            <div className="superadminadmincrm-metric-label">Total Leads</div>
            <div className="superadminadmincrm-metric-value">{metrics.total}</div>
            <div className="superadminadmincrm-metric-sub">+{metrics.newThisWeek} new this week</div>
          </div>
        </div>
        
        <div className="superadminadmincrm-metric-card">
          <div className="superadminadmincrm-metric-icon" style={{ background: '#dcfce7' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="superadminadmincrm-metric-content">
            <div className="superadminadmincrm-metric-label">Qualified Leads</div>
            <div className="superadminadmincrm-metric-value">{metrics.qualified}</div>
            <div className="superadminadmincrm-metric-sub">
              {metrics.total > 0 ? Math.round((metrics.qualified / metrics.total) * 100) : 0}% qualification rate
            </div>
          </div>
        </div>
        
        <div className="superadminadmincrm-metric-card">
          <div className="superadminadmincrm-metric-icon" style={{ background: '#dbeafe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="superadminadmincrm-metric-content">
            <div className="superadminadmincrm-metric-label">Avg. Lead Score</div>
            <div className="superadminadmincrm-metric-value">{metrics.avgScore}</div>
            <div className="superadminadmincrm-metric-sub">Quality indicator</div>
                      </div>
                    </div>
        
        <div className="superadminadmincrm-metric-card">
          <div className="superadminadmincrm-metric-icon" style={{ background: '#ede9fe' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div className="superadminadmincrm-metric-content">
            <div className="superadminadmincrm-metric-label">Active Leads</div>
            <div className="superadminadmincrm-metric-value">{metrics.active}</div>
            <div className="superadminadmincrm-metric-sub">Leads from last 24 hours</div>
          </div>
        </div>
      </div>

      {/* Broker Leads Section */}
      <section className="superadminadmincrm-card">
        <div className="superadminadmincrm-section-header">
          <div>
            <h3 className="superadminadmincrm-sectiontitle">All Broker Leads ({filteredBrokerLeads.length})</h3>
            <p className="superadminadmincrm-subtle">Read-only list aggregated from all brokers</p>
          </div>
          <div className="superadminadmincrm-tableactions">
            <button
              type="button"
              ref={brokerColumnButtonRef}
              className="superadminadmincrm-columns-btn"
              onClick={() => setBrokerColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {brokerColumnMenuOpen && (
              <div className="superadminadmincrm-colmenu" ref={brokerColumnMenuRef} role="menu">
                <div className="superadminadmincrm-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="superadminadmincrm-colmenu-item">
                    <input
                      type="checkbox"
                      checked={brokerVisibleColumnIds.includes(col.id)}
                      onChange={() => toggleBrokerColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="superadminadmincrm-tablewrap">
          <table className="superadminadmincrm-table">
            <thead>
              <tr>
                {brokerVisibleColumns.map((col) => (
                  <th key={col.id} scope="col">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={brokerVisibleColumns.length} className="superadminadmincrm-table-empty">Loading leads…</td>
                </tr>
              )}
              {!!error && !loading && (
                <tr>
                  <td colSpan={brokerVisibleColumns.length} className="superadminadmincrm-error">{error}</td>
                </tr>
              )}
              {!loading && !error && filteredBrokerLeads.length === 0 && (
                <tr>
                  <td colSpan={brokerVisibleColumns.length} className="superadminadmincrm-table-empty">No broker leads</td>
                </tr>
              )}
              {!loading && !error && filteredBrokerLeads.map((l) => (
                <tr key={`b-${l.id}-${l.tenant_db || ''}`}>
                  {brokerVisibleColumns.map((col) => {
                    switch (col.id) {
                      case 'lead':
                        return (
                          <td key={col.id}>
                            <div className="superadminadmincrm-leadcell">
                              <div className="superadminadmincrm-avatar">{initials(l.full_name)}</div>
                              <div>
                                <div 
                                  className="superadminadmincrm-textbold" 
                                  style={{ cursor: 'pointer', color: '#2563eb' }}
                                  onClick={() => openView(l)}
                                >
                                  {l.full_name}
                                </div>
                                <div className="superadminadmincrm-textmuted">{l.city || '-'}</div>
                              </div>
                            </div>
                          </td>
                        );
                      case 'contact':
                        return (
                          <td key={col.id}>
                            <div className="superadminadmincrm-textbold">{l.email}</div>
                            <div className="superadminadmincrm-textmuted">{l.phone || '-'}</div>
                          </td>
                        );
                      case 'status':
                        return (
                          <td key={col.id}>
                            <span className={`superadminadmincrm-badge status-${(l.status || 'new').toLowerCase()}`}>
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
                      case 'brokerName':
                        return <td key={col.id}>{l.broker_name || '-'}</td>;
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
                            <div className="superadminadmincrm-actions-col">
                              <button
                                className="superadminadmincrm-link"
                                onClick={() => openView(l)}
                                title="View"
                                aria-label="View"
                                style={{ fontSize: '18px', padding: '4px' }}
                              >
                                👁️
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

      {/* Admin Leads Section */}
      <section className="superadminadmincrm-card">
        <div className="superadminadmincrm-section-header">
          <div>
            <h3 className="superadminadmincrm-sectiontitle">Admin/Main Website Leads ({filteredAdminLeads.length})</h3>
            <p className="superadminadmincrm-subtle">You can create and update these leads</p>
          </div>
          <div className="superadminadmincrm-tableactions">
            <button
              type="button"
              ref={adminColumnButtonRef}
              className="superadminadmincrm-columns-btn"
              onClick={() => setAdminColumnMenuOpen((open) => !open)}
            >
              <span aria-hidden>🗂️</span>
              <span>Columns</span>
            </button>
            {adminColumnMenuOpen && (
              <div className="superadminadmincrm-colmenu" ref={adminColumnMenuRef} role="menu">
                <div className="superadminadmincrm-colmenu-head">Show columns</div>
                {COLUMN_OPTIONS.map((col) => (
                  <label key={col.id} className="superadminadmincrm-colmenu-item">
                    <input
                      type="checkbox"
                      checked={adminVisibleColumnIds.includes(col.id)}
                      onChange={() => toggleAdminColumn(col.id)}
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="superadminadmincrm-tablewrap">
          <table className="superadminadmincrm-table">
            <thead>
              <tr>
                {adminVisibleColumns.map((col) => (
                  <th key={col.id} scope="col">{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={adminVisibleColumns.length} className="superadminadmincrm-table-empty">Loading leads…</td>
                </tr>
              )}
              {!!error && !loading && (
                <tr>
                  <td colSpan={adminVisibleColumns.length} className="superadminadmincrm-error">{error}</td>
                </tr>
              )}
              {!loading && !error && filteredAdminLeads.length === 0 && (
                <tr>
                  <td colSpan={adminVisibleColumns.length} className="superadminadmincrm-table-empty">No admin leads</td>
                </tr>
              )}
              {!loading && !error && filteredAdminLeads.map((l) => (
                <tr key={`a-${l.id}`}>
                  {adminVisibleColumns.map((col) => {
                    switch (col.id) {
                      case 'lead':
                        return (
                          <td key={col.id}>
                            <div className="superadminadmincrm-leadcell">
                              <div className="superadminadmincrm-avatar">{initials(l.full_name)}</div>
                              <div>
                                <div 
                                  className="superadminadmincrm-textbold" 
                                  style={{ cursor: 'pointer', color: '#2563eb' }}
                                  onClick={() => openView(l)}
                                >
                                  {l.full_name}
                                </div>
                                <div className="superadminadmincrm-textmuted">{l.city || '-'}</div>
                              </div>
                            </div>
                          </td>
                        );
                      case 'contact':
                        return (
                          <td key={col.id}>
                            <div className="superadminadmincrm-textbold">{l.email}</div>
                            <div className="superadminadmincrm-textmuted">{l.phone || '-'}</div>
                          </td>
                        );
                      case 'status':
                        return (
                          <td key={col.id}>
                            <span className={`superadminadmincrm-badge status-${(l.status || 'new').toLowerCase()}`}>
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
                      case 'brokerName':
                        return <td key={col.id}>—</td>;
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
                            <div className="superadminadmincrm-actions-col">
                              <button
                                className="superadminadmincrm-link"
                                onClick={() => openView(l)}
                                title="View"
                                aria-label="View"
                                style={{ fontSize: '18px', padding: '4px' }}
                              >
                                👁️
                              </button>
                              <button
                                className="superadminadmincrm-link"
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
        <div className="superadminadmincrm-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="superadminadmincrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadminadmincrm-modal-header">
              <h3>New Lead</h3>
              <button className="superadminadmincrm-iconbtn" onClick={() => setShowAdd(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitAdd} className="superadminadmincrm-formgrid">
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
              <div className="superadminadmincrm-modal-actions">
                <button type="button" className="btn-light" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-dark">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="superadminadmincrm-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="superadminadmincrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadminadmincrm-modal-header">
              <h3>Edit Lead</h3>
              <button className="superadminadmincrm-iconbtn" onClick={() => setShowEdit(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitEdit} className="superadminadmincrm-formgrid">
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
              <div className="superadminadmincrm-modal-actions">
                <button type="button" className="btn-light" onClick={() => setShowEdit(false)}>Cancel</button>
                <button type="submit" className="btn-dark">Save</button>
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
      l.broker_name,
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



