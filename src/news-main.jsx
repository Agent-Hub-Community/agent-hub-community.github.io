import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import SiteHeader from './SiteHeader';
import NewsPage from './NewsPage';
import SiteFooter from './SiteFooter';
import { HomeLanguageProvider, useHomeLanguage } from './HomeLanguage';
import { ThemePackProvider } from './ThemePack';
import './fonts.css';
import './site.css';
import './module-header.css';
import './site-map.css';
import './subpage.css';

function NewsShell() {
  const { copy } = useHomeLanguage();
  return <>
    <a className="skip-link" href="#news-heading">{copy.skip}</a>
    <SiteHeader current="news"/>
    <main><NewsPage/></main>
    <SiteFooter current="news"/>
  </>;
}

export function NewsApp() {
  return <HomeLanguageProvider page="news"><ThemePackProvider><NewsShell/></ThemePackProvider></HomeLanguageProvider>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root'), <NewsApp/>);
