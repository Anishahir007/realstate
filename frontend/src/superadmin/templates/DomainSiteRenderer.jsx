import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../../utils/apiBase.js';
import { Outlet } from 'react-router-dom';
import ProClassicLayout from './proclassic/layout/ProClassicLayout.jsx';
import ClassicLayout from './classic/layout/ClassicLayout.jsx';
import PremiumLayout from './premium/layout/PremiumLayout.jsx';

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
  let Layout = ProClassicLayout;
  if (tpl === 'classic') Layout = ClassicLayout;
  else if (tpl === 'premium') Layout = PremiumLayout;
  return (
    <Layout site={site} properties={properties}>
      <Outlet context={{ site, properties, template: tpl }} />
    </Layout>
  );
}


