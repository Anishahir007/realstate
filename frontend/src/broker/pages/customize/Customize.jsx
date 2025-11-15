import React, { useState, useEffect } from 'react';
import { useBroker } from '../../../context/BrokerContext.jsx';
import axios from 'axios';
import { FiUpload, FiTrash2, FiEdit2, FiArrowUp, FiArrowDown, FiImage, FiX, FiEye, FiChevronDown, FiChevronUp, FiSun, FiTarget, FiAward } from 'react-icons/fi';
import './customize.css';
import '../../../superadmin/templates/proclassic/pages/about.css';

export default function Customize() {
  const broker = useBroker();
  const apiBase = broker?.apiBase || '';
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [siteSlug, setSiteSlug] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [newPosition, setNewPosition] = useState('');
  const [bannerWidth, setBannerWidth] = useState('');
  const [bannerHeight, setBannerHeight] = useState('');
  const [logo, setLogo] = useState(null);
  const [logoLoading, setLogoLoading] = useState(true);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoPreview, setShowLogoPreview] = useState(false);
  const [logoWidth, setLogoWidth] = useState('');
  const [logoHeight, setLogoHeight] = useState('');
  const [aboutUs, setAboutUs] = useState(null);
  const [aboutUsLoading, setAboutUsLoading] = useState(true);
  const [aboutUsSaving, setAboutUsSaving] = useState(false);
  const [showAboutUsPreview, setShowAboutUsPreview] = useState(false);
  const [showAboutUsSection, setShowAboutUsSection] = useState(false);
  const [showLogoSection, setShowLogoSection] = useState(false);
  const [showBannerSection, setShowBannerSection] = useState(false);

  // Get site slug
  useEffect(() => {
    async function fetchSiteSlug() {
      try {
        const { data } = await axios.get(`${apiBase}/api/templates/my-sites`, {
          headers: { Authorization: `Bearer ${broker?.token}` }
        });
        if (data?.data && data.data.length > 0) {
          setSiteSlug(data.data[0].slug);
        }
      } catch (err) {
        console.error('Error fetching site:', err);
      }
    }
    if (broker?.token) {
      fetchSiteSlug();
    }
  }, [broker?.token, apiBase]);

  // Fetch banners
  useEffect(() => {
    async function fetchBanners() {
      if (!broker?.token) return;
      try {
        setLoading(true);
        const getEndpoint = siteSlug ? `${apiBase}/api/templates/hero-banners/${siteSlug}` : `${apiBase}/api/templates/hero-banners`;
        const { data } = await axios.get(getEndpoint, {
          headers: { Authorization: `Bearer ${broker?.token}` }
        });
        if (data?.data) {
          setBanners(data.data);
          // If all banners have same dimensions, populate inputs
          if (data.data.length > 0) {
            const firstBanner = data.data[0];
            const allSame = data.data.every(b => 
              b.width === firstBanner.width && b.height === firstBanner.height
            );
            if (allSame && (firstBanner.width || firstBanner.height)) {
              setBannerWidth(firstBanner.width || '');
              setBannerHeight(firstBanner.height ? String(firstBanner.height) : '');
            }
          }
        }
      } catch (err) {
        console.error('Error fetching banners:', err);
      } finally {
        setLoading(false);
      }
    }
    if (broker?.token) {
      fetchBanners();
    }
  }, [siteSlug, broker?.token, apiBase]);

  // Fetch logo
  useEffect(() => {
    async function fetchLogo() {
      if (!broker?.token) return;
      try {
        setLogoLoading(true);
        const getEndpoint = siteSlug ? `${apiBase}/api/templates/logo/${siteSlug}` : `${apiBase}/api/templates/logo`;
        const { data } = await axios.get(getEndpoint, {
          headers: { Authorization: `Bearer ${broker?.token}` }
        });
        if (data?.data) {
          setLogo(data.data);
          setLogoWidth(data.data.width || '');
          setLogoHeight(data.data.height || '');
        }
      } catch (err) {
        console.error('Error fetching logo:', err);
      } finally {
        setLogoLoading(false);
      }
    }
    if (broker?.token) {
      fetchLogo();
    }
  }, [siteSlug, broker?.token, apiBase]);

  // Fetch About Us
  useEffect(() => {
    async function fetchAboutUs() {
      if (!broker?.token) return;
      try {
        setAboutUsLoading(true);
        const getEndpoint = siteSlug ? `${apiBase}/api/templates/about-us/${siteSlug}` : `${apiBase}/api/templates/about-us`;
        const { data } = await axios.get(getEndpoint, {
          headers: { Authorization: `Bearer ${broker?.token}` }
        });
        if (data?.data) {
          setAboutUs(data.data);
        }
      } catch (err) {
        console.error('Error fetching About Us:', err);
      } finally {
        setAboutUsLoading(false);
      }
    }
    if (broker?.token) {
      fetchAboutUs();
    }
  }, [siteSlug, broker?.token, apiBase]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('position', String(banners.length + 1));
      // Apply saved dimensions if available
      if (bannerWidth) formData.append('width', bannerWidth);
      if (bannerHeight) formData.append('height', bannerHeight);

      const endpoint = siteSlug ? `${apiBase}/api/templates/hero-banners/${siteSlug}` : `${apiBase}/api/templates/hero-banners`;
      const { data } = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${broker?.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data?.data) {
        setBanners([...banners, data.data]);
      }
      e.target.value = ''; // Reset input
    } catch (err) {
      console.error('Error uploading banner:', err);
      alert(err.response?.data?.message || 'Failed to upload banner');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;

    try {
      const deleteEndpoint = siteSlug ? `${apiBase}/api/templates/hero-banners/${siteSlug}/${bannerId}` : `${apiBase}/api/templates/hero-banners/${bannerId}`;
      await axios.delete(deleteEndpoint, {
        headers: { Authorization: `Bearer ${broker?.token}` }
      });
      setBanners(banners.filter(b => b.id !== bannerId));
    } catch (err) {
      console.error('Error deleting banner:', err);
      alert(err.response?.data?.message || 'Failed to delete banner');
    }
  };

  const handlePositionChange = async (bannerId, newPos) => {
    try {
      const updateEndpoint = siteSlug ? `${apiBase}/api/templates/hero-banners/${siteSlug}/${bannerId}/position` : `${apiBase}/api/templates/hero-banners/${bannerId}/position`;
      await axios.put(updateEndpoint, 
        { position: newPos },
        { headers: { Authorization: `Bearer ${broker?.token}` } }
      );
      // Refresh banners
      const getEndpoint = siteSlug ? `${apiBase}/api/templates/hero-banners/${siteSlug}` : `${apiBase}/api/templates/hero-banners`;
      const { data } = await axios.get(getEndpoint, {
        headers: { Authorization: `Bearer ${broker?.token}` }
      });
      if (data?.data) {
        setBanners(data.data);
      }
      setEditingPosition(null);
    } catch (err) {
      console.error('Error updating position:', err);
      alert(err.response?.data?.message || 'Failed to update position');
    }
  };

  const moveBanner = async (bannerId, direction) => {
    const banner = banners.find(b => b.id === bannerId);
    if (!banner) return;

    const currentPos = banner.position || 0;
    const newPos = direction === 'up' ? currentPos - 1 : currentPos + 1;
    
    if (newPos < 1 || newPos > banners.length) return;

    // Swap positions
    const otherBanner = banners.find(b => (b.position || 0) === newPos);
    if (otherBanner) {
      await handlePositionChange(otherBanner.id, currentPos);
    }
    await handlePositionChange(bannerId, newPos);
  };

  const handleSaveAllBannerDimensions = async () => {
    if (banners.length === 0) {
      alert('No banners to update');
      return;
    }

    try {
      // Update all banners one by one
      const updatePromises = banners.map(banner => {
        const updateEndpoint = siteSlug 
          ? `${apiBase}/api/templates/hero-banners/${siteSlug}/${banner.id}/dimensions` 
          : `${apiBase}/api/templates/hero-banners/${banner.id}/dimensions`;
        return axios.put(updateEndpoint, 
          { 
            width: bannerWidth || null, 
            height: bannerHeight || null 
          },
          { headers: { Authorization: `Bearer ${broker?.token}` } }
        );
      });

      const results = await Promise.all(updatePromises);
      
      // Refresh banners list
      const getEndpoint = siteSlug ? `${apiBase}/api/templates/hero-banners/${siteSlug}` : `${apiBase}/api/templates/hero-banners`;
      const { data } = await axios.get(getEndpoint, {
        headers: { Authorization: `Bearer ${broker?.token}` }
      });
      
      if (data?.data) {
        setBanners(data.data);
        // Keep the values in inputs after saving
        // bannerWidth and bannerHeight already have the values
        alert('All banner dimensions saved successfully!');
      }
    } catch (err) {
      console.error('Error saving banner dimensions:', err);
      alert(err.response?.data?.message || 'Failed to save dimensions');
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    try {
      setLogoUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      if (logoWidth) formData.append('width', logoWidth);
      if (logoHeight) formData.append('height', logoHeight);

      const endpoint = siteSlug ? `${apiBase}/api/templates/logo/${siteSlug}` : `${apiBase}/api/templates/logo`;
      const { data } = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${broker?.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data?.data) {
        setLogo(data.data);
        setLogoWidth(data.data.width || '');
        setLogoHeight(data.data.height || '');
      }
      e.target.value = ''; // Reset input
    } catch (err) {
      console.error('Error uploading logo:', err);
      alert(err.response?.data?.message || 'Failed to upload logo');
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) return;

    try {
      const deleteEndpoint = siteSlug ? `${apiBase}/api/templates/logo/${siteSlug}` : `${apiBase}/api/templates/logo`;
      await axios.delete(deleteEndpoint, {
        headers: { Authorization: `Bearer ${broker?.token}` }
      });
      setLogo(null);
      setLogoWidth('');
      setLogoHeight('');
    } catch (err) {
      console.error('Error deleting logo:', err);
      alert(err.response?.data?.message || 'Failed to delete logo');
    }
  };

  const handleSaveDimensions = async () => {
    if (!logo) {
      alert('No logo to update');
      return;
    }

    try {
      const updateEndpoint = siteSlug 
        ? `${apiBase}/api/templates/logo/${siteSlug}/dimensions` 
        : `${apiBase}/api/templates/logo/dimensions`;
      const { data } = await axios.put(updateEndpoint, 
        { 
          width: logoWidth || null, 
          height: logoHeight || null 
        },
        { headers: { Authorization: `Bearer ${broker?.token}` } }
      );

      if (data?.data) {
        setLogo(data.data);
        setLogoWidth(data.data.width || '');
        setLogoHeight(data.data.height || '');
        alert('Dimensions saved successfully!');
      }
    } catch (err) {
      console.error('Error saving dimensions:', err);
      alert(err.response?.data?.message || 'Failed to save dimensions');
    }
  };

  // About Us handlers
  const handleAboutUsSave = async () => {
    if (!aboutUs) {
      alert('No content to save');
      return;
    }

    try {
      setAboutUsSaving(true);
      const updateEndpoint = siteSlug 
        ? `${apiBase}/api/templates/about-us/${siteSlug}` 
        : `${apiBase}/api/templates/about-us`;
      const updateData = {
        title: aboutUs.title || null,
        subtitle: aboutUs.subtitle || null,
        description: aboutUs.description || null,
        mission: aboutUs.mission || null,
        vision: aboutUs.vision || null,
        values: aboutUs.values || null
      };
      const { data } = await axios.put(updateEndpoint, updateData, {
        headers: { Authorization: `Bearer ${broker?.token}` }
      });
      if (data?.data) {
        setAboutUs(data.data);
        alert('About Us content saved successfully!');
      }
    } catch (err) {
      console.error('Error saving About Us:', err);
      alert(err.response?.data?.message || 'Failed to save About Us');
    } finally {
      setAboutUsSaving(false);
    }
  };


  const handleLogoResize = async () => {
    if (!logo) return;
    try {
      const formData = new FormData();
      if (logoWidth) formData.append('width', logoWidth);
      if (logoHeight) formData.append('height', logoHeight);

      const endpoint = siteSlug ? `${apiBase}/api/templates/logo/${siteSlug}` : `${apiBase}/api/templates/logo`;
      // For resize, we need to re-upload with new dimensions
      // Since we can't resize without re-uploading, we'll just update the stored dimensions
      // The actual resize would need to happen on the frontend or backend image processing
      alert('To resize logo, please upload a new image with desired dimensions. The width and height fields are stored for display purposes.');
    } catch (err) {
      console.error('Error updating logo size:', err);
    }
  };

  if (loading) {
    return (
      <div className="customize-root">
        <h2 className="customize-title">Hero Banner Management</h2>
        <div className="customize-content">Loading...</div>
      </div>
    );
  }

  if (!siteSlug) {
    return (
      <div className="customize-root">
        <h2 className="customize-title">Hero Banner Management</h2>
        <div className="customize-content">
          <p>No website found. Please publish a template first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="customize-root">
      <h2 className="customize-title">Website Customization</h2>
      <div className="customize-content">
        {/* About Us Section */}
        <div className="customize-dropdown-section">
          <div 
            className="customize-dropdown-header"
            onClick={() => setShowAboutUsSection(!showAboutUsSection)}
          >
            <h3>About Us</h3>
            {showAboutUsSection ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {showAboutUsSection && (
            <div className="customize-dropdown-content">
              <div className="customize-section">
                <div className="customize-section-header">
                  <h3>About Us Content</h3>
                  <button
                    className="customize-btn customize-btn-secondary"
                    onClick={() => setShowAboutUsPreview(!showAboutUsPreview)}
                    title="Toggle Preview"
                  >
                    <FiEye /> {showAboutUsPreview ? 'Hide Preview' : 'Show Preview'}
                  </button>
                </div>
                {showAboutUsPreview && (
                  <div className="customize-about-us-preview">
                    <div className="customize-preview-header">
                      <h4>Preview - How your About Us page will look:</h4>
                      <button
                        className="customize-preview-close"
                        onClick={() => setShowAboutUsPreview(false)}
                      >
                        <FiX />
                      </button>
                    </div>
                    <div className="customize-preview-content">
                      {aboutUs?.title && (
                        <h1 className="pc-about-title">{aboutUs.title}</h1>
                      )}
                      {aboutUs?.subtitle && (
                        <p className="pc-about-subtitle">{aboutUs.subtitle}</p>
                      )}
                      
                      {aboutUs?.description && (
                        <div className="pc-about-section">
                          <h2 className="pc-about-section-title">Our Story</h2>
                          <p className="pc-about-text">{aboutUs.description}</p>
                        </div>
                      )}

                      {(aboutUs?.mission || aboutUs?.vision || aboutUs?.values) && (
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

                      {(!aboutUs || (!aboutUs.title && !aboutUs.description)) && (
                        <div className="customize-preview-empty">
                          <p>No content added yet. Start adding content above to see the preview.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {aboutUsLoading ? (
                  <p>Loading...</p>
                ) : (
                  <div style={{ marginTop: '24px' }}>
                    <div className="customize-about-us-form">
                      <div className="customize-form-group">
                        <label>
                          Title:
                          <input
                            type="text"
                            value={aboutUs?.title || ''}
                            onChange={(e) => {
                              const updated = { ...aboutUs, title: e.target.value };
                              setAboutUs(updated);
                            }}
                            placeholder="Enter About Us title"
                            className="customize-text-input"
                          />
                        </label>
                      </div>
                      <div className="customize-form-group">
                        <label>
                          Subtitle:
                          <input
                            type="text"
                            value={aboutUs?.subtitle || ''}
                            onChange={(e) => {
                              const updated = { ...aboutUs, subtitle: e.target.value };
                              setAboutUs(updated);
                            }}
                            placeholder="Enter subtitle"
                            className="customize-text-input"
                          />
                        </label>
                      </div>
                      <div className="customize-form-group">
                        <label>
                          Description:
                          <textarea
                            value={aboutUs?.description || ''}
                            onChange={(e) => {
                              const updated = { ...aboutUs, description: e.target.value };
                              setAboutUs(updated);
                            }}
                            placeholder="Enter main description about your company/brokerage"
                            className="customize-textarea"
                            rows="5"
                          />
                        </label>
                      </div>
                      <div className="customize-form-group">
                        <label>
                          Mission:
                          <textarea
                            value={aboutUs?.mission || ''}
                            onChange={(e) => {
                              const updated = { ...aboutUs, mission: e.target.value };
                              setAboutUs(updated);
                            }}
                            placeholder="Enter your mission statement"
                            className="customize-textarea"
                            rows="3"
                          />
                        </label>
                      </div>
                      <div className="customize-form-group">
                        <label>
                          Vision:
                          <textarea
                            value={aboutUs?.vision || ''}
                            onChange={(e) => {
                              const updated = { ...aboutUs, vision: e.target.value };
                              setAboutUs(updated);
                            }}
                            placeholder="Enter your vision statement"
                            className="customize-textarea"
                            rows="3"
                          />
                        </label>
                      </div>
                      <div className="customize-form-group">
                        <label>
                          Values:
                          <textarea
                            value={aboutUs?.values || ''}
                            onChange={(e) => {
                              const updated = { ...aboutUs, values: e.target.value };
                              setAboutUs(updated);
                            }}
                            placeholder="Enter your core values"
                            className="customize-textarea"
                            rows="3"
                          />
                        </label>
                      </div>
                    </div>
                    <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className="customize-btn customize-btn-primary"
                        onClick={handleAboutUsSave}
                        disabled={aboutUsSaving}
                      >
                        {aboutUsSaving ? 'Saving...' : (aboutUs?.title || aboutUs?.description ? 'Update About Us' : 'Save About Us')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Logo Section */}
        <div className="customize-dropdown-section">
          <div 
            className="customize-dropdown-header"
            onClick={() => setShowLogoSection(!showLogoSection)}
          >
            <h3>Website Logo</h3>
            {showLogoSection ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {showLogoSection && (
            <div className="customize-dropdown-content">
              <div className="customize-section">
                <div className="customize-section-header">
                  <h3>Website Logo</h3>
            <label className="customize-upload-btn" htmlFor="logo-upload">
              <FiUpload /> {logo ? 'Update Logo' : 'Upload Logo'}
              <input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={logoUploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {logoUploading && <p className="customize-upload-status">Uploading...</p>}
          
          {logoLoading ? (
            <p>Loading logo...</p>
          ) : logo ? (
            <div className="customize-logo-container">
              <div className="customize-logo-preview-wrapper">
                <div className="customize-logo-preview">
                  <img 
                    src={logo.image_url} 
                    alt="Logo Preview" 
                    style={{
                      width: logo.width ? `${logo.width}px` : 'auto',
                      height: logo.height ? `${logo.height}px` : 'auto',
                      maxWidth: '200px',
                      maxHeight: '100px',
                      objectFit: 'contain'
                    }}
                  />
                  <button
                    className="customize-logo-preview-btn"
                    onClick={() => setShowLogoPreview(!showLogoPreview)}
                    title="Toggle Full Preview"
                  >
                    {showLogoPreview ? <FiX /> : <FiImage />}
                  </button>
                </div>
                {showLogoPreview && (
                  <div className="customize-logo-full-preview" onClick={() => setShowLogoPreview(false)}>
                    <div className="customize-logo-full-preview-content" onClick={(e) => e.stopPropagation()}>
                      <button className="customize-logo-close" onClick={() => setShowLogoPreview(false)}>
                        <FiX />
                      </button>
                      <img 
                        src={logo.image_url} 
                        alt="Logo Full Preview"
                        style={{
                          width: logo.width ? `${logo.width}px` : 'auto',
                          height: logo.height ? `${logo.height}px` : 'auto',
                          maxWidth: '90vw',
                          maxHeight: '90vh',
                          objectFit: 'contain'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="customize-logo-controls">
                <div className="customize-logo-size-inputs">
                  <label>
                    Width (px):
                    <input
                      type="number"
                      min="1"
                      value={logoWidth}
                      onChange={(e) => setLogoWidth(e.target.value)}
                      placeholder="Auto"
                      className="customize-size-input"
                    />
                  </label>
                  <label>
                    Height (px):
                    <input
                      type="number"
                      min="1"
                      value={logoHeight}
                      onChange={(e) => setLogoHeight(e.target.value)}
                      placeholder="Auto"
                      className="customize-size-input"
                    />
                  </label>
                </div>
                <div className="customize-logo-actions">
                  <button
                    className="customize-btn customize-btn-primary"
                    onClick={handleSaveDimensions}
                  >
                    <FiEdit2 /> Save Dimensions
                  </button>
                  <button
                    className="customize-btn customize-btn-danger"
                    onClick={handleLogoDelete}
                  >
                    <FiTrash2 /> Delete Logo
                  </button>
                </div>
                <p className="customize-logo-note">
                  Note: Width and height are stored for display. To resize, upload a new image with desired dimensions.
                </p>
              </div>
            </div>
          ) : (
            <div className="customize-empty">
              <FiImage size={48} />
              <p>No logo uploaded. Upload a logo to display it in the website navbar.</p>
            </div>
          )}
              </div>
            </div>
          )}
        </div>

        {/* Hero Banners Section */}
        <div className="customize-dropdown-section">
          <div 
            className="customize-dropdown-header"
            onClick={() => setShowBannerSection(!showBannerSection)}
          >
            <h3>Hero Banners</h3>
            {showBannerSection ? <FiChevronUp /> : <FiChevronDown />}
          </div>
          {showBannerSection && (
            <div className="customize-dropdown-content">
              <div className="customize-section">
          <div className="customize-section-header">
            <h3>Upload Hero Banner</h3>
            <label className="customize-upload-btn" htmlFor="banner-upload">
              <FiUpload /> Upload Banner
              <input
                id="banner-upload"
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </label>
          </div>
          {uploading && <p className="customize-upload-status">Uploading...</p>}
        </div>

        <div className="customize-section">
          <h3>Banner Dimensions (Apply to All)</h3>
          <div className="customize-banner-upload-dimensions">
            <div className="customize-banner-size-inputs">
              <label>
                Width (%):
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={bannerWidth}
                  onChange={(e) => setBannerWidth(e.target.value)}
                  placeholder="Auto"
                  className="customize-size-input"
                />
              </label>
              <label>
                Height (px):
                <input
                  type="number"
                  min="1"
                  value={bannerHeight}
                  onChange={(e) => setBannerHeight(e.target.value)}
                  placeholder="Auto"
                  className="customize-size-input"
                />
              </label>
            </div>
            <div className="customize-banner-dimensions-actions" style={{ marginTop: '12px' }}>
              <button
                className="customize-btn customize-btn-primary"
                onClick={handleSaveAllBannerDimensions}
                disabled={banners.length === 0}
              >
                <FiEdit2 /> Save Dimensions for All Banners
              </button>
            </div>
            <p className="customize-logo-note" style={{ marginTop: '8px', marginBottom: 0 }}>
              Set dimensions and click save to apply to all banners. Width in percentage (%), Height in pixels (px).
            </p>
          </div>
        </div>

        <div className="customize-section">
          <h3>Banners ({banners.length})</h3>
          {banners.length === 0 ? (
            <div className="customize-empty">
              <FiImage size={48} />
              <p>No banners uploaded yet. Upload your first banner above.</p>
            </div>
          ) : (
            <div className="customize-banners-grid">
              {banners.map((banner, index) => (
                <div key={banner.id} className="customize-banner-card">
                  <div className="customize-banner-image">
                    <img src={banner.image_url} alt={`Banner ${banner.position || index + 1}`} />
                  </div>
                  <div className="customize-banner-info">
                    <div className="customize-banner-position">
                      <span>Position: {banner.position || index + 1}</span>
                    </div>
                    <div className="customize-banner-dimensions-display">
                      {banner.width && <span>Width: {banner.width}%</span>}
                      {banner.height && <span>Height: {banner.height}px</span>}
                      {!banner.width && !banner.height && <span className="customize-dimension-placeholder">No dimensions set</span>}
                    </div>
                    <div className="customize-banner-actions">
                      <button
                        className="customize-btn customize-btn-icon"
                        onClick={() => moveBanner(banner.id, 'up')}
                        disabled={index === 0}
                        title="Move Up"
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        className="customize-btn customize-btn-icon"
                        onClick={() => moveBanner(banner.id, 'down')}
                        disabled={index === banners.length - 1}
                        title="Move Down"
                      >
                        <FiArrowDown />
                      </button>
                      {editingPosition === banner.id ? (
                        <div className="customize-position-edit">
                          <input
                            type="number"
                            min="1"
                            max={banners.length}
                            value={newPosition}
                            onChange={(e) => setNewPosition(e.target.value)}
                            className="customize-position-input"
                          />
                          <button
                            className="customize-btn customize-btn-small"
                            onClick={() => {
                              handlePositionChange(banner.id, parseInt(newPosition, 10));
                              setNewPosition('');
                            }}
                          >
                            Save
                          </button>
                          <button
                            className="customize-btn customize-btn-small"
                            onClick={() => {
                              setEditingPosition(null);
                              setNewPosition('');
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                          <>
                          <button
                            className="customize-btn customize-btn-icon"
                            onClick={() => {
                              setEditingPosition(banner.id);
                              setNewPosition(String(banner.position || index + 1));
                            }}
                            title="Edit Position"
                          >
                            <FiEdit2 />
                          </button>
                        </>
                      )}
                      <button
                        className="customize-btn customize-btn-icon customize-btn-danger"
                        onClick={() => handleDelete(banner.id)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
