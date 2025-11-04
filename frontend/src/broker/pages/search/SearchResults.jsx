import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';
import { FiSearch, FiHome, FiBriefcase, FiMail, FiPhone, FiMapPin, FiDollarSign } from 'react-icons/fi';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const broker = useBroker();
  const navigate = useNavigate();
  const [results, setResults] = useState({ properties: [], leads: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query || query.length < 2) {
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data } = await axios.get(`${broker.apiBase}/api/search/broker`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${broker.token}` },
        });
        setResults(data.data || { properties: [], leads: [] });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Search error:', err);
        setError('Failed to load search results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, broker]);

  const handlePropertyClick = (propertyId) => {
    navigate(`/broker/properties?highlight=${propertyId}`);
  };

  const handleLeadClick = (leadId) => {
    navigate(`/broker/crm/lead/${leadId}`);
  };

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="broker-search-results-container">
        <div className="broker-search-results-header">
          <h1>Search Results</h1>
          <div className="broker-search-query">Searching for: "{query}"</div>
        </div>
        <div className="broker-search-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="broker-search-results-container">
        <div className="broker-search-results-header">
          <h1>Search Results</h1>
          <div className="broker-search-query">Searching for: "{query}"</div>
        </div>
        <div className="broker-search-error">{error}</div>
      </div>
    );
  }

  const totalResults = results.properties.length + results.leads.length;

  return (
    <div className="broker-search-results-container">
      <div className="broker-search-results-header">
        <h1>Search Results</h1>
        <div className="broker-search-query">
          {totalResults > 0 ? (
            <>
              Found {totalResults} result{totalResults !== 1 ? 's' : ''} for: <strong>"{query}"</strong>
            </>
          ) : (
            <>
              No results found for: <strong>"{query}"</strong>
            </>
          )}
        </div>
      </div>

      {totalResults === 0 ? (
        <div className="broker-search-empty">
          <FiSearch className="broker-search-empty-icon" />
          <p>Try searching with different keywords</p>
        </div>
      ) : (
        <div className="broker-search-results-content">
          {/* Properties Section */}
          {results.properties.length > 0 && (
            <section className="broker-search-section">
              <h2 className="broker-search-section-title">
                <FiHome className="broker-search-section-icon" />
                Properties ({results.properties.length})
              </h2>
              <div className="broker-search-results-grid">
                {results.properties.map((property) => (
                  <div
                    key={property.id}
                    className="broker-search-result-card broker-search-result-card-property"
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <div className="broker-search-result-card-image">
                      {property.image ? (
                        <img
                          src={property.image.startsWith('http') ? property.image : `${broker.apiBase}${property.image}`}
                          alt={property.title}
                        />
                      ) : (
                        <div className="broker-search-result-card-image-placeholder">
                          <FiHome />
                        </div>
                      )}
                    </div>
                    <div className="broker-search-result-card-content">
                      <h3 className="broker-search-result-title">{property.title}</h3>
                      <div className="broker-search-result-meta">
                        <span className="broker-search-result-badge">{property.propertyType}</span>
                        <span className="broker-search-result-badge">{property.buildingType}</span>
                        {property.status && (
                          <span className="broker-search-result-badge">{property.status}</span>
                        )}
                      </div>
                      <div className="broker-search-result-card-body">
                        <div className="broker-search-result-field">
                          <FiMapPin className="broker-search-result-field-icon" />
                          <span>{[property.locality, property.city, property.state].filter(Boolean).join(', ')}</span>
                        </div>
                        {property.price && (
                          <div className="broker-search-result-field">
                            <FiDollarSign className="broker-search-result-field-icon" />
                            <span>{formatPrice(property.price)}</span>
                          </div>
                        )}
                        {property.area && (
                          <div className="broker-search-result-field">
                            <span>{property.area} {property.areaUnit || 'sqft'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Leads Section */}
          {results.leads.length > 0 && (
            <section className="broker-search-section">
              <h2 className="broker-search-section-title">
                <FiBriefcase className="broker-search-section-icon" />
                Leads ({results.leads.length})
              </h2>
              <div className="broker-search-results-grid">
                {results.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="broker-search-result-card"
                    onClick={() => handleLeadClick(lead.id)}
                  >
                    <div className="broker-search-result-card-header">
                      <div className="broker-search-result-avatar-placeholder">
                        <FiBriefcase />
                      </div>
                      <div className="broker-search-result-card-info">
                        <h3 className="broker-search-result-title">{lead.fullName}</h3>
                        <div className="broker-search-result-meta">
                          <span className="broker-search-result-badge">{lead.status || 'new'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="broker-search-result-card-body">
                      <div className="broker-search-result-field">
                        <FiMail className="broker-search-result-field-icon" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="broker-search-result-field">
                          <FiPhone className="broker-search-result-field-icon" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.city && (
                        <div className="broker-search-result-field">
                          <FiMapPin className="broker-search-result-field-icon" />
                          <span>{lead.city}</span>
                        </div>
                      )}
                      {lead.propertyInterest && (
                        <div className="broker-search-result-field">
                          <FiHome className="broker-search-result-field-icon" />
                          <span>{lead.propertyInterest}</span>
                        </div>
                      )}
                      <div className="broker-search-result-field">
                        <span className="broker-search-result-date">Created: {formatDate(lead.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

