import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { ContactForm } from './ContactForm.jsx';
import './contactus.css';

// Full Contact Us page component (with breadcrumbs and aside)
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
        <ContactForm site={site} showTitle={true} compact={false} />
      </div>
    </div>
  );
}


