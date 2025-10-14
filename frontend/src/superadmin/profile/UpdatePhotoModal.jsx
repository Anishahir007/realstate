import React, { useState } from 'react';
import './profile.css';
import { useSuperAdmin } from '../../context/SuperAdminContext.jsx';

export default function UpdatePhotoModal({ onClose }) {
  const sa = useSuperAdmin();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!file) {
      setError('Please choose an image file');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('photo', file);
      const res = await fetch(`${sa.apiBase}/api/auth/super-admin/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${sa.token}` },
        body: form,
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) {
        if (data?.message) throw new Error(data.message);
        const text = !ct.includes('application/json') ? await res.text() : '';
        throw new Error(text ? `Unexpected response (${res.status})` : 'Upload failed');
      }
      await sa.refreshProfile();
      onClose();
    } catch (err) {
      setError(err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Update Photo</h3>
          <button className="sa-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="sa-modal-body" onSubmit={onSubmit}>
          {error && <div className="sa-modal-error">{error}</div>}
          <label className="sa-field">Upload file</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="sa-modal-actions">
            <button type="button" className="sa-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


