import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './notifications.css';

const FILTER_OPTIONS = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

const TYPE_OPTIONS = [
  { key: 'all', label: 'All Types' },
  { key: 'broker', label: 'Broker' },
  { key: 'property', label: 'Property' },
  { key: 'lead', label: 'Lead' },
  { key: 'system', label: 'System' },
];

export default function Notifications() {
  const { token, apiBase } = useSuperAdmin();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    axios.get(`${apiBase}/api/notifications/super-admin`, { headers, params: { limit: 1000 } })
      .then(({ data: resData }) => {
        setNotifications(Array.isArray(resData?.data) ? resData.data : []);
      })
      .catch((err) => {
        console.error('Failed to load notifications:', err);
        setNotifications([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [apiBase, headers, token]);

  const getNotificationCategory = (type) => {
    if (!type) return 'system';
    const lowerType = String(type).toLowerCase();
    if (lowerType.includes('broker') && !lowerType.includes('lead') && !lowerType.includes('property')) return 'broker';
    if (lowerType.includes('lead')) return 'lead';
    if (lowerType.includes('property')) return 'property';
    return 'system';
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      if (filter === 'unread' && n.is_read) return false;
      if (filter === 'read' && !n.is_read) return false;
      if (typeFilter !== 'all') {
        const category = getNotificationCategory(n.type);
        if (category !== typeFilter) return false;
      }
      return true;
    });
  }, [notifications, filter, typeFilter]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  async function markAsRead(id) {
    try {
      await axios.post(`${apiBase}/api/notifications/super-admin/${id}/read`, null, { headers });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1, read_at: new Date().toISOString() } : n))
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  async function markAllAsRead() {
    try {
      await axios.post(`${apiBase}/api/notifications/super-admin/mark-all-read`, null, { headers });
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: 1, read_at: new Date().toISOString() }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  }

  const formatTime = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'broker': return '👥';
      case 'property': return '🏠';
      case 'lead': return '📊';
      case 'system': return '⚙️';
      default: return '📢';
    }
  };

  return (
    <div className="superadminnotifications-root">
      <div className="superadminnotifications-header">
        <div>
          <h1 className="superadminnotifications-title">Notifications</h1>
          <div className="superadminnotifications-subtitle">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="superadminnotifications-markall-btn"
            onClick={markAllAsRead}
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="superadminnotifications-filters">
        <div className="superadminnotifications-filter-group">
          <label className="superadminnotifications-filter-label">Status</label>
          <div className="superadminnotifications-filter-buttons">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`superadminnotifications-filter-btn ${filter === option.key ? 'active' : ''}`}
                onClick={() => setFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className="superadminnotifications-filter-group">
          <label className="superadminnotifications-filter-label">Type</label>
          <div className="superadminnotifications-filter-buttons">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.key}
                type="button"
                className={`superadminnotifications-filter-btn ${typeFilter === option.key ? 'active' : ''}`}
                onClick={() => setTypeFilter(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="superadminnotifications-content">
        {loading ? (
          <div className="superadminnotifications-loading">Loading notifications...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="superadminnotifications-empty">
            <div className="superadminnotifications-empty-icon">🔔</div>
            <div className="superadminnotifications-empty-text">No notifications found</div>
          </div>
        ) : (
          <div className="superadminnotifications-list">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`superadminnotifications-item ${!notification.is_read ? 'superadminnotifications-item-unread' : ''}`}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
              >
                <div className="superadminnotifications-item-icon">
                  {getTypeIcon(notification.type)}
                </div>
                <div className="superadminnotifications-item-content">
                  <div className="superadminnotifications-item-header">
                    <div className="superadminnotifications-item-title">{notification.title || 'Notification'}</div>
                    {!notification.is_read && (
                      <div className="superadminnotifications-item-badge">New</div>
                    )}
                  </div>
                  <div className="superadminnotifications-item-message">{notification.message || '—'}</div>
                  <div className="superadminnotifications-item-meta">
                    <span className="superadminnotifications-item-time">{formatTime(notification.created_at)}</span>
                    {notification.actor_broker_name && (
                      <span className="superadminnotifications-item-actor">by {notification.actor_broker_name}</span>
                    )}
                    {notification.type && (
                      <span className="superadminnotifications-item-type">{notification.type}</span>
                    )}
                  </div>
                </div>
                {!notification.is_read && (
                  <div className="superadminnotifications-item-dot" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
