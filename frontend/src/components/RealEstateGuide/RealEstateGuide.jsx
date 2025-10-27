import "./RealEstateGuide.css";

const INSIGHTS = [
  { text: "15+ Vastu Tips for Residential Building", ico: "📄" },
  { text: "Ready Reckoner Rate - What Does it Mean and How to Calculate It?", ico: "🧮" },
  { text: "Occupancy Certificate (OC) - Meaning, Documents Required, and Importance", ico: "▶️" },
  { text: "Pink Square Mall Jaipur - Timings, Photos, Shops List & Other Information", ico: "🛍️" },
  { text: "Malls in Jaipur: Complete List of Shopping Malls, Location & Guide", ico: "🗺️" },
];

const LEGAL = [
  {
    title: "Inheritance Laws In India - All You Need to Know",
    cta: "Watch video",
    img:
      "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=800&auto=format&fit=crop",
  },
  {
    title: "What is a Conveyance Deed and Why Is It Important?",
    cta: "Read article",
    img:
      "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?q=80&w=800&auto=format&fit=crop",
  },
];

const RealEstateGuide = () => {
  return (
    <section className="RealEstateGuide" aria-label="Your Real Estate Guide">
      <h2 className="RealEstateGuide-title">Your Real Estate Guide</h2>
      <div className="RealEstateGuide-grid">
        <article className="RealEstateGuide-card RealEstateGuide-card--left">
          <header className="RealEstateGuide-cardHead">
            <h3 className="RealEstateGuide-cardTitle">Industry Insights</h3>
          </header>
          <ul className="RealEstateGuide-list" role="list">
            {INSIGHTS.map((it, i) => (
              <li key={i} className="RealEstateGuide-item">
                <span className="RealEstateGuide-ico" aria-hidden>{it.ico}</span>
                <a href="#" className="RealEstateGuide-link">{it.text}</a>
              </li>
            ))}
          </ul>
          <a href="#" className="RealEstateGuide-see">See all</a>
        </article>

        <article className="RealEstateGuide-card RealEstateGuide-card--right">
          <header className="RealEstateGuide-cardHead">
            <h3 className="RealEstateGuide-cardTitle">Legal Updates</h3>
          </header>
          <ul className="RealEstateGuide-legal" role="list">
            {LEGAL.map((l, i) => (
              <li key={i} className="RealEstateGuide-legalItem">
                <div
                  className="RealEstateGuide-thumb"
                  style={{ backgroundImage: `url(${l.img})` }}
                  aria-hidden
                />
                <div className="RealEstateGuide-legalBody">
                  <h4 className="RealEstateGuide-legalTitle">{l.title}</h4>
                  <a href="#" className="RealEstateGuide-cta">{l.cta} →</a>
                </div>
              </li>
            ))}
          </ul>
          <div className="RealEstateGuide-actions">
            <a href="#" className="RealEstateGuide-btn">Explore Services</a>
            <a href="#" className="RealEstateGuide-see RealEstateGuide-see--right">See all</a>
          </div>
        </article>
      </div>
    </section>
  );
};

export default RealEstateGuide;


