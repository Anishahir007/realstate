import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './brokercrm.css';
import { useBroker } from '../../../context/BrokerContext.jsx';

export default function BrokerPanelBrokercrm() {
  const { token, apiBase } = useBroker();
  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Status');

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selected, setSelected] = useState(null);

  const [formAdd, setFormAdd] = useState({
    full_name: '', email: '', phone: '', city: '', property_interest: '', source: 'website', status: 'new', message: '', assigned_to: ''
  });
  const [formEdit, setFormEdit] = useState({
    id: null, full_name: '', email: '', phone: '', city: '', property_interest: '', source: 'website', status: 'new', message: '', assigned_to: ''
  });

  const filtered = useMemo(() => filterLeads(leads, query, statusFilter), [leads, query, statusFilter]);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!token) return;
      setLoading(true); setError('');
      try {
        const resp = await axios.get(`${apiBase}/api/leads/broker`, { headers: { ...headers, 'Content-Type': 'application/json' } });
        if (!cancel) setLeads(Array.isArray(resp.data?.data) ? resp.data.data : []);
      } catch (e) {
        if (!cancel) setError(e?.response?.data?.message || e?.message || 'Failed to load');
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => { cancel = true; };
  }, [apiBase, headers, token]);

  async function refresh() {
    try {
      const resp = await axios.get(`${apiBase}/api/leads/broker`, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setLeads(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch {}
  }

  function openAdd() {
    setFormAdd({ full_name: '', email: '', phone: '', city: '', property_interest: '', source: 'website', status: 'new', message: '', assigned_to: '' });
    setShowAdd(true);
  }

  function openEdit(lead) {
    setFormEdit({ id: lead.id, full_name: lead.full_name || '', email: lead.email || '', phone: lead.phone || '', city: lead.city || '', property_interest: lead.property_interest || '', source: lead.source || 'website', status: lead.status || 'new', message: lead.message || '', assigned_to: lead.assigned_to || '' });
    setShowEdit(true);
  }

  async function submitAdd(e) {
    e?.preventDefault?.(); if (!token) return;
    try {
      await axios.post(`${apiBase}/api/leads/broker`, formAdd, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setShowAdd(false); await refresh();
    } catch (e) { alert(e?.response?.data?.message || e?.message || 'Create failed'); }
  }

  async function submitEdit(e) {
    e?.preventDefault?.(); if (!token || !formEdit.id) return;
    try {
      const payload = { ...formEdit }; delete payload.id;
      await axios.patch(`${apiBase}/api/leads/broker/${formEdit.id}`, payload, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setShowEdit(false); await refresh();
    } catch (e) { alert(e?.response?.data?.message || e?.message || 'Update failed'); }
  }

  return (
    <div className="brokerpanelbrokercrm-root">
      <div className="brokerpanelbrokercrm-head">
        <div>
          <h2 className="brokerpanelbrokercrm-title">CRM - My Leads</h2>
          <p className="brokerpanelbrokercrm-sub">Manage your website leads</p>
        </div>
        <div className="brokerpanelbrokercrm-actions">
          <button className="brokerpanelbrokercrm-btn primary" onClick={openAdd}>+ Add Lead</button>
        </div>
      </div>

      <div className="brokerpanelbrokercrm-toolbar">
        <input className="brokerpanelbrokercrm-input" placeholder="Search by name, email, phone, city..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="brokerpanelbrokercrm-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option>All Status</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal">Proposal</option>
          <option value="closed">Closed</option>
          <option value="lost">Lost</option>
        </select>
      </div>

      <div className="brokerpanelbrokercrm-card">
        <div className="brokerpanelbrokercrm-tablewrap">
          <table className="brokerpanelbrokercrm-table">
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
              {!loading && !error && filtered.length === 0 && (<tr><td colSpan={6}>No leads</td></tr>)}
              {!loading && !error && filtered.map((l) => (
                <tr key={l.id}>
                  <td>
                    <div className="brokerpanelbrokercrm-leadcell">
                      <div className="brokerpanelbrokercrm-avatar">{initials(l.full_name)}</div>
                      <div>
                        <div className="brokerpanelbrokercrm-textbold">{l.full_name}</div>
                        <div className="brokerpanelbrokercrm-textmuted">{l.city || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="brokerpanelbrokercrm-textbold">{l.email}</div>
                    <div className="brokerpanelbrokercrm-textmuted">{l.phone || '-'}</div>
                  </td>
                  <td><span className={`brokerpanelbrokercrm-badge status-${(l.status || 'new').toLowerCase()}`}>{labelize(l.status)}</span></td>
                  <td>{l.property_interest || '-'}</td>
                  <td>{labelize(l.source)}</td>
                  <td>
                    <button className="brokerpanelbrokercrm-link" onClick={() => openEdit(l)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <div className="brokerpanelbrokercrm-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="brokerpanelbrokercrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="brokerpanelbrokercrm-modal-header">
              <h3>New Lead</h3>
              <button className="brokerpanelbrokercrm-iconbtn" onClick={() => setShowAdd(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitAdd} className="brokerpanelbrokercrm-formgrid">
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
              <div className="brokerpanelbrokercrm-modal-actions">
                <button type="button" className="btn-light" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn-dark">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEdit && (
        <div className="brokerpanelbrokercrm-modal-overlay" onClick={() => setShowEdit(false)}>
          <div className="brokerpanelbrokercrm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="brokerpanelbrokercrm-modal-header">
              <h3>Edit Lead</h3>
              <button className="brokerpanelbrokercrm-iconbtn" onClick={() => setShowEdit(false)} aria-label="Close">×</button>
            </div>
            <form onSubmit={submitEdit} className="brokerpanelbrokercrm-formgrid">
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
              <div className="brokerpanelbrokercrm-modal-actions">
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
    const matchesQ = !term || [l.full_name, l.email, l.phone, l.city, l.property_interest].some((v) => String(v || '').toLowerCase().includes(term));
    const matchesStatus = !byStatus || byStatus === 'all status' || String(l.status || '').toLowerCase() === byStatus;
    return matchesQ && matchesStatus;
  });
}

function labelize(v) { if (!v) return '-'; return String(v).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase()); }
function initials(name) { const parts = String(name || '').trim().split(/\s+/).slice(0, 2); return parts.map((p) => p[0]?.toUpperCase?.() || '').join('') || 'NA'; }


