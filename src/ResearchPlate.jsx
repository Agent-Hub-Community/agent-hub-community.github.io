import { useId } from 'react';

// Illustrative objects, not screenshots, benchmark charts, or experimental data.
// All motion is finite and local to the article; there is no animation loop.
export default function ResearchPlate({ kind }) {
  const id = 'plate-' + useId().replace(/[^a-z0-9]/gi, '');
  const paint = name => `url(#${id}-${name})`;
  const lead = kind === 'harness';
  const material = (name, fallback) => lead ? fallback : `var(--plate-${name}, ${fallback})`;
  const width = lead ? 680 : 320;
  const height = lead ? 500 : 320;
  return <div className={'fj-art fj-plate fj-plate-' + kind} aria-hidden="true">
    {/* The surface fills the frame while the drawing keeps its proportions. */}
    <svg className="plate-surface" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" fill="none" focusable="false">
      <defs>
        <radialGradient id={id + '-light'} cx=".36" cy=".16" r=".94">
          <stop stopColor={material('stage-start', '#384449')}/><stop offset=".6" stopColor={material('stage-middle', '#232f34')}/><stop offset="1" stopColor={material('stage-end', '#172227')}/>
        </radialGradient>
        <pattern id={id + '-grain'} width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M0 .5H5" stroke="#fff" strokeOpacity=".009"/>
        </pattern>
      </defs>
      <rect width={width} height={height} fill={paint('light')}/>
      <rect width={width} height={height} fill={paint('grain')}/>
    </svg>
    <svg className="plate-drawing" viewBox={lead ? `0 0 ${width} ${height}` : '17 17 286 286'} fill="none" focusable="false">
      <defs>
        <linearGradient id={id + '-metal'} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor={lead ? '#70787a' : '#768488'}/><stop offset=".4" stopColor={lead ? '#40484b' : '#46565d'}/><stop offset="1" stopColor="#20282b"/>
        </linearGradient>
        <linearGradient id={id + '-edge'} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor="#bbc7cc" stopOpacity=".6"/><stop offset=".45" stopColor="#879499" stopOpacity=".15"/><stop offset="1" stopColor="#a0adb1" stopOpacity=".3"/>
        </linearGradient>
        {/* Split jaws keep the compound path's original paint coordinates. */}
        {!lead && kind !== 'eval' && <>
          <linearGradient id={id + '-finger-metal'} href={'#' + id + '-metal'} gradientUnits="userSpaceOnUse" gradientTransform="translate(102 160) scale(116 56)"/>
          <linearGradient id={id + '-finger-edge'} href={'#' + id + '-edge'} gradientUnits="userSpaceOnUse" gradientTransform="translate(102 160) scale(116 56)"/>
          <radialGradient id={id + '-ground'}>
            <stop stopColor={material('ground-ink', '#101719')}/>
            <stop offset=".45" stopColor={material('ground-ink', '#101719')} stopOpacity=".8"/>
            <stop offset="1" stopColor={material('ground-ink', '#101719')} stopOpacity="0"/>
          </radialGradient>
        </>}
        <linearGradient id={id + '-copper'} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#f1c2a6"/><stop offset=".48" stopColor="#ce8a64"/><stop offset="1" stopColor="#8d523b"/>
        </linearGradient>
        <linearGradient id={id + '-glass'} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#ffffff" stopOpacity=".1"/><stop offset="1" stopColor="#ffffff" stopOpacity=".02"/>
        </linearGradient>
        <filter id={id + '-shadow'} x="-.4" y="-.3" width="1.8" height="2">
          <feDropShadow dx="0" dy="9" stdDeviation="9" floodColor={material('shadow-ink', '#070b0d')} floodOpacity={material('shadow-opacity', '.32')}/>
        </filter>
      </defs>
      {lead ? <>
        <text className="plate-caption" x="40" y="42">THREE WAYS TO ACT</text>
        <text className="plate-caption plate-faint" textAnchor="end" x="640" y="42">HCU / 01</text>
        <path className="plate-hairline" d="M40 59H640M40 449H640"/>
        <g className="plate-routes">
          <path className="plate-route-base" d="M139 348V390Q139 400 149 400H531Q541 400 541 390V348M340 348V426"/>
          <path className="plate-route-trace" d="M139 348V390Q139 400 149 400H531Q541 400 541 390V348M340 348V426" pathLength="1"/>
          <circle cx="340" cy="400" r="4" fill="#d89b78"/>
          <circle cx="340" cy="426" r="3" fill="#d89b78"/>
        </g>
        {[57, 258, 459].map((x, index) => <g key={x} className={'plate-object plate-channel-' + index}>
          <rect x={x} y="116" width="164" height="230" rx="6" fill={paint('metal')} stroke={paint('edge')} filter={paint('shadow')}/>
          <rect x={x + 4} y="120" width="156" height="222" rx="3" stroke="#f2f6f5" strokeOpacity=".045"/>
          <path d={`M${x + 17} 153H${x + 147}`} className="plate-hairline"/>
          <circle cx={x + 19} cy="136" r="2" fill="#d0a58a"/>
          <text className="plate-number" x={x + 132} y="140">0{index + 1}</text>
          <text className="plate-title" x={x + 22} y="315">{['Code', 'AX Tree', 'GUI'][index]}</text>
        </g>)}
        <g className="plate-symbol plate-symbol-code" strokeLinecap="round" strokeLinejoin="round">
          <path d="M114 199L92 220L114 241M164 199L186 220L164 241M147 192L130 247" stroke="#d4dbdc" strokeWidth="2"/>
          <path d="M90 269H145M90 277H126" className="plate-hairline"/>
        </g>
        <g className="plate-symbol plate-symbol-tree" strokeWidth="1.3">
          <path d="M292 195V257Q292 263 298 263H319M304 190H322M292 225H322M354 225H385M335 234V263H373" stroke="#a3aeb1"/>
          <rect x="283" y="181" width="18" height="18" rx="3" fill="#515d62" stroke="#a3aeb1"/>
          <rect x="322" y="181" width="63" height="18" rx="3" fill={paint('glass')} stroke="#859296"/>
          <rect x="322" y="216" width="32" height="18" rx="3" fill={paint('copper')}/>
          <rect x="374" y="216" width="19" height="18" rx="3" fill={paint('glass')} stroke="#859296"/>
          <rect x="320" y="254" width="25" height="18" rx="3" fill={paint('glass')} stroke="#859296"/>
          <rect x="373" y="254" width="20" height="18" rx="3" fill={paint('glass')} stroke="#859296"/>
        </g>
        <g className="plate-symbol plate-symbol-gui">
          <rect x="482" y="182" width="117" height="82" rx="5" fill={paint('glass')} stroke="#919b9f"/>
          <path d="M482 202H599M497 216H531M497 226H548" className="plate-hairline"/>
          <rect className="plate-gui-action" x="497" y="241" width="35" height="8" rx="2" fill="#98a5aa" fillOpacity=".45"/>
          <path className="plate-cursor" d="M560 229L560 269L570 258L580 277L588 272L578 254L594 252Z" fill={paint('copper')} stroke="#343b3e" strokeWidth="3"/>
        </g>
        <text className="plate-caption plate-faint" x="40" y="473">PROGRAMMATIC / SEMANTIC / VISUAL</text>
        <path className="plate-hairline" d="M622 467H640M634 461L640 467L634 473"/>
      </> : kind === 'eval' ? <>
        <text className="plate-caption" x="25" y="35">KERNEL ALIGNMENT</text>
        <path className="plate-hairline" d="M25 49H295M25 280H295"/>
        <path d="M71 246H246" className="plate-route-base"/>
        {[{ x: 54, y: 89, className: 'plate-matrix-back' }, { x: 136, y: 122, className: 'plate-matrix-front' }].map(({ x, y, className }) => <g key={x} className={'plate-object ' + className}>
          <rect x={x} y={y} width="129" height="129" rx="9" fill={paint('metal')} stroke={paint('edge')} filter={paint('shadow')}/>
          {Array.from({ length: 9 }, (_, i) => <rect key={i} x={x + 14 + (i % 3) * 36} y={y + 14 + Math.floor(i / 3) * 36} width="29" height="29" rx="3" fill={i === 4 ? paint('copper') : paint('glass')} stroke="#c7d3d7" strokeOpacity={i === 4 ? '.5' : '.14'}/>)}
        </g>)}
        <text className="plate-caption plate-faint" x="25" y="302">TRAINING ⇄ INFERENCE</text>
      </> : <>
        <text className="plate-caption" x="25" y="35">IN THE REAL WORLD</text>
        <path className="plate-hairline" d="M25 49H295M25 280H295"/>
        <path d="M52 247H268M76 258H244" className="plate-hairline"/>
        <ellipse cx="160" cy="246" rx="65" ry="8" fill={paint('ground')} fillOpacity={`calc(${material('ground-opacity', '.5')} * 1.6)`}/>
        <g className="plate-object plate-gripper" filter={paint('shadow')}>
          <path d="M138 73H182V133H138Z" fill={paint('metal')} stroke={paint('edge')}/>
          <path d="M147 83V123M155 83V123M163 83V123M171 83V123" className="plate-hairline"/>
          <rect x="124" y="127" width="72" height="36" rx="5" fill={paint('metal')} stroke={paint('edge')}/>
          <circle cx="139" cy="144" r="4" stroke="#8d9b9f"/>
          <circle cx="181" cy="144" r="4" stroke="#8d9b9f"/>
          <path className="plate-finger plate-finger-left" d="M127 160L102 187V216H118V191L141 166" fill={paint('finger-metal')} stroke={paint('finger-edge')} strokeLinejoin="round"/>
          <path className="plate-finger plate-finger-right" d="M193 160L218 187V216H202V191L179 166" fill={paint('finger-metal')} stroke={paint('finger-edge')} strokeLinejoin="round"/>
          <path d="M125 135H194" className="plate-hairline"/>
        </g>
        <g className="plate-object plate-block">
          <path d="M138 205L166 194L188 206V237L158 248L138 237Z" fill={paint('copper')}/>
          <path d="M138 205L158 218L188 206M158 218V248" stroke="#f5d2b6" strokeOpacity=".7"/>
          <path d="M138 205V237L158 248V218Z" fill="#4f2a20" fillOpacity=".23"/>
        </g>
        <text className="plate-caption plate-faint" x="25" y="302">FROM MODEL TO MOTION</text>
      </>}
    </svg>
  </div>;
}
