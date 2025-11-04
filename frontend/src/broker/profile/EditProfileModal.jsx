import React, { useState } from 'react';
import axios from 'axios';
import './profile.css';
import { useBroker } from '../../context/BrokerContext.jsx';

const EditProfileModal = ({ onClose }) => {
  const broker = useBroker();
  const [fullName, setFullName] = useState(broker?.name ?? '');
  const [email, setEmail] = useState(broker?.email ?? '');
  const [phone, setPhone] = useState(broker?.phone ?? '');
  const [licenseNo, setLicenseNo] = useState(broker?.licenseNo ?? '');
  const [photo, setPhoto] = useState(null);
  const [documentType, setDocumentType] = useState(broker?.documentType ?? '');
  const [documentFront, setDocumentFront] = useState(null);
  const [documentBack, setDocumentBack] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('full_name', fullName);
      fd.append('email', email);
      fd.append('phone', phone || '');
      fd.append('license_no', licenseNo || '');
      if (photo) fd.append('photo', photo);
      if (documentType) fd.append('document_type', documentType);
      if (documentFront) fd.append('document_front', documentFront);
      if (documentBack) fd.append('document_back', documentBack);
      
      await axios.put(`${broker.apiBase}/api/auth/broker/profile`, fd, {
        headers: {
          Authorization: `Bearer ${broker.token}`,
        },
      });
      await broker.refreshProfile();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Update failed');
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
          <label className="brokerpanel-field">Photo</label>
          <input type="file" accept="image/*" className="brokerpanel-input" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          <label className="brokerpanel-field">Document Type</label>
          <select className="brokerpanel-input" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            <option value="">Select Document Type</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="pan_card">PAN Card</option>
            <option value="driving_license">Driving License</option>
            <option value="voter_id">Voter ID</option>
            <option value="other">Other</option>
          </select>
          <label className="brokerpanel-field">Document (Front)</label>
          <input type="file" accept="image/*,.pdf" className="brokerpanel-input" onChange={(e) => setDocumentFront(e.target.files?.[0] || null)} />
          <label className="brokerpanel-field">Document (Back)</label>
          <input type="file" accept="image/*,.pdf" className="brokerpanel-input" onChange={(e) => setDocumentBack(e.target.files?.[0] || null)} />
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


