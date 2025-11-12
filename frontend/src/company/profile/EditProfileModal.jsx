import React, { useState } from 'react';
import axios from 'axios';
import './profile.css';
import { useCompany } from '../../context/CompanyContext.jsx';

const EditProfileModal = ({ onClose }) => {
  const company = useCompany();
  const [fullName, setFullName] = useState(company?.name ?? '');
  const [email, setEmail] = useState(company?.email ?? '');
  const [phone, setPhone] = useState(company?.phone ?? '');
  const [photo, setPhoto] = useState(null);
  const [documentType, setDocumentType] = useState(company?.documentType ?? '');
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
      if (photo) fd.append('photo', photo);
      if (documentType) fd.append('document_type', documentType);
      if (documentFront) fd.append('document_front', documentFront);
      if (documentBack) fd.append('document_back', documentBack);
      
      await axios.put(`${company.apiBase}/api/auth/company/profile`, fd, {
        headers: {
          Authorization: `Bearer ${company.token}`,
        },
      });
      await company.refreshProfile();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="companypanel-modal-overlay" onClick={onClose}>
      <div className="companypanel-modal" onClick={(e) => e.stopPropagation()}>
        <div className="companypanel-modal-header">
          <h3>Edit Profile</h3>
          <button className="companypanel-modal-close" onClick={onClose}>×</button>
        </div>
        <form className="companypanel-modal-body" onSubmit={onSubmit}>
          {error && <div className="companypanel-modal-error">{error}</div>}
          <label className="companypanel-field">Full name</label>
          <input className="companypanel-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <label className="companypanel-field">Email</label>
          <input type="email" className="companypanel-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label className="companypanel-field">Phone</label>
          <input className="companypanel-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          <label className="companypanel-field">Photo</label>
          <input type="file" accept="image/*" className="companypanel-input" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
          <label className="companypanel-field">Document Type</label>
          <select className="companypanel-input" value={documentType} onChange={(e) => setDocumentType(e.target.value)}>
            <option value="">Select Document Type</option>
            <option value="aadhaar">Aadhaar</option>
            <option value="pan_card">PAN Card</option>
            <option value="driving_license">Driving License</option>
            <option value="voter_id">Voter ID</option>
            <option value="other">Other</option>
          </select>
          <label className="companypanel-field">Document (Front)</label>
          <input type="file" accept="image/*,.pdf" className="companypanel-input" onChange={(e) => setDocumentFront(e.target.files?.[0] || null)} />
          <label className="companypanel-field">Document (Back)</label>
          <input type="file" accept="image/*,.pdf" className="companypanel-input" onChange={(e) => setDocumentBack(e.target.files?.[0] || null)} />
          <div className="companypanel-modal-actions">
            <button type="button" className="companypanel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="companypanel-btn companypanel-btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;

