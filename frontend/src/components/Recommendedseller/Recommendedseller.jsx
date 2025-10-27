import { useMemo, useRef } from "react";
import "./Recommendedseller.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const FALLBACK = (name) => `https://placehold.co/96x96/png?text=${encodeURIComponent(name[0] || "S")}`;

const SAMPLE_SELLERS = [
  {
    id: "life-settle",
    name: "Life settle homes",
    badge: "HOUSING EXPERT PRO",
    areas: ["Jagatpura", "Jagatpura"],
    years: 10,
    properties: 5,
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=256&auto=format&fit=crop",
  },
  {
    id: "volt-group",
    name: "Volt Group",
    badge: "HOUSING EXPERT PRO",
    areas: ["Bagru", "Tonk Road"],
    years: 2,
    properties: 6,
    avatar: "https://images.unsplash.com/photo-1541534401786-2077eed87a72?q=80&w=256&auto=format&fit=crop",
  },
  {
    id: "shanaya",
    name: "Shanaya Gautam",
    badge: "HOUSING EXPERT PRO",
    areas: ["Karolan Ka Barh", "Sitapura"],
    years: 15,
    properties: 8,
    avatar: "https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?q=80&w=256&auto=format&fit=crop",
  },
  {
    id: "abhishek",
    name: "Abhishek Singh",
    badge: "HOUSING EXPERT",
    areas: ["Vaishali Nagar", "Vaishali Nagar Ext"],
    years: 2,
    properties: 41,
    avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop",
  },
  {
    id: "sr-homes",
    name: "SR Homes",
    badge: "HOUSING EXPERT",
    areas: ["Jagatpura", "Karolan Ka Barh"],
    years: 4,
    properties: 72,
    avatar: "https://images.unsplash.com/photo-1519340241574-2cec6aef0c01?q=80&w=256&auto=format&fit=crop",
  },
  {
    id: "avni",
    name: "Avni Associate",
    badge: "HOUSING EXPERT",
    areas: ["Panchyawala", "Lalarpura"],
    years: 14,
    properties: 33,
    avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=256&auto=format&fit=crop",
  },
];

export default function Recommendedseller({ sellers }) {
  const list = useMemo(() => (sellers?.length ? sellers : SAMPLE_SELLERS), [sellers]);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="rs" aria-label="Recommended sellers">
      <div className="rs-head">
        <h2 className="rs-title">Recommended sellers</h2>
        <p className="rs-sub">Top brokers and agents</p>
        <div className="rs-ctrls">
          <button type="button" className="rs-btn rs-btn--prev" ref={prevRef} aria-label="Previous">
            <span className="rs-icon" aria-hidden>←</span>
          </button>
          <button type="button" className="rs-btn rs-btn--next" ref={nextRef} aria-label="Next">
            <span className="rs-icon" aria-hidden>→</span>
          </button>
        </div>
      </div>

      <Swiper
        className="rs-swiper"
        modules={[Navigation, Autoplay, A11y]}
        spaceBetween={16}
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 2 },
          980: { slidesPerView: 3 },
          1280: { slidesPerView: 4 },
        }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.prevEl = prevRef.current;
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        speed={550}
        loop
      >
        {list.map((s) => (
          <SwiperSlide key={s.id} className="rs-card">
            <article className="rs-cardInner">
              <div className="rs-row">
                <div className="rs-avatarWrap">
                  <img
                    className="rs-avatar"
                    src={s.avatar}
                    alt={s.name}
                    loading="lazy"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      img.src = FALLBACK(s.name);
                    }}
                  />
                </div>
                <div className="rs-main">
                  <h3 className="rs-name">{s.name}</h3>
                  <span className={`rs-badge`}>{s.badge}</span>
                </div>
              </div>

              <div className="rs-chips">
                {s.areas.map((a, i) => (
                  <span className="rs-chip" key={`${s.id}-a-${i}`}>{a}</span>
                ))}
              </div>

              <div className="rs-meta">
                <span><strong>{s.years} years</strong> Experience</span>
                <span><strong>{s.properties}</strong> Properties</span>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}


