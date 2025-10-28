import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './hero.css';

const banners = [
  // Property/real-estate themed images
  'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1600&auto=format&fit=crop', // modern house exterior
  'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop', // living room interior
  'https://images.unsplash.com/photo-1486304873000-235643847519?q=80&w=1600&auto=format&fit=crop', // kitchen
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=1600&auto=format&fit=crop', // apartment building
  'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop', // dining space
  'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop'  // bedroom
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
  const settings = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3800,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    pauseOnHover: false,
  };

  return (
    <div className="pc-hero">
      <Slider {...settings}>
        {banners.map((src, i) => (
          <div key={i} className="pc-hero-slide">
            <img src={src} alt={`banner-${i}`} />
          </div>
        ))}
      </Slider>
    </div>
  );
}


