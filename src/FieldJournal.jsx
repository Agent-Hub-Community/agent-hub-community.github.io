import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, ArrowUp, ArrowUpRight, ChevronLeft, ChevronRight, Search, X, createLucideIcon } from 'lucide-react';
import BrandWordmark from './BrandWordmark';
import ResearchPlate from './ResearchPlate';
import MemberLogo from './MemberLogo';
import community from 'agenthub:homepage-community';
import journal from './journal-content.json';
import { discussionSearchPreview, findTextMatches } from './journal-search';

const DAILY = '/newspaper/';
const publicationHref = url => url.replace(/^https:\/\/agent-hub-community\.github\.io\/newspaper\//, DAILY);
const GITHUB = 'https://github.com/Agent-Hub-Community';
const PAGE_SIZE = 3;
const pad = value => String(value).padStart(2, '0');

// Keep the shared plus geometry; expose its vertical stroke for the open state.
const DisclosureIndicator = createLucideIcon('DisclosureIndicator', [
  ['path', { d: 'M5 12h14', key: 'horizontal' }],
  ['path', { d: 'M12 5v14', className: 'fj-disclosure-axis', key: 'vertical' }]
]);

function TextLink({ href, children, external = false, className = '', ariaLabel }) {
  return <a className={'fj-text-link ' + className} href={href} data-direction={external ? 'external' : 'internal'} aria-label={ariaLabel}>
    <span>{children}</span>
    {external ? <ArrowUpRight size={17} aria-hidden="true"/> : <ArrowRight size={17} aria-hidden="true"/>}
  </a>;
}

function SectionHeading({ id, title, children, link }) {
  return <div className="fj-section-heading fj-reveal">
    <div><h2 id={id}>{title}</h2>{children && <p>{children}</p>}</div>
    {link}
  </div>;
}

function Daily() {
  const [lead, ...others] = journal.stories;
  return <section className="fj-daily fj-wrap" id="daily" aria-labelledby="daily-title">
    <SectionHeading id="daily-title" title="社群日报" link={<TextLink href={DAILY} external>阅读日报</TextLink>}>
      来自社群的论文、实验与一线经验。<span className="fj-edition">本期选读 <time dateTime={journal.edition}>{journal.editionLabel}</time></span>
    </SectionHeading>
    <a className="fj-feature fj-reveal" href={publicationHref(lead.url)}>
      <ResearchPlate kind={lead.art}/>
      <div className="fj-feature-copy"><span className="fj-story-category">{lead.category}</span><h3>{lead.title}</h3><p>{lead.description}</p><span className="fj-story-cta">阅读这篇讨论<ArrowUpRight size={18} aria-hidden="true"/></span></div>
    </a>
    <div className="fj-secondary-stories">
      {others.map(story => <a key={story.url} className="fj-secondary-story fj-reveal" href={publicationHref(story.url)}>
        <ResearchPlate kind={story.art}/><div><span className="fj-story-category">{story.category}</span><h3>{story.title}</h3><p>{story.description}</p><span className="fj-story-cta">阅读这篇讨论<ArrowUpRight size={17} aria-hidden="true"/></span></div>
      </a>)}
    </div>
    <div className="fj-daily-foot"><span>保留经验，也保留分歧。</span><TextLink href={publicationHref(journal.overview)} external>阅读本期完整日报</TextLink></div>
  </section>;
}

function Research() {
  return <section className="fj-research fj-section-tint" id="topics" aria-labelledby="research-title"><div className="fj-wrap">
    <SectionHeading id="research-title" title="研究方向">这些问题，来自社群讨论。</SectionHeading>
    <div className="fj-research-grid">
      {journal.topics.map(item => <a className="fj-topic fj-reveal" key={item.name} href={'#discussion-' + item.discussionId}>
        <div className="fj-topic-top"><ArrowUpRight size={19} aria-hidden="true"/></div>
        <h3>{item.name}</h3><p>{community.discussions[item.discussionId - 1].question}</p><span className="fj-topic-english" lang="en">{item.english}</span>
      </a>)}
    </div>
  </div></section>;
}

const filters = [
  { name: '全部', tags: null },
  { name: 'Agent 系统', tags: ['Harness', 'Agent 架构', 'Coding Agent', 'Personal Agent', 'Multi-agent', 'Subagent', 'Computer Use', 'Memory', '工具', 'Infra'] },
  { name: '评估与训练', tags: ['Eval', 'RL', 'RL 环境', 'Benchmark', 'Reasoning', 'Data', 'Distillation', 'RSI', '模型行为'] },
  { name: '科学与安全', tags: ['AI4Science', '数学', 'Safety', 'Alignment', '科研方法', '科研', 'Embodied'] }
];

// Curate the opening selection without changing the stable discussion IDs.
const allDiscussions = community.discussions.map((item, index) => ({ ...item, index }));
const highlightedIds = [...new Set(journal.discussionHighlights ?? [])]
  .filter(id => Number.isInteger(id) && id > 0 && id <= allDiscussions.length);
const highlightedSet = new Set(highlightedIds);
const orderedDiscussions = [
  ...highlightedIds.map(id => allDiscussions[id - 1]),
  ...allDiscussions.filter(item => !highlightedSet.has(item.index + 1))
];

function markedText(text, query) {
  const matches = findTextMatches(text, query);
  if (!matches.length) return text;
  const parts = [];
  let cursor = 0;
  for (const { start, end } of matches) {
    parts.push(text.slice(cursor, start), <mark key={start}>{text.slice(start, end)}</mark>);
    cursor = end;
  }
  parts.push(text.slice(cursor));
  return parts;
}

function DiscussionCard({ item, query = '' }) {
  const id = 'discussion-' + (item.index + 1);
  const preview = discussionSearchPreview(item, query);
  const Preview = preview === null ? 'q' : 'p';
  return <article className="fj-discussion" id={id}><details>
    <summary aria-labelledby={id + '-title'} aria-describedby={id + '-quote'}><span className="fj-discussion-tag">{markedText(item.tag, query)}</span><h3 id={id + '-title'}>{markedText(item.question, query)}</h3><Preview className="fj-discussion-preview" id={id + '-quote'}>{markedText(preview ?? item.quote, query)}</Preview><DisclosureIndicator size={21} aria-hidden="true"/></summary>
    <div className="fj-discussion-detail">{preview !== null && <q className="fj-discussion-original-quote">{item.quote}</q>}<p>{markedText(item.detail, query)}</p><div className="fj-discussion-conclusion"><span>讨论小结</span><p>{markedText(item.conclusion, query)}</p></div><TextLink href={'#' + id} className="fj-discussion-link" ariaLabel={'这则讨论的链接：' + item.question}>这则讨论的链接</TextLink></div>
  </details></article>;
}

function Discussions() {
  const [filter, setFilter] = useState(0);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [requestedDiscussion, setRequestedDiscussion] = useState(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);
  const paging = useRef(false);
  useLayoutEffect(() => {
    if (!paging.current) return;
    paging.current = false;
    const first = listRef.current?.querySelector('summary');
    if (!first) return;
    // A shorter page can leave the new excerpts above the viewport. Move the
    // reading position only when needed, and let keyboard reading start here.
    first.focus({ preventScroll: true });
    const bounds = first.getBoundingClientRect();
    const offset = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    if (bounds.top < offset || bounds.bottom > window.innerHeight) {
      first.scrollIntoView({ block: 'start', behavior: 'instant' });
    }
  }, [page]);
  useEffect(() => {
    const followDiscussion = () => {
      const match = location.hash.match(/^#discussion-(\d+)$/);
      if (!match) return;
      const index = Number(match[1]) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= community.discussions.length) return;
      const position = orderedDiscussions.findIndex(item => item.index === index);
      setFilter(0); setQuery(''); setPage(Math.floor(position / PAGE_SIZE));
      setRequestedDiscussion(index);
    };
    // Browsing the archive can unmount the current fragment's article. A second
    // click on the same fragment must still restore its page and open it.
    const repeatCurrentLink = event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
      const anchor = event.target.closest?.('a[href^="#discussion-"]');
      if (anchor && anchor.getAttribute('href') === location.hash) {
        event.preventDefault();
        followDiscussion();
      }
    };
    followDiscussion();
    window.addEventListener('hashchange', followDiscussion);
    document.addEventListener('click', repeatCurrentLink);
    return () => {
      window.removeEventListener('hashchange', followDiscussion);
      document.removeEventListener('click', repeatCurrentLink);
    };
  }, []);
  useEffect(() => {
    if (requestedDiscussion === null) return;
    const article = document.getElementById('discussion-' + (requestedDiscussion + 1));
    if (!article) return;
    article.querySelector('details').open = true;
    article.querySelector('summary').focus({ preventScroll: true });
    article.scrollIntoView({ block: 'start', behavior: 'instant' });
    setRequestedDiscussion(null);
  }, [requestedDiscussion, page, filter, query]);
  const items = useMemo(() => orderedDiscussions.filter(item =>
    (!filters[filter].tags || filters[filter].tags.includes(item.tag)) &&
    (!query.trim() || [item.tag, item.question, item.quote, item.detail, item.conclusion].join(' ').toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
  ), [filter, query]);
  const pages = Math.ceil(items.length / PAGE_SIZE);
  function reset() { setFilter(0); setQuery(''); setPage(0); searchRef.current?.focus(); }
  function turnPage(direction) { paging.current = true; setPage(value => value + direction); }
  return <section className="fj-discussions fj-wrap" id="discussions" aria-labelledby="discussions-title">
    <SectionHeading id="discussions-title" title="讨论摘录" link={<TextLink href={DAILY + 'search/'} external>搜索全部日报</TextLink>}>
      {community.discussions.length} 则社群交流摘录。从实验怎么复现，到手头的项目怎么推进。
    </SectionHeading>
    <div className="fj-archive-tools">
      <div className="fj-filters" role="group" aria-label="筛选讨论话题">{filters.map((item, index) => <button type="button" key={item.name} aria-pressed={filter === index} onClick={() => { setFilter(index); setPage(0); }}>{item.name}</button>)}</div>
      <div className="fj-search"><Search size={17} aria-hidden="true"/><input ref={searchRef} aria-label="搜索讨论摘录" type="search" placeholder="搜索讨论" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }}/>{query && <button type="button" aria-label="清空搜索" onClick={() => { setQuery(''); setPage(0); searchRef.current?.focus(); }}><X size={16} aria-hidden="true"/></button>}</div>
    </div>
    <div className="fj-archive-status" role="status">{items.length} 则讨论{items.length > 0 && <span>显示 {page * PAGE_SIZE + 1}–{Math.min(items.length, (page + 1) * PAGE_SIZE)}</span>}</div>
    {items.length ? <div className="fj-discussion-list" ref={listRef}>{items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE).map(item => <DiscussionCard item={item} query={query} key={item.index}/>)}</div> : <div className="fj-no-results"><h3>没有找到相关讨论。</h3><p>试试其他关键词，或在日报中继续查找。</p><div><button type="button" className="fj-button" onClick={reset}>重置筛选</button><TextLink href={DAILY + 'search/'} external>搜索全部日报</TextLink></div></div>}
    {items.length > 0 && <div className="fj-archive-bottom"><p>点击问题，展开完整摘录。</p><div className="fj-pagination"><span><span className="visually-hidden">第 {page + 1} 页，共 {pages} 页</span><span aria-hidden="true">{pad(page + 1)}<i> / {pad(pages)}</i></span></span><button type="button" aria-label="上一组讨论" disabled={page === 0} onClick={() => turnPage(-1)}><ChevronLeft size={19} aria-hidden="true"/></button><button type="button" aria-label="下一组讨论" disabled={page >= pages - 1} onClick={() => turnPage(1)}><ChevronRight size={19} aria-hidden="true"/></button></div></div>}
    <noscript><div className="fj-static-archive">{orderedDiscussions.slice(PAGE_SIZE).map(item => <DiscussionCard key={item.index} item={item}/>)}</div></noscript>
  </section>;
}

function Community() {
  const formats = [
    ['论文与项目分享', '一起读论文、看实验，讨论方法与实现细节。'],
    ['Coffee chat', '围绕共同的问题，小范围、面对面地聊一聊。'],
    ['跨学科交流', '让数学、物理等领域的问题与 Agent 研究相遇。'],
    ['研究与职业交流', '分享科研、求职和创业中的经验与选择。']
  ];
  return <section className="fj-community fj-section-tint" id="events" aria-labelledby="events-title"><div className="fj-wrap">
    <div className="fj-community-layout">
      <div className="fj-community-intro fj-reveal"><h2 id="events-title">论文之外，<br/>还有做研究的人。</h2><p>聊新发现，也聊没复现的结果。<br/>有时交流从一个具体的问题开始，有时只是想知道，别人碰到这个问题时是怎么想的。</p><TextLink href="#discussions">看看大家在聊什么</TextLink></div>
      <figure className="fj-voice fj-reveal"><span className="fj-voice-mark" aria-hidden="true">“</span><blockquote>{community.discussions[3].quote.split('，').map((part, index, parts) => <span className="fj-voice-line" key={index}>{part}{index < parts.length - 1 ? '，' : '。'}</span>)}</blockquote><figcaption><span>社群讨论摘录<span>关于形式化验证与人的理解</span></span><a href="#discussion-4" aria-label="阅读关于形式化验证的完整讨论"><ArrowRight size={20} aria-hidden="true"/></a></figcaption></figure>
    </div>
    <div className="fj-gatherings-heading"><h3>把交流继续下去。</h3><p>也欢迎你来发起</p></div>
    <div className="fj-gatherings">{formats.map(([title, description]) => <article className="fj-reveal" key={title}><div><h3>{title}</h3><p>{description}</p></div></article>)}</div>
    <div className="fj-members">
      <div className="fj-members-heading"><h3>不同的来处，共同的好奇。</h3><p>成员来自基模团队、科研机构与高校。</p></div>
      <ul className="fj-member-grid" aria-label="部分成员所在机构与高校">{community.featuredInstitutions.map(item => <li key={item.title} title={item.title}><MemberLogo item={item}/><span className="fj-member-name">{item.title}</span></li>)}</ul>
      <details className="fj-member-directory"><summary><span>查看全部成员所在机构与高校</span><DisclosureIndicator size={17} aria-hidden="true"/></summary><div className="fj-directory-columns">{community.institutions.map((row, index) => <div key={index}><h4>{index === 0 ? '团队与科研机构' : '高校'}</h4><ul>{row.map(name => <li key={name}>{name}</li>)}</ul></div>)}</div></details>
    </div>
  </div></section>;
}

function Join() {
  return <section className="fj-join fj-wrap" id="join" aria-labelledby="join-title">
    <div className="fj-join-layout fj-reveal">
      <div><h2 id="join-title">带着你的问题，<br/>来聊聊。</h2></div>
      <div className="fj-join-copy">
        <p>如果你也在研究 Agent、做产品，<br/>或想认真探索它能做什么，欢迎加入。</p>
        <p>社群采用成员邀请制，可通过现有成员推荐加入。论文分享、活动合作与内容共建，也欢迎通过 GitHub 联系我们。</p>
        <div className="fj-join-actions"><a href={GITHUB} className="fj-button">在 GitHub 找到我们<ArrowUpRight size={17} aria-hidden="true"/></a></div>
      </div>
    </div>
  </section>;
}

export function JournalFooter() {
  return <footer className="field-journal fj-footer"><div className="fj-wrap">
    <div className="fj-footer-main">
      <p>让做 Agent 的人彼此找到。</p>
      <nav aria-label="页脚导航">
        <a href={DAILY}>社群日报<ArrowUpRight size={14} aria-hidden="true"/></a>
        <a href={DAILY + 'library/'}>资料库<ArrowUpRight size={14} aria-hidden="true"/></a>
        <a href={DAILY + 'feed.xml'}>RSS<ArrowUpRight size={14} aria-hidden="true"/></a>
        <a href={GITHUB}>GitHub<ArrowUpRight size={14} aria-hidden="true"/></a>
      </nav>
    </div>
    <a href="./" className="fj-footer-brand" aria-label="Agent Hub 首页"><BrandWordmark/></a>
    <div className="fj-footer-bottom">
      <span className="fj-footer-motto" lang="en"><em>Human</em><span>×</span>Agent</span>
      <a href="#root">回到顶部<ArrowUp size={15} aria-hidden="true"/></a>
    </div>
  </div></footer>;
}

export default function FieldJournal() {
  const ref = useRef(null);
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches || !('IntersectionObserver' in window)) return;
    const root = ref.current;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-seen'); observer.unobserve(entry.target); }
      });
    }, { threshold: .04 });
    const drawingObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.closest('.fj-plate').classList.add('is-drawn');
          drawingObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -48px 0px' });
    const revealImmediately = element => {
      element.classList.add('is-seen', 'is-instant');
      observer.unobserve(element);
    };
    // Deliberate navigation should arrive at readable content immediately.
    const followHash = () => {
      let id;
      try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
      const section = document.getElementById(id)?.closest('section');
      if (section && root.contains(section)) section.querySelectorAll('.fj-reveal').forEach(revealImmediately);
    };
    const followFocus = event => {
      const element = event.target.closest?.('.fj-reveal');
      if (element && root.contains(element)) revealImmediately(element);
    };
    root.querySelectorAll('.fj-reveal').forEach(element => observer.observe(element));
    // Watch the connector itself: the full illustration may exceed the viewport.
    root.querySelectorAll('.fj-plate-harness .plate-routes').forEach(element => drawingObserver.observe(element));
    followHash();
    root.classList.add('fj-motion');
    window.addEventListener('hashchange', followHash);
    root.addEventListener('focusin', followFocus);
    const stopMotion = () => { if (media.matches) ref.current?.classList.remove('fj-motion'); };
    media.addEventListener('change', stopMotion);
    return () => {
      observer.disconnect(); drawingObserver.disconnect();
      window.removeEventListener('hashchange', followHash);
      root.removeEventListener('focusin', followFocus);
      media.removeEventListener('change', stopMotion);
    };
  }, []);
  return <div className="field-journal" ref={ref}><Daily/><Research/><Discussions/><Community/><Join/></div>;
}
