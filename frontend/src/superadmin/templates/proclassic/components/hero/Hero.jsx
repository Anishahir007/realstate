import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { getApiBase } from '../../../../../utils/apiBase.js';
import './hero.css';

// Default banners fallback
const defaultBanners = [
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1486304873000-235643847519?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop'
];

function PrevArrow(props) {
  const { onClick } = props;
  return (
    <button className="pc-hero-arrow pc-hero-prev" onClick={onClick} aria-label="Previous">
      ‹
    </button>
  );
}

function NextArrow(props) {
  const { onClick } = props;
  return (
    <button className="pc-hero-arrow pc-hero-next" onClick={onClick} aria-label="Next">
      ›
    </button>
  );
}

export default function Hero() {
  const { slug } = useParams();
  const ctx = useOutletContext?.() || {};
  const site = ctx.site || {};
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const apiBase = getApiBase() || '';

  useEffect(() => {
    async function fetchBanners() {
      try {
        setLoading(true);
        // Get slug from params or site context
        const siteSlug = slug || site.slug;
        if (!siteSlug) {
          // Use default banners if no slug
          setBanners(defaultBanners);
          setLoading(false);
          return;
        }

        const response = await fetch(`${apiBase}/api/templates/site/${siteSlug}/hero-banners`);
        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0) {
            // Use banner objects with dimensions
            setBanners(result.data);
          } else {
            // Use default banners if no custom banners
            setBanners(defaultBanners);
          }
        } else {
          // Use default banners on error
          setBanners(defaultBanners);
        }
      } catch (err) {
        console.error('Error fetching hero banners:', err);
        // Use default banners on error
        setBanners(defaultBanners);
      } finally {
        setLoading(false);
      }
    }

    fetchBanners();
  }, [slug, site.slug, apiBase]);

  const settings = {
    dots: true,
    infinite: banners.length > 1,
    autoplay: banners.length > 1,
    autoplaySpeed: 3800,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: banners.length > 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    pauseOnHover: false,
  };

  if (loading) {
    return (
      <div className="pc-hero">
        <div className="pc-hero-slide" style={{ height: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6' }}>
          <span>Loading banners...</span>
        </div>
      </div>
    );
  }

  if (banners.length === 0) {
    return null;
  }

  return (
    <div className="pc-hero">
      <Slider {...settings}>
        {banners.map((banner, i) => {
          const src = typeof banner === 'string' ? banner : banner.image_url || banner.url || banner;
          const width = typeof banner === 'object' && banner.width ? banner.width : null;
          const height = typeof banner === 'object' && banner.height ? banner.height : null;
          
          return (
            <div key={i} className="pc-hero-slide">
              <img 
                src={src} 
                alt={`banner-${i}`}
                style={{
                  ...(width ? { width: width.includes('%') ? width : `${width}%` } : {}),
                  ...(height ? { height: `${height}px` } : {}),
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  // Fallback to default banner if image fails to load
                  e.target.src = defaultBanners[i % defaultBanners.length];
                }} 
              />
            </div>
          );
        })}
      </Slider>
    </div>
  );
}


