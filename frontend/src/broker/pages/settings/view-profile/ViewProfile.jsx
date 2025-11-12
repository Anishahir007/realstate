import React, { useEffect, useState, useRef } from 'react';
import { useBroker } from '../../../../context/BrokerContext.jsx';
import './brokerviewprofile.css';
import EditProfileModal from '../../../../broker/profile/EditProfileModal.jsx';
import UpdatePhotoModal from '../../../../broker/profile/UpdatePhotoModal.jsx';

const ViewProfile = () => {
  const broker = useBroker();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);

  useEffect(() => {
    if (!broker?.name || !broker?.email) {
      broker?.refreshProfile?.();
    }
  }, [broker?.name, broker?.email, broker]);

  // Refresh profile when edit modal closes
  const prevEditOpen = useRef(isEditOpen);
  const prevPhotoOpen = useRef(isPhotoOpen);
  
  useEffect(() => {
    // Only refresh when modal transitions from open to closed
    if (prevEditOpen.current && !isEditOpen) {
      broker?.refreshProfile?.();
    }
    if (prevPhotoOpen.current && !isPhotoOpen) {
      broker?.refreshProfile?.();
    }
    prevEditOpen.current = isEditOpen;
    prevPhotoOpen.current = isPhotoOpen;
  }, [isEditOpen, isPhotoOpen, broker]);

  return (
    <div className="brokerviewprofile-root">
      <div className="brokerviewprofile-titlebar">
        <h2 className="brokerviewprofile-title">Profile</h2>
        <div className="brokerviewprofile-actions">
          <button className="brokerviewprofile-btn" onClick={() => setIsEditOpen(true)}>Edit Profile</button>
          <button className="brokerviewprofile-btn" onClick={() => setIsPhotoOpen(true)}>Update Photo</button>
        </div>
      </div>
      <div className="brokerviewprofile-header">
        {(() => {
          const p = broker?.photo;
          if (!p) return null;
          const isHttp = p.startsWith('http://') || p.startsWith('https://');
          const src = isHttp ? p : `${broker.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
          return <img src={src} alt="Avatar" className="brokerviewprofile-avatar" />;
        })()}
        <div>
          <div className="brokerviewprofile-name">{broker?.name}</div>
          <div className="brokerviewprofile-email">{broker?.email}</div>
        </div>
      </div>
      <div className="brokerviewprofile-grid">
        <div className="brokerviewprofile-label">Role</div>
        <div>broker</div>
        <div className="brokerviewprofile-label">Phone</div>
        <div>{broker?.phone || '-'}</div>
        <div className="brokerviewprofile-label">License No</div>
        <div>{broker?.licenseNo || '-'}</div>
        <div className="brokerviewprofile-label">Location</div>
        <div>{broker?.location || '-'}</div>
        <div className="brokerviewprofile-label">Address</div>
        <div>{broker?.address || '-'}</div>
        <div className="brokerviewprofile-label">Store Name</div>
        <div>{broker?.storeName || '-'}</div>
        <div className="brokerviewprofile-label">Company Name</div>
        <div>{broker?.companyName || '-'}</div>
        <div className="brokerviewprofile-label">Document Type</div>
        <div>{broker?.documentType ? broker.documentType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}</div>
        <div className="brokerviewprofile-label">Last Login</div>
        <div>{broker?.lastLoginAt ? new Date(broker.lastLoginAt).toLocaleString() : '-'}</div>
      </div>

      {(broker?.instagram || broker?.facebook || broker?.linkedin || broker?.youtube || broker?.whatsappNumber) && (
        <div className="brokerviewprofile-section">
          <h3 className="brokerviewprofile-section-title">Social Media</h3>
          <div className="brokerviewprofile-grid">
            {broker?.instagram && (
              <>
                <div className="brokerviewprofile-label">Instagram</div>
                <div>
                  <a href={broker.instagram} target="_blank" rel="noopener noreferrer" className="brokerviewprofile-link">
                    {broker.instagram}
                  </a>
                </div>
              </>
            )}
            {broker?.facebook && (
              <>
                <div className="brokerviewprofile-label">Facebook</div>
                <div>
                  <a href={broker.facebook} target="_blank" rel="noopener noreferrer" className="brokerviewprofile-link">
                    {broker.facebook}
                  </a>
                </div>
              </>
            )}
            {broker?.linkedin && (
              <>
                <div className="brokerviewprofile-label">LinkedIn</div>
                <div>
                  <a href={broker.linkedin} target="_blank" rel="noopener noreferrer" className="brokerviewprofile-link">
                    {broker.linkedin}
                  </a>
                </div>
              </>
            )}
            {broker?.youtube && (
              <>
                <div className="brokerviewprofile-label">YouTube</div>
                <div>
                  <a href={broker.youtube} target="_blank" rel="noopener noreferrer" className="brokerviewprofile-link">
                    {broker.youtube}
                  </a>
                </div>
              </>
            )}
            {broker?.whatsappNumber && (
              <>
                <div className="brokerviewprofile-label">WhatsApp Number</div>
                <div>{broker.whatsappNumber}</div>
              </>
            )}
          </div>
        </div>
      )}

      {(broker?.documentFront || broker?.documentBack) && (
        <div className="brokerviewprofile-documents">
          <h3 className="brokerviewprofile-documents-title">Documents</h3>
          <div className="brokerviewprofile-documents-grid">
            {broker?.documentFront && (
              <div className="brokerviewprofile-document-item">
                <div className="brokerviewprofile-document-label">Document Front</div>
                <div className="brokerviewprofile-document-image">
                  {(() => {
                    const doc = broker.documentFront;
                    const isHttp = doc.startsWith('http://') || doc.startsWith('https://');
                    const src = isHttp ? doc : `${broker.apiBase}${doc.startsWith('/') ? doc : `/${doc}`}`;
                    const isPdf = doc.toLowerCase().endsWith('.pdf');
                    if (isPdf) {
                      return (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="brokerviewprofile-document-link">
                          <div className="brokerviewprofile-document-pdf-icon">📄</div>
                          <div className="brokerviewprofile-document-pdf-text">View PDF</div>
                        </a>
                      );
                    }
                    return <img src={src} alt="Document Front" className="brokerviewprofile-document-img" />;
                  })()}
                </div>
              </div>
            )}
            {broker?.documentBack && (
              <div className="brokerviewprofile-document-item">
                <div className="brokerviewprofile-document-label">Document Back</div>
                <div className="brokerviewprofile-document-image">
                  {(() => {
                    const doc = broker.documentBack;
                    const isHttp = doc.startsWith('http://') || doc.startsWith('https://');
                    const src = isHttp ? doc : `${broker.apiBase}${doc.startsWith('/') ? doc : `/${doc}`}`;
                    const isPdf = doc.toLowerCase().endsWith('.pdf');
                    if (isPdf) {
                      return (
                        <a href={src} target="_blank" rel="noopener noreferrer" className="brokerviewprofile-document-link">
                          <div className="brokerviewprofile-document-pdf-icon">📄</div>
                          <div className="brokerviewprofile-document-pdf-text">View PDF</div>
                        </a>
                      );
                    }
                    return <img src={src} alt="Document Back" className="brokerviewprofile-document-img" />;
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


