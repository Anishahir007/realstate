import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import './usersrole.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';

const ROLE_OPTIONS = [
  { value: 'sales', label: 'Sales • CRM Access' },
  { value: 'property_management', label: 'Property Management • Property Panel' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

const EMPTY_FORM = {
  full_name: '',
  email: '',
  phone: '',
  portal_role: 'sales',
  status: 'active',
  password: '',
};

export default function UsersRole() {
  const superAdmin = useSuperAdmin();
  const apiBase = superAdmin?.apiBase;
  const token = superAdmin?.token;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${apiBase}/api/super-admin/users`, { headers: authHeaders });
      setRecords(Array.isArray(data?.data) ? data.data : []);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, authHeaders, token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  function resetForm(options = {}) {
    const { clearMessages = false } = options;
    setForm(EMPTY_FORM);
    setEditingId(null);
    if (clearMessages) {
      setSuccess('');
    }
    setError('');
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      portal_role: form.portal_role,
      status: form.status,
    };

    if (editingId) {
      if (form.password.trim()) {
        payload.password = form.password.trim();
      }
    } else {
      payload.password = form.password.trim();
    }

    try {
      if (editingId) {
        await axios.put(`${apiBase}/api/super-admin/users/${editingId}`, payload, { headers: authHeaders });
        setSuccess('Super admin updated successfully.');
      } else {
        await axios.post(`${apiBase}/api/super-admin/users`, payload, { headers: authHeaders });
        setSuccess('Super admin created successfully.');
      }
      await fetchRecords();
      resetForm();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Request failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(record) {
    setEditingId(record.id);
    setForm({
      full_name: record.name || '',
      email: record.email || '',
      phone: record.phone || '',
      portal_role: ROLE_OPTIONS.some(option => option.value === record.portalRole) ? record.portalRole : 'sales',
      status: record.status || 'active',
      password: '',
    });
    setError('');
    setSuccess('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="usersrole-container">
      <div className="usersrole-card">
        <div className="usersrole-card-header">
          <h2>{editingId ? 'Edit Super Admin User' : 'Add Super Admin User'}</h2>
          {editingId && (
            <button type="button" className="usersrole-link-btn" onClick={() => resetForm({ clearMessages: true })}>
              Cancel editing
            </button>
          )}
        </div>
        <form className="usersrole-form" onSubmit={handleSubmit}>
          <div className="usersrole-grid">
            <label className="usersrole-field">
              <span>Full name</span>
              <input
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleInputChange}
                placeholder="Jane Doe"
                required
              />
            </label>
            <label className="usersrole-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleInputChange}
                placeholder="jane@example.com"
                required
              />
            </label>
            <label className="usersrole-field">
              <span>Phone</span>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                placeholder="+91 98765 43210"
              />
            </label>
            <label className="usersrole-field">
              <span>Portal role</span>
              <select
                name="portal_role"
                value={form.portal_role}
                onChange={handleInputChange}
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="usersrole-field">
              <span>Status</span>
              <select
                name="status"
                value={form.status}
                onChange={handleInputChange}
              >
                {STATUS_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="usersrole-field">
              <span>{editingId ? 'New password (optional)' : 'Password'}</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleInputChange}
                placeholder="••••••••"
                {...(editingId ? {} : { required: true })}
                autoComplete="new-password"
              />
            </label>
          </div>
          {(error || success) && (
            <div className={`usersrole-message ${error ? 'error' : 'success'}`}>
              {error || success}
            </div>
          )}
          <div className="usersrole-actions">
            <button type="submit" className="usersrole-submit" disabled={submitting}>
              {submitting ? 'Saving...' : (editingId ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>

      <div className="usersrole-card">
        <div className="usersrole-card-header">
          <h2>Super Admin Users</h2>
          <button type="button" className="usersrole-link-btn" onClick={fetchRecords} disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        {loading ? (
          <div className="usersrole-empty">Loading users…</div>
        ) : records.length === 0 ? (
          <div className="usersrole-empty">No super admin users found.</div>
        ) : (
          <div className="usersrole-table-wrapper">
            <table className="usersrole-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Portal Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id}>
                    <td>
                      <div className="usersrole-primary">{record.name}</div>
                      <div className="usersrole-secondary">{record.phone || '—'}</div>
                    </td>
                    <td>{record.email}</td>
                    <td className="usersrole-capitalize">{record.portalRole?.replace(/_/g, ' ')}</td>
                    <td className={`usersrole-status usersrole-status-${record.status}`}>
                      {record.status}
                    </td>
                    <td>{record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleString() : 'Never'}</td>
                    <td>
                      <button type="button" className="usersrole-small-btn" onClick={() => handleEdit(record)}>
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

