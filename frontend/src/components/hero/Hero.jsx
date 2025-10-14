import React, { useMemo, useState } from 'react'
import './hero.css'

const TABS = [
  { key: 'buy', label: 'Buy' },
  { key: 'rent', label: 'Rent / PG' },
  { key: 'projects', label: 'Projects' },
  { key: 'commercial', label: 'Commercial' },
  { key: 'dealers', label: 'Dealers' },
]

const Hero = () => {
  const [active, setActive] = useState('buy')
  const [query, setQuery] = useState('')

  const placeholder = useMemo(() => {
    switch (active) {
      case 'buy': return 'Search city, locality, project...'
      case 'rent': return 'Search rentals or PG in your city'
      case 'projects': return 'Search new projects'
      case 'commercial': return 'Search offices, shops...'
      case 'dealers': return 'Search verified dealers'
      default: return 'Search'
    }
  }, [active])

  return (
    <section className="hero-root">
      <div className="hero-bg" aria-hidden></div>
      <div className="hero-overlay"></div>
      <div className="hero-container">
        <h1 className="hero-title">
          Explore <span className="accent">Buy</span> / <span className="accent">Sell</span> / <span className="accent">Rent</span> Property
          <span className="pulse-dot" aria-hidden></span>
        </h1>
        <p className="hero-sub">Find the right place with Logic Infosoft Real Estate</p>

        <div className="search-card">
          <div className="tabs" role="tablist" aria-label="Property categories">
            {TABS.map(t => (
              <button
                key={t.key}
                role="tab"
                aria-selected={active === t.key}
                className={`tab${active === t.key ? ' active' : ''}`}
                onClick={() => setActive(t.key)}
              >{t.label}</button>
            ))}
          </div>

          <div className="search-row">
            <div className="select-wrap">
              <select className="select">
                <option>All Residential</option>
                <option>Apartment</option>
                <option>Villa</option>
                <option>Plot</option>
              </select>
            </div>
            <div className="input-wrap">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="input"
                placeholder={placeholder}
              />
            </div>
            <button className="nearby" title="Detect nearby">⚐</button>
            <button className="search-btn">Search</button>
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat"><span className="stat-num">10k+</span><span className="stat-label">Listings</span></div>
          <div className="stat"><span className="stat-num">4k+</span><span className="stat-label">Owners</span></div>
          <div className="stat"><span className="stat-num">1k+</span><span className="stat-label">Projects</span></div>
        </div>
      </div>
    </section>
  )
}

export default Hero
