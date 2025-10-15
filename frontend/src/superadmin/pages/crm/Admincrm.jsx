import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './admincrm.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

export default function SuperAdminAdmincrm() {
  const { token, apiBase } = useSuperAdmin();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [adminLeads, setAdminLeads] = useState([]);
  const [brokerLeads, setBrokerLeads] = useState([]);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selected, setSelected] = useState(null);

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

  const filteredAdminLeads = useMemo(() => filterLeads(adminLeads, query, statusFilter), [adminLeads, query, statusFilter]);
  const filteredBrokerLeads = useMemo(() => filterLeads(brokerLeads, query, statusFilter), [brokerLeads, query, statusFilter]);

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
    setSelected(lead);
    setShowView(true);
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
    const rows = [...adminLeads.map(a => ({ ...a, scope: 'main' })), ...brokerLeads.map(b => ({ ...b, scope: 'broker' }))];
    const headersCsv = ['scope','id','full_name','email','phone','city','property_interest','source','status','assigned_to','created_at'];
    const csv = [headersCsv.join(','), ...rows.map(r => headersCsv.map(h => toCsv(String(r[h] ?? ''))).join(','))].join('\n');
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
          <p className="superadminadmincrm-sub">Manage leads across all brokers and main website</p>
        </div>
        <div className="superadminadmincrm-actions">
          <button className="superadminadmincrm-btn" onClick={exportCsv}>Export Leads</button>
          <button className="superadminadmincrm-btn primary" onClick={openAdd}>+ Add New Lead</button>
        </div>
      </div>

      <div className="superadminadmincrm-toolbar">
        <input className="superadminadmincrm-input" placeholder="Search by name, email, phone, city..." value={query} onChange={(e) => setQuery(e.target.value)} />
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

      <section className="superadminadmincrm-card">
        <h3 className="superadminadmincrm-sectiontitle">All Broker Leads ({filteredBrokerLeads.length})</h3>
        <p className="superadminadmincrm-subtle">Read-only list aggregated from all brokers</p>
        <div className="superadminadmincrm-tablewrap">
          <table className="superadminadmincrm-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Broker Name</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Property Interest</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={7}>Loading...</td></tr>)}
              {!!error && !loading && (<tr><td colSpan={7} style={{ color: '#b91c1c' }}>{error}</td></tr>)}
              {!loading && !error && filteredBrokerLeads.length === 0 && (<tr><td colSpan={7}>No broker leads</td></tr>)}
              {!loading && !error && filteredBrokerLeads.map((l) => (
                <tr key={`b-${l.id}-${l.tenant_db || ''}`}>
                  <td>
                    <div className="superadminadmincrm-leadcell">
                      <div className="superadminadmincrm-avatar">{initials(l.full_name)}</div>
                      <div>
                        <div className="superadminadmincrm-textbold">{l.full_name}</div>
                        <div className="superadminadmincrm-textmuted">{l.city || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{l.broker_name || '-'}</td>
                  <td>
                    <div className="superadminadmincrm-textbold">{l.email}</div>
                    <div className="superadminadmincrm-textmuted">{l.phone || '-'}</div>
                  </td>
                  <td><span className={`superadminadmincrm-badge status-${(l.status || 'new').toLowerCase()}`}>{labelize(l.status)}</span></td>
                  <td>{l.property_interest || '-'}</td>
                  <td>{labelize(l.source)}</td>
                  <td>
                    <button className="superadminadmincrm-link" onClick={() => openView(l)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="superadminadmincrm-card">
        <h3 className="superadminadmincrm-sectiontitle">Admin/Main Website Leads ({filteredAdminLeads.length})</h3>
        <p className="superadminadmincrm-subtle">You can create and update these leads</p>
        <div className="superadminadmincrm-tablewrap">
          <table className="superadminadmincrm-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Contact</th>
                <th>Status</th>
                <th>Property Interest</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={6}>Loading...</td></tr>)}
              {!!error && !loading && (<tr><td colSpan={6} style={{ color: '#b91c1c' }}>{error}</td></tr>)}
              {!loading && !error && filteredAdminLeads.length === 0 && (<tr><td colSpan={6}>No admin leads</td></tr>)}
              {!loading && !error && filteredAdminLeads.map((l) => (
                <tr key={`a-${l.id}`}>
                  <td>
                    <div className="superadminadmincrm-leadcell">
                      <div className="superadminadmincrm-avatar">{initials(l.full_name)}</div>
                      <div>
                        <div className="superadminadmincrm-textbold">{l.full_name}</div>
                        <div className="superadminadmincrm-textmuted">{l.city || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="superadminadmincrm-textbold">{l.email}</div>
                    <div className="superadminadmincrm-textmuted">{l.phone || '-'}</div>
                  </td>
                  <td><span className={`superadminadmincrm-badge status-${(l.status || 'new').toLowerCase()}`}>{labelize(l.status)}</span></td>
                  <td>{l.property_interest || '-'}</td>
                  <td>{labelize(l.source)}</td>
                  <td>
                    <button className="superadminadmincrm-link" onClick={() => openView(l)}>View</button>
                    <button className="superadminadmincrm-link" onClick={() => openEdit(l)}>Edit</button>
                  </td>
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

      {showView && selected && (
        <div className="superadminadmincrm-modal-overlay" onClick={() => setShowView(false)}>
          <div className="superadminadmincrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="superadminadmincrm-modal-header">
              <h3>Lead Details</h3>
              <button className="superadminadmincrm-iconbtn" onClick={() => setShowView(false)} aria-label="Close">×</button>
            </div>
            <div className="superadminadmincrm-viewgrid">
              <div><strong>Name:</strong> {selected.full_name}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Phone:</strong> {selected.phone || '-'}</div>
              <div><strong>City:</strong> {selected.city || '-'}</div>
              <div><strong>Interest:</strong> {selected.property_interest || '-'}</div>
              <div><strong>Source:</strong> {labelize(selected.source)}</div>
              <div><strong>Status:</strong> {labelize(selected.status)}</div>
              <div style={{ gridColumn: '1 / -1' }}><strong>Message:</strong><div style={{ marginTop: 6 }}>{selected.message || '-'}</div></div>
            </div>
            <div className="superadminadmincrm-modal-actions">
              <button className="btn-dark" onClick={() => setShowView(false)}>Close</button>
            </div>
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
    const matchesQ = !term || [l.full_name, l.email, l.phone, l.city, l.property_interest].some((v) => String(v || '').toLowerCase().includes(term));
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


