import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import './header.css';
import { useBroker } from '../../../context/BrokerContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FiSearch, FiChevronDown, FiX, FiHome, FiBriefcase } from 'react-icons/fi';
import Notification from '../notification/Notification.jsx';

const BrokerPanelHeader = () => {
  const broker = useBroker();
  const displayName = broker?.name;
  const displayEmail = broker?.email;
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  function toggleMenu() { setIsMenuOpen((v) => !v); }

  const performSearch = useCallback(async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    try {
      setIsSearchLoading(true);
      const { data } = await axios.get(`${broker.apiBase}/api/search/broker`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${broker.token}` },
      });

      const allResults = [
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
  }, [broker]);

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
      navigate(`/broker/search?q=${encodeURIComponent(trimmedQuery)}`);
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
    if (result.type === 'property') {
      navigate(`/broker/properties?highlight=${result.id}`);
    } else if (result.type === 'lead') {
      navigate(`/broker/crm/lead/${result.id}`);
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
    <header className="brokerpanelheader-header">
      <div className="brokerpanelheader-left">
        <div className="brokerpanelheader-search-wrapper">
          <form className="brokerpanelheader-search" role="search" onSubmit={handleSearchSubmit}>
            <FiSearch className="brokerpanelheader-search-icon" />
            <input
              ref={searchInputRef}
              className="brokerpanelheader-search-input"
              placeholder="Search properties, leads..."
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
                className="brokerpanelheader-search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </form>
          {showSearchDropdown && (
            <div className="brokerpanelheader-search-dropdown" ref={searchDropdownRef}>
              {isSearchLoading ? (
                <div className="brokerpanelheader-search-loading">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="brokerpanelheader-search-results">
                  {searchResults.map((result, idx) => (
                    <div
                      key={`${result.type}-${result.id}-${idx}`}
                      className="brokerpanelheader-search-result-item"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="brokerpanelheader-search-result-icon">
                        {result.type === 'property' && <FiHome />}
                        {result.type === 'lead' && <FiBriefcase />}
                      </div>
                      <div className="brokerpanelheader-search-result-content">
                        <div className="brokerpanelheader-search-result-title">
                          {result.type === 'property' && result.title}
                          {result.type === 'lead' && result.fullName}
                        </div>
                        <div className="brokerpanelheader-search-result-subtitle">
                          {result.type === 'property' && `${result.city || ''}${result.city && result.state ? ', ' : ''}${result.state || ''}`.trim()}
                          {result.type === 'lead' && result.email}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="brokerpanelheader-search-footer">
                    <button
                      type="button"
                      className="brokerpanelheader-search-view-all"
                      onClick={handleSearchSubmit}
                    >
                      View all results for "{searchQuery}"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="brokerpanelheader-search-empty">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="brokerpanelheader-right">
        <Notification />

        <div className="brokerpanelheader-profile" onClick={toggleMenu} ref={menuRef}>
          {(() => {
            const p = broker?.photo;
            if (!p) return null;
            const isHttp = p.startsWith('http://') || p.startsWith('https://');
            const src = isHttp ? p : `${broker.apiBase}${p.startsWith('/') ? p : `/${p}`}`;
            return <img src={src} alt="Avatar" className="brokerpanelheader-avatar" />;
          })()}
          <div className="brokerpanelheader-profile-text">
            <div className="brokerpanelheader-name">{displayName}</div>
            <div className="brokerpanelheader-email">{displayEmail}</div>
          </div>
          <FiChevronDown className="brokerpanelheader-caret" />

          {isMenuOpen && (
            <div className="brokerpanelheader-menu" role="menu">
              <button
                className="brokerpanelheader-menu-item"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/broker/settings/view-profile');
                }}
              >
                View Profile
              </button>
              <button
                className="brokerpanelheader-menu-item"
                onClick={() => {
                  try { broker?.logout?.(); } catch {}
                  setIsMenuOpen(false);
                  navigate('/auth', { replace: true });
                }}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default BrokerPanelHeader;


