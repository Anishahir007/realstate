import React, { useState } from 'react';
import axios from 'axios';
import './profile.css';
import { useCompany } from '../../context/CompanyContext.jsx';

const UpdatePhotoModal = ({ onClose }) => {
  const company = useCompany();
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
      await axios.put(`${company.apiBase}/api/auth/company/profile`, form, {
        headers: { Authorization: `Bearer ${company.token}` },
      });
      await company.refreshProfile();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Update failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="companypanel-modal-overlay" onClick={onClose}>
      <div className="companypanel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="companypanel-modal-header">
          <h3>Update Photo</h3>
          <button className="companypanel-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="companypanel-modal-body" onSubmit={onSubmit}>
          {error && <div className="companypanel-modal-error">{error}</div>}
          <label className="companypanel-field">Upload file</label>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <div className="companypanel-modal-actions">
            <button type="button" className="companypanel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="companypanel-btn companypanel-btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdatePhotoModal;

