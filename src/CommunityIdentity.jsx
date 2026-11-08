import CyberCommons from './CyberCommons';
import { useHomeLanguage } from './HomeLanguage';

export default function CommunityIdentity() {
  const { copy } = useHomeLanguage();
  return <section className="community-identity" id="collaborate" aria-labelledby="robot-title">
    <CyberCommons>
    <div className="identity-world-heading">
      <h2 id="robot-title">{copy.worldHeading[0]}<br/>{copy.worldHeading[1]}</h2>
      <p>{copy.worldIntro[0]}<br/>{copy.worldIntro[1]}</p>
      <div className="scene-actions identity-actions">
        <a className="scene-button" href="community.html#discussions">{copy.discussionEntry}</a>
        <a className="scene-link" href="https://github.com/Agent-Hub-Community">{copy.projectEntry}</a>
      </div>
    </div>
    </CyberCommons>
  </section>;
}
