import React, { useState } from 'react';
import './profile.css';
import { useBroker } from '../../context/BrokerContext.jsx';

const UpdatePhotoModal = ({ onClose }) => {
  const broker = useBroker();
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
      const res = await fetch(`${broker.apiBase}/api/auth/broker/profile`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${broker.token}` },
        body: form,
      });
      const ct = res.headers.get('content-type') || '';
      const data = ct.includes('application/json') ? await res.json() : null;
      if (!res.ok) {
        if (data?.message) throw new Error(data.message);
        const text = !ct.includes('application/json') ? await res.text() : '';
        throw new Error(text ? `Unexpected response (${res.status})` : 'Upload failed');
      }
      await broker.refreshProfile();
      onClose();
    } catch (err) {
      setError(err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="brokerpanel-modal-overlay" onClick={onClose}>
      <div className="brokerpanel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="brokerpanel-modal-header">
          <h3>Update Photo</h3>
          <button className="brokerpanel-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="brokerpanel-modal-body" onSubmit={onSubmit}>
          {error && <div className="brokerpanel-modal-error">{error}</div>}
          <label className="brokerpanel-field">Upload file</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="brokerpanel-modal-actions">
            <button type="button" className="brokerpanel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="brokerpanel-btn brokerpanel-btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePhotoModal;


