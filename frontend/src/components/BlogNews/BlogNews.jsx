import { useEffect, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./BlogNews.css";

const POSTS = [
  {
    id: 1,
    title: "Jaipur market update: Price trends and what to expect",
    tag: "Market",
    date: "Oct 10, 2025",
    img: "https://images.unsplash.com/photo-1486401899868-0e435ed85128?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "Home loan rates – how to pick the right bank in 2025",
    tag: "Finance",
    date: "Oct 08, 2025",
    img: "https://images.unsplash.com/photo-1554224155-3a589877462f?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "Vastu tips for small apartments that actually work",
    tag: "Guide",
    date: "Oct 01, 2025",
    img: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "RERA changes – what buyers and sellers should know",
    tag: "Legal",
    date: "Sep 28, 2025",
    img: "https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?q=80&w=1200&auto=format&fit=crop",
  },
];

const BlogNews = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const swiperRef = useRef(null);

  return (
    <section className="BlogNews" aria-label="Blog and News">
      <div className="BlogNews-head">
        <h2 className="BlogNews-title">Blog & News</h2>
        <a href="#" className="BlogNews-see">See all →</a>
      </div>

      <Swiper
        className="BlogNews-swiper"
        modules={[Navigation, A11y]}
        spaceBetween={16}
        slidesPerView={1.1}
        breakpoints={{ 640: { slidesPerView: 2 }, 980: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          // store instance for later update
          swiperRef.current = swiper;
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.prevEl = prevRef.current;
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.nextEl = nextRef.current;
        }}
        grabCursor
      >
        {POSTS.map((p) => (
          <SwiperSlide key={p.id} className="BlogNews-card">
            <article className="BlogNews-cardInner">
              <div className="BlogNews-media">
                <img src={p.img} alt={p.title} loading="lazy" className="BlogNews-img" />
                <span className="BlogNews-tag">{p.tag}</span>
              </div>
              <div className="BlogNews-body">
                <h3 className="BlogNews-name">{p.title}</h3>
                <div className="BlogNews-meta">{p.date}</div>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="BlogNews-ctrls">
        <button className="BlogNews-btn" ref={prevRef} aria-label="Previous">←</button>
        <button className="BlogNews-btn" ref={nextRef} aria-label="Next">→</button>
      </div>
    </section>
  );
};

// Ensure navigation refs are bound after mount
export default function BlogNewsWithInit(props) {
  const Comp = BlogNews;
  const compRef = useRef(null);
  // nothing, wrapper to export default
  return <Comp {...props} ref={compRef} />;
}
export { BlogNews as BlogNewsBase };


