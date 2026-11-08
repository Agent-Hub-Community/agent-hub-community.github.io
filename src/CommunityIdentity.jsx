import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import community from 'agenthub:homepage-community';
import { DISCUSSION_TRANSLATIONS } from './commons-stories';
import { createSky } from './commons-sky';
import { useHomeLanguage } from './HomeLanguage';
import { sitePath } from './site-map';
import SOURCES from './discussion-sources.json';

const DISCUSSIONS = community.discussions;
// Where each discussion was written up in the newspaper, keyed by archive number (see discussion-sources.json).
// Without a verified source, the link opens the newspaper's search for the question instead.
const sourceOf = index => SOURCES[index + 1];
const FIRST = 59 - 1;
const sentences = text => (text.match(/[^。！？；]+[。！？；]?/g) || []).map(part => part.trim()).filter(Boolean);
const longest = Math.max(...DISCUSSIONS.map(item => item.detail.length));
const WEIGHTS = DISCUSSIONS.map(item => item.detail.length / longest);

// One discussion as the page shows it: the archive's Chinese, or an English reading where one exists.
function read(index, language) {
  const item = DISCUSSIONS[index], english = language === 'en' && DISCUSSION_TRANSLATIONS[index + 1];
  return english
    ? { ...english, quote: '', lang: 'en' }
    : { tag: item.tag, question: item.question, quote: item.quote, ideas: sentences(item.detail), conclusion: item.conclusion, lang: 'zh-CN' };
}

// Every archived discussion is a star. Hovering one previews its question; clicking it opens the discussion below,
// where each idea matches a numbered star around it. Those idea stars preview their idea on hover, and clicking one
// brings the matching idea in the list into view.
export default function CommunityIdentity() {
  const { copy, language } = useHomeLanguage();
  const surface = useRef(null), sky = useRef(null), ideaList = useRef(null), openPoint = useRef(null);
  const [selected, setSelected] = useState(FIRST);
  const [peek, setPeek] = useState(null);
  const [idea, setIdea] = useState(null), [pinned, setPinned] = useState(null);
  const lit = idea ?? pinned;
  const discussion = read(selected, language);
  const preview = peek && (peek.kind === 'question' ? read(peek.index, language) : null);
  const ideaText = index => index < discussion.ideas.length ? discussion.ideas[index] : discussion.conclusion;

  useEffect(() => {
    sky.current = createSky(surface.current, {
      groups: DISCUSSIONS.map(item => item.tag), weights: WEIGHTS,
      onHover: target => { setPeek(target); setIdea(target?.kind === 'idea' ? target.index : null); },
      onSelect: target => {
        if (target.kind === 'question') { setSelected(target.index); return; }
        setPinned(target.index);
        const item = ideaList.current?.children[target.index] || openPoint.current;
        item?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'nearest' });
      },
    });
    return () => { sky.current?.dispose(); sky.current = null; };
  }, []);
  useEffect(() => { sky.current?.select(selected, discussion.ideas.length); setIdea(null); setPinned(null); }, [selected, discussion.ideas.length]);
  useEffect(() => { sky.current?.focusIdea(lit); }, [lit]);

  const step = offset => setSelected(index => (index + offset + DISCUSSIONS.length) % DISCUSSIONS.length);
  const shuffle = () => setSelected(index => (index + 1 + Math.floor(Math.random() * (DISCUSSIONS.length - 1))) % DISCUSSIONS.length);
  const peekSide = peek && surface.current ? (peek.x < 180 ? 'is-start' : peek.x > surface.current.clientWidth - 180 ? 'is-end' : '') : '';

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
      {/* The sky is a pointer shortcut; the buttons below reach every discussion from the keyboard. */}
      <div className="commons-sky" aria-hidden="true">
        <canvas ref={surface}/>
        <p className="commons-hint">{copy.skyHint}</p>
        {peek && <div className={'commons-peek ' + peekSide + (peek.kind === 'idea' && peek.index === discussion.ideas.length ? ' is-open' : '')} style={{ left: peek.x, top: peek.y }}>
          {preview
            ? <><span className="commons-peek-tag" lang={preview.lang}>{preview.tag}</span>
              <span className="commons-peek-question" lang={preview.lang}>{preview.question}</span></>
            : <><span className="commons-peek-tag">{peek.index < discussion.ideas.length ? copy.ideaNumber.replace('{n}', peek.index + 1) : copy.stillOpen}</span>
              <span className="commons-peek-question" lang={discussion.lang}>{ideaText(peek.index)}</span></>}
        </div>}
      </div>
      <article className="commons-detail" aria-labelledby="commons-question" aria-live="polite">
        <div className="commons-detail-main">
          <p className="commons-meta"><span>{selected + 1} / {DISCUSSIONS.length}</span><span className="commons-tag" lang={discussion.lang}>{discussion.tag}</span></p>
          <h3 id="commons-question" lang={discussion.lang}>{discussion.question}</h3>
          {discussion.quote && <blockquote lang={discussion.lang}>{discussion.quote}</blockquote>}
          <div className="commons-nav" role="group" aria-label={copy.browseDiscussions}>
            <button type="button" onClick={() => step(-1)} aria-label={copy.previousDiscussion}><ChevronLeft size={17} aria-hidden="true"/></button>
            <button type="button" className="commons-shuffle" onClick={shuffle}><Shuffle size={15} aria-hidden="true"/>{copy.randomDiscussion}</button>
            <button type="button" onClick={() => step(1)} aria-label={copy.nextDiscussion}><ChevronRight size={17} aria-hidden="true"/></button>
            <a className="commons-record" href={sourceOf(selected)?.path || sitePath('search') + '?q=' + encodeURIComponent(DISCUSSIONS[selected].question)}>
              {sourceOf(selected) ? copy.sourceRecord[sourceOf(selected).kind] : copy.searchRecord}<ArrowUpRight size={14} aria-hidden="true"/></a>
          </div>
        </div>
        <div className="commons-detail-ideas">
          <ol className="commons-ideas" ref={ideaList} lang={discussion.lang}>{discussion.ideas.map((text, index) => <li key={selected + '-' + index} className={lit === index ? 'is-lit' : undefined}
            onPointerEnter={() => setIdea(index)} onPointerLeave={() => setIdea(null)}><span aria-hidden="true">{index + 1}</span><p>{text}</p></li>)}</ol>
          <div className={'commons-open' + (lit === discussion.ideas.length ? ' is-lit' : '')} ref={openPoint} onPointerEnter={() => setIdea(discussion.ideas.length)} onPointerLeave={() => setIdea(null)}>
            <span>{copy.stillOpen}</span><p lang={discussion.lang}>{discussion.conclusion}</p>
          </div>
        </div>
      </article>
    </div>
  </section>;
}
