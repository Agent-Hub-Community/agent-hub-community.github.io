import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Plus } from 'lucide-react';
import institutions from 'agenthub:institutions';
import MemberLogo from './MemberLogo';
import { useHomeLanguage } from './HomeLanguage';
import { INSTITUTION_NAMES_EN } from './home-copy';

// Four equally paced tracks retain every institution in the source. Separating
// teams from universities makes the complete directory useful as well.
const rows = [
  institutions[0].filter((_, index) => index % 2 === 0),
  institutions[0].filter((_, index) => index % 2 === 1),
  institutions[1].filter((_, index) => index % 2 === 0),
  institutions[1].filter((_, index) => index % 2 === 1),
];

export default function InstitutionWall() {
  const { language, copy } = useHomeLanguage();
  const name = item => language === 'en' ? (INSTITUTION_NAMES_EN[item.title] || item.title) : item.title;
  const ref = useRef(null);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => {
    let inView = false;
    const sync = () => setActive(inView && !document.hidden);
    const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; sync(); });
    observer.observe(ref.current);
    document.addEventListener('visibilitychange', sync);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); };
  }, []);
  return <section className="institution-section" id="members" ref={ref} aria-labelledby="members-title">
    <div className="institution-heading cinema-wrap">
      <h2 id="members-title"><span>{copy.memberHeading[0]}</span><span>{copy.memberHeading[1]}</span></h2>
      <p>{copy.memberIntro[0]}<br className="mobile-break"/>{language === 'en' && ' '}{copy.memberIntro[1]}</p>
    </div>
    <div className="institution-marquee" data-paused={paused || !active} aria-label={copy.memberLabel}>
      {rows.map((row, index) => <div className="institution-row" key={index} style={{ '--item-count': row.length }} tabIndex={0} role="group" aria-label={copy.groups[index < 2 ? 0 : 1] + ', ' + copy.browseRow} onBlur={event => { event.currentTarget.scrollLeft = 0; }}>
        <div className="institution-track" data-reverse={index % 2 === 1}>
          {[false, true].map(duplicate => <ul className="institution-group" key={String(duplicate)} aria-label={duplicate ? undefined : copy.groups[index < 2 ? 0 : 1]} aria-hidden={duplicate || undefined} inert={duplicate || undefined}>
            {row.map(item => <li key={item.title} title={name(item)}><MemberLogo item={item}/><span className="institution-name">{name(item)}</span></li>)}
          </ul>)}
        </div>
      </div>)}
    </div>
    <div className="institution-bottom cinema-wrap">
      <button className="institution-pause" type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>
        {paused ? <Play size={14} aria-hidden="true"/> : <Pause size={14} aria-hidden="true"/>}<span>{paused ? copy.resumeScroll : copy.pauseScroll}</span>
      </button>
    </div>
    <details className="institution-directory cinema-wrap">
      <summary><span>{copy.directory.replace('{count}', institutions.flat().length)}</span><Plus size={17} aria-hidden="true"/></summary>
      <div className="institution-directory-groups">{institutions.map((row, index) => <div key={index}><h3>{copy.groups[index]}</h3><ul>{row.map(item => <li key={item.title}>{name(item)}</li>)}</ul></div>)}</div>
    </details>
  </section>;
}
