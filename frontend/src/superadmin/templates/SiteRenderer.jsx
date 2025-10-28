import React, { useEffect, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import axios from 'axios';
import ClassicLayout from './classic/layout/ClassicLayout.jsx';
import ProClassicLayout from './proclassic/layout/ProClassicLayout.jsx';

// For now, always use classic. You can switch based on stored template.
export default function SiteRenderer() {
  const { slug } = useParams();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_BASE;

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await axios.get(`${apiBase}/api/templates/site/${slug}/context`);
        if (mounted) setCtx(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug, apiBase]);

  if (loading) return <div style={{ padding: 24 }}>Loading site…</div>;
  if (!ctx) return <div style={{ padding: 24 }}>Site not found</div>;

  const site = ctx.site;
  const properties = ctx.properties || [];
  const tpl = (ctx.template || site?.template || 'proclassic').toLowerCase();
  const Layout = tpl === 'classic' ? ClassicLayout : ProClassicLayout;
  // Render children via Outlet defined in App routes
  return (
    <Layout site={site} properties={properties}>
      <Outlet context={{ site, properties, template: tpl }} />
    </Layout>
  );
}


