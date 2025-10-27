import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useBroker } from '../../../context/BrokerContext.jsx';

export default function Templates() {
  const { token, apiBase } = useBroker();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [sites, setSites] = useState([]);

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
      }
    } finally {
      setPublishing(false);
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
          </li>
        ))}
      </ul>
    </div>
  );
}


