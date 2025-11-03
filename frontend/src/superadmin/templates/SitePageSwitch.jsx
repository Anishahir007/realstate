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
import PremiumHome from './premium/pages/Home.jsx';
import PremiumProperties from './premium/pages/Properties.jsx';
import PremiumAbout from './premium/pages/About.jsx';
import PremiumContact from './premium/pages/Contact.jsx';

function getTemplate(ctx) {
  return (ctx?.template || ctx?.site?.template || 'proclassic').toLowerCase();
}

export function HomeSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  if (tpl === 'classic') return <ClassicHome />;
  if (tpl === 'premium') return <PremiumHome />;
  return <ProClassicHome />;
}

export function PropertiesSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  if (tpl === 'classic') return <ClassicProperties />;
  if (tpl === 'premium') return <PremiumProperties />;
  return <ProClassicProperties />;
}

export function AboutSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  if (tpl === 'classic') return <ClassicAbout />;
  if (tpl === 'premium') return <PremiumAbout />;
  return <ProClassicAbout />;
}

export function ContactSwitch() {
  const ctx = useOutletContext?.() || {};
  const tpl = getTemplate(ctx);
  if (tpl === 'classic') return <ClassicContact />;
  if (tpl === 'premium') return <PremiumContact />;
  return <ProClassicContact />;
}


