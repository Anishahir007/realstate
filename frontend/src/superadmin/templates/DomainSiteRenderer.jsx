import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../../utils/apiBase.js';
import { Outlet, Route, Routes } from 'react-router-dom';
import ViewProperty from './proclassic/pages/ViewProperty.jsx';
import ProClassicLayout from './proclassic/layout/ProClassicLayout.jsx';
import ClassicLayout from './classic/layout/ClassicLayout.jsx';

export default function DomainSiteRenderer() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = getApiBase();

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const host = window.location.host;
        const { data } = await axios.get(`${apiBase}/api/templates/domain/context`, {
          headers: { 'x-site-host': host },
          withCredentials: false,
        });
        if (mounted) setCtx(data);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [apiBase]);

  if (loading) return <div style={{ padding: 24 }}>Loading…</div>;
  if (!ctx) return <div style={{ padding: 24 }}>Site not found</div>;

  const site = ctx.site;
  const properties = ctx.properties || [];
  const tpl = (ctx.template || site?.template || 'proclassic').toLowerCase();
  const Layout = tpl === 'classic' ? ClassicLayout : ProClassicLayout;
  return (
    <Layout site={site} properties={properties}>
      <Routes>
        <Route path="property/:id" element={<ViewProperty site={site} properties={properties} />} />
        <Route path="*" element={<Outlet context={{ site, properties, template: tpl }} />} />
      </Routes>
    </Layout>
  );
}


