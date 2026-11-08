import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import community from 'agenthub:homepage-community';
import { COMMONS_STORIES } from './commons-stories';
import { createSky } from './commons-sky';
import { useHomeLanguage } from './HomeLanguage';

const pad = number => String(number).padStart(2, '0');

// Three real discussions, each read as a short exchange that ends on what is still open. Above them, each discussion
// is a constellation in a night sky; a card and its constellation light up together.
export default function CommunityIdentity() {
  const { copy, language } = useHomeLanguage();
  const surface = useRef(null), list = useRef(null), sky = useRef(null);
  const [active, setActive] = useState(null);
  const stories = COMMONS_STORIES.map(item => {
    const discussion = community.discussions[item.discussionId - 1];
    const text = language === 'en' ? { ...item, ...item.en } : item;
    return { ...text, question: text.question || discussion.question, conclusion: text.conclusion || discussion.conclusion };
  });

  useEffect(() => {
    const canvas = surface.current;
    const targets = () => {
      const origin = canvas.getBoundingClientRect();
      const cards = [...list.current.children].map(card => card.getBoundingClientRect());
      // Side by side, each constellation hangs over its card; stacked, they share the width.
      const sideBySide = cards.length > 1 && Math.abs(cards[0].top - cards[1].top) < 2;
      return cards.map((card, index) => sideBySide
        ? { x: card.left - origin.left + card.width / 2, width: card.width }
        : { x: origin.width * (index * 2 + 1) / (cards.length * 2), width: origin.width / cards.length });
    };
    const select = index => {
      const card = list.current.children[index];
      card.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      card.querySelector('.commons-record')?.focus({ preventScroll: true });
    };
    sky.current = createSky(canvas, { targets, onHover: setActive, onSelect: select });
    return () => { sky.current?.dispose(); sky.current = null; };
  }, []);
  useEffect(() => { sky.current?.setActive(active); }, [active]);
  useEffect(() => {
    sky.current?.setLabels(stories.map((story, index) => ({ number: pad(index + 1), topic: story.label, turns: story.turns.map(turn => turn.label), open: copy.stillOpen })));
  }, [language]);

  return <section className="community-identity" id="collaborate" aria-labelledby="collaborate-title">
    <div className="cinema-wrap">
      <header className="commons-head">
        <h2 id="collaborate-title">{copy.worldHeading[0]}<br/>{copy.worldHeading[1]}</h2>
        <div className="commons-lead">
          <p>{copy.worldIntro[0]}<br/>{copy.worldIntro[1]}</p>
          <div className="scene-actions commons-actions">
            <a className="scene-button" href="community.html#discussions">{copy.discussionEntry}</a>
            <a className="scene-link" href="https://github.com/Agent-Hub-Community">{copy.projectEntry}</a>
          </div>
        </div>
      </header>
      <div className="commons-sky" aria-hidden="true">
        <canvas ref={surface}/>
        <p className="commons-legend"><span>{copy.skyLegend[0]}</span><span className="is-star">{copy.skyLegend[1]}</span><span className="is-open">{copy.skyLegend[2]}</span></p>
      </div>
      <ol className="commons-threads" ref={list}>{stories.map((story, index) => <li key={story.id} className={active === index ? 'is-active' : undefined}
        onPointerEnter={() => setActive(index)} onPointerLeave={() => setActive(null)} onFocus={() => setActive(index)} onBlur={() => setActive(null)}>
        <article className="commons-thread" aria-labelledby={'commons-' + story.id}>
          <p className="commons-topic"><span>{pad(index + 1)}</span>{story.label}</p>
          <h3 id={'commons-' + story.id}>{story.question}</h3>
          <ol className="commons-turns">{story.turns.map(turn => <li key={turn.label}><span>{turn.label}</span><p>{turn.text}</p></li>)}</ol>
          <div className="commons-open"><span>{copy.stillOpen}</span><p>{story.conclusion}</p></div>
          <a className="commons-record" href={'community.html#discussion-' + story.discussionId}>{copy.discussionRecord}<ArrowUpRight size={14} aria-hidden="true"/></a>
        </article>
      </li>)}</ol>
      <p className="commons-note">{copy.provenance}</p>
    </div>
  </section>;
}
