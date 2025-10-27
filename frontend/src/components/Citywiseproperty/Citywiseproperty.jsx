import { useEffect, useRef, useState } from "react";
import "./Citywiseproperty.css";

const CITIES = [
  {
    name: "Bangalore",
    properties: 34687,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Bangalore_Skyline.jpg/640px-Bangalore_Skyline.jpg",
  },
  {
    name: "Gurgaon",
    properties: 33952,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Cyber_City_Gurgaon.jpg/640px-Cyber_City_Gurgaon.jpg",
  },
  {
    name: "Mumbai",
    properties: 33361,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/The_Gateway_of_India%2C_Mumbai.jpg/640px-The_Gateway_of_India%2C_Mumbai.jpg",
  },
  {
    name: "New Delhi",
    properties: 31616,
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Pune",
    properties: 28984,
    image:
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
  },
  {
    name: "Lucknow",
    properties: 25330,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/79/Bada_Imambara_Lucknow.jpg/640px-Bada_Imambara_Lucknow.jpg",
  },
  {
    name: "Chennai",
    properties: 20575,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Chennai_Central.jpg/640px-Chennai_Central.jpg",
  },
  {
    name: "Noida",
    properties: 19037,
    image:
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Hyderabad",
    properties: 17814,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Charminar_Hyderabad_2015.jpg/640px-Charminar_Hyderabad_2015.jpg",
  },
  {
    name: "Thane",
    properties: 16785,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Upvan_Lake_Thane.jpg/640px-Upvan_Lake_Thane.jpg",
  },
  {
    name: "Kolkata",
    properties: 11671,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Victoria_Memorial_Kolkata_January_2019.jpg/640px-Victoria_Memorial_Kolkata_January_2019.jpg",
  },
  {
    name: "Ahmedabad",
    properties: 9204,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Sabarmati_Riverfront%2C_Ahmedabad.jpg/640px-Sabarmati_Riverfront%2C_Ahmedabad.jpg",
  },
  // more cities
  {
    name: "Jaipur",
    properties: 17850,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Hawa_Mahal_2011.jpg/640px-Hawa_Mahal_2011.jpg",
  },
  {
    name: "Surat",
    properties: 15600,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Cable-stayed_Surat.jpg/640px-Cable-stayed_Surat.jpg",
  },
  {
    name: "Indore",
    properties: 13420,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/Rajwada_Indore_2019.jpg/640px-Rajwada_Indore_2019.jpg",
  },
  {
    name: "Nagpur",
    properties: 12100,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Deekshabhoomi%2C_Nagpur.jpg/640px-Deekshabhoomi%2C_Nagpur.jpg",
  },
  {
    name: "Kanpur",
    properties: 11080,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Kanpur_Memorial_Church.jpg/640px-Kanpur_Memorial_Church.jpg",
  },
  {
    name: "Bhopal",
    properties: 10410,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Upper_Lake_Bhopal.jpg/640px-Upper_Lake_Bhopal.jpg",
  },
  {
    name: "Visakhapatnam",
    properties: 10250,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/Visakhapatnam_Beach.jpg/640px-Visakhapatnam_Beach.jpg",
  },
  {
    name: "Patna",
    properties: 9850,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Golghar%2C_Patna.jpg/640px-Golghar%2C_Patna.jpg",
  },
  {
    name: "Vadodara",
    properties: 9420,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Laxmi_Vilas_Palace%2C_Vadodara.jpg/640px-Laxmi_Vilas_Palace%2C_Vadodara.jpg",
  },
  {
    name: "Ghaziabad",
    properties: 9100,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Hindon_Metro_Station_Ghaziabad.jpg/640px-Hindon_Metro_Station_Ghaziabad.jpg",
  },
  {
    name: "Ludhiana",
    properties: 8800,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Lodhi_Fort_Ludhiana.jpg/640px-Lodhi_Fort_Ludhiana.jpg",
  },
  {
    name: "Agra",
    properties: 8700,
    image:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Taj_Mahal_in_India_-_Kristian_Bertel.jpg/640px-Taj_Mahal_in_India_-_Kristian_Bertel.jpg",
  },
];

const CITY_FALLBACK = {
  Bangalore:
    "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?q=80&w=800&auto=format&fit=crop",
  Gurgaon:
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=800&auto=format&fit=crop",
  Mumbai:
    "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop",
  "New Delhi":
    "https://images.unsplash.com/photo-1549899595-95c1025bc3f1?q=80&w=800&auto=format&fit=crop",
  Pune:
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop",
  Lucknow:
    "https://images.unsplash.com/photo-1603262110263-fb0112e7cc33?q=80&w=800&auto=format&fit=crop",
  Chennai:
    "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=800&auto=format&fit=crop",
  Noida:
    "https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=800&auto=format&fit=crop",
  Hyderabad:
    "https://images.unsplash.com/photo-1548705085-101177834f47?q=80&w=800&auto=format&fit=crop",
  Thane:
    "https://images.unsplash.com/photo-1494526585095-c41746248156?q=80&w=800&auto=format&fit=crop",
  Kolkata:
    "https://images.unsplash.com/photo-1528909514045-2fa4ac7a08ba?q=80&w=800&auto=format&fit=crop",
  Ahmedabad:
    "https://images.unsplash.com/photo-1501183638710-841dd1904471?q=80&w=800&auto=format&fit=crop",
  Jaipur:
    "https://images.unsplash.com/photo-1589386528392-2c4f2d02d293?q=80&w=800&auto=format&fit=crop",
  Surat:
    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop",
  Indore:
    "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?q=80&w=800&auto=format&fit=crop",
  Nagpur:
    "https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=800&auto=format&fit=crop",
  Kanpur:
    "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=800&auto=format&fit=crop",
  Bhopal:
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800&auto=format&fit=crop",
  Visakhapatnam:
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop",
  Patna:
    "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=800&auto=format&fit=crop",
  Vadodara:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=800&auto=format&fit=crop",
  Ghaziabad:
    "https://images.unsplash.com/photo-1547744015-03cd1692d6a8?q=80&w=800&auto=format&fit=crop",
  Ludhiana:
    "https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop",
  Agra:
    "https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop",
};

function useRevealOnScroll(ref) {
  useEffect(() => {
    if (!ref.current) return;
    const element = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.classList.add("cwp-visible");
          }
        });
      },
      { threshold: 0.15 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
}

export default function Citywiseproperty() {
  const sectionRef = useRef(null);
  useRevealOnScroll(sectionRef);
  const [showCount, setShowCount] = useState(Math.min(12, CITIES.length));

  return (
    <section ref={sectionRef} className="cwp-section" aria-label="City wise property">
      <div className="cwp-decor cwp-decor--one" />
      <div className="cwp-decor cwp-decor--two" />

      <div className="cwp-container">
        <header className="cwp-header">
          <p className="cwp-kicker">Explore</p>
          <h2 className="cwp-title">
            Find Your Property in Your <span className="cwp-title-accent">Preferred City</span>
          </h2>
          <div className="cwp-underline" />
        </header>

        <ul className="cwp-grid" role="list">
          {CITIES.slice(0, showCount).map((city, index) => (
            <li
              key={city.name}
              className="cwp-card"
              style={{ "--i": index }}
              tabIndex={0}
              aria-label={`${city.name} - ${city.properties.toLocaleString()} properties`}
            >
              <div className="cwp-card-media">
                <img
                  src={city.image}
                  alt={city.name}
                  loading="lazy"
                  className="cwp-card-img"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const imgEl = e.currentTarget;
                    const failCount = parseInt(imgEl.dataset.failCount || "0", 10);
                    if (failCount === 0) {
                      imgEl.dataset.failCount = "1";
                      imgEl.src = CITY_FALLBACK[city.name] || `https://placehold.co/600x600/png?text=${encodeURIComponent(city.name)}`;
                    } else {
                      imgEl.src = `https://placehold.co/600x600/png?text=${encodeURIComponent(city.name)}`;
                    }
                  }}
                />
                <span className="cwp-glow" />
              </div>

              <div className="cwp-card-body">
                <h3 className="cwp-city">{city.name}</h3>
                <p className="cwp-meta">
                  {city.properties.toLocaleString()} <span>+ Properties</span>
                </p>
              </div>
            </li>
          ))}
        </ul>

        {showCount < CITIES.length && (
          <div className="cwp-ctaWrap">
            <button
              type="button"
              className="cwp-cta"
              aria-label="View more cities"
              onClick={() => setShowCount((c) => Math.min(c + 12, CITIES.length))}
            >
              <span className="cwp-cta-shine" />
              View More Cities
            </button>
          </div>
        )}
      </div>
    </section>
  );
}


