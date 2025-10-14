import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./PropertyTypes.css";

const TYPES = [
  {
    id: "apartment",
    title: "Residential Apartment",
    sub: "2,000+ Properties",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
    tone: "#fff5e8",
  },
  {
    id: "villa",
    title: "Independent House / Villa",
    sub: "1,000+ Properties",
    image:
      "https://images.unsplash.com/photo-1505691723518-36a5ac3b2a59?q=80&w=1200&auto=format&fit=crop",
    tone: "#eef7ff",
  },
  {
    id: "builder",
    title: "Independent / Builder Floor",
    sub: "550+ Properties",
    image:
      "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=1200&auto=format&fit=crop",
    tone: "#edf9f1",
  },
  {
    id: "plot",
    title: "Residential Plot",
    sub: "800+ Properties",
    image:
      "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1200&auto=format&fit=crop",
    tone: "#f3f6ff",
  },
];

const FALLBACK_SRC = {
  apartment:
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1400&auto=format&fit=crop",
  villa:
    "https://images.unsplash.com/photo-1502005229762-cf1b2da7c52f?q=80&w=1400&auto=format&fit=crop",
  builder:
    "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?q=80&w=1400&auto=format&fit=crop",
  plot:
    "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1400&auto=format&fit=crop",
};

const FALLBACK_PLACEHOLDER = (title) =>
  `https://placehold.co/800x480/png?text=${encodeURIComponent(title)}`;

const PropertyTypes = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="pt" aria-label="Apartments, Villas and more">
      <div className="pt-head">
        <div>
          <h2 className="pt-title">Apartments, Villas and more</h2>
          <p className="pt-sub">in Jaipur</p>
        </div>
        <div className="pt-ctrls">
          <button className="pt-btn" ref={prevRef} aria-label="Previous">←</button>
          <button className="pt-btn" ref={nextRef} aria-label="Next">→</button>
        </div>
      </div>

      <Swiper
        className="pt-swiper"
        modules={[Navigation, A11y]}
        spaceBetween={18}
        slidesPerView={1.05}
        breakpoints={{ 540: { slidesPerView: 1.2 }, 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.prevEl = prevRef.current;
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.nextEl = nextRef.current;
        }}
      >
        {TYPES.map((t, i) => (
          <SwiperSlide key={t.id} className="pt-card" style={{ "--tone": t.tone, "--i": i }}>
            <article className="pt-cardInner">
              <div className="pt-info">
                <h3 className="pt-name">{t.title}</h3>
                <p className="pt-meta">{t.sub}</p>
              </div>
              <img
                className="pt-img"
                src={t.image}
                alt={t.title}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (img.dataset.fail === "1") {
                    img.src = FALLBACK_PLACEHOLDER(t.title);
                    return;
                  }
                  img.dataset.fail = "1";
                  img.src = FALLBACK_SRC[t.id] || FALLBACK_PLACEHOLDER(t.title);
                }}
              />
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}

export default PropertyTypes;


