import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
import community from 'agenthub:homepage-community';
import { COMMONS_STORIES } from './commons-stories';
import { createLoom } from './commons-loom';
import { useHomeLanguage } from './HomeLanguage';

const pad = number => String(number).padStart(2, '0');

// Three real discussions, each read as a short exchange that ends on what is still open. Above them, the loom
// weaves loose ideas into one braid per discussion; hovering or focusing a card brightens its braid.
export default function CommunityIdentity() {
  const { copy, language } = useHomeLanguage();
  const surface = useRef(null), list = useRef(null), loom = useRef(null);
  useEffect(() => {
    const canvas = surface.current;
    const targets = () => {
      const origin = canvas.getBoundingClientRect();
      const cards = [...list.current.children].map(card => card.getBoundingClientRect());
      // Stacked cards share one column, so the braids spread across it instead of landing on each card; on a
      // phone there is room for only one braid.
      const sideBySide = cards.length > 1 && Math.abs(cards[0].top - cards[1].top) < 2;
      if (!sideBySide && origin.width < 600) return [{ x: origin.width / 2, width: origin.width }];
      return cards.map((card, index) => sideBySide
        ? { x: card.left - origin.left + card.width / 2, width: card.width }
        : { x: origin.width * (index * 2 + 1) / (cards.length * 2), width: origin.width / cards.length });
    };
    loom.current = createLoom(canvas, targets, COMMONS_STORIES.map(story => story.terms));
    return () => { loom.current?.dispose(); loom.current = null; };
  }, []);
  const highlight = index => loom.current?.highlight(index);
  const stories = COMMONS_STORIES.map(item => {
    const discussion = community.discussions[item.discussionId - 1];
    const text = language === 'en' ? { ...item, ...item.en } : item;
    return { ...text, question: text.question || discussion.question, conclusion: text.conclusion || discussion.conclusion };
  });
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
      <div className="commons-loom" aria-hidden="true"><canvas ref={surface}/></div>
      <ol className="commons-threads" ref={list}>{stories.map((story, index) => <li key={story.id}
        onPointerEnter={() => highlight(index)} onPointerLeave={() => highlight(null)} onFocus={() => highlight(index)} onBlur={() => highlight(null)}>
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
