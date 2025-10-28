import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function ProClassicContact({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const email = site?.broker?.email || '';
  const phone = site?.broker?.phone || '';
  return (
    <div>
      <h2 style={{ marginTop: 0 }}>Contact</h2>
      {email ? <p>Email: {email}</p> : null}
      {phone ? <p>Phone: {phone}</p> : null}
      <form onSubmit={(e) => { e.preventDefault(); alert('Thanks!'); }} style={{ display:'grid', gap:10, maxWidth:420 }}>
        <input placeholder="Your name" required />
        <input placeholder="Your email" type="email" required />
        <textarea placeholder="Message" rows={4} required />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}


