import React, { useState } from 'react';
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
    property_interest: 'Buy a Property',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' | 'error' | null
  
  const apiBase = getApiBase() || window.location.origin;
  const tenantDb = site?.tenant_db || ctx.tenant_db;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSubmitStatus(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (tenantDb) {
        headers['x-tenant-db'] = tenantDb;
      }

      const response = await fetch(`${apiBase}/api/leads/public`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          property_interest: formData.property_interest,
          message: formData.message,
          source: 'website'
        })
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          property_interest: 'Buy a Property',
          message: ''
        });
        // Reset status after 5 seconds
        setTimeout(() => setSubmitStatus(null), 5000);
      } else {
        const error = await response.json();
        setSubmitStatus('error');
        console.error('Lead submission error:', error);
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
            <select
              className="pc-input"
              name="property_interest"
              value={formData.property_interest}
              onChange={handleChange}
            >
              <option>Buy a Property</option>
              <option>Sell a Property</option>
              <option>General Query</option>
            </select>
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
                    property_interest: 'Buy a Property',
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


