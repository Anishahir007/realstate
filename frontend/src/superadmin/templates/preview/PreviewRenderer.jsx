import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import ClassicLayout from '../classic/layout/ClassicLayout.jsx';
import ClassicHome from '../classic/pages/Home.jsx';
import ProClassicLayout from '../proclassic/layout/ProClassicLayout.jsx';
import ProClassicHome from '../proclassic/pages/Home.jsx';
import { getApiBase } from '../../../utils/apiBase.js';

export default function PreviewRenderer() {
  const { template } = useParams();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = getApiBase();

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
  const tpl = (site?.template || template || 'proclassic').toLowerCase();
  const Layout = tpl === 'classic' ? ClassicLayout : ProClassicLayout;
  const Home = tpl === 'classic' ? ClassicHome : ProClassicHome;
  return (
    <Layout site={site} properties={properties}>
      <Home site={site} properties={properties} />
    </Layout>
  );
}


