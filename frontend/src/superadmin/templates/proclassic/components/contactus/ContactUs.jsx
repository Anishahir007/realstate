import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getApiBase } from '../../../../../utils/apiBase.js';
import './contactus.css';

export default function ContactUs({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const broker = site?.broker || {};
  const name = broker?.full_name || 'Broker';
  const email = broker?.email || '';
  const phone = broker?.phone || '';
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    property_interest: '',
    city: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  
  const apiBase = getApiBase() || '';
  // Try multiple ways to get tenant_db
  const tenantDb = site?.tenant_db || 
                   site?.broker?.tenant_db || 
                   ctx.site?.tenant_db || 
                   ctx.site?.broker?.tenant_db ||
                   ctx.tenant_db;
  
  // Debug log
  useEffect(() => {
    console.log('ContactUs Debug:', {
      tenantDb,
      apiBase,
      site: site ? { ...site, broker: site.broker ? 'exists' : 'missing' } : 'missing',
      ctxSite: ctx.site ? { ...ctx.site, broker: ctx.site.broker ? 'exists' : 'missing' } : 'missing',
      ctxTenantDb: ctx.tenant_db
    });
  }, [tenantDb, apiBase, site, ctx]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if tenantDb is available
    if (!tenantDb) {
      setSubmitStatus('error');
      console.error('ContactUs - tenantDb is missing. Cannot submit lead without tenant database.');
      return;
    }
    
    setLoading(true);
    setSubmitStatus(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-tenant-db': tenantDb
      };

      // Construct API URL properly
      const apiUrl = apiBase ? `${apiBase}/api/leads/public` : '/api/leads/public';
      
      console.log('Submitting lead to:', apiUrl, 'with tenant:', tenantDb);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          property_interest: formData.property_interest,
          city: formData.city,
          message: formData.message,
          source: 'website'
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus('success');
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          property_interest: '',
          city: '',
          message: ''
        });
        // Reset status after 5 seconds
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        // Try to parse error, but handle HTML responses
        let errorMessage = 'Failed to submit. Please try again.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          } else {
            const text = await response.text();
            console.error('Non-JSON error response:', text.substring(0, 200));
            errorMessage = `Server error (${response.status}). Please check your connection.`;
          }
        } catch (parseErr) {
          console.error('Error parsing response:', parseErr);
        }
        setSubmitStatus('error');
        console.error('Lead submission error:', errorMessage);
      }
    } catch (err) {
      setSubmitStatus('error');
      console.error('Lead submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pc-contact">
      <div className="pc-contact__crumbs">
        <span>Home</span>
        <span>›</span>
        <span>Contact Us</span>
      </div>
      <div className="pc-contact__wrap">
        <aside className="pc-contact__aside">
          <h3 className="pc-contact__title">{name}</h3>
          {phone ? (
            <div className="pc-contact__row">📞 <a href={`tel:${phone}`}>{phone}</a></div>
          ) : null}
          {email ? (
            <div className="pc-contact__row">✉️ <a href={`mailto:${email}`}>{email}</a></div>
          ) : null}
        </aside>
        <section className="pc-contact__form">
          <h3 className="pc-contact__heading">Send us a Message</h3>
          {submitStatus === 'success' && (
            <div className="pc-contact__success">
              ✓ Thank you! We have received your message and will get back to you soon.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="pc-contact__error">
              ✗ Something went wrong. Please try again or contact us directly.
            </div>
          )}
          <form onSubmit={handleSubmit} className="pc-contact__grid">
            <input
              className="pc-input"
              name="full_name"
              placeholder="Your Name"
              value={formData.full_name}
              onChange={handleChange}
              required
            />
            <input
              className="pc-input"
              name="email"
              placeholder="Email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              className="pc-input"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />
            <input
              className="pc-input"
              name="property_interest"
              placeholder="Property Interest (e.g., Buy a Property, Sell a Property, General Query)"
              value={formData.property_interest}
              onChange={handleChange}
            />
            <input
              className="pc-input"
              name="city"
              placeholder="Location / City"
              value={formData.city}
              onChange={handleChange}
            />
            <textarea
              className="pc-textarea"
              name="message"
              rows={5}
              placeholder="Your Requirement"
              value={formData.message}
              onChange={handleChange}
            />
            <div className="pc-actions">
              <button
                type="submit"
                className="pc-btn pc-btn--primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
              <button
                type="button"
                className="pc-btn"
                onClick={(e) => {
                  e.preventDefault();
                  setFormData({
                    full_name: '',
                    email: '',
                    phone: '',
                    property_interest: '',
                    city: '',
                    message: ''
                  });
                  setSubmitStatus(null);
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


