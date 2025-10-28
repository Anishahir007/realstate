import React from 'react';
import { useOutletContext } from 'react-router-dom';
import './contactus.css';

export default function ContactUs({ site: siteProp }) {
  const ctx = useOutletContext?.() || {};
  const site = siteProp || ctx.site || {};
  const broker = site?.broker || {};
  const name = broker?.full_name || 'Broker';
  const email = broker?.email || '';
  const phone = broker?.phone || '';

  return (
    <div className="pc-contact">
      <div className="pc-contact__crumbs">
        <span>Home</span>
        <span>›</span>
        <span>Contact Us</span>
      </div>
      <div className="pc-contact__wrap">
        <aside className="pc-contact__aside">
          <h3 className="pc-contact__title">{name}</h3>
          {phone ? (
            <div className="pc-contact__row">📞 <a href={`tel:${phone}`}>{phone}</a></div>
          ) : null}
          {email ? (
            <div className="pc-contact__row">✉️ <a href={`mailto:${email}`}>{email}</a></div>
          ) : null}
        </aside>
        <section className="pc-contact__form">
          <h3 className="pc-contact__heading">Send us a Message</h3>
          <form
            onSubmit={(e) => { e.preventDefault(); alert('Thanks! We will get back to you.'); }}
            className="pc-contact__grid"
          >
            <input className="pc-input" placeholder="Your Name" required />
            <input className="pc-input" placeholder="Email" type="email" required />
            <input className="pc-input" placeholder="Phone" />
            <select className="pc-input">
              <option>Buy a Property</option>
              <option>Sell a Property</option>
              <option>General Query</option>
            </select>
            <textarea className="pc-textarea" rows={5} placeholder="Your Requirement" />
            <div className="pc-actions">
              <button type="submit" className="pc-btn pc-btn--primary">Submit</button>
              <button type="button" className="pc-btn" onClick={(e) => e.currentTarget.form?.reset()}>Cancel</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}


