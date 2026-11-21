import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import SiteHeader from './SiteHeader';
import AboutPage from './AboutPage';
import SiteFooter from './SiteFooter';
import { HomeLanguageProvider, useHomeLanguage } from './HomeLanguage';
import './fonts.css';
import './site.css';
import './module-header.css';
import './site-map.css';
import './subpage.css';

function AboutShell() {
  const { copy } = useHomeLanguage();
  return <>
    <a className="skip-link" href="#about-heading">{copy.skip}</a>
    <SiteHeader current="about"/>
    <main><AboutPage/></main>
    <SiteFooter current="about"/>
  </>;
}

export function AboutApp() {
  return <HomeLanguageProvider page="about"><AboutShell/></HomeLanguageProvider>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root'), <AboutApp/>);
