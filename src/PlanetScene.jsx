import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Pause, Play } from 'lucide-react';
import community from 'agenthub:homepage-community';
import { useHomeLanguage } from './HomeLanguage';
import { createPlanetLights } from './planet-lights';

// One light per archived discussion, named by its direction.
const DIRECTIONS = community.discussions.map(item => item.tag);

// The original SpaceX Mars films carry the lighting, framing and rotation.
// Load only the appropriate film, when motion is wanted and the scene is visible.
export default function PlanetScene() {
  const { copy } = useHomeLanguage();
  const section = useRef(null), video = useRef(null), playback = useRef(null), poster = useRef(null), sky = useRef(null), copyBlock = useRef(null), bottom = useRef(null);
  const [hydrated, setHydrated] = useState(false);
  const [playing, setPlaying] = useState(false), [hasFrame, setHasFrame] = useState(false);

  useEffect(() => {
    const element = video.current;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width: 961px)');
    const connection = navigator.connection;
    let visible = false, disposed = false, seek = 0;
    let desired = !reduced.matches && !connection?.saveData;
    setHydrated(true);

    function source() { return 'assets/environment/mars-' + (narrow.matches ? 'portrait' : 'landscape') + '.mp4'; }
    function load() {
      if (element.getAttribute('src') === source()) return;
      seek = element.currentTime || 0;
      setHasFrame(false);
      element.src = source();
      element.load();
    }
    async function sync() {
      if (disposed) return;
      if (!visible || document.hidden || !desired) { element.pause(); return; }
      load();
      try { await element.play(); } catch { /* The matching poster remains available. */ }
      // A pending play() may settle after an observer or preference change.
      if (disposed || !visible || document.hidden || !desired) element.pause();
    }
    function ready() { if (!disposed) setHasFrame(true); }
    function metadata() {
      if (seek > 0 && Number.isFinite(element.duration)) element.currentTime = Math.min(seek, element.duration - .1);
    }
    function play() { if (!disposed) setPlaying(true); }
    function pause() { if (!disposed) setPlaying(false); }
    function error() { if (!disposed) { setHasFrame(false); setPlaying(false); } }
    function preference() { desired = !reduced.matches && !connection?.saveData; sync(); }
    function resize() {
      if (element.hasAttribute('src')) { element.pause(); load(); }
      sync();
    }
    playback.current = () => { desired = element.paused; sync(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); });
    observer.observe(section.current);
    reduced.addEventListener('change', preference);
    narrow.addEventListener('change', resize);
    connection?.addEventListener?.('change', preference);
    document.addEventListener('visibilitychange', sync);
    element.addEventListener('loadeddata', ready);
    element.addEventListener('loadedmetadata', metadata);
    element.addEventListener('play', play);
    element.addEventListener('pause', pause);
    element.addEventListener('error', error);
    return () => {
      disposed = true; playback.current = null; observer.disconnect();
      reduced.removeEventListener('change', preference);
      narrow.removeEventListener('change', resize);
      connection?.removeEventListener?.('change', preference);
      document.removeEventListener('visibilitychange', sync);
      element.removeEventListener('loadeddata', ready);
      element.removeEventListener('loadedmetadata', metadata);
      element.removeEventListener('play', play);
      element.removeEventListener('pause', pause);
      element.removeEventListener('error', error);
      element.pause(); element.removeAttribute('src'); element.load();
    };
  }, []);

  useEffect(() => {
    const lights = createPlanetLights(sky.current, poster.current, {
      tags: DIRECTIONS, avoid: () => [copyBlock.current, bottom.current].map(element => element.getBoundingClientRect()),
    });
    return () => lights?.dispose();
  }, []);

  return <section ref={section} id="about" className="planet-scene" aria-labelledby="planet-title">
    <div className="planet-media" aria-hidden="true">
      <picture><source media="(max-width: 961px)" srcSet="assets/environment/mars-portrait.jpg"/><img ref={poster} src="assets/environment/mars-landscape.jpg" alt="" width="1920" height="1080" loading="lazy" decoding="async"/></picture>
      <video ref={video} muted playsInline loop preload="none" tabIndex={-1} className={hasFrame ? 'has-frame' : ''}/>
      <canvas ref={sky} className="planet-lights"/>
    </div>
    <div className="planet-content">
      <div className="planet-copy" ref={copyBlock}>
        <h2 id="planet-title">{copy.planetHeading[0]}<br/>{copy.planetHeading[1]}</h2>
        <p>{copy.intro}</p>
        <div className="scene-actions"><a className="scene-button" href="/newspaper/">{copy.readDaily}</a><a className="scene-link" href="/newspaper/library/">{copy.library}</a></div>
      </div>
    </div>
    <div className="planet-bottom" ref={bottom}>
      <a className="planet-credit" href="assets/licenses/spacex-mars.txt" target="_blank" rel="noreferrer">Mars · SpaceX</a>
      <a className="planet-next" href="#collaborate" aria-label={copy.planetNext}><ChevronDown size={23} strokeWidth={1.3} aria-hidden="true"/></a>
      {hydrated && <button type="button" className="planet-motion" onClick={() => playback.current?.()} aria-label={playing ? copy.marsPause : copy.marsPlay} aria-pressed={!playing}>{playing ? <Pause size={13} aria-hidden="true"/> : <Play size={13} aria-hidden="true"/>}<span>{playing ? copy.pauseAnimation : copy.playAnimation}</span></button>}
    </div>
  </section>;
}
