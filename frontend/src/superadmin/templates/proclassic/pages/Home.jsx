import React from 'react';
import { useOutletContext } from 'react-router-dom';
import Hero from '../components/hero/Hero.jsx';
import { PropertiesGrid } from '../components/property/PropertyCard.jsx';
import { FeaturedPropertiesGrid } from '../components/featuredProperties/FeaturedProperties.jsx';
import '../components/property/property.css';
import '../components/featuredProperties/featuredProperties.css';

export default function ProClassicHome({ site: siteProp, properties: propsProps }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const properties = propsProps || ctx.properties || [];
  return (
    <div>
      <Hero />
      <FeaturedPropertiesGrid properties={properties} />
      <PropertiesGrid properties={properties} />
    </div>
  );
}


