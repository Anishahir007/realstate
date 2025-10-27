import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';

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
        if (mounted) setSites(my?.data || []);
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
      setSites(my?.data || []);
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
      setSites(my?.data || []);
    } finally {
      setDomainBusy(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading templates…</div>;

  return (
    <div style={{ padding: 16 }}>
      <h2>Website Templates</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 }}>
        {items.map((t) => (
          <div key={t.name} style={{ border: '1px solid #eee', borderRadius: 12, padding: 12 }}>
            <div style={{ height: 140, background: '#f5f5f5', borderRadius: 8, marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span>{t.label}</span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => onPreview(t.name)}>Preview</button>
              <button disabled={publishing} onClick={() => onPublish(t.name)}>{publishing ? 'Publishing…' : 'Publish'}</button>
            </div>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: 24 }}>My Published Sites</h3>
      <ul>
        {sites.map((s) => (
          <li key={s.slug}>
            <strong>{s.template}</strong> — <code>{s.slug}</code> — <a href={s.urlPath || `/site/${s.slug}`} target="_blank" rel="noreferrer">Open</a>
            {s.customDomain ? (<span> — Domain: <strong>{s.customDomain}</strong></span>) : null}
          </li>
        ))}
      </ul>

      {sites[0] && (
        <div style={{ marginTop: 16, padding: 12, border: '1px solid #eee', borderRadius: 8, maxWidth: 700 }}>
          <h4>Connect Your Custom Domain</h4>
          <div style={{ marginBottom: 8 }}>
            <input
              placeholder="yourdomain.com"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              style={{ padding: 8, width: 320, marginRight: 8 }}
            />
            <button disabled={domainBusy || !domainInput} onClick={connectDomain}>Connect Domain</button>
            <button disabled={domainBusy || !sites[0]?.slug} onClick={checkDomain} style={{ marginLeft: 8 }}>Check Status</button>
          </div>
          <div style={{ background: '#fff7e6', padding: 8, borderRadius: 6, border: '1px solid #ffe58f', color: '#ad6800' }}>
            Please set your domain's A record to <code>72.61.136.84</code>
          </div>
          {domainStatus && (
            <div style={{ marginTop: 8, color: domainStatus.ok ? 'green' : 'crimson' }}>{domainStatus.message}</div>
          )}
        </div>
      )}
    </div>
  );
}


