import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useParams, useOutletContext, useNavigate } from 'react-router-dom';
import './navbar.css';
import { getApiBase } from '../../../../../utils/apiBase.js';

export default function Navbar({ site: siteProp }) {
  const { slug = '' } = useParams();
  const base = slug ? `/site/${slug}` : '';
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const [logoData, setLogoData] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const apiBase = getApiBase() || '';
  
  const tenantDb = site?.tenant_db || 
                   site?.broker?.tenant_db || 
                   ctx.site?.tenant_db || 
                   ctx.site?.broker?.tenant_db ||
                   ctx.tenant_db;

  const name = site?.broker?.full_name || site?.company?.name || 'Real Estate';
  
  // Fetch logo from API if slug is available
  useEffect(() => {
    async function fetchLogo() {
      if (!slug) return;
      try {
        const response = await fetch(`${apiBase}/api/templates/site/${slug}/logo`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setLogoData(result.data);
          }
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
      }
    }
    fetchLogo();
  }, [slug, apiBase]);

  // Determine logo URL: priority: site.logo > logoData from API > broker.photo > company.photo
  let logo = '';
  if (site?.logo?.image_url) {
    logo = site.logo.image_url;
  } else if (logoData?.image_url) {
    logo = logoData.image_url;
  } else if (site?.broker?.photo) {
    logo = site.broker.photo;
  } else if (site?.company?.photo) {
    logo = site.company.photo;
  }

  // Construct full URL if needed
  if (logo && !(logo.startsWith('http://') || logo.startsWith('https://'))) {
    logo = `${apiBase}${logo.startsWith('/') ? logo : `/${logo}`}`;
  }

  // Get logo dimensions
  const logoWidth = site?.logo?.width || logoData?.width || null;
  const logoHeight = site?.logo?.height || logoData?.height || null;

  // Focus search input when it opens
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  // Real-time search as user types
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is empty, clear results
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    // Debounce search - wait 300ms after user stops typing
    searchTimeoutRef.current = setTimeout(async () => {
      if (!searchQuery.trim() || !tenantDb) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const headers = { 'x-tenant-db': tenantDb };
        // Use search endpoint with q parameter for general text search
        const params = new URLSearchParams({ 
          q: searchQuery.trim(), 
          limit: '5',
          page: '1'
        });
        const apiUrl = apiBase ? `${apiBase}/api/properties/search` : '/api/properties/search';
        const response = await fetch(`${apiUrl}?${params.toString()}`, { headers });
        
        if (response.ok) {
          const result = await response.json();
          setSearchResults(result.data || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching properties:', err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, tenantDb, apiBase]);

  // Format price
  const formatPrice = (price) => {
    if (!price || price === 0) return 'Price on Request';
    if (price >= 10000000) return `₹ ${(price / 10000000).toFixed(2)} Cr.`;
    if (price >= 100000) return `₹ ${(price / 100000).toFixed(2)} Lac`;
    return `₹ ${price.toLocaleString('en-IN')}`;
  };

  // Handle search toggle
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (!showSearch) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  // Handle property click from search results
  const handlePropertyClick = (propertyId) => {
    navigate(`${base}/property/${propertyId}`);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Handle search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`${base}/properties?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearch(false);
      setSearchQuery('');
    }
  };

  // Close search on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showSearch && searchInputRef.current && !searchInputRef.current.contains(event.target)) {
        const searchContainer = event.target.closest('.pc-search-container');
        const searchButton = event.target.closest('.pc-search');
        const searchResultItem = event.target.closest('.pc-search-result-item');
        const searchResultMore = event.target.closest('.pc-search-result-more');
        if (!searchContainer && !searchButton && !searchResultItem && !searchResultMore) {
          setShowSearch(false);
          setSearchQuery('');
          setSearchResults([]);
        }
      }
    };

    if (showSearch) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSearch]);

  return (
    <div className="pc-nav-root">
      <div className="pc-nav-strip" />
      <div className="pc-nav">
        <Link to={base || '/'} className="pc-brand">
          {logo ? (
            <img 
              className="pc-brand-logo" 
              src={logo} 
              alt={name}
              style={{
                ...(logoWidth ? { width: `${logoWidth}px` } : {}),
                ...(logoHeight ? { height: `${logoHeight}px` } : {}),
                objectFit: 'contain',
                display: 'block'
              }}
              onError={(e) => {
                // Fallback to initial if logo fails to load
                e.target.style.display = 'none';
                const fallback = e.target.nextElementSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : null}
          {!logo && (
            <div className="pc-brand-logo pc-brand-fallback">{(name || 'R')[0]}</div>
          )}
        </Link>
        <nav className="pc-links">
          <NavLink to={`${base || '/'}`} end className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Home</NavLink>
          <NavLink to={`${base}/about`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>About Us</NavLink>
          <NavLink to={`${base}/properties`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Find Properties</NavLink>
          <NavLink to={`${base}/contact`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Contact Us</NavLink>
          <NavLink to={`${base}/privacy`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Privacy</NavLink>
          <NavLink to={`${base}/privacy`} className={({ isActive }) => `pc-link ${isActive ? 'active' : ''}`}>Terms</NavLink>
        </nav>
        <div className="pc-search-wrapper">
          {showSearch && (
            <div className="pc-search-container" ref={searchInputRef}>
              <form onSubmit={handleSearchSubmit} className="pc-search-form">
                <input
                  type="text"
                  className="pc-search-input"
                  placeholder="Search properties by title, city, locality..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="pc-search-submit" aria-label="Submit Search">
                  🔍
                </button>
                <button
                  type="button"
                  className="pc-search-close"
                  onClick={handleSearchToggle}
                  aria-label="Close Search"
                >
                  ✕
                </button>
              </form>
              
              {/* Search Results Dropdown */}
              {searchQuery.trim() && (
                <div className="pc-search-results">
                  {searchLoading ? (
                    <div className="pc-search-loading">Searching...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="pc-search-results-list">
                      {searchResults.map((property) => {
                        const imageUrl = property.primary_image || property.image_url || property.image || '/assets/images/default-property.jpg';
                        const fullImageUrl = imageUrl?.startsWith('http') ? imageUrl : `${apiBase}${imageUrl?.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
                        const price = formatPrice(property.expected_price || property.price);
                        const location = [property.locality, property.city, property.state].filter(Boolean).join(', ') || 'Location not specified';
                        
                        return (
                          <div
                            key={property.id}
                            className="pc-search-result-item"
                            onClick={() => handlePropertyClick(property.id)}
                          >
                            <div className="pc-search-result-image">
                              <img
                                src={fullImageUrl}
                                alt={property.title || 'Property'}
                                onError={(e) => {
                                  e.target.src = '/assets/images/default-property.jpg';
                                }}
                              />
                            </div>
                            <div className="pc-search-result-content">
                              <div className="pc-search-result-title">{property.title || 'Property'}</div>
                              <div className="pc-search-result-location">{location}</div>
                              <div className="pc-search-result-price">{price}</div>
                            </div>
                          </div>
                        );
                      })}
                      {searchResults.length >= 5 && (
                        <div className="pc-search-result-more" onClick={handleSearchSubmit}>
                          View all results →
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="pc-search-no-results">No properties found</div>
                  )}
                </div>
              )}
            </div>
          )}
          <button 
            className="pc-search" 
            onClick={handleSearchToggle}
            aria-label="Search"
          >
            🔍
          </button>
        </div>
      </div>
    </div>
  );
}


