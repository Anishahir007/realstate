import React, { useState } from 'react';
import { getApiBase } from '../../../../../utils/apiBase.js';
import './findProperty.css';

export default function EnquiryModal({ property, site, tenantDb, onClose }) {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  
  const apiBase = getApiBase() || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tenantDb) {
      setSubmitStatus('error');
      console.error('EnquiryModal - tenantDb is missing');
      return;
    }
    
    setLoading(true);
    setSubmitStatus(null);

    try {
      const headers = {
        'Content-Type': 'application/json',
        'x-tenant-db': tenantDb
      };

      const apiUrl = apiBase ? `${apiBase}/api/leads/public` : '/api/leads/public';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          full_name: formData.full_name,
          email: formData.email,
          phone: formData.phone,
          property_interest: `Enquiry for: ${property.title || 'Property'}`,
          message: formData.message || `Interested in property: ${property.title || 'Property'} (ID: ${property.id})`,
          source: 'property_enquiry',
          city: property.city || ''
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSubmitStatus('success');
        setFormData({ full_name: '', email: '', phone: '', message: '' });
        setTimeout(() => {
          onClose();
          setSubmitStatus(null);
        }, 2000);
      } else {
        let errorMessage = 'Failed to submit. Please try again.';
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            errorMessage = error.message || errorMessage;
          }
        } catch (parseErr) {
          console.error('Error parsing response:', parseErr);
        }
        setSubmitStatus('error');
        console.error('Enquiry submission error:', errorMessage);
      }
    } catch (err) {
      setSubmitStatus('error');
      console.error('Enquiry submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pc-enquiry-modal-overlay" onClick={onClose}>
      <div className="pc-enquiry-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pc-enquiry-modal-header">
          <h3>Send Enquiry</h3>
          <button className="pc-enquiry-close" onClick={onClose}>×</button>
        </div>
        
        <div className="pc-enquiry-property-info">
          <strong>Property:</strong> {property.title || 'Property'}
          {property.id && <span className="pc-enquiry-property-id"> (ID: REI{property.id})</span>}
        </div>

        {submitStatus === 'success' && (
          <div className="pc-enquiry-success">
            ✓ Thank you! We have received your enquiry and will get back to you soon.
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="pc-enquiry-error">
            ✗ Something went wrong. Please try again or contact us directly.
          </div>
        )}

        <form onSubmit={handleSubmit} className="pc-enquiry-form">
          <input
            type="text"
            name="full_name"
            className="pc-enquiry-input"
            placeholder="Your Name"
            value={formData.full_name}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            className="pc-enquiry-input"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="phone"
            className="pc-enquiry-input"
            placeholder="Phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
          <textarea
            name="message"
            className="pc-enquiry-textarea"
            rows={4}
            placeholder="Your Message (Optional)"
            value={formData.message}
            onChange={handleChange}
          />
          <div className="pc-enquiry-actions">
            <button type="submit" className="pc-enquiry-btn pc-enquiry-btn--submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Enquiry'}
            </button>
            <button type="button" className="pc-enquiry-btn pc-enquiry-btn--cancel" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

