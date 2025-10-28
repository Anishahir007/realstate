import React from 'react';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import './hero.css';

const banners = [
  'https://images.unsplash.com/photo-1502005229762-cf1b2da7c55a?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505691723518-36a5ac3b2d52?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1499955085172-a104c9463ece?q=80&w=1600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472220625704-91e1462799b2?q=80&w=1600&auto=format&fit=crop'
];

export default function Hero() {
  const settingsTop = {
    dots: true,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 3500,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    pauseOnHover: false,
  };

  const settingsThumbs = {
    dots: false,
    infinite: true,
    autoplay: true,
    autoplaySpeed: 2800,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    arrows: false,
    centerMode: true,
    focusOnSelect: false,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 900, settings: { slidesToShow: 2 } },
      { breakpoint: 600, settings: { slidesToShow: 1 } },
    ],
  };

  return (
    <div className="pc-hero">
      <div className="pc-hero-top">
        <Slider {...settingsTop}>
          {banners.map((src, i) => (
            <div key={i} className="pc-hero-slide">
              <img src={src} alt={`banner-${i}`} />
            </div>
          ))}
        </Slider>
      </div>
      <div className="pc-hero-thumbs">
        <Slider {...settingsThumbs}>
          {banners.map((src, i) => (
            <div key={i} className="pc-hero-thumb">
              <img src={src} alt={`thumb-${i}`} />
            </div>
          ))}
        </Slider>
      </div>
    </div>
  );
}


