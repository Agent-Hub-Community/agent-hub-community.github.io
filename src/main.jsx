import React, { useEffect, useId, useMemo, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { MotionConfig, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Github, Menu, X } from 'lucide-react';
import BrandWordmark from './BrandWordmark';
import GenesisHero from './GenesisHero';
import { IconSwap, MagneticGlyph, MicroArrow, RollingLabel } from './amicro/MicroInteractions';
import { ChapterTransition, Events, Topics } from './EditorialSections';
import LogoLoop from './react-bits/LogoLoop';
import ScrollReveal from './react-bits/ScrollReveal';
import ScrollFloat from './react-bits/ScrollFloat';
import { WarmTooltipGroup } from './react-bits/WarmTooltip';
import { AccordionMark, PageCounter, PageProgress, Tip } from './MicroUI';
import data from './community-data.json';
import './fonts.css';
import './site.css';
import './micro-ui.css';
import './editorial.css';

const DAILY = 'https://agent-hub-community.github.io/newspaper/';
const GITHUB = 'https://github.com/Agent-Hub-Community';
const JOIN_FORM = 'join-example.html'; // Replace with the official application form when available.

function Reveal({ children, className = '' }) {
  const reduce = useReducedMotion();
  return <motion.div className={className} initial={false} whileInView={reduce ? {} : { opacity: [.2, 1], y: [28, 0] }} viewport={{ once: true, amount: .15 }} transition={{ duration: .8, ease: [.22, 1, .36, 1] }}>{children}</motion.div>;
}

function Header({ visible }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  useEffect(() => { if (!visible) setOpen(false); }, [visible]);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: '-15% 0px -65% 0px' });
    document.querySelectorAll('section[id]').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  return <header className={'site-header' + (visible ? ' is-visible' : '')}>
    <div className="wrap header-inner">
      <a href="#" className="brand" aria-label="Agent Hub 首页"><img src="assets/agenthub-icon.webp" alt="" width="30" height="30"/><BrandWordmark/></a>
      <nav className={'nav' + (open ? ' is-open' : '')} aria-label="页面导航">
        {[['about', '我们'], ['topics', '话题'], ['discussions', '讨论'], ['events', '活动']].map(([id, name]) => <a key={id} href={'#' + id} aria-current={active === id ? 'location' : undefined} onClick={() => setOpen(false)}>{name}</a>)}
      </nav>
      <div className="header-actions">
        <Tip label="GitHub 社区" side="bottom" className="github-tip"><a href={GITHUB} className="github-link" aria-label="GitHub 社区"><MagneticGlyph><Github size={17} strokeWidth={1.5}/></MagneticGlyph></a></Tip>
        <a href={DAILY} className="header-daily"><RollingLabel>社群日报</RollingLabel></a>
        <button type="button" className="menu-toggle" aria-label={open ? '关闭导航' : '打开导航'} aria-expanded={open} onClick={() => setOpen(!open)}><IconSwap state={open}>{open ? <X size={20}/> : <Menu size={20}/>}</IconSwap></button>
      </div>
    </div>
  </header>;
}

function About() {
  return <section className="section about" id="about"><div className="wrap">
    <ScrollReveal splitBy="chars" enableBlur={false} baseOpacity={.2} baseRotation={0} stagger={.025} smoothing={.25} wordAnimationEnd="bottom 62%" containerClassName="community-statement" textClassName="statement-text">聚焦 LLM Agent 的研究与应用。</ScrollReveal>
    <Reveal className="about-foot"><p>社群设有四个讨论群，内容涵盖模型评估与训练、Agent 架构和科研应用。成员分享论文和项目，也交流实验与工程中的具体问题。</p><a href="#join" className="quiet-link">加入社群</a></Reveal>
  </div></section>;
}

function MemberLogo({ item }) {
  const uid = useId().replace(/[^a-z0-9]/gi, '');
  const html = useMemo(() => {
    let markup = item.html;
    for (const match of item.html.matchAll(/\bid="([^"]+)"/g)) {
      const id = match[1], unique = uid + '-' + id;
      markup = markup.replaceAll('id="' + id + '"', 'id="' + unique + '"').replaceAll('url(#' + id + ')', 'url(#' + unique + ')');
    }
    return markup;
  }, [item, uid]);
  return <span className={'member-logo ' + item.className}><span dangerouslySetInnerHTML={{ __html: html }}/></span>;
}

function Members() {
  const rows = useMemo(() => data.logos.map(row => row.map(item => ({ node: <MemberLogo item={item}/>, title: item.title, ariaLabel: item.title }))), []);
  return <section className="members" aria-labelledby="members-title"><div className="wrap">
    <Reveal className="members-intro"><h2 id="members-title">成员所在的团队与高校</h2><p>成员中有基模团队的研究员，也有高校的青年教授和博士。我们正邀请自然科学领域的学者加入，交流 AI4Science、RSI 和 AI Safety。</p></Reveal>
    <div className="logo-loops"><LogoLoop logos={rows[0]} speed={10} logoHeight={25} gap={58} labels="hover" intro={false} pauseOnHover ariaLabel="成员所在团队"/><LogoLoop logos={rows[1]} speed={9} direction="right" logoHeight={26} gap={50} labels="hover" intro={false} pauseOnHover ariaLabel="成员所在高校"/></div>
  </div></section>;
}

const filters = [
  { name: '全部', tags: null },
  { name: 'Agent', tags: ['Harness', 'Agent 架构', 'Coding Agent', 'Personal Agent', 'Multi-agent', 'Subagent', 'Computer Use', 'Memory'] },
  { name: '评估与训练', tags: ['Eval', 'RL', 'RL 环境', 'Benchmark', 'Reasoning', 'Data', 'Distillation'] },
  { name: '科学与安全', tags: ['AI4Science', '数学', 'Safety', 'Alignment'] }
];

function Discussion({ item, position }) {
  const [expanded, setExpanded] = useState(false);
  const reduce = useReducedMotion();
  const id = 'discussion-' + item.index;
  return <motion.article className={'discussion-card' + (position === 0 ? ' discussion-card--lead' : '') + (expanded ? ' is-expanded' : '')} initial={false} whileInView={reduce ? {} : { y: [position === 0 ? 40 : 64, 0], rotate: [position === 0 ? -1 : 1, 0] }} viewport={{ once: true, amount: .15 }} transition={{ duration: .8, delay: position * .08, ease: [.16, 1, .3, 1] }}>
    <div className="discussion-meta"><span>{item.tag}</span><span>摘录 / {String(item.index + 1).padStart(2, '0')}</span></div>
    <h3>{item.question}</h3>
    <blockquote><span className="discussion-quote-mark" aria-hidden="true">“</span><p>{item.quote}</p></blockquote>
    <div className="discussion-takeaway"><span>讨论小结</span><p>{item.conclusion}</p></div>
    <div id={id} className="discussion-detail-frame" aria-hidden={!expanded}><div className="discussion-detail"><div className="discussion-detail-inner"><span className="discussion-detail-label">交流摘录</span><p>{item.detail}</p></div></div></div>
    <button type="button" className="discussion-trigger" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(!expanded)} aria-label={(expanded ? '收起讨论：' : '展开讨论：') + item.question}><span>{expanded ? '收起讨论' : '阅读讨论'}</span><AccordionMark/></button>
  </motion.article>;
}

function Discussions() {
  const [filter, setFilter] = useState(0);
  const [page, setPage] = useState(0);
  const items = useMemo(() => data.discussions.map((item, index) => ({ ...item, index })).filter(item => !filters[filter].tags || filters[filter].tags.includes(item.tag)), [filter]);
  const pages = Math.ceil(items.length / 3);
  return <section className="section discussions-section" id="discussions"><div className="wrap">
    <div className="chapter-heading discussion-heading"><div><span className="chapter-kicker">02 / DISCUSSIONS</span><h2 className="section-title">讨论摘录</h2></div><div><p>社群交流中的问题与观点，按主题整理。</p><a href={DAILY} className="quiet-link"><RollingLabel>阅读完整日报</RollingLabel><MicroArrow size={17}/></a></div></div>
    <div className="discussion-toolbar"><div className="filter-tabs" role="group" aria-label="筛选讨论话题">{filters.map((item, index) => <button type="button" key={item.name} className={filter === index ? 'is-active' : ''} aria-pressed={filter === index} onClick={() => { setFilter(index); setPage(0); }}>{item.name}{filter === index && <motion.span className="filter-underline" layoutId="discussion-filter" aria-hidden="true" transition={{ duration: .22, ease: [.16, 1, .3, 1] }}/>}</button>)}</div><span className="discussion-count">{items.length} 则摘录</span></div>
    <div className="discussion-list discussion-spread" key={filter + '-' + page} aria-live="polite">{items.slice(page * 3, page * 3 + 3).map((item, position) => <Discussion key={item.index} item={item} position={position}/>)}</div>
    <div className="discussion-bottom"><p>摘自社群交流，保留讨论中的不同观点。</p><div className="pagination"><PageCounter value={page + 1} total={pages}/><Tip label={page === 0 ? '已经是第一组' : '上一组讨论'}><button type="button" aria-label="上一组讨论" disabled={page === 0} onClick={() => setPage(page - 1)}><MagneticGlyph><ChevronLeft size={18}/></MagneticGlyph></button></Tip><Tip label={page >= pages - 1 ? '已经是最后一组' : '下一组讨论'}><button type="button" aria-label="下一组讨论" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}><MagneticGlyph><ChevronRight size={18}/></MagneticGlyph></button></Tip></div></div>
  </div></section>;
}

function Daily() {
  const reduce = useReducedMotion();
  return <section className="daily-chapter" id="daily"><div className="wrap">
    <div className="daily-layout"><div><ScrollFloat containerClassName="daily-float" textClassName="daily-title" distance={56} stretch={1.1} ease="power3.out" scrollStart="top 95%" scrollEnd="top 60%" stagger={.05} smoothing={.2}>社群日报</ScrollFloat><a href={DAILY} className="editorial-link"><RollingLabel>阅读日报</RollingLabel><MicroArrow/></a></div><Reveal className="daily-copy"><p>社群讨论与外部资讯的日常整理。</p><span>日报整理前一天的群内讨论与外部资讯。<br/>每周一发布周报，汇总一周的内容。</span></Reveal></div>
    <motion.div className="daily-rule" aria-hidden="true" initial={false} whileInView={reduce ? {} : { scaleX: [.05, 1] }} viewport={{ once: true }} transition={{ duration: 1.2, ease: [.16, 1, .3, 1] }}/>
    <div className="daily-foot"><span>Agent Hub Newspaper</span></div>
  </div></section>;
}

function Join() {
  return <section className="section join-section" id="join"><div className="wrap join-layout">
    <div><ScrollFloat containerClassName="join-float" textClassName="join-title" distance={56} stretch={1.1} ease="power3.out" scrollStart="top 95%" scrollEnd="top 60%" stagger={.05} smoothing={.2}>加入社群</ScrollFloat><a href={JOIN_FORM} className="join-form-link"><RollingLabel>填写入群申请</RollingLabel><MicroArrow size={28}/></a><p className="join-form-note"><span>示例表单</span>正式申请入口待更新</p></div>
    <Reveal className="join-copy"><p>社群采用成员邀请制。从事 Agent 相关研究或工程工作的朋友，可通过现有成员推荐加入。</p><p>活动合作或内容共建，可在 <a href={GITHUB}>GitHub</a> 联系我们。</p><div className="community-note"><p>社群以技术讨论为主，欢迎基于论文、代码和实验结果交流不同观点。</p></div></Reveal>
  </div></section>;
}

function Footer() {
  return <footer className="site-footer"><div className="wrap footer-inner"><a className="footer-brand" href="#" aria-label="Agent Hub 首页"><BrandWordmark/></a><p>LLM Agent 研究者社群</p><div><a href={DAILY}>日报</a><a href={GITHUB}>GitHub</a><a href="#">回到顶部</a></div></div></footer>;
}

export function App() {
  const [interfaceVisible, setInterfaceVisible] = useState(false);
  return <MotionConfig reducedMotion="user"><WarmTooltipGroup delay={850} warmWindow={250} lean={0}><a className="skip-link" href="#about">跳转到主要内容</a><Header visible={interfaceVisible}/><main><GenesisHero onInterfaceChange={setInterfaceVisible}/><About/><Topics/><ChapterTransition/><Discussions/><Events/><Members/><Daily/><Join/></main><Footer/><PageProgress visible={interfaceVisible}/></WarmTooltipGroup></MotionConfig>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root'), <App/>);
