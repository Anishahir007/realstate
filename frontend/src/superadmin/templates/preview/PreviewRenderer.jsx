import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ClassicLayout from '../classic/layout/ClassicLayout.jsx';
import ClassicHome from '../classic/pages/Home.jsx';

export default function PreviewRenderer() {
  const { template } = useParams();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        // Read broker token from localStorage (BrokerContext STORAGE_KEY)
        const raw = localStorage.getItem('realestate_broker_auth');
        const parsed = raw ? JSON.parse(raw) : null;
        const headers = parsed?.token ? { Authorization: `Bearer ${parsed.token}` } : {};
        const { data } = await axios.get(`${apiBase}/api/templates/preview/${template}/context`, { headers });
        if (mounted) setCtx(data);
      } catch {
        if (mounted) setCtx(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [apiBase, template]);

  if (loading) return <div style={{ padding: 24 }}>Loading preview…</div>;
  if (!ctx) return <div style={{ padding: 24 }}>Preview not available</div>;

  const site = ctx.site || {};
  const properties = ctx.properties || [];
  // For now, render classic preview; switch on `template` if multiple UIs are added
  return (
    <ClassicLayout>
      <ClassicHome site={site} properties={properties} />
    </ClassicLayout>
  );
}


