import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, A11y } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "./PopularOwner.css";

const PROPS = [
  { id: 1, bhk: "3 BHK Flat", price: "₹90 Lac", sqft: "1475 sqft", area: "Lalapura, Jaipur", status: "Ready to Move", img: "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=1200&auto=format&fit=crop" },
  { id: 2, bhk: "2 BHK Flat", price: "₹36 Lac", sqft: "1063 sqft", area: "Ajmer Road, Jaipur", status: "Ready to Move", img: "https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?q=80&w=1200&auto=format&fit=crop" },
  { id: 3, bhk: "2 BHK Flat", price: "₹36 Lac", sqft: "1063 sqft", area: "Ajmer Road, Jaipur", status: "Ready to Move", img: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=1200&auto=format&fit=crop" },
  { id: 4, bhk: "3 BHK Flat", price: "₹75 Lac", sqft: "1300 sqft", area: "Vaishali Nagar, Jaipur", status: "Ready to Move", img: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=1200&auto=format&fit=crop" },
  { id: 5, bhk: "3 BHK Flat", price: "₹95 Lac", sqft: "1520 sqft", area: "Mansarovar, Jaipur", status: "Ready to Move", img: "https://images.unsplash.com/photo-1523217582562-09d0def993a6?q=80&w=1200&auto=format&fit=crop" },
];

const PopularOwner = () => {
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  return (
    <section className="PopularOwner" aria-label="Popular Owner Properties">
      <div className="PopularOwner-head">
        <h2 className="PopularOwner-title">Popular Owner Properties</h2>
        <a href="#" className="PopularOwner-see">See all Properties →</a>
      </div>

      <Swiper
        className="PopularOwner-swiper"
        modules={[Navigation, A11y]}
        spaceBetween={16}
        slidesPerView={1.1}
        breakpoints={{ 640: { slidesPerView: 2 }, 980: { slidesPerView: 3 }, 1280: { slidesPerView: 4 } }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.prevEl = prevRef.current;
          // eslint-disable-next-line no-param-reassign
          swiper.params.navigation.nextEl = nextRef.current;
        }}
      >
        {PROPS.map((p) => (
          <SwiperSlide key={p.id} className="PopularOwner-card">
            <article className="PopularOwner-cardInner">
              <div className="PopularOwner-media">
                <img src={p.img} alt={p.bhk} loading="lazy" className="PopularOwner-img" />
                <span className="PopularOwner-badge">{p.bhk}</span>
              </div>
              <div className="PopularOwner-body">
                <div className="PopularOwner-row">
                  <span className="PopularOwner-price">{p.price}</span>
                  <span className="PopularOwner-sqft">{p.sqft}</span>
                </div>
                <p className="PopularOwner-loc">{p.area}</p>
                <p className="PopularOwner-status">{p.status}</p>
              </div>
            </article>
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="PopularOwner-ctrls">
        <button className="PopularOwner-btn" ref={prevRef} aria-label="Previous">←</button>
        <button className="PopularOwner-btn" ref={nextRef} aria-label="Next">→</button>
      </div>
    </section>
  );
};

export default PopularOwner;


