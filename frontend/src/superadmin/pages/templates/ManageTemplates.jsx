import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './ManageTemplates.css';

export default function ManageTemplates() {
  const { token, apiBase } = useSuperAdmin();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    loadTemplates();
  }, [apiBase, token]);

  async function loadTemplates() {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.get(`${apiBase}/api/template-management/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTemplates(data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(templateName, currentStatus) {
    if (!token) return;
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await axios.patch(
        `${apiBase}/api/template-management/${templateName}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await loadTemplates();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to update status');
    }
  }

  async function handleBannerUpload(templateName, file) {
    if (!token || !file) return;
    setUploading({ ...uploading, [templateName]: true });
    try {
      const formData = new FormData();
      formData.append('banner', file);
      formData.append('templateName', templateName);

      await axios.post(`${apiBase}/api/template-management/${templateName}/banner`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      await loadTemplates();
    } catch (e) {
      alert(e?.response?.data?.message || e?.message || 'Failed to upload banner');
    } finally {
      setUploading({ ...uploading, [templateName]: false });
    }
  }

  async function previewTemplate(templateName) {
    try {
      const { data } = await axios.get(
        `${apiBase}/api/template-management/${templateName}/preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data?.data?.previewUrl) {
        window.open(data.data.previewUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (e) {
      // Fallback: open preview directly
      const url = `/site/preview/${templateName}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  if (loading) {
    return (
      <div className="managetemplates-root">
        <div className="managetemplates-loading">Loading templates...</div>
      </div>
    );
  }

  return (
    <div className="managetemplates-root">
      <div className="managetemplates-header">
        <div>
          <h2 className="managetemplates-title">Manage Templates</h2>
          <p className="managetemplates-subtitle">Activate, deactivate, and customize template banners</p>
        </div>
      </div>

      {error && (
        <div className="managetemplates-error">
          {error}
        </div>
      )}

      <div className="managetemplates-grid">
        {templates.map((template) => (
          <div key={template.name} className="managetemplates-card">
            <div className="managetemplates-card-header">
              <div>
                <h3 className="managetemplates-template-name">{template.label}</h3>
                <p className="managetemplates-template-id">{template.name}</p>
              </div>
              <div className={`managetemplates-status-badge ${template.status === 'active' ? 'active' : 'inactive'}`}>
                {template.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="managetemplates-banner-container">
              {template.banner_image ? (
                <img
                  src={`${apiBase}${template.banner_image}`}
                  alt={`${template.label} banner`}
                  className="managetemplates-banner-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div
                className="managetemplates-banner-placeholder"
                style={{ display: template.banner_image ? 'none' : 'flex' }}
              >
                <span>No banner image</span>
              </div>
            </div>

            <div className="managetemplates-actions">
              <button
                className="managetemplates-btn managetemplates-btn-preview"
                onClick={() => previewTemplate(template.name)}
              >
                Preview
              </button>

              <label className="managetemplates-btn managetemplates-btn-upload">
                {uploading[template.name] ? 'Uploading...' : 'Upload Banner'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleBannerUpload(template.name, file);
                    e.target.value = ''; // Reset input
                  }}
                  disabled={uploading[template.name]}
                />
              </label>

              <button
                className={`managetemplates-btn ${
                  template.status === 'active'
                    ? 'managetemplates-btn-deactivate'
                    : 'managetemplates-btn-activate'
                }`}
                onClick={() => toggleStatus(template.name, template.status)}
              >
                {template.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

