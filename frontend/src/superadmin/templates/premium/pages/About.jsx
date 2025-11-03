import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { getApiBase } from '../../../../utils/apiBase.js';

export default function PremiumAbout({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx?.site || {};
  const broker = site?.broker || {};
  
  let brokerPhoto = '';
  if (broker.photo) {
    const isHttp = broker.photo.startsWith('http://') || broker.photo.startsWith('https://');
    const baseApi = getApiBase();
    brokerPhoto = isHttp ? broker.photo : `${baseApi}${broker.photo.startsWith('/') ? broker.photo : `/${broker.photo}`}`;
  }

  return (
    <div className="premium-page">
      <div className="premium-page-header">
        <h1 className="premium-page-title">About Us</h1>
      </div>
      <div className="premium-about-content">
        {brokerPhoto && (
          <div className="premium-about-image">
            <img src={brokerPhoto} alt={broker.full_name || 'Broker'} />
          </div>
        )}
        <div className="premium-about-text">
          <h2>{broker.full_name || 'Real Estate Professionals'}</h2>
          <p>
            We are dedicated to helping you find the perfect property that meets your needs and exceeds your expectations.
            With years of experience in the real estate industry, we provide exceptional service and personalized attention
            to every client.
          </p>
          {broker.email && (
            <p>
              <strong>Email:</strong> {broker.email}
            </p>
          )}
          {broker.phone && (
            <p>
              <strong>Phone:</strong> {broker.phone}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

