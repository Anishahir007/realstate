import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';

export default function PremiumContact({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx?.site || {};
  const broker = site?.broker || {};
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  return (
    <div className="premium-page">
      <div className="premium-page-header">
        <h1 className="premium-page-title">Contact Us</h1>
        <p className="premium-page-subtitle">Get in touch with us for any inquiries</p>
      </div>
      <div className="premium-contact-content">
        <div className="premium-contact-info">
          <h2>Contact Information</h2>
          {broker.full_name && (
            <div className="premium-contact-item">
              <strong>Name:</strong> {broker.full_name}
            </div>
          )}
          {broker.email && (
            <div className="premium-contact-item">
              <strong>Email:</strong> <a href={`mailto:${broker.email}`}>{broker.email}</a>
            </div>
          )}
          {broker.phone && (
            <div className="premium-contact-item">
              <strong>Phone:</strong> <a href={`tel:${broker.phone}`}>{broker.phone}</a>
            </div>
          )}
        </div>
        <form className="premium-contact-form" onSubmit={handleSubmit}>
          <div className="premium-form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="premium-form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="premium-form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="premium-form-group">
            <label>Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={5}
              required
            />
          </div>
          <button type="submit" className="premium-submit-btn">Send Message</button>
        </form>
      </div>
    </div>
  );
}

