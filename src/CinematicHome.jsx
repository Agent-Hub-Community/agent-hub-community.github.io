import InstitutionWall from './InstitutionWall';
import PlanetScene from './PlanetScene';
import CommunityIdentity from './CommunityIdentity';
import { useHomeLanguage } from './HomeLanguage';

export default function CinematicHome() {
  return <>
    <PlanetScene/>
    <CommunityIdentity/>
    <InstitutionWall/>
  </>;
}

export function HomeFooter() {
  const { copy } = useHomeLanguage();
  return <footer className="cinema-footer cinema-wrap"><a href="#cover" aria-label={copy.footerHome}>Agent Hub</a><span lang="en">Human × Agent</span><nav aria-label={copy.footerNavigation}><a href="community.html#join">{copy.join}</a><a href="https://github.com/Agent-Hub-Community">GitHub</a><a href="/newspaper/feed.xml">RSS</a></nav></footer>;
}
