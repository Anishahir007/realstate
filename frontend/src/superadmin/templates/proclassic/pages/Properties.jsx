import React from 'react';
import { useOutletContext } from 'react-router-dom';
import FindProperty from '../components/findProperty/FindProperty.jsx';
import '../components/findProperty/findProperty.css';

export default function ProClassicProperties({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];
  
  return <FindProperty site={site} properties={properties} />;
}


