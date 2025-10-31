import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './notification.css';

export default function Notification() {
  const superAdmin = useSuperAdmin();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const containerRef = useRef(null);

  async function loadNotifications() {
    try {
      const { data } = await axios.get(`${superAdmin.apiBase}/api/notifications/super-admin`, {
        params: { limit: 100 },
        headers: { Authorization: `Bearer ${superAdmin.token}` },
      });
      if (data && Array.isArray(data?.data)) {
        const allNotifications = data.data;
        const unreadNotifications = allNotifications.filter((n) => !n.is_read);
        setTotalUnread(unreadNotifications.length);
        setTotalCount(allNotifications.length);
        // Sort: unread first, then by date
        const sorted = [...allNotifications].sort((a, b) => {
          if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
        // Show all notifications (both read and unread), limit to 5 in dropdown
        setItems(sorted.slice(0, 5));
      } else {
        setItems([]);
        setTotalUnread(0);
        setTotalCount(0);
      }
    } catch {
      setItems([]);
      setTotalUnread(0);
      setTotalCount(0);
    }
  }

  async function markAsRead(id) {
    try {
      await axios.post(`${superAdmin.apiBase}/api/notifications/super-admin/${id}/read`, null, {
        headers: { Authorization: `Bearer ${superAdmin.token}` },
      });
      await loadNotifications();
    } catch {
      // Ignore errors
    }
  }

  function handleViewAll() {
    setOpen(false);
    navigate('/superadmin/notifications');
  }

  function handleNotificationClick(id) {
    markAsRead(id);
    setOpen(false);
    navigate('/superadmin/notifications');
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
      // Refresh notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
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
        {totalUnread > 0 && <span className="sa-notification-badge">{totalUnread}</span>}
      </button>
      {open && (
        <div className="superadminheader-menu sa-notification-menu">
          {items.length === 0 ? (
            <div className="superadminheader-menu-item">No notifications</div>
          ) : (
            <>
              {items.map((n) => (
                <div 
                  key={n.id} 
                  className={`superadminheader-menu-item sa-notification-item ${!n.is_read ? 'sa-notification-unread' : ''}`}
                  onClick={() => handleNotificationClick(n.id)}
                >
                  <div className="sa-notification-title">{n.title}</div>
                  <div className="sa-notification-sub">{n.message}</div>
                  <div className="sa-notification-time">
                    {n.created_at ? new Date(n.created_at).toLocaleDateString('en-IN', { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }) : ''}
                  </div>
                </div>
              ))}
              {totalCount > 5 && (
                <div className="sa-notification-viewall" onClick={handleViewAll}>
                  <button className="superadminheader-menu-item sa-notification-viewall-btn">
                    View All Notifications ({totalCount})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}


