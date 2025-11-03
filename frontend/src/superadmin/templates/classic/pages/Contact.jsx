import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function Contact({ site: siteProp }) {
  const fromOutlet = useOutletContext();
  const site = siteProp || fromOutlet?.site;
  return (
    <div>
      <h1>Contact</h1>
      <p>Email: {site?.broker?.email || 'contact@example.com'}</p>
    </div>
  );
}


