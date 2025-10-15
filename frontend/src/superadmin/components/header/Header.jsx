import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import './header.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import Notification from '../notification/Notification.jsx';
import EditProfileModal from '../../profile/EditProfileModal.jsx';
import UpdatePhotoModal from '../../profile/UpdatePhotoModal.jsx';

export default function Header() {
  const superAdmin = useSuperAdmin();
  const displayName = superAdmin?.name;
  const displayEmail = superAdmin?.email;
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isPhotoOpen, setIsPhotoOpen] = useState(false);
  const menuRef = useRef(null);

  function toggleMenu() { setIsMenuOpen((v) => !v); }
  async function loadNotifications() {
    try {
      const { data } = await axios.get(`${superAdmin.apiBase}/api/notifications/super-admin`, {
        params: { limit: 10 },
        headers: { Authorization: `Bearer ${superAdmin.token}` },
      });
      if (data && Array.isArray(data.data)) setNotifications(data.data);
    } catch {}
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setIsMenuOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <header className="superadminheader-header">
      <div className="superadminheader-left">
        <div className="superadminheader-search" role="search">
          <FiSearch className="superadminheader-search-icon" />
          <input className="superadminheader-search-input" placeholder="Search..." />
        </div>
      </div>
      <div className="superadminheader-right">
        <Notification />

        <div className="superadminheader-profile" onClick={toggleMenu} ref={menuRef}>
          {(() => {
            const p = superAdmin?.photo;
            if (!p) return null;
            const isHttp = p.startsWith('http://') || p.startsWith('https://');
            const src = isHttp ? p : `${superAdmin.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
            return <img src={src} alt="Avatar" className="superadminheader-avatar" />;
          })()}
          <div className="superadminheader-profile-text">
            <div className="superadminheader-name">{displayName}</div>
            <div className="superadminheader-email">{displayEmail}</div>
          </div>
          <FiChevronDown className="superadminheader-caret" />

          {isMenuOpen && (
            <div className="superadminheader-menu" role="menu">
              <button className="superadminheader-menu-item" onClick={() => { setIsEditOpen(true); setIsMenuOpen(false); }}>Edit Profile</button>
              <button className="superadminheader-menu-item" onClick={() => { setIsPhotoOpen(true); setIsMenuOpen(false); }}>Update Photo</button>
              <button
                className="superadminheader-menu-item"
                onClick={() => {
                  try { superAdmin?.logout?.(); } catch {}
                  setIsMenuOpen(false);
                  navigate('/superadmin/login', { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {isEditOpen && (
        <EditProfileModal onClose={() => setIsEditOpen(false)} />
      )}
      {isPhotoOpen && (
        <UpdatePhotoModal onClose={() => setIsPhotoOpen(false)} />
      )}
    </header>
  );
}


