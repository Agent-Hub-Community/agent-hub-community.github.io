import InstitutionWall from './InstitutionWall';
import PlanetScene from './PlanetScene';
import CommunityIdentity from './CommunityIdentity';
import HubSection from './HubSection';
import SiteMap from './SiteMap';
import { useHomeLanguage } from './HomeLanguage';

export default function CinematicHome() {
  return <>
    <PlanetScene/>
    <HubSection/>
    <CommunityIdentity/>
    <InstitutionWall/>
  </>;
}

export function HomeFooter() {
  const { copy, language } = useHomeLanguage();
  return <footer className="cinema-footer cinema-wrap">
    <div className="footer-brand"><a href="#cover" aria-label={copy.footerHome}>Agent Hub</a><span lang="en">Human × Agent</span><p>{copy.footerMotto}</p></div>
    <SiteMap language={language} headings={copy.siteMap} label={copy.footerNavigation}/>
  </footer>;
}
