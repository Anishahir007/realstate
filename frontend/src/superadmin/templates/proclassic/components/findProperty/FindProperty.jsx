import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useSearchParams } from 'react-router-dom';
import { getApiBase } from '../../../../../utils/apiBase.js';
import EnquiryModal from './EnquiryModal.jsx';
import './findProperty.css';

function formatPriceINR(price) {
  if (!price || price === 0) return 'Price on Request';
  if (price >= 10000000) {
    return `₹ ${(price / 10000000).toFixed(2)} Cr.`;
  } else if (price >= 100000) {
    return `₹ ${(price / 100000).toFixed(2)} Lac`;
  }
  return `₹ ${price.toLocaleString('en-IN')}`;
}

function PropertyCard({ property, onEnquiry }) {
  const imageUrl = property.image_url || property.primary_image || property.image || '/assets/images/default-property.jpg';
  const propertyId = property.id ? `REI${property.id}` : 'N/A';
  
  // Get area - try multiple fields
  const area = property.built_up_area || property.area || property.carpet_area || property.super_area;
  const areaUnit = property.area_unit || property.carpet_area_unit || property.super_area_unit || 'Sq.ft.';
  
  // Get property type - format it nicely
  const propertyTypeRaw = property.property_type || property.type || 'Property';
  const propertyType = propertyTypeRaw.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  // Get location - show locality, city, state
  const locationParts = [];
  if (property.locality) locationParts.push(property.locality);
  if (property.city) locationParts.push(property.city);
  if (property.state && property.city !== property.state) locationParts.push(property.state);
  const location = locationParts.length > 0 ? locationParts.join(', ') : 'Location not specified';

  return (
    <div className="pc-find-prop-card">
      <div className="pc-find-prop-image">
        <img src={imageUrl} alt={property.title || 'Property'} onError={(e) => { e.target.src = '/assets/images/default-property.jpg'; }} />
      </div>
      <div className="pc-find-prop-content">
        <div className="pc-find-prop-id">{propertyId}</div>
        <h3 className="pc-find-prop-title">{property.title || 'Property'}</h3>
        <div className="pc-find-prop-location">{location}</div>
        <div className="pc-find-prop-details">
          {area && <span>Build up Area: {area} {areaUnit}</span>}
          <span>Property Type: {propertyType}</span>
        </div>
        <div className="pc-find-prop-price">{formatPriceINR(property.expected_price || property.price)}</div>
        <div className="pc-find-prop-actions">
          <Link to={`/property/${property.id}`} className="pc-find-btn pc-find-btn--view">View Details</Link>
          <button className="pc-find-btn pc-find-btn--enquiry" onClick={() => onEnquiry(property)}>
            Send Enquiry
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FindProperty({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get initial search query from URL
  const initialQuery = searchParams.get('q') || '';
  
  const [filters, setFilters] = useState({
    property_for: '',
    property_type: '',
    city: '',
    locality: initialQuery, // Set locality from URL query
    min_price_lacs: '',
    max_price_lacs: ''
  });
  
  const [filterOptions, setFilterOptions] = useState({
    cities: [],
    propertyTypes: [],
    localities: []
  });
  
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtersLoaded, setFiltersLoaded] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [cityCounts, setCityCounts] = useState({});
  
  const apiBase = getApiBase() || '';
  const tenantDb = site?.tenant_db || 
                   site?.broker?.tenant_db || 
                   ctx.site?.tenant_db || 
                   ctx.site?.broker?.tenant_db ||
                   ctx.tenant_db;

  // Fetch filter options
  useEffect(() => {
    if (!tenantDb) {
      // If no tenantDb, use properties from props/context
      if (properties && properties.length > 0) {
        setSearchResults(properties);
      }
      return;
    }
    
    async function fetchFilters() {
      try {
        const headers = {};
        if (tenantDb) headers['x-tenant-db'] = tenantDb;
        
        const apiUrl = apiBase ? `${apiBase}/api/properties/filters` : '/api/properties/filters';
        console.log('Fetching filters from:', apiUrl, 'with tenant:', tenantDb);
        
        const response = await fetch(apiUrl, { headers });
        console.log('Filters response status:', response.status, response.statusText);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Filters result:', result);
          if (result.data) {
            setFilterOptions({
              cities: result.data.cities || [],
              propertyTypes: result.data.propertyTypes || [],
              localities: result.data.localities || []
            });
            
            // Create city counts map
            const counts = {};
            result.data.cities.forEach(c => {
              counts[c.value] = c.count;
            });
            setCityCounts(counts);
            setFiltersLoaded(true);
          }
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch filters:', response.status, errorText);
          // Fallback to props/context properties
          if (properties && properties.length > 0) {
            setSearchResults(properties);
            setFiltersLoaded(true); // Still mark as loaded to trigger search
          }
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
        // Fallback to props/context properties
        if (properties && properties.length > 0) {
          setSearchResults(properties);
          setFiltersLoaded(true); // Still mark as loaded to trigger search
        }
      }
    }
    
    fetchFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantDb, apiBase]);

  // Handle URL query parameter changes
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery !== filters.locality) {
      setFilters(prev => ({ ...prev, locality: urlQuery }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Trigger search when filters change and we have a query from URL
  useEffect(() => {
    const urlQuery = searchParams.get('q') || '';
    if (urlQuery && filtersLoaded) {
      if (tenantDb) {
        performSearch();
      } else if (properties && properties.length > 0) {
        // Filter by query
        const filtered = properties.filter(p => 
          (p.title && p.title.toLowerCase().includes(urlQuery.toLowerCase())) ||
          (p.city && p.city.toLowerCase().includes(urlQuery.toLowerCase())) ||
          (p.locality && p.locality.toLowerCase().includes(urlQuery.toLowerCase())) ||
          (p.address && p.address.toLowerCase().includes(urlQuery.toLowerCase()))
        );
        setSearchResults(filtered);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locality, filtersLoaded, searchParams]);

  // Initial load - perform search after filters are loaded or use props
  useEffect(() => {
    if (tenantDb && filtersLoaded) {
      // Filters loaded, perform initial search to show all properties
      performSearch();
    } else if (!tenantDb && properties && properties.length > 0) {
      // No tenantDb, use properties from props/context
      const urlQuery = searchParams.get('q') || '';
      if (urlQuery) {
        // Filter by query if available
        const filtered = properties.filter(p => 
          (p.title && p.title.toLowerCase().includes(urlQuery.toLowerCase())) ||
          (p.city && p.city.toLowerCase().includes(urlQuery.toLowerCase())) ||
          (p.locality && p.locality.toLowerCase().includes(urlQuery.toLowerCase())) ||
          (p.address && p.address.toLowerCase().includes(urlQuery.toLowerCase()))
        );
        setSearchResults(filtered);
      } else {
        setSearchResults(properties);
      }
      setFiltersLoaded(true);
    } else if (!tenantDb) {
      // No tenantDb and no props, try to search anyway
      performSearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersLoaded, tenantDb, searchParams]);

  const performSearch = async () => {
    if (!tenantDb) {
      // Fallback to props/context properties if no tenantDb
      if (properties && properties.length > 0) {
        // Filter by query if available
        const query = filters.locality || initialQuery;
        if (query) {
          const filtered = properties.filter(p => 
            (p.title && p.title.toLowerCase().includes(query.toLowerCase())) ||
            (p.city && p.city.toLowerCase().includes(query.toLowerCase())) ||
            (p.locality && p.locality.toLowerCase().includes(query.toLowerCase())) ||
            (p.address && p.address.toLowerCase().includes(query.toLowerCase()))
          );
          setSearchResults(filtered);
        } else {
          setSearchResults(properties);
        }
      }
      return;
    }
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.property_for) params.append('property_for', filters.property_for);
      if (filters.property_type) params.append('property_type', filters.property_type);
      if (filters.city) params.append('city', filters.city);
      if (filters.locality) params.append('locality', filters.locality);
      // Add text search query parameter
      const searchQuery = filters.locality || initialQuery;
      if (searchQuery) params.append('q', searchQuery);
      
      // Convert lacs to rupees for API
      if (filters.min_price_lacs) {
        const minPrice = parseFloat(filters.min_price_lacs) * 100000;
        if (!isNaN(minPrice) && minPrice > 0) {
          params.append('min_price', minPrice);
        }
      }
      if (filters.max_price_lacs) {
        const maxPrice = parseFloat(filters.max_price_lacs) * 100000;
        if (!isNaN(maxPrice) && maxPrice > 0) {
          params.append('max_price', maxPrice);
        }
      }
      
      const headers = { 'x-tenant-db': tenantDb };
      const apiUrl = apiBase ? `${apiBase}/api/properties/search` : '/api/properties/search';
      const fullUrl = `${apiUrl}?${params.toString()}`;
      console.log('Searching properties:', fullUrl, 'with tenant:', tenantDb);
      
      const response = await fetch(fullUrl, { headers });
      console.log('Search response status:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Search result count:', result.data?.length || 0);
        setSearchResults(result.data || []);
      } else {
        const errorText = await response.text();
        console.error('Search failed:', response.status, errorText);
        // Fallback to props/context properties
        if (properties && properties.length > 0) {
          setSearchResults(properties);
        }
      }
    } catch (err) {
      console.error('Error searching properties:', err);
      // Fallback to props/context properties
      if (properties && properties.length > 0) {
        setSearchResults(properties);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    // Just update the filter state, don't auto-search
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Update URL with search query if locality is set
    if (filters.locality) {
      setSearchParams({ q: filters.locality });
    } else {
      setSearchParams({});
    }
    performSearch();
  };

  const handleEnquiry = (property) => {
    setSelectedProperty(property);
    setShowEnquiryModal(true);
  };

  const handleCloseEnquiry = () => {
    setShowEnquiryModal(false);
    setSelectedProperty(null);
  };

  // Get cities with counts for tabs
  const cityTabs = filterOptions.cities.slice(0, 4);

  return (
    <div className="pc-find-property">
      {/* City Tabs */}
      <div className="pc-find-city-tabs">
        {cityTabs.map(city => (
          <button
            key={city.value}
            className={`pc-find-city-tab ${filters.city === city.value ? 'active' : ''}`}
            onClick={() => {
              setFilters(prev => ({ ...prev, city: city.value }));
              // Don't auto-search, user needs to click SEARCH button
            }}
          >
            Property in {city.label} ({city.count})
          </button>
        ))}
      </div>

      {/* Search Form */}
      <div className="pc-find-search">
        <form onSubmit={handleSearch} className="pc-find-search-form">
          <select
            className="pc-find-select"
            value={filters.property_for}
            onChange={(e) => handleFilterChange('property_for', e.target.value)}
          >
            <option value="">I Want to</option>
            <option value="sale">Buy</option>
            <option value="rent">Rent</option>
          </select>
          
          <select
            className="pc-find-select"
            value={filters.property_type}
            onChange={(e) => handleFilterChange('property_type', e.target.value)}
          >
            <option value="">Property Type</option>
            {filterOptions.propertyTypes.map(pt => (
              <option key={pt.value} value={pt.value}>{pt.label}</option>
            ))}
          </select>
          
          <select
            className="pc-find-select"
            value={filters.city}
            onChange={(e) => handleFilterChange('city', e.target.value)}
          >
            <option value="">City</option>
            {filterOptions.cities.map(city => (
              <option key={city.value} value={city.value}>{city.label}</option>
            ))}
          </select>
          
          <input
            type="text"
            className="pc-find-input"
            placeholder="Locality"
            value={filters.locality}
            onChange={(e) => handleFilterChange('locality', e.target.value)}
          />
          
          <div className="pc-find-budget">
            <input
              type="number"
              className="pc-find-input pc-find-input--small"
              placeholder="Min (Lacs)"
              value={filters.min_price_lacs}
              onChange={(e) => handleFilterChange('min_price_lacs', e.target.value)}
            />
            <input
              type="number"
              className="pc-find-input pc-find-input--small"
              placeholder="Max (Lacs)"
              value={filters.max_price_lacs}
              onChange={(e) => handleFilterChange('max_price_lacs', e.target.value)}
            />
          </div>
          
          <button type="submit" className="pc-find-search-btn" disabled={loading}>
            {loading ? 'Searching...' : 'SEARCH'}
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="pc-find-results">
        {loading ? (
          <div className="pc-find-loading">Loading properties...</div>
        ) : searchResults.length === 0 ? (
          <div className="pc-find-empty">No properties found. Please adjust your filters.</div>
        ) : (
          <div className="pc-find-grid">
            {searchResults.map(property => (
              <PropertyCard key={property.id} property={property} onEnquiry={handleEnquiry} />
            ))}
          </div>
        )}
      </div>

      {/* Enquiry Modal */}
      {showEnquiryModal && selectedProperty && (
        <EnquiryModal
          property={selectedProperty}
          site={site}
          tenantDb={tenantDb}
          onClose={handleCloseEnquiry}
        />
      )}
    </div>
  );
}

