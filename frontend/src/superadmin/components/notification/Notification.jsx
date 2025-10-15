import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './notification.css';

export default function Notification() {
  const superAdmin = useSuperAdmin();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const containerRef = useRef(null);

  const unreadCount = items.filter((n) => !n.is_read).length;

  async function loadNotifications() {
    try {
      const { data } = await axios.get(`${superAdmin.apiBase}/api/notifications/super-admin`, {
        params: { limit: 10 },
        headers: { Authorization: `Bearer ${superAdmin.token}` },
      });
      if (data && Array.isArray(data?.data)) setItems(data.data.filter((n) => !n.is_read));
      else setItems([]);
    } catch {
      setItems([]);
    }
  }

  async function markAsRead(id) {
    // Optimistically remove then confirm with server
    setItems((prev) => prev.filter((n) => n.id !== id));
    try {
      await axios.post(`${superAdmin.apiBase}/api/notifications/super-admin/${id}/read`, null, {
        headers: { Authorization: `Bearer ${superAdmin.token}` },
      });
    } catch {
      await loadNotifications();
    }
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  // Load notifications on mount/token change so count shows immediately
  useEffect(() => {
    if (superAdmin?.token) {
      loadNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [superAdmin?.token]);

  return (
    <div className="sa-notification" ref={containerRef}>
      <button
        className="superadminheader-iconbtn sa-notification-btn"
        aria-label="Notifications"
        onClick={async () => { await loadNotifications(); setOpen((v) => !v); }}
      >
        <FiBell />
        <span className="sa-notification-badge">{unreadCount || 0}</span>
      </button>
      {open && (
        <div className="superadminheader-menu sa-notification-menu">
          {items.length === 0 && (
            <div className="superadminheader-menu-item">No notifications</div>
          )}
          {items.map((n) => (
            <div key={n.id} className="superadminheader-menu-item sa-notification-item" onClick={() => markAsRead(n.id)}>
              <div className="sa-notification-title">{n.title}</div>
              <div className="sa-notification-sub">{n.message}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


