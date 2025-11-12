import React, { useEffect, useState } from 'react';
import { useCompany } from '../../../../context/CompanyContext.jsx';
import './companyviewprofile.css';
import EditProfileModal from '../../../../company/profile/EditProfileModal.jsx';
import UpdatePhotoModal from '../../../../company/profile/UpdatePhotoModal.jsx';

const ViewProfile = () => {
  const company = useCompany();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  useEffect(() => {
    if (!company?.name || !company?.email) {
      company?.refreshProfile?.();
    }
  }, [company]);

  return (
    <div className="companyviewprofile-root">
      <div className="companyviewprofile-titlebar">
        <h2 className="companyviewprofile-title">Profile</h2>
        <div className="companyviewprofile-actions">
          <button className="companyviewprofile-btn" onClick={() => setIsEditOpen(true)}>Edit Profile</button>
          <button className="companyviewprofile-btn" onClick={() => setIsPhotoOpen(true)}>Update Photo</button>
        </div>
      </div>
      <div className="companyviewprofile-header">
        {(() => {
          const p = company?.photo;
          if (!p) return null;
          const isHttp = p.startsWith('http://') || p.startsWith('https://');
          const src = isHttp ? p : `${company.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
          return <img src={src} alt="Avatar" className="companyviewprofile-avatar" />;
        })()}
        <div>
          <div className="companyviewprofile-name">{company?.name}</div>
          <div className="companyviewprofile-email">{company?.email}</div>
        </div>
      </div>
      <div className="companyviewprofile-grid">
        <div className="companyviewprofile-label">Role</div>
        <div>company</div>
        <div className="companyviewprofile-label">Phone</div>
        <div>{company?.phone}</div>
        <div className="companyviewprofile-label">Company Name</div>
        <div>{company?.companyName || '-'}</div>
        <div className="companyviewprofile-label">Location</div>
        <div>{company?.location || '-'}</div>
        <div className="companyviewprofile-label">Document Type</div>
        <div>{company?.documentType ? company.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}</div>
        <div className="companyviewprofile-label">Last Login</div>
        <div>{company?.lastLoginAt ? new Date(company.lastLoginAt).toLocaleString() : ''}</div>
      </div>

      {(company?.documentFront || company?.documentBack) && (
        <div className="companyviewprofile-documents">
          <h3 className="companyviewprofile-documents-title">Documents</h3>
          <div className="companyviewprofile-documents-grid">
            {company?.documentFront && (
              <div className="companyviewprofile-document-item">
                <div className="companyviewprofile-document-label">Document Front</div>
                <div className="companyviewprofile-document-image">
                  {(() => {
                    const doc = company.documentFront;
                    const isHttp = doc.startsWith('http://') || doc.startsWith('https://');
                    const src = isHttp ? doc : `${company.apiBase}${doc.startsWith('/') ? doc : `/${doc}`}`;
                    const isPdf = doc.toLowerCase().endsWith('.pdf');
                    if (isPdf) {
                      return (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="companyviewprofile-document-link">
                          <div className="companyviewprofile-document-pdf-icon">📄</div>
                          <div className="companyviewprofile-document-pdf-text">View PDF</div>
                        </a>
                      );
                    }
                    return <img src={src} alt="Document Front" className="companyviewprofile-document-img" />;
                  })()}
                </div>
              </div>
            )}
            {company?.documentBack && (
              <div className="companyviewprofile-document-item">
                <div className="companyviewprofile-document-label">Document Back</div>
                <div className="companyviewprofile-document-image">
                  {(() => {
                    const doc = company.documentBack;
                    const isHttp = doc.startsWith('http://') || doc.startsWith('https://');
                    const src = isHttp ? doc : `${company.apiBase}${doc.startsWith('/') ? doc : `/${doc}`}`;
                    const isPdf = doc.toLowerCase().endsWith('.pdf');
                    if (isPdf) {
                      return (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="companyviewprofile-document-link">
                          <div className="companyviewprofile-document-pdf-icon">📄</div>
                          <div className="companyviewprofile-document-pdf-text">View PDF</div>
                        </a>
                      );
                    }
                    return <img src={src} alt="Document Back" className="companyviewprofile-document-img" />;
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isEditOpen && <EditProfileModal onClose={() => setIsEditOpen(false)} />}
      {isPhotoOpen && <UpdatePhotoModal onClose={() => setIsPhotoOpen(false)} />}
    </div>
  );
};

export default ViewProfile;

