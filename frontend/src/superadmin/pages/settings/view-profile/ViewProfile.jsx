import React, { useEffect } from 'react';
import { useSuperAdmin } from '../../../../context/SuperAdminContext.jsx';
import './superadminviewprofile.css';

export default function ViewProfile() {
  const sa = useSuperAdmin();

  useEffect(() => {
    if (!sa?.name || !sa?.email) {
      sa?.refreshProfile?.();
    }
  }, [sa]);

  return (
    <div className="superadminviewprofile-root">
      <h2 className="superadminviewprofile-title">Profile</h2>
      <div className="superadminviewprofile-header">
        {(() => {
          const p = sa?.photo;
          if (!p) return null;
          const isHttp = p.startsWith('http://') || p.startsWith('https://');
          const src = isHttp ? p : `${sa.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
          return <img src={src} alt="Avatar" className="superadminviewprofile-avatar" />;
        })()}
        <div>
          <div className="superadminviewprofile-name">{sa?.name}</div>
          <div className="superadminviewprofile-email">{sa?.email}</div>
        </div>
      </div>
      <div className="superadminviewprofile-grid">
        <div className="superadminviewprofile-label">Role</div>
        <div>super_admin</div>
        <div className="superadminviewprofile-label">Phone</div>
        <div>{sa?.phone}</div>
        <div className="superadminviewprofile-label">Last Login</div>
        <div>{sa?.lastLoginAt ? new Date(sa.lastLoginAt).toLocaleString() : ''}</div>
      </div>
    </div>
  );
}


