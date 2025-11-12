import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { FiChevronDown, FiEdit2, FiEye, FiPlus, FiPrinter, FiUsers, FiUserCheck, FiStar, FiActivity } from 'react-icons/fi';
import './user.css';
import { useCompany } from '../../../context/CompanyContext.jsx';

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

function toTitle(text) {
  if (!text) return '—';
  return text.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

function initialsFromName(name) {
  if (!name) return 'NA';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || '';
  const second = parts[1]?.[0] || '';
  return `${first}${second}`.toUpperCase();
}

function buildPhotoUrl(photo, apiBase) {
  if (!photo) return '';
  if (/^https?:\/\//i.test(photo)) return photo;
  if (!apiBase) return photo;
  return `${apiBase}${photo.startsWith('/') ? photo : `/${photo}`}`;
}

export default function CompanyUsersRole() {
  const company = useCompany();
  const apiBase = company?.apiBase;
  const token = company?.token;

  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const photoInputRef = useRef(null);
  const lastObjectUrlRef = useRef(null);
  const [viewRecord, setViewRecord] = useState(null);
  const exportInProgressRef = useRef(false);

  const authHeaders = useMemo(() => ({
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchRecords = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${apiBase}/api/company/team-members`, { headers: authHeaders });
      const rows = Array.isArray(data?.data) ? data.data : [];
      const mapped = rows.map((record) => ({
        ...record,
        photoUrl: buildPhotoUrl(record.photo, apiBase),
      }));
      setRecords(mapped);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load team members';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, authHeaders, token]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    return () => {
      if (lastObjectUrlRef.current) {
        URL.revokeObjectURL(lastObjectUrlRef.current);
        lastObjectUrlRef.current = null;
      }
    };
  }, []);

  function resetForm(options = {}) {
    const { clearMessages = false } = options;
    setForm(EMPTY_FORM);
    setEditingId(null);
    setPhotoFile(null);
    setPhotoRemoved(false);
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    setPhotoPreview('');
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    if (clearMessages) setSuccess('');
    setError('');
  }

  function handleAddClick() {
    resetForm({ clearMessages: true });
    setShowForm(true);
    setViewRecord(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleInputChange(event) {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleStatusChange(event) {
    setForm(prev => ({ ...prev, status: event.target.checked ? 'active' : 'suspended' }));
  }

  function handlePhotoChange(event) {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      lastObjectUrlRef.current = objectUrl;
      setPhotoFile(file);
      setPhotoPreview(objectUrl);
      setPhotoRemoved(false);
    } else {
      setPhotoFile(null);
      setPhotoPreview('');
    }
  }

  function handleRemovePhoto() {
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoRemoved(true);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('full_name', form.full_name.trim());
    formData.append('email', form.email.trim());
    formData.append('phone', form.phone.trim());
    formData.append('portal_role', form.portal_role);
    formData.append('status', form.status);

    const trimmedPassword = form.password.trim();
    if (!editingId || trimmedPassword) {
      formData.append('password', trimmedPassword);
    }

    if (photoFile) {
      formData.append('photo', photoFile);
    } else if (editingId && photoRemoved) {
      formData.append('remove_photo', '1');
    }

    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingId) {
        await axios.put(`${apiBase}/api/company/team-members/${editingId}`, formData, config);
        setSuccess('Team member updated successfully.');
      } else {
        await axios.post(`${apiBase}/api/company/team-members`, formData, config);
        setSuccess('Team member created successfully.');
      }
      await fetchRecords();
      resetForm();
      setShowForm(false);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Request failed';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  function handleEdit(record) {
    setViewRecord(null);
    setEditingId(record.id);
    setForm({
      full_name: record.name || '',
      email: record.email || '',
      phone: record.phone || '',
      portal_role: ROLE_OPTIONS.some(option => option.value === record.portalRole) ? record.portalRole : 'sales',
      status: record.status || 'active',
      password: '',
    });
    const previewUrl = buildPhotoUrl(record.photo, apiBase);
    setPhotoPreview(previewUrl);
    setPhotoFile(null);
    setPhotoRemoved(false);
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
    setError('');
    setSuccess('');
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleView(record) {
    setViewRecord(record);
    setShowForm(false);
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    setPhotoFile(null);
    setPhotoPreview('');
    setPhotoRemoved(false);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  }

  function closeView() {
    setViewRecord(null);
  }

  const filteredRecords = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return records.filter((record) => {
      const matchesSearch = !needle || [record.name, record.email, record.phone]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(needle));
      const matchesRole = roleFilter === 'all' || record.portalRole === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [records, search, roleFilter]);

  const activeCount = filteredRecords.filter((user) => user.status === 'active').length;
  const inactiveCount = filteredRecords.filter((user) => user.status === 'suspended').length;
  const roleCount = new Set(filteredRecords.map((user) => user.portalRole)).size;

  const metrics = [
    { label: 'Total Team Members', value: filteredRecords.length, helper: `${records.length} total in system`, icon: <FiUsers /> },
    { label: 'Active Members', value: activeCount, helper: `${activeCount} currently active`, icon: <FiUserCheck /> },
    { label: 'Average Role Score', value: filteredRecords.length ? Math.round((activeCount / filteredRecords.length) * 100) : 0, helper: 'Engagement indicator', icon: <FiStar /> },
    { label: 'Eligible Roles', value: roleCount, helper: `${roleCount} roles assigned`, icon: <FiActivity /> },
  ];

  const editingRecordPhotoUrl = useMemo(() => {
    if (!editingId) return '';
    const match = records.find((record) => record.id === editingId);
    return match ? match.photoUrl : '';
  }, [editingId, records]);

  const viewPhotoUrl = viewRecord ? (viewRecord.photoUrl || buildPhotoUrl(viewRecord.photo, apiBase)) : '';

  const handleExport = useCallback(() => {
    if (exportInProgressRef.current) return;
    exportInProgressRef.current = true;
    try {
      if (!filteredRecords.length) {
        alert('No team members available to export.');
        return;
      }
      const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created On', 'Last Login'];
      const rows = filteredRecords.map((record) => [
        record.name || '',
        record.email || '',
        record.phone || '',
        toTitle(record.portalRole) || '',
        toTitle(record.status) || '',
        record.createdAt ? new Date(record.createdAt).toLocaleString() : '',
        record.lastLoginAt ? new Date(record.lastLoginAt).toLocaleString() : '',
      ]);
      const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `company-team-members-${Date.now()}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } finally {
      exportInProgressRef.current = false;
    }
  }, [filteredRecords]);

  return (
    <div className="companyusersrole-root">
      <header className="companyusersrole-header">
        <div>
          <h1>Team Members & Roles</h1>
          <p>Create and manage team members with role assignments</p>
        </div>
        <div className="companyusersrole-header-actions">
          <button type="button" className="companyusersrole-secondary-btn" onClick={handleExport}>
            <FiPrinter /> Export
          </button>
          <button type="button" className="companyusersrole-primary-btn" onClick={handleAddClick}>
            <FiPlus /> Add New Member
          </button>
        </div>
      </header>

      <section className="companyusersrole-toolbar">
        <div className="companyusersrole-search">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search team members by name, email, or phone..."
          />
        </div>
        <div className="companyusersrole-filter">
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">All Roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {toTitle(option.value)}
              </option>
            ))}
          </select>
          <FiChevronDown className="companyusersrole-filter-icon" />
        </div>
      </section>

      <section className="companyusersrole-metrics">
        {metrics.map((metric) => (
          <article key={metric.label} className="companyusersrole-metric-card">
            <div className="companyusersrole-metric-icon">{metric.icon}</div>
            <div className="companyusersrole-metric-text">
              <span className="companyusersrole-metric-label">{metric.label}</span>
              <span className="companyusersrole-metric-value">{metric.value}</span>
              <span className="companyusersrole-metric-helper">{metric.helper}</span>
            </div>
          </article>
        ))}
      </section>

      {(error || success) && (
        <div className={`companyusersrole-banner ${error ? 'error' : 'success'}`}>
          {error || success}
        </div>
      )}

      <section className="companyusersrole-table-card">
        <div className="companyusersrole-table-head">
          <div>
            <h2>All Team Members</h2>
            <p>Complete list of team members and their respective roles</p>
          </div>
          <button type="button" className="companyusersrole-columns-btn">Columns</button>
        </div>
        <div className="companyusersrole-table-wrapper">
          {loading ? (
            <div className="companyusersrole-table-empty">Loading team members…</div>
          ) : filteredRecords.length === 0 ? (
            <div className="companyusersrole-table-empty">No team members match the current filters.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Created On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <div className="companyusersrole-usercell">
                        <span className="companyusersrole-avatar">
                          {record.photoUrl ? (
                            <img src={record.photoUrl} alt={record.name || 'Team Member'} />
                          ) : (
                            initialsFromName(record.name)
                          )}
                        </span>
                        <div className="companyusersrole-userinfo">
                          <span className="companyusersrole-username">{record.name || '—'}</span>
                          <span className="companyusersrole-userrole">{toTitle(record.portalRole)}</span>
                        </div>
                      </div>
                    </td>
                    <td>{record.email || '—'}</td>
                    <td>{record.phone || '—'}</td>
                    <td>{toTitle(record.portalRole)}</td>
                    <td>
                      <span className={`companyusersrole-status-chip ${record.status === 'active' ? 'active' : 'inactive'}`}>
                        {toTitle(record.status)}
                      </span>
                    </td>
                    <td>{record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '—'}</td>
                    <td className="companyusersrole-actions-cell">
                      <button
                        type="button"
                        className="companyusersrole-icon-btn"
                        title="View team member"
                        onClick={() => handleView(record)}
                      >
                        <FiEye />
                      </button>
                      <button
                        type="button"
                        className="companyusersrole-icon-btn"
                        title="Edit team member"
                        onClick={() => handleEdit(record)}
                      >
                        <FiEdit2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {showForm && (
        <div className="companyusersrole-modal-backdrop" role="dialog" aria-modal="true">
          <div
            className="companyusersrole-modal-blanket"
            onClick={() => {
              resetForm({ clearMessages: true });
              setShowForm(false);
            }}
          />
          <section
            className="companyusersrole-form-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="companyusersrole-form-header">
              <div>
                <h2>{editingId ? 'Edit Team Member' : 'Add New Team Member'}</h2>
                <p>Fill out details to {editingId ? 'update' : 'add'} team member and assign role</p>
              </div>
              <button
                type="button"
                className="companyusersrole-secondary-btn"
                onClick={() => {
                  resetForm({ clearMessages: true });
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
            <div className="companyusersrole-form-content">
              <form className="companyusersrole-form-grid" onSubmit={handleSubmit}>
                <label>
                  <span>Full Name *</span>
                  <input
                    type="text"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter full name"
                    required
                  />
                </label>
                <label>
                  <span>Phone Number</span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </label>
                <label>
                  <span>Email *</span>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleInputChange}
                    placeholder="Enter email"
                    required
                  />
                </label>
                <label>
                  <span>Password {editingId ? '(leave blank to keep existing)' : '*'}</span>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                    {...(editingId ? {} : { required: true })}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  <span>Roles *</span>
                  <select name="portal_role" value={form.portal_role} onChange={handleInputChange}>
                    {ROLE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="companyusersrole-switch-field">
                  <span>Status</span>
                  <div className="companyusersrole-switch-row">
                    <label className="companyusersrole-switch">
                      <input
                        type="checkbox"
                        checked={form.status === 'active'}
                        onChange={handleStatusChange}
                      />
                      <span className="companyusersrole-switch-track" />
                      <span className="companyusersrole-switch-thumb" />
                    </label>
                    <span className={`companyusersrole-switch-state ${form.status === 'active' ? 'active' : 'inactive'}`}>
                      {form.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <label className="companyusersrole-file-field">
                  <span>Upload Profile Photo</span>
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    ref={photoInputRef}
                    onChange={handlePhotoChange}
                  />
                  <div className="companyusersrole-file-actions">
                    <small>Upload a square image (PNG/JPG).</small>
                    {(photoPreview || (editingId && !photoRemoved && editingRecordPhotoUrl)) && (
                      <button type="button" className="companyusersrole-link-btn" onClick={handleRemovePhoto}>
                        Remove photo
                      </button>
                    )}
                  </div>
                </label>
                <div className="companyusersrole-form-actions">
                  <button type="submit" className="companyusersrole-primary-btn" disabled={submitting}>
                    {submitting ? 'Saving…' : editingId ? 'Update Member' : 'Create Member'}
                  </button>
                </div>
              </form>
              <aside className="companyusersrole-preview-card">
                <div className="companyusersrole-preview-avatar">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" />
                  ) : (
                    initialsFromName(form.full_name || 'Member')
                  )}
                </div>
                <h3>{form.full_name || 'Preview Name'}</h3>
                <dl>
                  <div>
                    <dt>Email</dt>
                    <dd>{form.email || '—'}</dd>
                  </div>
                  <div>
                    <dt>Member Role</dt>
                    <dd>{toTitle(form.portal_role)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{form.status === 'active' ? 'Active' : 'Inactive'}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </section>
        </div>
      )}

      {viewRecord && (
        <div className="companyusersrole-modal-backdrop" role="dialog" aria-modal="true">
          <div
            className="companyusersrole-modal-blanket"
            onClick={closeView}
          />
          <section
            className="companyusersrole-form-card companyusersrole-view-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="companyusersrole-form-header">
              <div>
                <h2>View Team Member</h2>
                <p>Detailed information for this team member role</p>
              </div>
              <button type="button" className="companyusersrole-secondary-btn" onClick={closeView}>
                Close
              </button>
            </div>
            <div className="companyusersrole-view-body">
              <div className="companyusersrole-view-grid">
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Full Name</span>
                  <span className="companyusersrole-view-value">{viewRecord.name || '—'}</span>
                </div>
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Email</span>
                  <span className="companyusersrole-view-value">{viewRecord.email || '—'}</span>
                </div>
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Phone Number</span>
                  <span className="companyusersrole-view-value">{viewRecord.phone || '—'}</span>
                </div>
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Role</span>
                  <span className="companyusersrole-view-value">{toTitle(viewRecord.portalRole)}</span>
                </div>
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Status</span>
                  <span className={`companyusersrole-status-chip ${viewRecord.status === 'active' ? 'active' : 'inactive'}`}>
                    {toTitle(viewRecord.status)}
                  </span>
                </div>
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Created On</span>
                  <span className="companyusersrole-view-value">
                    {viewRecord.createdAt ? new Date(viewRecord.createdAt).toLocaleString() : '—'}
                  </span>
                </div>
                <div className="companyusersrole-view-field">
                  <span className="companyusersrole-view-label">Last Login</span>
                  <span className="companyusersrole-view-value">
                    {viewRecord.lastLoginAt ? new Date(viewRecord.lastLoginAt).toLocaleString() : 'Never'}
                  </span>
                </div>
              </div>
              <aside className="companyusersrole-preview-card companyusersrole-view-preview">
                <div className="companyusersrole-preview-avatar">
                  {viewPhotoUrl ? (
                    <img src={viewPhotoUrl} alt={viewRecord.name || 'Team Member'} />
                  ) : (
                    initialsFromName(viewRecord.name || 'Member')
                  )}
                </div>
                <h3>{viewRecord.name || '— — —'}</h3>
                <dl>
                  <div>
                    <dt>Email</dt>
                    <dd>{viewRecord.email || '—'}</dd>
                  </div>
                  <div>
                    <dt>Member Role</dt>
                    <dd>{toTitle(viewRecord.portalRole)}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>{toTitle(viewRecord.status)}</dd>
                  </div>
                </dl>
              </aside>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
