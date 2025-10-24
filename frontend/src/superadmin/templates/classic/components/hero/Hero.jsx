import React, { useEffect, useState } from 'react';
import './Hero.css';

export default function Hero() {
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

  return (
    <section className="superadmin-classic-hero">
      <div className="superadmin-classic-hero__slider">
        {heroImages.map((src, i) => (
          <div
            key={src}
            className={`superadmin-classic-hero__slide${i === slide ? ' superadmin-classic-hero__slide--active' : ''}`}
            aria-hidden={i !== slide}
          >
            <img src={src} alt="Real estate" />
          </div>
        ))}
        <button className="superadmin-classic-hero__arrow superadmin-classic-hero__arrow--left" onClick={() => goto(slide - 1)} aria-label="Previous">‹</button>
        <button className="superadmin-classic-hero__arrow superadmin-classic-hero__arrow--right" onClick={() => goto(slide + 1)} aria-label="Next">›</button>
        <div className="superadmin-classic-hero__dots">
          {heroImages.map((_, i) => (
            <button key={i} className={`superadmin-classic-hero__dot${i === slide ? ' superadmin-classic-hero__dot--active' : ''}`} onClick={() => goto(i)} aria-label={`Go to slide ${i+1}`} />
          ))}
        </div>
      </div>
    </section>
  );
}


