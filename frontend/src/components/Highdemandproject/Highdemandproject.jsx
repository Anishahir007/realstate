import  React, { useMemo, useRef } from "react";
import "./Highdemandproject.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const FALLBACK = (title) =>
  `https://placehold.co/640x420/png?text=${encodeURIComponent(title)}`;

const SAMPLE_PROJECTS = [
  {
    id: "platinum-greens",
    title: "Platinum Greens Opus",
    by: "Platinum Group",
    location: "Mansarovar Extension, Jaipur",
    price: "₹1.24 Cr - 1.68 Cr",
    bhk: "3, 4 BHK Apartments",
    image:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "lotus-tower",
    title: "Lotus Tower",
    by: "SPH Group",
    location: "Govindpura, Jaipur",
    price: "₹55.0 L - 2.89 Cr",
    bhk: "1 - 5.5 BHK Apartments",
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "samanvay-amelia",
    title: "Samanvay The Amelia",
    by: "Synergy Realty",
    location: "Nevta Village, Jaipur",
    price: "₹25.5 L - 47.5 L",
    bhk: "1, 2 BHK Apartments",
    image:
      "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "vinayak-residency",
    title: "Vinayak Residency I",
    by: "Vinayak Residence",
    location: "Jhotwara, Jaipur",
    price: "₹49.9 L - 58.71 L",
    bhk: "3 BHK Apartment",
    image:
      "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "samanvay-meadows",
    title: "Samanvay The Meadows",
    by: "Samanvay Buildtech",
    location: "Narsinghpura, Jaipur",
    price: "₹41.5 L - 44.5 L",
    bhk: "2 BHK Apartment",
    image:
      "https://images.unsplash.com/photo-1460317442991-0ec209397118?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "sky-bungalows",
    title: "The Sky Bungalows",
    by: "One Realty",
    location: "Vaishali Nagar, Jaipur",
    price: "₹2.25 Cr - 5.74 Cr",
    bhk: "3 - 7 BHK Penthouse",
    image:
      "https://images.unsplash.com/photo-1464146072230-91cabc968266?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function Highdemandproject({ projects }) {
  const list = useMemo(() => (projects?.length ? projects : SAMPLE_PROJECTS), [projects]);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="hdp" aria-label="High-demand projects to invest now">
      <div className="hdp-head">
        <h2 className="hdp-title">High-demand projects to invest now</h2>
        <p className="hdp-sub">Leading projects in high demand</p>
        <div className="hdp-ctrls">
          <button
            type="button"
            className="hdp-btn hdp-btn--prev"
            ref={prevRef}
            aria-label="Previous"
          >
            <span className="hdp-icon" aria-hidden>←</span>
          </button>
          <button
            type="button"
            className="hdp-btn hdp-btn--next"
            ref={nextRef}
            aria-label="Next"
          >
            <span className="hdp-icon" aria-hidden>→</span>
          </button>
        </div>
      </div>

      <div className="hdp-trackWrap">
        <Swiper
          className="hdp-swiper"
          modules={[Navigation, Autoplay, A11y]}
          spaceBetween={16}
          slidesPerView={1.1}
          breakpoints={{
            480: { slidesPerView: 1.2 },
            640: { slidesPerView: 2 },
            900: { slidesPerView: 3 },
            1200: { slidesPerView: 4 },
          }}
          navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
          onBeforeInit={(swiper) => {
            // eslint-disable-next-line no-param-reassign
            swiper.params.navigation.prevEl = prevRef.current;
            // eslint-disable-next-line no-param-reassign
            swiper.params.navigation.nextEl = nextRef.current;
          }}
          autoplay={{ delay: 3500, disableOnInteraction: false }}
          speed={650}
          loop
        >
          {list.map((p, idx) => (
            <SwiperSlide key={p.id} className="hdp-card" style={{ "--i": idx }}>
              <article className="hdp-cardInner" tabIndex={0} aria-label={`${p.title} by ${p.by}`}>
                <div className="hdp-media">
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="hdp-img"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.fail === "1") {
                        img.src = FALLBACK(p.title);
                        return;
                      }
                      img.dataset.fail = "1";
                      img.src = FALLBACK(p.title);
                    }}
                  />
                  <span className="hdp-mediaGlow" />
                </div>
                <div className="hdp-body">
                  <h3 className="hdp-name">{p.title}</h3>
                  <p className="hdp-by">by {p.by}</p>
                  <p className="hdp-bhk">{p.bhk}</p>
                  <p className="hdp-loc">{p.location}</p>
                  <p className="hdp-price">{p.price}</p>
                </div>
              </article>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="hdp-fade hdp-fade--left" aria-hidden />
        <div className="hdp-fade hdp-fade--right" aria-hidden />
      </div>
    </section>
  );
}


