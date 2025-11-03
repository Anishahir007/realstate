import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import './Home.css';
import Hero from '../../components/hero/Hero.jsx';
import Properties from '../../components/properties/Properties.jsx';

export default function Home({ site: siteProp, properties: propsProp = [] }) {
  const fromOutlet = useOutletContext();
  const site = siteProp || fromOutlet?.site;
  const properties = (propsProp && propsProp.length) ? propsProp : (fromOutlet?.properties || []);

  const list = useMemo(() => properties || [], [properties]);
  const trackRef = useRef(null);
  const heroImages = [
    'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1560448075-bb4caa6c8b0a?q=80&w=1600&auto=format&fit=crop'
  ];
  const [slide, setSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % heroImages.length), 4000);
    return () => clearInterval(id);
  }, [heroImages.length]);
  function goto(idx) { setSlide((idx + heroImages.length) % heroImages.length); }

  function scrollByCards(dir) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.superadmin-home-home__card');
    const cardWidth = card ? card.getBoundingClientRect().width : 260;
    track.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' });
  }

  return (
    <>
      <Hero />

      <Properties items={list} />
    </>
  );
}


