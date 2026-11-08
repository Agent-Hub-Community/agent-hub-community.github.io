import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import BrandWordmark from './BrandWordmark';
import { LanguageSwitch, useHomeLanguage } from './HomeLanguage';

export default function SiteHeader({ reading = false }) {
  const { copy } = useHomeLanguage();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef(null), menu = useRef(null);
  const community = reading ? '' : 'community.html';
  const navigation = [
    ['/newspaper/', copy.nav[0]], ['/newspaper/library/', copy.nav[1]],
    [community + '#topics', copy.nav[2]], [community + '#discussions', copy.nav[3]],
    [reading ? '#events' : '#members', copy.nav[4]],
  ];
  useEffect(() => {
    const desktop = matchMedia('(min-width: 901px)');
    const resize = () => { if (desktop.matches) setOpen(false); };
    const scroll = () => setScrolled(window.scrollY > 30);
    scroll();
    desktop.addEventListener('change', resize);
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { desktop.removeEventListener('change', resize); window.removeEventListener('scroll', scroll); };
  }, []);
  useLayoutEffect(() => {
    if (!open) return;
    const list = header.current?.querySelector('.nav');
    if (list) list.scrollTop = 0;
    list?.querySelector('a')?.focus({ preventScroll: true });
    const dismiss = event => {
      if (event.type === 'keydown' && event.key === 'Escape') { setOpen(false); menu.current?.focus(); }
      if (event.type === 'pointerdown' && !header.current?.contains(event.target)) setOpen(false);
      if (event.type === 'focusin' && !header.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('keydown', dismiss);
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('focusin', dismiss);
    return () => { document.removeEventListener('keydown', dismiss); document.removeEventListener('pointerdown', dismiss); document.removeEventListener('focusin', dismiss); };
  }, [open]);
  return <header ref={header} className={'site-header module-header is-visible ' + (reading ? 'journal-header' : 'cinema-header') + (scrolled ? ' is-scrolled' : '') + (open ? ' menu-open' : '')}>
    <div className="header-inner cinema-wrap">
      <a className="brand" href={reading ? './' : '#cover'} aria-label={copy.home}><img src="assets/agenthub-icon.webp" alt="" width="28" height="28"/><BrandWordmark/></a>
      <nav id="site-navigation" className={'nav' + (open ? ' is-open' : '')} aria-label={copy.navigation}>
        {navigation.map(([href, label]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        {!reading && <a className="nav-join" href={community + '#join'} onClick={() => setOpen(false)}>{copy.join}</a>}
      </nav>
      <div className="header-actions">
        <a className="header-join" href={community + '#join'} onClick={() => setOpen(false)}>{copy.join}</a>
        {!reading && <LanguageSwitch/>}
        <button ref={menu} className="menu-toggle" type="button" aria-label={open ? copy.menuClose : copy.menuOpen} aria-controls="site-navigation" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X size={21}/> : <Menu size={21}/>}</button>
      </div>
    </div>
  </header>;
}
