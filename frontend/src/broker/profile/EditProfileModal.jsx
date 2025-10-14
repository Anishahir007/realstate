import React, { useState } from 'react';
import './profile.css';
import { useBroker } from '../../context/BrokerContext.jsx';

const EditProfileModal = ({ onClose }) => {
  const broker = useBroker();
  const [fullName, setFullName] = useState(broker?.name ?? '');
  const [email, setEmail] = useState(broker?.email ?? '');
  const [phone, setPhone] = useState(broker?.phone ?? '');
  const [licenseNo, setLicenseNo] = useState(broker?.licenseNo ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await broker.updateProfile({ full_name: fullName, email, phone, license_no: licenseNo });
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
          <h3>Edit Profile</h3>
          <button className="brokerpanel-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="brokerpanel-modal-body" onSubmit={onSubmit}>
          {error && <div className="brokerpanel-modal-error">{error}</div>}
          <label className="brokerpanel-field">Full name</label>
          <input className="brokerpanel-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <label className="brokerpanel-field">Email</label>
          <input type="email" className="brokerpanel-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="brokerpanel-field">Phone</label>
          <input className="brokerpanel-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="brokerpanel-field">License No</label>
          <input className="brokerpanel-input" value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} />
          <div className="brokerpanel-modal-actions">
            <button type="button" className="brokerpanel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="brokerpanel-btn brokerpanel-btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;


