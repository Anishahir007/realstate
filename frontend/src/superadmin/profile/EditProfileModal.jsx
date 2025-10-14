import React, { useState } from 'react';
import './profile.css';
import { useSuperAdmin } from '../../context/SuperAdminContext.jsx';

export default function EditProfileModal({ onClose }) {
  const sa = useSuperAdmin();
  const [fullName, setFullName] = useState(sa?.name ?? '');
  const [email, setEmail] = useState(sa?.email ?? '');
  const [phone, setPhone] = useState(sa?.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sa.updateProfile({ full_name: fullName, email, phone });
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
          <h3>Edit Profile</h3>
          <button className="sa-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="sa-modal-body" onSubmit={onSubmit}>
          {error && <div className="sa-modal-error">{error}</div>}
          <label className="sa-field">Full name</label>
          <input className="sa-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <label className="sa-field">Email</label>
          <input type="email" className="sa-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="sa-field">Phone</label>
          <input className="sa-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <div className="sa-modal-actions">
            <button type="button" className="sa-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="sa-btn sa-btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}


