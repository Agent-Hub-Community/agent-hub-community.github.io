import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import MediaPanel from './MediaPanel';
import { MagneticGlyph, MicroArrow } from './amicro/MicroInteractions';
import media from './media-content.json';

export const topics = [
  ['RSI', '从数据、评估和训练诊断入手，讨论模型自我改进的方法与实验结果。'],
  ['Agent harness', '讨论模型与工具、记忆及环境的协作方式，交流系统设计经验，也关注模型能力变化对设计的影响。'],
  ['Eval 与 RL', '交流评估方法及训练、推理中的工程经验，分析指标能够反映的问题与局限。'],
  ['AI4Science', '与数学、物理等领域的研究者交流，讨论 Agent 在科研任务中的应用。'],
  ['AI Safety', '讨论复杂长任务中的过程控制、模型对齐与审计问题。'],
  ['论文与项目', '分享成员及同行的论文和项目，讨论方法设计、实验结果与待解决的问题。']
];
const pad = n => String(n).padStart(2, '0');

function useDesktopStory() {
  const [desktop, setDesktop] = useState(false);
  useEffect(() => {
    const query = matchMedia('(min-width: 64rem) and (min-height: 780px) and (prefers-reduced-motion: no-preference)');
    const update = () => setDesktop(query.matches);
    update();query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return desktop;
}

export function Topics() {
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const desktop = useDesktopStory();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const progress = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const imageY = useTransform(scrollYProgress, [0, 1], [18, -18]);
  useMotionValueEvent(scrollYProgress, 'change', value => {
    if (desktop) setActive(Math.min(topics.length - 1, Math.floor(Math.max(0, value) * topics.length)));
  });
  const select = index => {
    setActive(index);
    if (desktop && ref.current) {
      const box = ref.current.getBoundingClientRect();
      const range = Math.max(0, box.height - innerHeight);
      window.scrollTo({ top: box.top + scrollY + range * (index + .35) / topics.length, behavior: 'instant' });
    }
  };
  return <section className="topics-section editorial-topics" id="topics" aria-labelledby="topics-heading">
    <div className="wrap chapter-heading"><div><span className="chapter-kicker">01 / RESEARCH</span><h2 id="topics-heading">研究方向</h2></div><p>围绕 LLM Agent 的研究与实践，<br/>交流方法、实验和工程经验。</p></div>
    <div ref={ref} className="topic-story"><div className="wrap topic-sticky">
      <div className="topic-scene">
        <motion.div className="topic-visual" style={reduce ? {} : { y: imageY }}><MediaPanel items={media.topics} active={active} onSelect={select}/></motion.div>
        <div className="topic-narrative">
          <div className="topic-folio"><span>研究方向</span><span>{pad(active + 1)} / {pad(topics.length)}</span></div>
          <div className="topic-detail" aria-live="polite">{topics.map(([title, text], index) => <div key={title} id={'topic-detail-' + index} className={'topic-chapter' + (active === index ? ' is-active' : '')}><span className="topic-ghost" aria-hidden="true">{pad(index + 1)}</span><h3>{title}</h3><p>{text}</p></div>)}</div>
          <div className="topic-navigation" role="group" aria-label="选择研究方向">{topics.map(([title], index) => <button type="button" key={title} className={'topic-tab' + (active === index ? ' is-active' : '')} aria-label={title} aria-pressed={active === index} aria-describedby={'topic-detail-' + index} onClick={() => select(index)}><span>{pad(index + 1)}</span><span>{title}</span></button>)}</div>
          <div className="topic-reading-hint" aria-hidden="true"><span className="scroll-track"><motion.i style={reduce ? {} : { scaleX: progress }}/></span></div>
        </div>
      </div>
    </div></div>
  </section>;
}

export function ChapterTransition() {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['12%', '-12%']);
  const line = useTransform(scrollYProgress, [0, .8], [.05, 1]);
  return <div className="chapter-transition" ref={ref} aria-hidden="true"><motion.div className="transition-word" style={reduce ? {} : { x }}>COMMUNITY</motion.div><motion.div className="transition-rule" style={reduce ? {} : { scaleX: line }}/></div>;
}

const events = [
  ['线上分享', '介绍研究方法和实验结果，并讨论实现细节。', '线上'],
  ['研究与职业交流', '交流研究、求职和创业经历，分享职业选择中的经验。', '经验交流'],
  ['Coffee chat', '面向共同话题的小范围线下交流，北京优先。', '线下'],
  ['跨学科交流', '邀请其他学科的研究者介绍领域问题，讨论 AI 与相关研究的结合方式。', '跨学科']
];

function ActivitySlide({ index, progress, reduce }) {
  const [title, description, format] = events[index];
  const image = media.events[index];
  const y = useTransform(progress, [0, 1], [index * 12, (index - 3) * 12]);
  return <article className="activity-slide" aria-label={title}>
    <motion.figure className="activity-image" style={reduce ? {} : { y }}>
      {image.src ? <img src={image.src} alt={image.alt} width="1400" height="1200" loading="lazy"/> : <div className="activity-empty" aria-hidden="true"><ImageIcon size={22} strokeWidth={1}/><span className="image-registration"><i/><i/><i/><i/></span><span className="activity-image-number">{pad(index + 1)}</span><span className="activity-image-label">{title}</span></div>}
      <span className="activity-format">{format}</span>
    </motion.figure>
    <div className="activity-caption"><span className="activity-number">{pad(index + 1)}</span><div><h3>{title}</h3><p>{description}</p></div><ArrowUpRight className="activity-arrow" size={24} strokeWidth={1}/></div>
  </article>;
}

export function Events() {
  const ref = useRef(null);
  const viewport = useRef(null);
  const track = useRef(null);
  const [travel, setTravel] = useState(0);
  const [active, setActive] = useState(0);
  const desktop = useDesktopStory();
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -travel]);
  useMotionValueEvent(scrollYProgress, 'change', value => { if (desktop) setActive(Math.min(3, Math.round(value * 3))); });
  useEffect(() => {
    const measure = () => setTravel(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    const observer = new ResizeObserver(measure);observer.observe(viewport.current);measure();
    return () => observer.disconnect();
  }, []);
  const select = index => {
    setActive(index);
    if (desktop) {
      const box = ref.current.getBoundingClientRect();
      window.scrollTo({ top: box.top + scrollY + (box.height - innerHeight) * index / 3, behavior: 'instant' });
    } else {
      const slide = track.current.children[index];
      viewport.current.scrollTo({ left: slide.offsetLeft - track.current.children[0].offsetLeft, behavior: reduce ? 'instant' : 'smooth' });
    }
  };
  const onScroll = () => {
    if (!desktop && track.current?.children.length) {
      const slides = [...track.current.children];
      setActive(slides.reduce((closest, slide, index) => Math.abs(slide.offsetLeft - slides[0].offsetLeft - viewport.current.scrollLeft) < Math.abs(slides[closest].offsetLeft - slides[0].offsetLeft - viewport.current.scrollLeft) ? index : closest, 0));
    }
  };
  return <section className="editorial-events" id="events" aria-labelledby="events-heading">
    <div className="wrap chapter-heading"><div><span className="chapter-kicker">03 / GATHERINGS</span><h2 id="events-heading">交流活动</h2></div><p>计划开展线上分享与小范围线下交流。<br/>欢迎成员提出选题，参与组织。</p></div>
    <div className="activity-story" ref={ref}><div className="activity-sticky">
      <div className="activity-viewport" ref={viewport} onScroll={onScroll} tabIndex="0" role="region" aria-label="活动图文画廊" onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault();select(Math.min(3, Math.max(0, active + (event.key === 'ArrowRight' ? 1 : -1)))); } }}>
        <motion.div ref={track} className="activity-track" style={desktop ? { x } : { x: 0 }}>{events.map((_, index) => <ActivitySlide key={index} index={index} progress={scrollYProgress} reduce={reduce}/>)}</motion.div>
      </div>
      <div className="wrap activity-bottom"><div className="activity-progress" role="group" aria-label="选择交流活动">{events.map(([title], index) => <button type="button" key={title} aria-label={title} aria-pressed={active === index} onClick={() => select(index)}><span>{pad(index + 1)}</span><i className={active === index ? 'is-active' : ''}/></button>)}</div><div className="activity-controls"><button type="button" aria-label="上一项活动" disabled={active === 0} onClick={() => select(active - 1)}><MagneticGlyph><ChevronLeft size={20}/></MagneticGlyph></button><button type="button" aria-label="下一项活动" disabled={active === 3} onClick={() => select(active + 1)}><MagneticGlyph><ChevronRight size={20}/></MagneticGlyph></button><a href="#join">参与组织<MicroArrow size={17}/></a></div></div>
    </div></div>
  </section>;
}
