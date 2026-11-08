import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { MotionConfig } from 'motion/react';
import SiteHeader from './SiteHeader';
import ThemeToggle from './ThemeToggle';
import FieldJournal, { JournalFooter } from './FieldJournal';
import './fonts.css';
import './site.css';
import './field-journal.css';
import './module-header.css';
import './community-page.css';

export function CommunityApp() {
  return <MotionConfig reducedMotion="user">
    <a className="skip-link" href="#daily">跳转到主要内容</a>
    <SiteHeader reading/><ThemeToggle/>
    <main>
      <section className="archive-intro field-journal" id="about" aria-labelledby="archive-title"><div className="fj-wrap"><a href="./" className="archive-home">返回首页</a><h1 id="archive-title">一起研究 Agent。</h1><p>从一篇论文、一个问题开始。这里保留我们的讨论、分享与加入方式。</p></div></section>
      <FieldJournal/>
    </main>
    <JournalFooter/>
  </MotionConfig>;
}

if (typeof document !== 'undefined') hydrateRoot(document.getElementById('root'), <CommunityApp/>);
