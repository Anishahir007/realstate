import "./about.css";

const STAT_ITEMS = [
  { label: "Cities Covered", value: "40+" },
  { label: "Verified Listings", value: "120K+" },
  { label: "Active Brokers", value: "3.5K+" },
  { label: "Avg. Response Time", value: "<4 hrs" },
];

const VALUES = [
  { title: "Trust", desc: "Every listing is verified by our in‑house team with photo checks and documentation where available." },
  { title: "Transparency", desc: "Clear pricing, honest descriptions and upfront builder/broker disclosures." },
  { title: "Tech + Human", desc: "Modern search, accurate recommendations, and a support team that actually calls you back." },
];

const TEAM = [
  { name: "Anish Gupta", role: "Founder & CEO" },
  { name: "Riya Sharma", role: "Head of Operations" },
  { name: "Kunal Verma", role: "Engineering Lead" },
];

const BRANDS = ["HDFC", "SBI", "LIC HFL", "Axis", "ICICI", "Kotak"];

const TIMELINE = [
  { year: "2022", title: "Started in Jaipur", desc: "Launched with a small verified inventory and a promise to remove spam from searches." },
  { year: "2023", title: "Multi‑city expansion", desc: "Added brokers and projects across major Rajasthan cities with broker dashboards." },
  { year: "2024", title: "Quality at scale", desc: "Automated listing checks, photo scoring and duplicate detection using ML." },
  { year: "2025", title: "Partners ecosystem", desc: "Home loans, movers and legal assistance integrated for a full‑stack experience." },
];

const FAQ = [
  { q: "Do you charge buyers or tenants?", a: "Browsing is free. For owner or broker services we provide simple, transparent plans—no hidden fees." },
  { q: "How do you verify listings?", a: "We combine photo metadata checks, duplicate detection and human reviews. Suspicious posts are removed within hours." },
  { q: "Can builders list new projects?", a: "Yes. We offer launch packages, lead routing, microsites and on‑ground event support." },
];

export default function About() {
  return (
    <main className="About">
      <section className="About-hero" aria-label="About RealEstate">
        <div className="About-heroInner">
          <h1 className="About-title">We simplify real estate for everyone</h1>
          <p className="About-sub">A modern platform connecting buyers, tenants, brokers and developers with verified information and delightful experiences.</p>
        </div>
        <div className="About-heroArt" aria-hidden />
      </section>

      <section className="About-stats" aria-label="Impact">
        <ul className="About-statsGrid" role="list">
          {STAT_ITEMS.map((s) => (
            <li key={s.label} className="About-stat">
              <span className="About-statValue">{s.value}</span>
              <span className="About-statLabel">{s.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="About-mission" aria-label="Mission">
        <div className="About-missionCopy">
          <h2 className="About-h2">Our mission</h2>
          <p>To bring trust, speed and simplicity to the Indian real estate journey — from the first search to the final signature.</p>
          <p>We started with a simple idea: people deserve better information before booking a site visit. Today, our platform blends high‑quality data with a personal touch so that decisions are confident and quick.</p>
        </div>
        <div className="About-missionCard">
          <h3>What we offer</h3>
          <ul className="About-bullets" role="list">
            <li>City‑wise discovery with rich photos and map context</li>
            <li>Instant filters for budget, BHK, locality and amenities</li>
            <li>Lead routing to verified brokers and project teams</li>
            <li>Secure dashboards for owners, brokers and builders</li>
          </ul>
        </div>
      </section>

      <section className="About-values" aria-label="Values">
        <h2 className="About-h2">The values that guide us</h2>
        <div className="About-valuesGrid">
          {VALUES.map((v) => (
            <article className="About-value" key={v.title}>
              <h3 className="About-valueTitle">{v.title}</h3>
              <p className="About-valueDesc">{v.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="About-brands" aria-label="Trusted partners">
        <h2 className="About-h2">Trusted by leading institutions</h2>
        <ul className="About-brandsRow" role="list">
          {BRANDS.map((b) => (
            <li key={b} className="About-brand">{b}</li>
          ))}
        </ul>
      </section>

      <section className="About-timeline" aria-label="Our journey">
        <h2 className="About-h2">Our journey</h2>
        <ol className="About-steps" aria-label="Milestones">
          {TIMELINE.map((t) => (
            <li key={t.year} className="About-step">
              <div className="About-stepYear">{t.year}</div>
              <div className="About-stepBody">
                <div className="About-stepTitle">{t.title}</div>
                <p className="About-stepDesc">{t.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="About-team" aria-label="Team">
        <h2 className="About-h2">Leadership</h2>
        <ul className="About-teamGrid" role="list">
          {TEAM.map((m) => (
            <li key={m.name} className="About-member">
              <div className="About-avatar" aria-hidden />
              <div>
                <div className="About-memberName">{m.name}</div>
                <div className="About-memberRole">{m.role}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="About-faq" aria-label="FAQs">
        <h2 className="About-h2">Frequently asked questions</h2>
        <div className="About-faqGrid">
          {FAQ.map((f, idx) => (
            <article key={idx} className="About-faqItem">
              <h3 className="About-faqQ">{f.q}</h3>
              <p className="About-faqA">{f.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="About-cta" aria-label="Contact">
        <div className="About-ctaCard">
          <h2 className="About-h2">Work with us</h2>
          <p>Whether you’re a developer launching a project or a broker scaling your pipeline, we’d love to collaborate.</p>
          <a href="mailto:hello@realestate.example" className="About-btn">Contact us</a>
        </div>
      </section>
    </main>
  );
}


