import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import GenesisHero from './GenesisHero';
import SiteHeader from './SiteHeader';
import CinematicHome, { HomeFooter } from './CinematicHome';
import { HomeLanguageProvider, useHomeLanguage } from './HomeLanguage';
import './fonts.css';
import './site.css';
import './module-header.css';
import './cinematic-home.css';
import './community-identity.css';
import './hub-section.css';
import './site-map.css';

function HomeContent() {
  const { copy } = useHomeLanguage();
  return <>
    <a className="skip-link" href="#about">{copy.skip}</a>
    <SiteHeader/>
    <main><GenesisHero/><CinematicHome/></main>
    <HomeFooter/>
  </>;
}

export function App() {
  return <HomeLanguageProvider><MotionConfig reducedMotion="user"><HomeContent/></MotionConfig></HomeLanguageProvider>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root'), <App/>);
