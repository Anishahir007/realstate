import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSuperAdmin } from '../../../context/SuperAdminContext.jsx';
import './templatepreview.css';

export default function TemplatePreview() {
  const { name } = useParams();
  const navigate = useNavigate();
  const { token, apiBase } = useSuperAdmin();
  const headers = useMemo(() => ({ Authorization: token ? `Bearer ${token}` : '' }), [token]);
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(''); setHtml('');
      try {
        const { data } = await axios.get(`${apiBase}/api/templates/preview/${name}`, { headers, responseType: 'text' });
        let s = String(data || '');
        if (s.includes('<head>')) {
          s = s.replace('<head>', `<head><base href="${apiBase}/">`);
        } else {
          s = `<base href="${apiBase}/">` + s;
        }
        if (!cancelled) setHtml(s);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || e?.message || 'Preview failed');
      }
    }
    if (name && token) load();
    return () => { cancelled = true; };
  }, [apiBase, headers, name, token]);

  return (
    <div className="superadmintemplatepreview-root">
      <div className="superadmintemplatepreview-bar">
        <button className="superadmintemplatepreview-btn" onClick={() => navigate(-1)}>← Back</button>
        <div className="superadmintemplatepreview-title">Template Preview: {name}</div>
        <div />
      </div>
      {error ? (
        <div className="superadmintemplatepreview-error">{error}</div>
      ) : (
        <iframe title="template-preview" className="superadmintemplatepreview-iframe" srcDoc={html} />
      )}
    </div>
  );
}
