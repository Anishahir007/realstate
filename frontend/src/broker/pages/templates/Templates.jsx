import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';
import './brokerTemplates.css';

export default function Templates() {
  const { token, apiBase } = useBroker();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [sites, setSites] = useState([]);
  const [domainInput, setDomainInput] = useState('');
  const [domainBusy, setDomainBusy] = useState(false);
  const [domainStatus, setDomainStatus] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function run() {
      try {
        const { data } = await axios.get(`${apiBase}/api/templates/list`, { headers: { Authorization: `Bearer ${token}` } });
        if (mounted) setItems(data?.data || []);
        const { data: my } = await axios.get(`${apiBase}/api/templates/my-sites`, { headers: { Authorization: `Bearer ${token}` } });
        if (mounted) {
          const list = my?.data || [];
          setSites(list);
          if (list[0]?.customDomain) setDomainInput(list[0].customDomain);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    run();
    return () => { mounted = false; };
  }, [apiBase, token]);

  async function onPreview(name) {
    const url = `/site/preview/${name}`; // open SPA preview route
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  async function onPublish(name) {
    setPublishing(true);
    try {
      const { data } = await axios.post(`${apiBase}/api/templates/publish`, { template: name }, { headers: { Authorization: `Bearer ${token}` } });
      const created = data?.data;
      if (created) {
        // Replace any previous site entries for this broker (single active site)
        setSites([created]);
        if (created.customDomain) setDomainInput(created.customDomain);
        setDomainStatus(null);
      }
    } finally {
      setPublishing(false);
    }
  }

  async function connectDomain() {
    if (!sites[0]) return;
    setDomainBusy(true);
    try {
      const { data } = await axios.post(`${apiBase}/api/templates/connect-domain`, { slug: sites[0].slug, domain: domainInput }, { headers: { Authorization: `Bearer ${token}` } });
      // refresh my sites to include domain
      const { data: my } = await axios.get(`${apiBase}/api/templates/my-sites`, { headers: { Authorization: `Bearer ${token}` } });
      const list = my?.data || [];
      setSites(list);
      if (list[0]?.customDomain) setDomainInput(list[0].customDomain);
      setDomainStatus({ message: 'Saved. Now set DNS A record and then Check Status.', ok: true });
    } catch (e) {
      setDomainStatus({ message: e?.response?.data?.message || 'Failed to save domain', ok: false });
    } finally {
      setDomainBusy(false);
    }
  }

  async function checkDomain() {
    if (!sites[0]) return;
    setDomainBusy(true);
    try {
      const { data } = await axios.get(`${apiBase}/api/templates/check-domain`, { params: { slug: sites[0].slug }, headers: { Authorization: `Bearer ${token}` } });
      const ok = data?.data?.connected;
      setDomainStatus({ message: ok ? 'Connected' : 'Not connected yet', ok });
      // refresh list to update verification timestamp if any
      const { data: my } = await axios.get(`${apiBase}/api/templates/my-sites`, { headers: { Authorization: `Bearer ${token}` } });
      const list = my?.data || [];
      setSites(list);
      if (list[0]?.customDomain) setDomainInput(list[0].customDomain);
    } finally {
      setDomainBusy(false);
    }
  }

  if (loading) return <div className="brokerTemplates-loading">Loading templates…</div>;

  return (
    <div className="brokerTemplates-root">
      <div className="brokerTemplates-header">
        <h2 className="brokerTemplates-title">Website Templates</h2>
        <p className="brokerTemplates-subtitle">Choose a template to create your professional real estate website</p>
      </div>

      <div className="brokerTemplates-grid">
        {items.map((t) => (
          <div key={t.name} className="brokerTemplates-card">
            <div className="brokerTemplates-card-image-wrapper">
              {t.banner_image ? (
                <img
                  src={`${apiBase}${t.banner_image}`}
                  alt={`${t.label} template`}
                  className="brokerTemplates-card-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="brokerTemplates-card-placeholder">
                {t.label}
              </div>
            </div>
            <div className="brokerTemplates-card-content">
              <h3 className="brokerTemplates-card-name">{t.name || t.label}</h3>
              {t.label && t.label !== t.name && (
                <p className="brokerTemplates-card-label">{t.label}</p>
              )}
              <div className="brokerTemplates-card-actions">
                <button 
                  className="brokerTemplates-btn brokerTemplates-btn-preview"
                  onClick={() => onPreview(t.name)}
                >
                  Preview
                </button>
                <button 
                  className="brokerTemplates-btn brokerTemplates-btn-publish"
                  disabled={publishing} 
                  onClick={() => onPublish(t.name)}
                >
                  {publishing ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sites.length > 0 && (
        <div className="brokerTemplates-sites-section">
          <h3 className="brokerTemplates-section-title">My Published Sites</h3>
          <ul className="brokerTemplates-sites-list">
            {sites.map((s) => (
              <li key={s.slug} className="brokerTemplates-site-item">
                <div className="brokerTemplates-site-info">
                  <span className="brokerTemplates-site-template">{s.template}</span>
                  <span className="brokerTemplates-site-separator">—</span>
                  <span className="brokerTemplates-site-slug">{s.slug}</span>
                  {s.customDomain && (
                    <>
                      <span className="brokerTemplates-site-separator">—</span>
                      <span className="brokerTemplates-site-domain">{s.customDomain}</span>
                    </>
                  )}
                </div>
                <a 
                  href={s.urlPath || `/site/${s.slug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="brokerTemplates-site-link"
                >
                  Open →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {sites[0] && (
        <div className="brokerTemplates-domain-section">
          <h4 className="brokerTemplates-domain-title">Connect Your Custom Domain</h4>
          <div className="brokerTemplates-domain-form">
            <input
              type="text"
              placeholder="yourdomain.com"
              value={sites[0]?.customDomain || domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              disabled={Boolean(sites[0]?.customDomain)}
              className="brokerTemplates-domain-input"
            />
            <button 
              className="brokerTemplates-domain-btn brokerTemplates-domain-btn-connect"
              disabled={domainBusy || !domainInput || Boolean(sites[0]?.customDomain)} 
              onClick={connectDomain}
            >
              Connect Domain
            </button>
            <button 
              className="brokerTemplates-domain-btn brokerTemplates-domain-btn-check"
              disabled={domainBusy || !sites[0]?.slug} 
              onClick={checkDomain}
            >
              Check Status
            </button>
          </div>
          <div className="brokerTemplates-domain-info">
            Please set your domain's A record to <code>72.61.136.84</code>
          </div>
          {domainStatus && (
            <div className={`brokerTemplates-domain-status ${domainStatus.ok ? 'brokerTemplates-domain-status-success' : 'brokerTemplates-domain-status-error'}`}>
              {domainStatus.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


