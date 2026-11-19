import InstitutionWall from './InstitutionWall';
import PlanetScene from './PlanetScene';
import CommunityIdentity from './CommunityIdentity';
import HubSection from './HubSection';
import SiteFooter from './SiteFooter';

export default function CinematicHome() {
  return <>
    <PlanetScene/>
    <HubSection/>
    <CommunityIdentity/>
    <InstitutionWall/>
  </>;
}

export { SiteFooter as HomeFooter };
