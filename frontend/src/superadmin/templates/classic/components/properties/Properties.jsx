import React, { useRef } from 'react';
import './Properties.css';

export default function Properties({ items = [] }) {
  const trackRef = useRef(null);
  function scrollByCards(dir) {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.superadmin-classic-properties__card');
    const cardWidth = card ? card.getBoundingClientRect().width : 260;
    track.scrollBy({ left: dir * (cardWidth + 16), behavior: 'smooth' });
  }
  return (
    <section className="superadmin-classic-properties">
      <div className="superadmin-classic-properties__head">
        <h3>Latest Properties</h3>
        {items.length > 0 && (
          <div className="superadmin-classic-properties__controls">
            <button aria-label="Previous" onClick={() => scrollByCards(-1)}>&lt;</button>
            <button aria-label="Next" onClick={() => scrollByCards(1)}>&gt;</button>
          </div>
        )}
      </div>
      {items.length === 0 ? (
        <p>No properties yet.</p>
      ) : (
        <div className="superadmin-classic-properties__track" ref={trackRef}>
          {items.map((p) => (
            <article key={p.id} className="superadmin-classic-properties__card">
              <h4>{p.title}</h4>
              <p>{p.city}, {p.state}</p>
              <p><strong>{p.expected_price ? `₹ ${p.expected_price}` : ''}</strong></p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}


