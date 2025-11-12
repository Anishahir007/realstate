import React, { useState } from 'react';
import axios from 'axios';
import './profile.css';
import { useCompany } from '../../context/CompanyContext.jsx';

const EditProfileModal = ({ onClose }) => {
  const company = useCompany();
  const [fullName, setFullName] = useState(company?.name ?? '');
  const [email, setEmail] = useState(company?.email ?? '');
  const [phone, setPhone] = useState(company?.phone ?? '');
  const [location, setLocation] = useState(company?.location ?? '');
  const [address, setAddress] = useState(company?.address ?? '');
  const [storeName, setStoreName] = useState(company?.storeName ?? '');
  const [instagram, setInstagram] = useState(company?.instagram ?? '');
  const [facebook, setFacebook] = useState(company?.facebook ?? '');
  const [linkedin, setLinkedin] = useState(company?.linkedin ?? '');
  const [youtube, setYoutube] = useState(company?.youtube ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(company?.whatsappNumber ?? '');
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
      fd.append('location', location || '');
      fd.append('address', address || '');
      fd.append('store_name', storeName || '');
      fd.append('instagram', instagram || '');
      fd.append('facebook', facebook || '');
      fd.append('linkedin', linkedin || '');
      fd.append('youtube', youtube || '');
      fd.append('whatsapp_number', whatsappNumber || '');
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
          <label className="companypanel-field">Location</label>
          <input className="companypanel-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location" />
          <label className="companypanel-field">Address</label>
          <textarea className="companypanel-input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
          <label className="companypanel-field">Store Name</label>
          <input className="companypanel-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Enter store name" />
          <div className="companypanel-field-group">
            <h4 style={{ margin: '16px 0 8px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              Social Media
            </h4>
          </div>
          <label className="companypanel-field">Instagram</label>
          <input type="url" className="companypanel-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://www.instagram.com/yourprofile" />
          <label className="companypanel-field">Facebook</label>
          <input type="url" className="companypanel-input" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://www.facebook.com/yourprofile" />
          <label className="companypanel-field">LinkedIn</label>
          <input type="url" className="companypanel-input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/yourcompany" />
          <label className="companypanel-field">YouTube</label>
          <input type="url" className="companypanel-input" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://www.youtube.com/@yourchannel" />
          <label className="companypanel-field">WhatsApp Number</label>
          <input type="tel" className="companypanel-input" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="6377963711" />
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

