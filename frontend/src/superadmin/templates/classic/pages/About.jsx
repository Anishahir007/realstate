import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function About({ site: siteProp }) {
  const fromOutlet = useOutletContext();
  const site = siteProp || fromOutlet?.site;
  return (
    <div>
      <h1>About {site?.broker?.full_name || 'Us'}</h1>
      <p>We help you buy, sell, and rent properties with ease.</p>
    </div>
  );
}


