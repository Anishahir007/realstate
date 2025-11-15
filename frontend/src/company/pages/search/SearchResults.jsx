import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCompany } from '../../../context/CompanyContext.jsx';
import { FiSearch, FiHome, FiBriefcase, FiMail, FiPhone, FiMapPin, FiDollarSign } from 'react-icons/fi';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const company = useCompany();
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
        const { data } = await axios.get(`${company.apiBase}/api/search/company`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${company.token}` },
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
  }, [query, company]);

  const handlePropertyClick = (propertyId) => {
    navigate(`/company/properties?highlight=${propertyId}`);
  };

  const handleLeadClick = (leadId) => {
    navigate(`/company/crm/lead/${leadId}`);
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
      <div className="company-search-results-container">
        <div className="company-search-results-header">
          <h1>Search Results</h1>
          <div className="company-search-query">Searching for: "{query}"</div>
        </div>
        <div className="company-search-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="company-search-results-container">
        <div className="company-search-results-header">
          <h1>Search Results</h1>
          <div className="company-search-query">Searching for: "{query}"</div>
        </div>
        <div className="company-search-error">{error}</div>
      </div>
    );
  }

  const totalResults = results.properties.length + results.leads.length;

  return (
    <div className="company-search-results-container">
      <div className="company-search-results-header">
        <h1>Search Results</h1>
        <div className="company-search-query">
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
        <div className="company-search-empty">
          <FiSearch className="company-search-empty-icon" />
          <p>Try searching with different keywords</p>
        </div>
      ) : (
        <div className="company-search-results-content">
          {/* Properties Section */}
          {results.properties.length > 0 && (
            <section className="company-search-section">
              <h2 className="company-search-section-title">
                <FiHome className="company-search-section-icon" />
                Properties ({results.properties.length})
              </h2>
              <div className="company-search-results-grid">
                {results.properties.map((property) => (
                  <div
                    key={property.id}
                    className="company-search-result-card company-search-result-card-property"
                    onClick={() => handlePropertyClick(property.id)}
                  >
                    <div className="company-search-result-card-image">
                      {property.image ? (
                        <img
                          src={property.image.startsWith('http') ? property.image : `${company.apiBase}${property.image}`}
                          alt={property.title}
                        />
                      ) : (
                        <div className="company-search-result-card-image-placeholder">
                          <FiHome />
                        </div>
                      )}
                    </div>
                    <div className="company-search-result-card-content">
                      <h3 className="company-search-result-title">{property.title}</h3>
                      <div className="company-search-result-meta">
                        <span className="company-search-result-badge">{property.propertyType}</span>
                        <span className="company-search-result-badge">{property.buildingType}</span>
                        {property.status && (
                          <span className="company-search-result-badge">{property.status}</span>
                        )}
                      </div>
                      <div className="company-search-result-card-body">
                        <div className="company-search-result-field">
                          <FiMapPin className="company-search-result-field-icon" />
                          <span>{[property.locality, property.city, property.state].filter(Boolean).join(', ')}</span>
                        </div>
                        {property.price && (
                          <div className="company-search-result-field">
                            <FiDollarSign className="company-search-result-field-icon" />
                            <span>{formatPrice(property.price)}</span>
                          </div>
                        )}
                        {property.area && (
                          <div className="company-search-result-field">
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
            <section className="company-search-section">
              <h2 className="company-search-section-title">
                <FiBriefcase className="company-search-section-icon" />
                Leads ({results.leads.length})
              </h2>
              <div className="company-search-results-grid">
                {results.leads.map((lead) => (
                  <div
                    key={lead.id}
                    className="company-search-result-card"
                    onClick={() => handleLeadClick(lead.id)}
                  >
                    <div className="company-search-result-card-header">
                      <div className="company-search-result-avatar-placeholder">
                        <FiBriefcase />
                      </div>
                      <div className="company-search-result-card-info">
                        <h3 className="company-search-result-title">{lead.fullName}</h3>
                        <div className="company-search-result-meta">
                          <span className="company-search-result-badge">{lead.status || 'new'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="company-search-result-card-body">
                      <div className="company-search-result-field">
                        <FiMail className="company-search-result-field-icon" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="company-search-result-field">
                          <FiPhone className="company-search-result-field-icon" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.city && (
                        <div className="company-search-result-field">
                          <FiMapPin className="company-search-result-field-icon" />
                          <span>{lead.city}</span>
                        </div>
                      )}
                      {lead.propertyInterest && (
                        <div className="company-search-result-field">
                          <FiHome className="company-search-result-field-icon" />
                          <span>{lead.propertyInterest}</span>
                        </div>
                      )}
                      <div className="company-search-result-field">
                        <span className="company-search-result-date">Created: {formatDate(lead.createdAt)}</span>
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

