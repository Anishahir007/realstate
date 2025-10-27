import "./Sellproperty.css";

const DEFAULT_BANNER =
  "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop";

export default function Sellproperty({ onClick, bannerSrc = DEFAULT_BANNER }) {
  return (
    <section className="sp" aria-label="Have a property to sell?">
      <h2 className="sp-title">Have a property to sell?</h2>

      <div className="sp-card" role="group" aria-label="Sell your property banner">
        <img
          className="sp-bg"
          src={bannerSrc}
          alt="Real estate banner"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_BANNER;
          }}
        />
        <span className="sp-overlay" />

        <div className="sp-copy">
          <p className="sp-headline">List your property & connect with clients faster!</p>
          <button
            type="button"
            className="sp-cta"
            onClick={onClick}
            aria-label="Sell your property"
          >
            <span>Sell your property</span>
          </button>
        </div>
      </div>
    </section>
  );
}


