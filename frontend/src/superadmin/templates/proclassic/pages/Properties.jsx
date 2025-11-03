import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function ProClassicProperties({ properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const properties = propsProps || ctx.properties || [];
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Properties pro </h2>
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


