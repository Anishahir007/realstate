import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import { FiSearch, FiUser, FiHome, FiBriefcase, FiMail, FiPhone, FiMapPin, FiDollarSign } from 'react-icons/fi';
import './SearchResults.css';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const superAdmin = useSuperAdmin();
  const navigate = useNavigate();
  const [results, setResults] = useState({ brokers: [], properties: [], leads: [] });
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
        const { data } = await axios.get(`${superAdmin.apiBase}/api/search/superadmin`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${superAdmin.token}` },
        });
        setResults(data.data || { brokers: [], properties: [], leads: [] });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Search error:', err);
        setError('Failed to load search results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, superAdmin]);

  const handleBrokerClick = (brokerId) => {
    navigate(`/superadmin/brokers?highlight=${brokerId}`);
  };

  const handlePropertyClick = (property) => {
    navigate(`/superadmin/properties?highlight=${property.id}&brokerId=${property.brokerId}&tenantDb=${property.tenantDb}`);
  };

  const handleLeadClick = (lead) => {
    if (lead.source === 'main') {
      navigate(`/superadmin/crm/lead/${lead.id}/main`);
    } else {
      navigate(`/superadmin/crm/lead/${lead.id}/broker`);
    }
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
      <div className="search-results-container">
        <div className="search-results-header">
          <h1>Search Results</h1>
          <div className="search-query">Searching for: "{query}"</div>
        </div>
        <div className="search-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="search-results-container">
        <div className="search-results-header">
          <h1>Search Results</h1>
          <div className="search-query">Searching for: "{query}"</div>
        </div>
        <div className="search-error">{error}</div>
      </div>
    );
  }

  const totalResults = results.brokers.length + results.properties.length + results.leads.length;

  return (
    <div className="search-results-container">
      <div className="search-results-header">
        <h1>Search Results</h1>
        <div className="search-query">
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
        <div className="search-empty">
          <FiSearch className="search-empty-icon" />
          <p>Try searching with different keywords</p>
        </div>
      ) : (
        <div className="search-results-content">
          {/* Brokers Section */}
          {results.brokers.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <FiUser className="search-section-icon" />
                Brokers ({results.brokers.length})
              </h2>
              <div className="search-results-grid">
                {results.brokers.map((broker) => (
                  <div
                    key={broker.id}
                    className="search-result-card"
                    onClick={() => handleBrokerClick(broker.id)}
                  >
                    <div className="search-result-card-header">
                      {broker.photo ? (
                        <img
                          src={broker.photo.startsWith('http') ? broker.photo : `${superAdmin.apiBase}${broker.photo}`}
                          alt={broker.name}
                          className="search-result-avatar"
                        />
                      ) : (
                        <div className="search-result-avatar-placeholder">
                          <FiUser />
                        </div>
                      )}
                      <div className="search-result-card-info">
                        <h3 className="search-result-title">{broker.name}</h3>
                        <div className="search-result-meta">
                          <span className="search-result-badge">{broker.status || 'pending'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="search-result-card-body">
                      <div className="search-result-field">
                        <FiMail className="search-result-field-icon" />
                        <span>{broker.email}</span>
                      </div>
                      {broker.phone && (
                        <div className="search-result-field">
                          <FiPhone className="search-result-field-icon" />
                          <span>{broker.phone}</span>
                        </div>
                      )}
                      {broker.companyName && (
                        <div className="search-result-field">
                          <FiBriefcase className="search-result-field-icon" />
                          <span>{broker.companyName}</span>
                        </div>
                      )}
                      {broker.location && (
                        <div className="search-result-field">
                          <FiMapPin className="search-result-field-icon" />
                          <span>{broker.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Properties Section */}
          {results.properties.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <FiHome className="search-section-icon" />
                Properties ({results.properties.length})
              </h2>
              <div className="search-results-grid">
                {results.properties.map((property) => (
                  <div
                    key={`${property.brokerId}-${property.id}`}
                    className="search-result-card search-result-card-property"
                    onClick={() => handlePropertyClick(property)}
                  >
                    <div className="search-result-card-image">
                      {property.image ? (
                        <img
                          src={property.image.startsWith('http') ? property.image : `${superAdmin.apiBase}${property.image}`}
                          alt={property.title}
                        />
                      ) : (
                        <div className="search-result-card-image-placeholder">
                          <FiHome />
                        </div>
                      )}
                    </div>
                    <div className="search-result-card-content">
                      <h3 className="search-result-title">{property.title}</h3>
                      <div className="search-result-meta">
                        <span className="search-result-badge">{property.propertyType}</span>
                        <span className="search-result-badge">{property.buildingType}</span>
                        {property.status && (
                          <span className="search-result-badge">{property.status}</span>
                        )}
                      </div>
                      <div className="search-result-card-body">
                        <div className="search-result-field">
                          <FiMapPin className="search-result-field-icon" />
                          <span>{[property.locality, property.city, property.state].filter(Boolean).join(', ')}</span>
                        </div>
                        {property.price && (
                          <div className="search-result-field">
                            <FiDollarSign className="search-result-field-icon" />
                            <span>{formatPrice(property.price)}</span>
                          </div>
                        )}
                        {property.area && (
                          <div className="search-result-field">
                            <span>{property.area} {property.areaUnit || 'sqft'}</span>
                          </div>
                        )}
                        <div className="search-result-field">
                          <span className="search-result-broker">Broker: {property.brokerName}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Leads Section */}
          {results.leads.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <FiBriefcase className="search-section-icon" />
                Leads ({results.leads.length})
              </h2>
              <div className="search-results-grid">
                {results.leads.map((lead) => (
                  <div
                    key={`${lead.source}-${lead.id}`}
                    className="search-result-card"
                    onClick={() => handleLeadClick(lead)}
                  >
                    <div className="search-result-card-header">
                      <div className="search-result-avatar-placeholder">
                        <FiUser />
                      </div>
                      <div className="search-result-card-info">
                        <h3 className="search-result-title">{lead.fullName}</h3>
                        <div className="search-result-meta">
                          <span className="search-result-badge">{lead.status || 'new'}</span>
                          <span className="search-result-badge">{lead.source}</span>
                        </div>
                      </div>
                    </div>
                    <div className="search-result-card-body">
                      <div className="search-result-field">
                        <FiMail className="search-result-field-icon" />
                        <span>{lead.email}</span>
                      </div>
                      {lead.phone && (
                        <div className="search-result-field">
                          <FiPhone className="search-result-field-icon" />
                          <span>{lead.phone}</span>
                        </div>
                      )}
                      {lead.city && (
                        <div className="search-result-field">
                          <FiMapPin className="search-result-field-icon" />
                          <span>{lead.city}</span>
                        </div>
                      )}
                      {lead.propertyInterest && (
                        <div className="search-result-field">
                          <FiHome className="search-result-field-icon" />
                          <span>{lead.propertyInterest}</span>
                        </div>
                      )}
                      {lead.brokerName && lead.source === 'broker' && (
                        <div className="search-result-field">
                          <span className="search-result-broker">Broker: {lead.brokerName}</span>
                        </div>
                      )}
                      <div className="search-result-field">
                        <span className="search-result-date">Created: {formatDate(lead.createdAt)}</span>
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

