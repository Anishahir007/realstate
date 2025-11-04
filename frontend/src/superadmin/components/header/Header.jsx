import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import './header.css';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiX, FiUser, FiHome, FiBriefcase } from 'react-icons/fi';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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

  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      setIsSearchLoading(true);
      const { data } = await axios.get(`${superAdmin.apiBase}/api/search/superadmin`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${superAdmin.token}` },
      });

      const allResults = [
        ...(data.data?.brokers || []).slice(0, 5).map(b => ({ ...b, type: 'broker' })),
        ...(data.data?.properties || []).slice(0, 5).map(p => ({ ...p, type: 'property' })),
        ...(data.data?.leads || []).slice(0, 5).map(l => ({ ...l, type: 'lead' })),
      ].slice(0, 5);

      setSearchResults(allResults);
      setShowSearchDropdown(allResults.length > 0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Search error:', err);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearchLoading(false);
    }
  }, [superAdmin]);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value.trim());
    }, 300);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= 2) {
      navigate(`/superadmin/search?q=${encodeURIComponent(trimmedQuery)}`);
      setSearchQuery('');
      setShowSearchDropdown(false);
      setSearchResults([]);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearchSubmit(e);
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setSearchQuery('');
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'broker') {
      navigate(`/superadmin/brokers?highlight=${result.id}`);
    } else if (result.type === 'property') {
      navigate(`/superadmin/properties?highlight=${result.id}&brokerId=${result.brokerId}&tenantDb=${result.tenantDb}`);
    } else if (result.type === 'lead') {
      if (result.source === 'main') {
        navigate(`/superadmin/crm/lead/${result.id}/main`);
      } else {
        navigate(`/superadmin/crm/lead/${result.id}/broker`);
      }
    }
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
  };

  useEffect(() => {
    function onDocClick(e) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setIsMenuOpen(false);
      
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target) && 
          searchInputRef.current && !searchInputRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener('click', onDocClick);
    return () => {
      document.removeEventListener('click', onDocClick);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <header className="superadminheader-header">
      <div className="superadminheader-left">
        <div className="superadminheader-search-wrapper">
          <form className="superadminheader-search" role="search" onSubmit={handleSearchSubmit}>
            <FiSearch className="superadminheader-search-icon" />
            <input
              ref={searchInputRef}
              className="superadminheader-search-input"
              placeholder="Search brokers, properties, leads..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => {
                if (searchResults.length > 0) {
                  setShowSearchDropdown(true);
                }
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="superadminheader-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </form>
          {showSearchDropdown && (
            <div className="superadminheader-search-dropdown" ref={searchDropdownRef}>
              {isSearchLoading ? (
                <div className="superadminheader-search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="superadminheader-search-results">
                  {searchResults.map((result, idx) => (
                    <div
                      key={`${result.type}-${result.id}-${idx}`}
                      className="superadminheader-search-result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="superadminheader-search-result-icon">
                        {result.type === 'broker' && <FiUser />}
                        {result.type === 'property' && <FiHome />}
                        {result.type === 'lead' && <FiBriefcase />}
                      </div>
                      <div className="superadminheader-search-result-content">
                        <div className="superadminheader-search-result-title">
                          {result.type === 'broker' && result.name}
                          {result.type === 'property' && result.title}
                          {result.type === 'lead' && result.fullName}
                        </div>
                        <div className="superadminheader-search-result-subtitle">
                          {result.type === 'broker' && result.email}
                          {result.type === 'property' && `${result.city || ''}${result.city && result.state ? ', ' : ''}${result.state || ''}`.trim()}
                          {result.type === 'lead' && result.email}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="superadminheader-search-footer">
                    <button
                      type="button"
                      className="superadminheader-search-view-all"
                      onClick={handleSearchSubmit}
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="superadminheader-search-empty">No results found</div>
              )}
            </div>
          )}
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


