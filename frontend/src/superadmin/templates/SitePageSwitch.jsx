import React from 'react';
import { useOutletContext } from 'react-router-dom';
import ClassicHome from './classic/pages/home/Home.jsx';
import ClassicProperties from './classic/pages/Properties.jsx';
import ClassicAbout from './classic/pages/About.jsx';
import ClassicContact from './classic/pages/Contact.jsx';
import ProClassicHome from './proclassic/pages/Home.jsx';
import ProClassicProperties from './proclassic/pages/Properties.jsx';
import ProClassicAbout from './proclassic/pages/About.jsx';
import ProClassicContact from './proclassic/pages/Contact.jsx';

function getTemplate(ctx) {
  return (ctx?.template || ctx?.site?.template || 'proclassic').toLowerCase();
}

export function HomeSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  return tpl === 'classic' ? <ClassicHome /> : <ProClassicHome />;
}

export function PropertiesSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  return tpl === 'classic' ? <ClassicProperties /> : <ProClassicProperties />;
}

export function AboutSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  return tpl === 'classic' ? <ClassicAbout /> : <ProClassicAbout />;
}

export function ContactSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  return tpl === 'classic' ? <ClassicContact /> : <ProClassicContact />;
}


