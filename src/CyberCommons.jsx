import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, Maximize2, Minimize2, Pause, Play, Plus, Minus, RotateCcw } from 'lucide-react';
import community from 'agenthub:homepage-community';
import { COMMONS_STORIES } from './commons-stories';
import { useHomeLanguage } from './HomeLanguage';

export default function CyberCommons({ children }) {
  const { language, copy } = useHomeLanguage();
  const stories = COMMONS_STORIES.map(item => language === 'en' ? { ...item, ...item.en } : item);
  const root = useRef(null), surface = useRef(null), world = useRef(null);
  const selection = useRef('benchmark'), motion = useRef(true);
  const [selected, setSelected] = useState('benchmark');
  const [hydrated, setHydrated] = useState(false), [ready, setReady] = useState(false), [paused, setPaused] = useState(false);
  const [fullscreen, setFullscreen] = useState(false), [canFullscreen, setCanFullscreen] = useState(false);
  useEffect(() => {
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let disposed = false, loading = false, visible = false;
    motion.current = !preference.matches; setPaused(preference.matches); setHydrated(true);
    setCanFullscreen(Boolean(document.fullscreenEnabled && root.current.requestFullscreen));
    async function prepare() {
      if (world.current || loading || disposed) return;
      loading = true;
      try {
        const { createCommunityWorld } = await import('./community-world');
        if (disposed) return;
        const instance = await createCommunityWorld(surface.current, {
          onReady: () => { if (!disposed) setReady(true); },
          onSelect: id => { if (!disposed) choose(id); },
          onMotionChange: enabled => { if (!disposed) { motion.current = enabled; setPaused(!enabled); } },
        });
        if (disposed) { instance.dispose(); return; }
        world.current = instance; instance.select(selection.current); instance.setMotion(motion.current); instance.setVisible(visible);
      } catch { /* The scene illustration and archive excerpt remain readable without WebGL. */ }
      loading = false;
    }
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting; if (visible) prepare(); world.current?.setVisible(visible);
    }, { rootMargin: '120px' });
    observer.observe(surface.current);
    function reduce() { motion.current = !preference.matches; setPaused(preference.matches); world.current?.setMotion(motion.current); }
    function fullscreenChange() { setFullscreen(document.fullscreenElement === root.current); }
    function contextLost() { setReady(false); }
    preference.addEventListener('change', reduce); document.addEventListener('fullscreenchange', fullscreenChange);
    const element = surface.current; element.addEventListener('webglcontextlost', contextLost);
    return () => {
      disposed = true; observer.disconnect(); preference.removeEventListener('change', reduce);
      document.removeEventListener('fullscreenchange', fullscreenChange); element.removeEventListener('webglcontextlost', contextLost);
      world.current?.dispose(); world.current = null;
    };
  }, []);
  function choose(id) { selection.current = id; setSelected(id); world.current?.select(id, { focus: true }); }
  function toggleMotion() { motion.current = paused; setPaused(!paused); world.current?.setMotion(motion.current, { userInitiated: true }); }
  async function toggleFullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await root.current.requestFullscreen?.(); } catch {} }
  async function openDiscussion(event) {
    if (document.fullscreenElement !== root.current) return;
    event.preventDefault();
    const destination = event.currentTarget.href;
    try { await document.exitFullscreen(); } catch {}
    location.assign(destination);
  }
  const story = stories.find(item => item.id === selected), discussion = community.discussions[story.discussionId - 1];
  return <div ref={root} className={'cyber-commons' + (ready ? ' is-ready' : '') + (hydrated ? ' is-hydrated' : '')}>
    <div className="world-stage">
      <picture><source media="(max-width: 899px)" srcSet="assets/community-world-mobile.webp"/><img className="world-fallback" src="assets/community-world.webp" alt={copy.worldAlt} aria-hidden={ready || undefined} width="1600" height="900" loading="lazy" decoding="async"/></picture>
      <canvas ref={surface} role="img" aria-hidden={!ready || undefined} aria-label={copy.canvasAlt}/>
      {children}
      <article className="world-dialogue" id="world-transcript" aria-live="polite" aria-atomic="true" aria-labelledby="world-question">
        <div className="world-dialogue-source"><span>{copy.discussionSource}</span><a href={'community.html#discussion-' + story.discussionId} onClick={openDiscussion}>{copy.discussionRecord}<ArrowUpRight size={13} aria-hidden="true"/></a></div>
        <h3 id="world-question">{story.question || discussion.question}</h3>
        <ol className="world-turns">{story.turns.map(turn => <li key={turn.label}><span>{turn.label}</span><p>{turn.text}</p></li>)}</ol>
        <p className="world-unresolved">{story.conclusion || discussion.conclusion}</p>
      </article>
      {ready && <p className="world-explore-hint" aria-hidden="true">{copy.worldHint}</p>}
      {ready && <div className="world-controls" role="group" aria-label={copy.worldControls}>
        <button type="button" onClick={() => world.current?.rotate(-1)} aria-label={copy.rotateLeft} title={copy.rotateLeft}><ChevronLeft size={17}/></button>
        <button type="button" onClick={() => world.current?.rotate(1)} aria-label={copy.rotateRight} title={copy.rotateRight}><ChevronRight size={17}/></button>
        <button type="button" onClick={() => world.current?.zoom(1)} aria-label={copy.zoomIn} title={copy.zoomIn}><Plus size={16}/></button>
        <button type="button" onClick={() => world.current?.zoom(-1)} aria-label={copy.zoomOut} title={copy.zoomOut}><Minus size={16}/></button>
        <button type="button" onClick={() => world.current?.reset()} aria-label={copy.resetView} title={copy.resetView}><RotateCcw size={15}/></button>
        <button type="button" onClick={toggleMotion} aria-label={paused ? copy.worldPlay : copy.worldPause} aria-pressed={paused} title={paused ? copy.worldPlay : copy.worldPause}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button>
        {canFullscreen && <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? copy.exitFullscreen : copy.fullscreen} title={fullscreen ? copy.exitFullscreen : copy.fullscreen}>{fullscreen ? <Minimize2 size={15}/> : <Maximize2 size={15}/>}</button>}
      </div>}
    </div>
    <div className="world-understage">
      <div className="world-navigation" role="group" aria-label={copy.chooseTopic}>{stories.map(item => <button key={item.id} type="button" onClick={() => choose(item.id)} aria-pressed={selected === item.id} aria-controls="world-transcript">{item.label}</button>)}</div>
      <p className="world-source-note">{copy.provenance}</p>
      <a className="world-next" href="#members" aria-label={copy.membersNext}><ChevronDown size={22} strokeWidth={1.3} aria-hidden="true"/></a>
    </div>
    <noscript><div className="world-static-links">{COMMONS_STORIES.map(item => <a key={item.id} href={'community.html#discussion-' + item.discussionId}>{item.label}：{community.discussions[item.discussionId - 1].question}</a>)}</div></noscript>
  </div>;
}
