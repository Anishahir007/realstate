import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../components/hero/Hero.jsx';

export default function ProClassicHome({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];
  return (
    <div>
      <Hero />
      <h2 style={{ marginTop: 0 }}>Latest Properties</h2>
      {properties.length === 0 ? (<div>No properties yet.</div>) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {properties.map(p => (
            <div key={p.id} style={{ border:'1px solid #eee', borderRadius:8, padding:12, background:'#fff' }}>
              <div style={{ fontWeight:700 }}>{p.title}</div>
              <div style={{ color:'#666' }}>{p.city}, {p.state}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


