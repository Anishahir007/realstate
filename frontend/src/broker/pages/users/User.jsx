import React from 'react';
import axios from 'axios';
import './user.css';
import { useBroker } from '../../../context/BrokerContext.jsx';

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

const UserPage = () => {
  const broker = useBroker();
  const token = broker?.token;
  const apiBase = broker?.apiBase;

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [list, setList] = React.useState([]);
  const [meta, setMeta] = React.useState({ page: 1, limit: 20, total: 0 });
  const [q, setQ] = React.useState('');
  const dq = useDebouncedValue(q, 300);

  const [editing, setEditing] = React.useState(null); // {id?, full_name, email, phone, photo, status, password?}

  // Close modal with Escape key
  React.useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setEditing(null);
    }
    if (editing) {
      window.addEventListener('keydown', onKey);
    }
    return () => window.removeEventListener('keydown', onKey);
  }, [editing]);

  const canSubmit = React.useMemo(() => {
    if (!editing) return false;
    if (editing.id) {
      return Boolean(editing.full_name) && Boolean(editing.email);
    }
    return Boolean(editing.full_name) && Boolean(editing.email) && Boolean(editing.password);
  }, [editing]);

  const fetchUsers = React.useCallback(async (page = 1) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${apiBase}/api/broker-users`, {
        params: { page, limit: meta.limit || 20, q: dq || undefined },
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(Array.isArray(res.data?.data) ? res.data.data : []);
      setMeta(res.data?.meta || { page, limit: meta.limit || 20, total: 0 });
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to load users';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [apiBase, token, dq, meta.limit]);

  React.useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!editing) return;
    setError('');
    try {
      const isEdit = Boolean(editing.id);
      const payload = {
        full_name: editing.full_name,
        email: editing.email,
        phone: editing.phone || '',
        photo: editing.photo || '',
      };
      if (!isEdit) payload.password = editing.password;
      if (editing.status) payload.status = editing.status;

      const endpoint = isEdit ? `${apiBase}/api/broker-users/${editing.id}` : `${apiBase}/api/broker-users/broker/create`;
      const method = isEdit ? 'put' : 'post';
      await axios({ url: endpoint, method, data: payload, headers: { Authorization: `Bearer ${token}` } });
      setEditing(null);
      fetchUsers(meta.page || 1);
    } catch (e) {
      const msg = e?.response?.data?.message || e?.message || 'Save failed';
      setError(msg);
    }
  }

  return (
    <div className="brokerusers-container">
      <div className="brokerusers-header">
        <h2>Users</h2>
        <div className="brokerusers-actions">
          <input
            type="text"
            placeholder="Search users..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="button" onClick={() => setEditing({ id: null, full_name: '', email: '', phone: '', photo: '', password: '', status: 'active' })}>+ Add User</button>
        </div>
      </div>

      {error ? <div className="brokerusers-error">{error}</div> : null}

      <div className="brokerusers-list">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="6" className="brokerusers-center">Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="6" className="brokerusers-center">No users</td></tr>
            ) : (
              list.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone || '-'}</td>
                  <td>
                    <span className={`brokerusers-badge ${u.status === 'active' ? 'brokerusers-badge--active' : 'brokerusers-badge--inactive'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <button type="button" onClick={() => setEditing({ id: u.id, full_name: u.name, email: u.email, phone: u.phone || '', photo: u.photo || '', status: u.status || 'active' })}>Edit</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {editing ? (
        <div className="brokerusers-modal" onClick={(e) => { if (e.target === e.currentTarget) setEditing(null); }}>
          <div className="brokerusers-modal-content">
            <div className="brokerusers-modal-header">
              <h3>{editing.id ? 'Edit User' : 'Add User'}</h3>
              <button type="button" className="brokerusers-close" onClick={() => setEditing(null)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="brokerusers-form">
              <div className="brokerusers-grid">
                <label>
                  <span>Name</span>
                  <input type="text" value={editing.full_name} onChange={e => setEditing({ ...editing, full_name: e.target.value })} required />
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} required />
                </label>
                <label>
                  <span>Phone</span>
                  <input type="text" value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} />
                </label>
                {!editing.id ? (
                  <label>
                    <span>Password</span>
                    <input type="password" value={editing.password} onChange={e => setEditing({ ...editing, password: e.target.value })} required />
                  </label>
                ) : null}
                <label>
                  <span>Status</span>
                  <select value={editing.status || 'active'} onChange={e => setEditing({ ...editing, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <div className="brokerusers-form-actions">
                <button type="button" className="brokerusers-btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
                <button disabled={!canSubmit} type="submit" className="brokerusers-btn-primary">{editing.id ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default UserPage;


