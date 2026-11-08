import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import community from 'agenthub:homepage-community';
import { DISCUSSION_TRANSLATIONS } from './commons-stories';
import { createSky } from './commons-sky';
import { useHomeLanguage } from './HomeLanguage';

const DISCUSSIONS = community.discussions;
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
// where each idea matches a numbered star around it.
export default function CommunityIdentity() {
  const { copy, language } = useHomeLanguage();
  const surface = useRef(null), sky = useRef(null);
  const [selected, setSelected] = useState(FIRST);
  const [peek, setPeek] = useState(null);
  const [idea, setIdea] = useState(null);
  const discussion = read(selected, language);
  const preview = peek && read(peek.index, language);

  useEffect(() => {
    sky.current = createSky(surface.current, {
      groups: DISCUSSIONS.map(item => item.tag), weights: WEIGHTS,
      onHover: (index, x, y) => setPeek(index === null ? null : { index, x, y }),
      onSelect: index => setSelected(index),
    });
    return () => { sky.current?.dispose(); sky.current = null; };
  }, []);
  useEffect(() => { sky.current?.select(selected, discussion.ideas.length); setIdea(null); }, [selected, discussion.ideas.length]);
  useEffect(() => { sky.current?.focusIdea(idea); }, [idea]);

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
        {preview && <div className={'commons-peek ' + peekSide} style={{ left: peek.x, top: peek.y }}>
          <span className="commons-peek-tag" lang={preview.lang}>{preview.tag}</span>
          <span className="commons-peek-question" lang={preview.lang}>{preview.question}</span>
          <span className="commons-peek-action">{peek.index === selected ? copy.skyOpened : copy.skyOpen}</span>
        </div>}
      </div>
      <article className="commons-detail" aria-labelledby="commons-question" aria-live="polite">
        <div className="commons-detail-main">
          <p className="commons-meta"><span>{copy.discussionNumber.replace('{n}', selected + 1).replace('{total}', DISCUSSIONS.length)}</span><span className="commons-tag" lang={discussion.lang}>{discussion.tag}</span></p>
          <h3 id="commons-question" lang={discussion.lang}>{discussion.question}</h3>
          {discussion.quote && <blockquote lang={discussion.lang}><span>{copy.quoteLabel}</span>{discussion.quote}</blockquote>}
          <div className="commons-nav" role="group" aria-label={copy.browseDiscussions}>
            <button type="button" onClick={() => step(-1)} aria-label={copy.previousDiscussion}><ChevronLeft size={17} aria-hidden="true"/></button>
            <button type="button" className="commons-shuffle" onClick={shuffle}><Shuffle size={15} aria-hidden="true"/>{copy.randomDiscussion}</button>
            <button type="button" onClick={() => step(1)} aria-label={copy.nextDiscussion}><ChevronRight size={17} aria-hidden="true"/></button>
            <a className="commons-record" href={'community.html#discussion-' + (selected + 1)}>{copy.discussionRecord}<ArrowUpRight size={14} aria-hidden="true"/></a>
          </div>
        </div>
        <div className="commons-detail-ideas">
          <p className="commons-ideas-label">{copy.ideasLabel}</p>
          <ol className="commons-ideas" lang={discussion.lang}>{discussion.ideas.map((text, index) => <li key={selected + '-' + index}
            onPointerEnter={() => setIdea(index)} onPointerLeave={() => setIdea(null)}><span aria-hidden="true">{index + 1}</span><p>{text}</p></li>)}</ol>
          <div className="commons-open" onPointerEnter={() => setIdea(discussion.ideas.length)} onPointerLeave={() => setIdea(null)}>
            <span>{copy.stillOpen}</span><p lang={discussion.lang}>{discussion.conclusion}</p>
          </div>
          {language === 'en' && discussion.lang !== 'en' && <p className="commons-language">{copy.archiveLanguage}</p>}
        </div>
      </article>
      <p className="commons-note">{copy.provenance}</p>
    </div>
  </section>;
}
