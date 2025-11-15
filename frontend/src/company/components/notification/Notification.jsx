import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { FiBell } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { useCompany } from '../../../context/CompanyContext.jsx';
import './companynotification.css';

export default function Notification() {
  const company = useCompany();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const containerRef = useRef(null);

  async function loadNotifications() {
    try {
      // Note: Company notifications endpoint would need to be created
      const { data } = await axios.get(`${company.apiBase}/api/notifications/broker`, {
        params: { limit: 100 },
        headers: { Authorization: `Bearer ${company.token}` },
      });
      if (data && Array.isArray(data?.data)) {
        const allNotifications = data.data;
        const unreadNotifications = allNotifications.filter((n) => !n.is_read);
        setTotalUnread(unreadNotifications.length);
        setTotalCount(allNotifications.length);
        const sorted = [...allNotifications].sort((a, b) => {
          if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
          return new Date(b.created_at) - new Date(a.created_at);
        });
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
      await axios.post(`${company.apiBase}/api/notifications/broker/${id}/read`, null, {
        headers: { Authorization: `Bearer ${company.token}` },
      });
      await loadNotifications();
    } catch {
      // Ignore errors
    }
  }

  function handleViewAll() {
    setOpen(false);
    navigate('/company/crm');
  }

  function handleNotificationClick(id) {
    markAsRead(id);
    setOpen(false);
    navigate('/company/crm');
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  useEffect(() => {
    if (company?.token) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.token]);

  return (
    <div className="companynotification" ref={containerRef}>
      <button
        className="brokerpanelheader-iconbtn companynotification-btn"
        aria-label="Notifications"
        onClick={async () => { await loadNotifications(); setOpen((v) => !v); }}
      >
        <FiBell />
        {totalUnread > 0 && <span className="companynotification-badge">{totalUnread}</span>}
      </button>
      {open && (
        <div className="brokerpanelheader-menu companynotification-menu">
          {items.length === 0 ? (
            <div className="brokerpanelheader-menu-item">No notifications</div>
          ) : (
            <>
              {items.map((n) => (
                <div 
                  key={n.id} 
                  className={`brokerpanelheader-menu-item companynotification-item ${!n.is_read ? 'companynotification-unread' : ''}`}
                  onClick={() => handleNotificationClick(n.id)}
                >
                  <div className="companynotification-title">{n.title}</div>
                  <div className="companynotification-sub">{n.message}</div>
                  <div className="companynotification-time">
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
                <div className="companynotification-viewall" onClick={handleViewAll}>
                  <button className="brokerpanelheader-menu-item companynotification-viewall-btn">
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

