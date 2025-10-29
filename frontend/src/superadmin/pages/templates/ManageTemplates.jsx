import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './managetemplates.css';
import { useNavigate } from 'react-router-dom';

export default function ManageTemplates() {
  const { token, apiBase } = useSuperAdmin();
  const navigate = useNavigate();
  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!token) return;
      setLoading(true); setError('');
      try {
        const { data } = await axios.get(`${apiBase}/api/templates/list`, { headers });
        if (!cancelled) setItems(Array.isArray(data?.data) ? data.data : []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Failed to load templates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [apiBase, headers, token]);

  async function toggleStatus(name, desired) {
    try {
      await axios.post(`${apiBase}/api/templates/admin/set-status`, { name, status: desired }, { headers });
      setItems((arr) => arr.map(t => t.name === name ? { ...t, status: desired } : t));
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Update failed');
    }
  }

  function previewTemplate(name) {
    navigate(`/superadmin/manage-templates/preview/${encodeURIComponent(name)}`);
  }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return items.filter(x => !qq || x.label.toLowerCase().includes(qq) || x.name.toLowerCase().includes(qq));
  }, [items, q]);

  return (
    <div className="superadminmanagetemplates-root">
      <div className="superadminmanagetemplates-head">
        <div>
          <h1 className="superadminmanagetemplates-title">Manage Templates</h1>
          <div className="superadminmanagetemplates-sub">Enable or disable templates visible to brokers</div>
        </div>
        <div className="superadminmanagetemplates-actions"></div>
      </div>

      <div className="superadminmanagetemplates-toolbar">
        <input className="superadminmanagetemplates-search" placeholder="Search templates" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && <div className="superadminmanagetemplates-loading">Loading...</div>}
      {!!error && !loading && <div className="superadminmanagetemplates-error">{error}</div>}

      <div className="superadminmanagetemplates-grid">
        {filtered.map(t => (
          <div key={t.name} className="superadminmanagetemplates-card">
            <div className="superadminmanagetemplates-media">
              <img alt="preview" src={t.previewImage} onError={(e) => { e.currentTarget.style.opacity = 0; }} />
            </div>
            <div className="superadminmanagetemplates-body">
              <div className="superadminmanagetemplates-cardtitle">{t.label}</div>
              <div className="superadminmanagetemplates-row">
                <span className={`superadminmanagetemplates-badge ${t.status === 'inactive' ? 'inactive' : 'active'}`}>{t.status === 'inactive' ? 'Inactive' : 'Active'}</span>
                <div className="superadminmanagetemplates-actions-row">
                  <button className="superadminmanagetemplates-btn superadminmanagetemplates-btn-ghost" onClick={() => previewTemplate(t.name)}>👁️ Preview</button>
                  {t.status === 'inactive' ? (
                    <button className="superadminmanagetemplates-btn" onClick={() => toggleStatus(t.name, 'active')}>Activate</button>
                  ) : (
                    <button className="superadminmanagetemplates-btn superadminmanagetemplates-btn-warn" onClick={() => toggleStatus(t.name, 'inactive')}>Deactivate</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
