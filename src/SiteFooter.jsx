import SiteMap from './SiteMap';
import { useHomeLanguage } from './HomeLanguage';

export default function SiteFooter({ current = 'home' }) {
  const { copy, language } = useHomeLanguage();
  const homeHref = current === 'home' ? '#cover' : '/';
  return <footer className="cinema-footer cinema-wrap">
    <div className="footer-brand"><a href={homeHref} aria-label={copy.footerHome}>Agent Hub</a><span lang="en">Human × Agent</span><p>{copy.footerMotto}</p></div>
    <SiteMap language={language} headings={copy.siteMap} label={copy.footerNavigation}/>
  </footer>;
}
