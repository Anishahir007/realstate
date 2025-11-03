import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Properties({ properties: propsProp = [] }) {
  const fromOutlet = useOutletContext();
  const properties = (propsProp && propsProp.length) ? propsProp : (fromOutlet?.properties || []);
  return (
    <div className="grid">
      {properties.map((p) => (
        <article key={p.id} className="card">
          <h4>{p.title}</h4>
          <p>{p.city}, {p.state}</p>
          <p><strong>{p.expected_price ? `₹ ${p.expected_price}` : ''}</strong></p>
        </article>
      ))}
    </div>
  );
}


