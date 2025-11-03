import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function ProClassicAbout({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const name = site?.broker?.full_name || 'Our Brokerage';
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>About</h2>
      <p style={{ color:'#555' }}>We help clients buy and sell properties with transparency and speed. Meet {name} and explore our portfolio.</p>
    </div>
  );
}


