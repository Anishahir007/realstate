import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './broker.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

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
    license_no: ''
  });
  const [formEdit, setFormEdit] = useState({
    id: null,
    full_name: '',
    email: '',
    phone: '',
    license_no: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);
  const filteredBrokers = useMemo(() => {
    if (!statusFilter || statusFilter === 'All') return brokers;
    const target = String(statusFilter).toLowerCase();
    return brokers.filter((b) => String(b.status || 'active').toLowerCase() === target);
  }, [brokers, statusFilter]);

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
        const resp = await axios.get(`${apiBase}/api/broker/listbroker`, { headers, params: Object.keys(params).length ? params : undefined });
        if (!cancelled) {
          setBrokers(Array.isArray(resp.data?.data) ? resp.data.data : []);
        }
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
      const resp = await axios.get(`${apiBase}/api/broker/listbroker`, { headers, params: Object.keys(params).length ? params : undefined });
      setBrokers(Array.isArray(resp.data?.data) ? resp.data.data : []);
    } catch (e) {
      // non-blocking
    }
  }

  function openAdd() {
    setFormAdd({ full_name: '', email: '', phone: '', password: '', license_no: '' });
    setShowAdd(true);
  }

  async function submitAdd(e) {
    e?.preventDefault?.();
    if (!token) return;
    setSubmitting(true);
    try {
      await axios.post(`${apiBase}/api/broker/createbroker`, formAdd, { headers: { ...headers, 'Content-Type': 'application/json' } });
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
    try {
      const resp = await axios.get(`${apiBase}/api/broker/getbroker/${brokerId}`, { headers });
      setSelected(resp.data?.data || null);
      setShowView(true);
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to load broker');
    }
  }

  async function openEdit(brokerId) {
    if (!token) return;
    try {
      const resp = await axios.get(`${apiBase}/api/broker/getbroker/${brokerId}`, { headers });
      const b = resp.data?.data;
      if (b) {
        setFormEdit({ id: b.id, full_name: b.name || '', email: b.email || '', phone: b.phone || '', license_no: b.licenseNo || '' });
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
      const payload = { full_name: formEdit.full_name, email: formEdit.email, phone: formEdit.phone, license_no: formEdit.license_no };
      await axios.put(`${apiBase}/api/broker/updatebroker/${formEdit.id}`, payload, { headers: { ...headers, 'Content-Type': 'application/json' } });
      setShowEdit(false);
      await refreshList();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="superadminbroker-root">
      <div className="superadminbroker-head">
        <div>
          <h2 className="superadminbroker-title">Brokers</h2>
          <p className="superadminbroker-sub">Manage broker accounts, status, and invites.</p>
        </div>
        <div className="superadminbroker-actions">
          <button className="superadminbroker-btn" onClick={openAdd}>+ Add Broker</button>
        </div>
      </div>

      <div className="superadminbroker-card">
        <div className="superadminbroker-toolbar">
          <input className="superadminbroker-input" placeholder="Search brokers" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="superadminbroker-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option>All</option>
            <option>Active</option>
            <option>Pending</option>
            <option>Suspended</option>
          </select>
        </div>

        <div className="superadminbroker-tablewrap">
          <table className="superadminbroker-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5}>Loading...</td>
                </tr>
              )}
              {!!error && !loading && (
                <tr>
                  <td colSpan={5} style={{ color: '#b91c1c' }}>{error}</td>
                </tr>
              )}
              {!loading && !error && filteredBrokers.length === 0 && (
                <tr>
                  <td colSpan={5}>No brokers found</td>
                </tr>
              )}
              {!loading && !error && filteredBrokers.map((b) => (
                <tr key={b.id}>
                  <td>{b.id}</td>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>
                    <span className={`superadminbroker-badge superadminbroker-badge-${String(b.status || 'active').toLowerCase()}`}>{String(b.status || 'active').charAt(0).toUpperCase() + String(b.status || 'active').slice(1)}</span>
                  </td>
                  <td>
                    <button className="superadminbroker-link" onClick={() => openView(b.id)}>View</button>
                    <button className="superadminbroker-link" onClick={() => openEdit(b.id)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            <div className="superadminbroker-modal-header">
              <h3>Broker Details</h3>
              <button className="superadminbroker-iconbtn" onClick={() => setShowView(false)} aria-label="Close">×</button>
            </div>
            <div className="superadminbroker-viewgrid">
              <div><strong>ID:</strong> {selected.id}</div>
              <div><strong>Name:</strong> {selected.name}</div>
              <div><strong>Email:</strong> {selected.email}</div>
              <div><strong>Phone:</strong> {selected.phone || '-'}</div>
              <div><strong>License No:</strong> {selected.licenseNo || '-'}</div>
              <div><strong>Status:</strong> {selected.status}</div>
              <div><strong>Tenant DB:</strong> {selected.tenantDb}</div>
            </div>
            <div className="superadminbroker-modal-actions">
              <button className="btn-dark" onClick={() => setShowView(false)}>Close</button>
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


