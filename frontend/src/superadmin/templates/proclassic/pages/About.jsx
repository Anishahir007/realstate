import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { FiSun, FiTarget, FiAward } from 'react-icons/fi';
import { getApiBase } from '../../../../utils/apiBase.js';
import './about.css';

export default function ProClassicAbout({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const { slug } = useParams();
  const [aboutUs, setAboutUs] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = getApiBase() || '';

  useEffect(() => {
    async function fetchAboutUs() {
      try {
        setLoading(true);
        const siteSlug = slug || site.slug;
        if (!siteSlug) {
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiBase}/api/templates/site/${siteSlug}/about-us`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setAboutUs(result.data);
          }
        }
      } catch (err) {
        console.error('Error fetching About Us:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchAboutUs();
  }, [slug, site.slug, apiBase]);

  if (loading) {
    return (
      <div className="pc-about">
        <div className="pc-about-loading">Loading...</div>
      </div>
    );
  }

  // Fallback content if no About Us data
  if (!aboutUs || (!aboutUs.title && !aboutUs.description)) {
    const name = site?.broker?.full_name || site?.broker?.company_name || 'Our Brokerage';
    return (
      <div className="pc-about">
        <div className="pc-about-container">
          <h1 className="pc-about-title">About Us</h1>
          <p className="pc-about-description">
            We help clients buy and sell properties with transparency and speed. Meet {name} and explore our portfolio.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="pc-about">
      <div className="pc-about-container">
        {aboutUs.title && (
          <h1 className="pc-about-title">{aboutUs.title}</h1>
        )}
        {aboutUs.subtitle && (
          <p className="pc-about-subtitle">{aboutUs.subtitle}</p>
        )}
        
        {aboutUs.images && aboutUs.images.length > 0 && (
          <div className="pc-about-images">
            {aboutUs.images
              .sort((a, b) => (a.position || 0) - (b.position || 0))
              .map((image, index) => (
                <div key={image.id || index} className="pc-about-image-wrapper">
                  <img 
                    src={image.image_url} 
                    alt={image.caption || `About Us ${index + 1}`}
                    className="pc-about-image"
                  />
                  {image.caption && (
                    <p className="pc-about-image-caption">{image.caption}</p>
                  )}
                </div>
              ))}
          </div>
        )}

        {aboutUs.description && (
          <div className="pc-about-section">
            <h2 className="pc-about-section-title">Our Story</h2>
            <p className="pc-about-text">{aboutUs.description}</p>
          </div>
        )}

        {(aboutUs.mission || aboutUs.vision || aboutUs.values) && (
          <div className="pc-about-vmv">
            {aboutUs.vision && (
              <div className="pc-about-vmv-card pc-about-vision-card">
                <div className="pc-about-vmv-header">
                  <div className="pc-about-vmv-icon pc-about-vision-icon">
                    <FiSun />
                  </div>
                  <h3 className="pc-about-vmv-title">Our Vision</h3>
                </div>
                <div className="pc-about-vmv-content">
                  <blockquote className="pc-about-vision-quote">{aboutUs.vision}</blockquote>
                </div>
              </div>
            )}
            {aboutUs.mission && (
              <div className="pc-about-vmv-card pc-about-mission-card">
                <div className="pc-about-vmv-header">
                  <div className="pc-about-vmv-icon pc-about-mission-icon">
                    <FiTarget />
                  </div>
                  <h3 className="pc-about-vmv-title">Our Mission</h3>
                </div>
                <div className="pc-about-vmv-content">
                  <div className="pc-about-mission-list">
                    {aboutUs.mission.split('\n').filter(line => line.trim()).map((line, index) => (
                      <div key={index} className="pc-about-mission-item">
                        <span className="pc-about-mission-bullet">•</span>
                        <span>{line.trim()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {aboutUs.values && (
              <div className="pc-about-vmv-card pc-about-values-card">
                <div className="pc-about-vmv-header">
                  <div className="pc-about-vmv-icon pc-about-values-icon">
                    <FiAward />
                  </div>
                  <h3 className="pc-about-vmv-title">Our Core Values</h3>
                </div>
                <div className="pc-about-vmv-content">
                  <div className="pc-about-values-list">
                    {aboutUs.values.split('\n').filter(line => line.trim()).map((line, index) => {
                      // Check if line starts with a number or has a pattern like "1. Value Name: Description"
                      const match = line.trim().match(/^(\d+)\.\s*(.+?)(?:\s*:\s*(.+))?$/);
                      if (match) {
                        const [, num, name, desc] = match;
                        return (
                          <div key={index} className="pc-about-value-item">
                            <div className="pc-about-value-number">{num}</div>
                            <div className="pc-about-value-content">
                              <strong className="pc-about-value-name">{name}</strong>
                              {desc && <span className="pc-about-value-desc">: {desc}</span>}
                            </div>
                          </div>
                        );
                      }
                      // If no numbered format, just show as bullet
                      return (
                        <div key={index} className="pc-about-value-item">
                          <div className="pc-about-value-number">{index + 1}</div>
                          <div className="pc-about-value-content">
                            <span>{line.trim()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
