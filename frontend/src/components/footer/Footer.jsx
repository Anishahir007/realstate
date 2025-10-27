import "./footer.css";

const LINKS = {
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  Explore: [
    { label: "Buy", href: "#" },
    { label: "Rent", href: "#" },
    { label: "Commercial", href: "#" },
  ],
  Resources: [
    { label: "Blog", href: "#" },
    { label: "Help Center", href: "#" },
    { label: "Contact", href: "#" },
  ],
  Services: [
    { label: "Post Property", href: "#" },
    { label: "Pricing", href: "#" },
    { label: "Agents", href: "#" },
  ],
};

const PARTNERS = ["Partner One", "Partner Two", "Partner Three", "Partner Four", "Partner Five"];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="ft">
      <div className="ft-wrap">
        <div className="ft-brand">
          <div className="ft-logo" aria-hidden />
          <p className="ft-tag">Find homes, faster and smarter.</p>
          <div className="ft-social" aria-label="Social links">
            <a className="ft-sicon" href="#" aria-label="Twitter">𝕏</a>
            <a className="ft-sicon" href="#" aria-label="Instagram">◎</a>
            <a className="ft-sicon" href="#" aria-label="LinkedIn">in</a>
          </div>
        </div>

        <nav className="ft-links" aria-label="Footer">
          {Object.entries(LINKS).map(([group, items]) => (
            <div className="ft-col" key={group}>
              <h4 className="ft-head">{group}</h4>
              <ul className="ft-list" role="list">
                {items.map((it) => (
                  <li key={it.label}><a href={it.href}>{it.label}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <form className="ft-news" onSubmit={(e) => e.preventDefault()}>
          <h4 className="ft-head">Subscribe</h4>
          <p className="ft-note">Market insights and updates—no spam.</p>
          <div className="ft-field">
            <input type="email" aria-label="Email" placeholder="Enter your email" required />
            <button type="submit">Subscribe</button>
          </div>
        </form>

        <div className="ft-contact">
          <h4 className="ft-head">Contact</h4>
          <p className="ft-note">Toll Free - 1800 41 99099</p>
          <a className="ft-mail" href="mailto:hello@realestate.com">hello@realestate.com</a>
          <div className="ft-apps">
            <a href="#" className="ft-badge ft-badge--gp" aria-label="Get it on Google Play">Google Play</a>
            <a href="#" className="ft-badge ft-badge--as" aria-label="Download on the App Store">App Store</a>
          </div>
        </div>
      </div>

      <div className="ft-partners" aria-label="Partners">
        {PARTNERS.map((p) => (
          <span key={p} className="ft-partner">{p}</span>
        ))}
      </div>

      <div className="ft-bottom">
        <p className="ft-copy">© {year} RealEstate. All rights reserved.</p>
        <div className="ft-legal">
          <a href="#">Privacy</a>
          <span>•</span>
          <a href="#">Terms</a>
          <span>•</span>
          <a href="#">Sitemap</a>
        </div>
        <button className="ft-top" type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>↑</button>
      </div>
    </footer>
  );
}


