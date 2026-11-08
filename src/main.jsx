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
import './cyber-commons.css';

const previousFragments = ['daily', 'topics', 'discussions', 'events', 'join', ...Array.from({ length: 66 }, (_, index) => 'discussion-' + (index + 1))];

function HomeContent() {
  const { copy } = useHomeLanguage();
  return <>
    <a className="skip-link" href="#about">{copy.skip}</a>
    <SiteHeader/>
    <main><GenesisHero/><CinematicHome/></main>
    <HomeFooter/>
    <noscript>{previousFragments.map(id => <p className="legacy-entry" id={id} key={id}><a href={'community.html#' + id}>这部分内容已移至社群资料页，点击继续阅读。</a></p>)}</noscript>
  </>;
}

export function App() {
  return <HomeLanguageProvider><MotionConfig reducedMotion="user"><HomeContent/></MotionConfig></HomeLanguageProvider>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root'), <App/>);
