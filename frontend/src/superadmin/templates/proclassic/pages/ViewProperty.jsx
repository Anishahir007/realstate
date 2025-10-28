import React from 'react';
import { useNavigate, useParams, useLocation, useOutletContext } from 'react-router-dom';
import './viewproperty.css';

export default function ViewProperty(props) {
  const { id } = useParams();
  const nav = useNavigate();
  const { state } = useLocation();
  const ctx = useOutletContext?.() || {};
  const list = Array.isArray(props?.properties)
    ? props.properties
    : (Array.isArray(ctx?.properties) ? ctx.properties : []);

  let current = state?.property || null;
  if (!current && list && list.length) {
    for (let i = 0; i < list.length; i += 1) {
      const p = list[i];
      if (String(p?.id) === String(id)) { current = p; break; }
    }
  }
  if (!current) {
    return (
      <div style={{ padding: 16 }}>
        <p>Property not found.</p>
        <button onClick={() => nav(-1)}>Go Back</button>
      </div>
    );
  }
  let cover = undefined;
  if (current.image_url) cover = current.image_url;
  else if (current.image) cover = current.image;

  return (
    <div className="pc-view">
      <div className="pc-view__media">
        {cover ? <img src={cover} alt={current.title} /> : null}
      </div>
      <div className="pc-view__content">
        <h1 className="pc-view__title">{current.title}</h1>
        <div className="pc-view__meta">
          <span>{current.property_type}</span>
          <span>•</span>
          <span>{current.built_up_area} {current.area_unit}</span>
          <span>•</span>
          <span>{current.city}, {current.state}</span>
        </div>
        <p className="pc-view__desc">{current.description ? current.description : ''}</p>
        <div className="pc-view__actions">
          {current.contact_phone ? (<a className="pc-view__btn" href={`tel:${current.contact_phone}`}>Call</a>) : null}
          {current.contact_email ? (<a className="pc-view__btn" href={`mailto:${current.contact_email}`}>Email</a>) : null}
        </div>
      </div>
    </div>
  );
}


