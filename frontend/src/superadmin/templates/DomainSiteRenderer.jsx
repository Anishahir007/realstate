import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Outlet } from 'react-router-dom';
import ClassicLayout from './classic/layout/ClassicLayout.jsx';

export default function DomainSiteRenderer() {
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const apiBase = import.meta.env.VITE_API_BASE || '';

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await axios.get(`${apiBase}/api/templates/domain/context`);
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
  return (
    <ClassicLayout>
      <Outlet context={{ site, properties }} />
    </ClassicLayout>
  );
}


