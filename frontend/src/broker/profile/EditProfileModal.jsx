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
  const [location, setLocation] = useState(broker?.location ?? '');
  const [address, setAddress] = useState(broker?.address ?? '');
  const [storeName, setStoreName] = useState(broker?.storeName ?? '');
  const [companyName, setCompanyName] = useState(broker?.companyName ?? '');
  const [instagram, setInstagram] = useState(broker?.instagram ?? '');
  const [facebook, setFacebook] = useState(broker?.facebook ?? '');
  const [linkedin, setLinkedin] = useState(broker?.linkedin ?? '');
  const [youtube, setYoutube] = useState(broker?.youtube ?? '');
  const [whatsappNumber, setWhatsappNumber] = useState(broker?.whatsappNumber ?? '');
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
      fd.append('location', location || '');
      fd.append('address', address || '');
      fd.append('store_name', storeName || '');
      fd.append('company_name', companyName || '');
      fd.append('instagram', instagram || '');
      fd.append('facebook', facebook || '');
      fd.append('linkedin', linkedin || '');
      fd.append('youtube', youtube || '');
      fd.append('whatsapp_number', whatsappNumber || '');
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
          <label className="brokerpanel-field">Location</label>
          <input className="brokerpanel-input" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Enter location" />
          <label className="brokerpanel-field">Address</label>
          <textarea className="brokerpanel-input" rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your address" />
          <label className="brokerpanel-field">Store Name</label>
          <input className="brokerpanel-input" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Enter store name" />
          <label className="brokerpanel-field">Company Name</label>
          <input className="brokerpanel-input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Enter company name" />
          <div className="brokerpanel-field-group">
            <h4 style={{ margin: '16px 0 8px', fontSize: '16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
              Social Media
            </h4>
          </div>
          <label className="brokerpanel-field">Instagram</label>
          <input type="url" className="brokerpanel-input" value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://www.instagram.com/yourprofile" />
          <label className="brokerpanel-field">Facebook</label>
          <input type="url" className="brokerpanel-input" value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://www.facebook.com/yourprofile" />
          <label className="brokerpanel-field">LinkedIn</label>
          <input type="url" className="brokerpanel-input" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/company/yourcompany" />
          <label className="brokerpanel-field">YouTube</label>
          <input type="url" className="brokerpanel-input" value={youtube} onChange={(e) => setYoutube(e.target.value)} placeholder="https://www.youtube.com/@yourchannel" />
          <label className="brokerpanel-field">WhatsApp Number</label>
          <input type="tel" className="brokerpanel-input" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="6377963711" />
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


