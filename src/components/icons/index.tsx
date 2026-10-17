// Clipte Icons v3 — the brand icon kit.
// Language: 24px grid · 1.6 stroke · round caps · duotone (soft tint on the key shape) ·
// notched corners (same concave bite as .pi-notch, scaled to the shape) · slanted "ribbon"
// strokes from the logo · the "+" crosshair from the landing eyebrows.
// Motion: every icon has its own short choreography (parts tagged with data-p, styled per
// icon in globals.css). IconMotion plays one full cycle per hover/focus, so it never snaps.
// Names mirror lucide, so swapping is an import change.

import React from 'react';

export type IconProps = { className?: string; strokeWidth?: number; title?: string; animate?: boolean; duotone?: boolean };

/** Notched rectangle path (concave quarter-circle bites at the corners). */
export function nrect(x: number, y: number, w: number, h: number, r = 2.2) {
  const R = +(x + w).toFixed(2), B = +(y + h).toFixed(2);
  return `M${x + r} ${y}H${R - r}A${r} ${r} 0 0 0 ${R} ${y + r}V${B - r}A${r} ${r} 0 0 0 ${R - r} ${B}H${x + r}A${r} ${r} 0 0 0 ${x} ${B - r}V${y + r}A${r} ${r} 0 0 0 ${x + r} ${y}Z`;
}

function make(name: string, body: React.ReactNode) {
  const key = name.toLowerCase();
  const Icon = ({ className = 'size-5', strokeWidth = 1.6, title, animate, duotone = true }: IconProps) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ci ${className}`}
      data-icon={key}
      data-ci-on={animate ? '' : undefined}
      data-ci-flat={duotone ? undefined : ''}
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
    >
      {title && <title>{title}</title>}
      <g data-p="all">{body}</g>
    </svg>
  );
  Icon.displayName = name;
  return Icon;
}

type P = { p?: string; children?: React.ReactNode; style?: React.CSSProperties };
/** Animated group. */
const G = ({ p, children, style }: P) => <g data-p={p} style={style}>{children}</g>;
/** Stroke path (draw = traced on play). */
const D = ({ d, draw, p, ...rest }: { d: string; draw?: boolean; p?: string } & React.SVGProps<SVGPathElement>) => (
  <path d={d} pathLength={draw ? 1 : undefined} data-draw={draw ? '' : undefined} data-p={p} {...rest} />
);
/** Duotone tint layer. */
const F = ({ d }: { d: string }) => <path d={d} className="ci-fill" fill="currentColor" stroke="none" />;
/** Solid dot. */
const Dot = ({ cx, cy, r = 0.9, p }: { cx: number; cy: number; r?: number; p?: string }) => (
  <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" data-p={p} />
);
/** Short line that appears only while playing (sound waves, sparks, motion lines). */
const Fx = ({ d, p, delay = 0 }: { d: string; p: string; delay?: number }) => (
  <path d={d} data-p={p} className="ci-fx" style={{ ['--ci-d' as string]: `${delay}ms` }} />
);

const SHIELD = 'M12 2.8 19.5 5.6v6.1c0 4.4-3.1 7.9-7.5 9.5-4.4-1.6-7.5-5.1-7.5-9.5V5.6Z';
const BOX = nrect(3, 3, 18, 18, 3.6);

/* =============================== navigation =============================== */

export const LayoutGrid = make('LayoutGrid', (
  <>
    <G p="t1"><F d={nrect(3, 3, 7.6, 7.6, 2)} /><D d={nrect(3, 3, 7.6, 7.6, 2)} /></G>
    <G p="t2"><D d={nrect(13.4, 3, 7.6, 7.6, 2)} /></G>
    <G p="t3"><D d={nrect(3, 13.4, 7.6, 7.6, 2)} /></G>
    <G p="plus"><D d="M17.2 13.6v7M13.7 17.1h7" /></G>
  </>
));

export const Compass = make('Compass', (
  <>
    <D d={BOX} />
    <G p="needle">
      <F d="M15.8 8.2 13.3 13.3 10.7 10.7Z" />
      <D d="M15.8 8.2 13.3 13.3 8.2 15.8 10.7 10.7Z" />
    </G>
  </>
));

export const Video = make('Video', (
  <>
    <G p="body"><F d={nrect(2.5, 6, 13, 12, 2.6)} /><D d={nrect(2.5, 6, 13, 12, 2.6)} /></G>
    <G p="lens"><D d="M15.5 10.4 21.2 7.4v9.2l-5.7-3" /></G>
    <G p="rec"><path d="M7.4 9.6 11 12l-3.6 2.4Z" fill="currentColor" stroke="none" /></G>
  </>
));

export const Wallet = make('Wallet', (
  <>
    <G p="coin"><circle cx="12" cy="3.6" r="1.6" className="ci-fx" /></G>
    <G p="body">
      <F d={nrect(3, 7, 18, 13, 3)} />
      <D d={nrect(3, 7, 18, 13, 3)} />
      <D d="M6 7 15.6 4c.9-.3 1.9.4 1.9 1.4V7" />
      <G p="pocket">
        <D d="M21 11.5h-4.2a2 2 0 0 0 0 4H21" />
        <Dot cx={17} cy={13.5} r={0.8} />
      </G>
    </G>
  </>
));

export const Users = make('Users', (
  <>
    <G p="lead">
      <F d="M9 4.2a3.6 3.6 0 1 1 0 7.2 3.6 3.6 0 0 1 0-7.2Z" />
      <circle cx="9" cy="7.8" r="3.6" />
      <D d="M2.8 20c.6-3.4 3.1-5.6 6.2-5.6s5.6 2.2 6.2 5.6" />
    </G>
    <G p="peer">
      <D d="M15.6 4.6a3.4 3.4 0 0 1 0 6.5" />
      <D d="M18.1 14.6c1.8.8 2.9 2.6 3.2 5.4" />
    </G>
  </>
));

export const User = make('User', (
  <>
    <G p="head">
      <F d="M12 3.6a4.2 4.2 0 1 1 0 8.4 4.2 4.2 0 0 1 0-8.4Z" />
      <circle cx="12" cy="7.8" r="4.2" />
    </G>
    <G p="torso"><D d="M4.5 20.6c.8-4 3.8-6.6 7.5-6.6s6.7 2.6 7.5 6.6" /></G>
  </>
));

export const UserCheck = make('UserCheck', (
  <>
    <G p="head">
      <F d="M9.5 4a3.9 3.9 0 1 1 0 7.8 3.9 3.9 0 0 1 0-7.8Z" />
      <circle cx="9.5" cy="7.9" r="3.9" />
    </G>
    <D d="M2.8 20.6c.7-3.9 3.5-6.3 6.7-6.3 1.6 0 3 .5 4.2 1.4" />
    <D d="m15.4 18 2.3 2.3 4.4-4.7" draw p="tick" />
  </>
));

export const Target = make('Target', (
  <>
    <D d={BOX} />
    <G p="inner">
      <F d={nrect(7.4, 7.4, 9.2, 9.2, 2.2)} />
      <D d={nrect(7.4, 7.4, 9.2, 9.2, 2.2)} />
    </G>
    <circle cx="12" cy="12" r="4" className="ci-fx" data-p="ping" />
    <Dot cx={12} cy={12} r={1.1} p="center" />
  </>
));

export const PlusCircle = make('PlusCircle', (
  <>
    <G p="box"><F d={BOX} /><D d={BOX} /></G>
    <G p="plus"><D d="M12 7.8v8.4M7.8 12h8.4" /></G>
  </>
));

export const ShieldAlert = make('ShieldAlert', (
  <>
    <G p="shield"><F d={SHIELD} /><D d={SHIELD} /></G>
    <G p="mark">
      <D d="M12 8v4.4" />
      <Dot cx={12} cy={15.7} />
    </G>
  </>
));

export const ShieldCheck = make('ShieldCheck', (
  <>
    <G p="shield"><F d={SHIELD} /><D d={SHIELD} /></G>
    <D d="m8.7 12.1 2.3 2.3 4.3-4.6" draw p="tick" />
  </>
));

const SPARK = 'M10 3.2c.6 3.8 2.5 5.7 6.3 6.3-3.8.6-5.7 2.5-6.3 6.3-.6-3.8-2.5-5.7-6.3-6.3 3.8-.6 5.7-2.5 6.3-6.3Z';
/** The admin mark: a four-point spark with a "+" satellite. */
export const Sparkles = make('Sparkles', (
  <>
    <G p="spark"><F d={SPARK} /><D d={SPARK} /></G>
    <G p="sat"><D d="M18.2 14.6v5.2M15.6 17.2h5.2" /></G>
    <Fx d="M19 4.5v2M18 5.5h2" p="glint" delay={180} />
  </>
));

const BELL = 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.6 2.1H4.4Z';
export const Bell = make('Bell', (
  <>
    <G p="bell">
      <F d={BELL} />
      <D d={BELL} />
      <D d="M12 3v2" />
    </G>
    <G p="clapper"><D d="M10 21.2h4" /></G>
    <Fx d="M2.6 8.6a8 8 0 0 1 2-3.8" p="ring-l" />
    <Fx d="M21.4 8.6a8 8 0 0 0-2-3.8" p="ring-r" />
  </>
));

const BUBBLE = 'M6 3.8H17.4A3.4 3.4 0 0 0 20.8 7.2V13.3A3.4 3.4 0 0 0 17.4 16.7H10.6L6 20.4V16.7A3.4 3.4 0 0 0 2.6 13.3V7.2A3.4 3.4 0 0 0 6 3.8Z';
/** Notched speech block — the messenger mark. */
export const MessageSquare = make('MessageSquare', (
  <>
    <G p="bubble"><F d={BUBBLE} /><D d={BUBBLE} /></G>
    <D d="M8 10.3h.01" strokeWidth={2.4} p="dot1" />
    <D d="M11.7 10.3h.01" strokeWidth={2.4} p="dot2" />
    <D d="M15.4 10.3h.01" strokeWidth={2.4} p="dot3" />
  </>
));

const PANE = 'M5.6 3.5H9v17H5.6A2.6 2.6 0 0 0 3 17.9V6.1A2.6 2.6 0 0 0 5.6 3.5Z';
export const PanelLeftClose = make('PanelLeftClose', (
  <>
    <G p="pane"><F d={PANE} /></G>
    <D d={nrect(3, 3.5, 18, 17, 2.6)} />
    <D d="M9 3.5v17" />
    <G p="chev"><D d="m15.6 9.4-2.6 2.6 2.6 2.6" /></G>
  </>
));

export const PanelLeft = make('PanelLeft', (
  <>
    <G p="pane"><F d={PANE} /></G>
    <D d={nrect(3, 3.5, 18, 17, 2.6)} />
    <D d="M9 3.5v17" />
    <G p="chev-r"><D d="m13 9.4 2.6 2.6-2.6 2.6" /></G>
  </>
));

export const LogOut = make('LogOut', (
  <>
    <G p="door">
      <F d="M10 3.5H6.6A2.6 2.6 0 0 0 4 6.1v11.8a2.6 2.6 0 0 0 2.6 2.6H10Z" />
      <D d="M10 3.5H6.6A2.6 2.6 0 0 0 4 6.1v11.8a2.6 2.6 0 0 0 2.6 2.6H10" />
    </G>
    <G p="exit"><D d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" /></G>
  </>
));

export const Settings = make('Settings', (
  <>
    <D d="M3.5 7.2h9M17.5 7.2h3M3.5 16.8h3M11.5 16.8h9" />
    <G p="knob-a"><F d={nrect(12.5, 4.4, 5, 5.6, 1.4)} /><D d={nrect(12.5, 4.4, 5, 5.6, 1.4)} /></G>
    <G p="knob-b"><F d={nrect(6.5, 14, 5, 5.6, 1.4)} /><D d={nrect(6.5, 14, 5, 5.6, 1.4)} /></G>
  </>
));

/* =============================== arrows & controls =============================== */

/** The landing-page arrow: shoots out of the corner and comes back in from the opposite one. */
export const ArrowUpRight = make('ArrowUpRight', <G p="shoot"><D d="M6.8 17.2 17 7M8.6 7H17v8.4" /></G>);
export const ArrowRight = make('ArrowRight', <G p="go-r"><D d="M4.8 12h14M13 6l6 6-6 6" /></G>);
export const ArrowLeft = make('ArrowLeft', <G p="go-l"><D d="M19.2 12h-14M11 6l-6 6 6 6" /></G>);
export const ArrowUp = make('ArrowUp', <G p="go-u"><D d="M12 19.2v-14M6 11l6-6 6 6" /></G>);
export const ChevronDown = make('ChevronDown', <G p="go-d"><D d="m6.4 9.4 5.6 5.6 5.6-5.6" /></G>);
export const ChevronLeft = make('ChevronLeft', <G p="go-l"><D d="M14.6 6.4 9 12l5.6 5.6" /></G>);
export const ChevronRight = make('ChevronRight', <G p="go-r"><D d="m9.4 6.4 5.6 5.6-5.6 5.6" /></G>);

export const X = make('X', <G p="turn"><D d="M6.4 6.4l11.2 11.2M17.6 6.4 6.4 17.6" /></G>);
export const Plus = make('Plus', <G p="turn"><D d="M12 5.2v13.6M5.2 12h13.6" /></G>);
export const Minus = make('Minus', <G p="squash"><D d="M5.2 12h13.6" /></G>);
export const Check = make('Check', <G p="stamp"><D d="m4.8 12.6 4.6 4.6 9.8-9.8" draw p="tick" /></G>);
export const CheckCheck = make('CheckCheck', (
  <>
    <D d="m2.4 12.6 4.1 4.1 8.6-8.6" draw p="tick" />
    <D d="m12.6 15.6 1.1 1.1 8.6-8.6" draw p="tick2" />
  </>
));

/** Round lens, slanted handle — scans a small loop. */
export const Search = make('Search', (
  <G p="scan">
    <F d="M10.6 3.6a7 7 0 1 1 0 14 7 7 0 0 1 0-14Z" />
    <circle cx="10.6" cy="10.6" r="7" />
    <D d="m15.8 15.8 4.8 4.8" />
  </G>
));

export const Copy = make('Copy', (
  <>
    <G p="back">
      <F d="M15.5 8.5V6.6A2.6 2.6 0 0 0 12.9 4H6.6A2.6 2.6 0 0 0 4 6.6v6.3a2.6 2.6 0 0 0 2.6 2.6h1.9V11.1a2.6 2.6 0 0 1 2.6-2.6Z" />
      <D d="M15.5 8.5V6.6A2.6 2.6 0 0 0 12.9 4H6.6A2.6 2.6 0 0 0 4 6.6v6.3a2.6 2.6 0 0 0 2.6 2.6h1.9" />
    </G>
    <G p="front"><D d={nrect(8.5, 8.5, 11.5, 11.5, 2.6)} /></G>
  </>
));

export const ExternalLink = make('ExternalLink', (
  <>
    <D d="M11 4.5H7.1a2.6 2.6 0 0 0-2.6 2.6v9.8a2.6 2.6 0 0 0 2.6 2.6h9.8a2.6 2.6 0 0 0 2.6-2.6V13" />
    <G p="shoot"><D d="M14 4.5h5.5V10M19.5 4.5 11 13" /></G>
  </>
));

export const Link2 = make('Link2', (
  <>
    <G p="half-a"><D d="M9.5 16.5h-2a4.5 4.5 0 0 1 0-9h2" /></G>
    <G p="half-b"><D d="M14.5 7.5h2a4.5 4.5 0 0 1 0 9h-2" /></G>
    <G p="bar"><D d="M8.6 12h6.8" /></G>
  </>
));

export const Trash2 = make('Trash2', (
  <>
    <G p="lid"><D d="M3.5 6.5h17M9 6.5V4.2h6v2.3" /></G>
    <G p="can">
      <F d="M5.5 6.5 6.6 19a1.8 1.8 0 0 0 1.8 1.6h7.2a1.8 1.8 0 0 0 1.8-1.6l1.1-12.5Z" />
      <D d="M5.5 6.5 6.6 19a1.8 1.8 0 0 0 1.8 1.6h7.2a1.8 1.8 0 0 0 1.8-1.6l1.1-12.5" />
      <D d="M10 10.5v6M14 10.5v6" />
    </G>
  </>
));

export const Pause = make('Pause', (
  <>
    <G p="bar-a"><F d={nrect(5.5, 4.5, 4.6, 15, 1.4)} /><D d={nrect(5.5, 4.5, 4.6, 15, 1.4)} /></G>
    <G p="bar-b"><F d={nrect(13.9, 4.5, 4.6, 15, 1.4)} /><D d={nrect(13.9, 4.5, 4.6, 15, 1.4)} /></G>
  </>
));
export const Play = make('Play', (
  <G p="push">
    <F d="M7 4.6 19.2 12 7 19.4Z" />
    <D d="M7 4.6 19.2 12 7 19.4Z" />
  </G>
));

/** Slanted pencil — writes a short stroke. */
export const Pencil = make('Pencil', (
  <>
    <G p="pen">
      <F d="M15.6 4.4a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L8.8 19.2 3.8 20.2l1-5Z" />
      <D d="M15.6 4.4a2.1 2.1 0 0 1 3 0l1 1a2.1 2.1 0 0 1 0 3L8.8 19.2 3.8 20.2l1-5Z" />
      <D d="m13.5 6.5 4 4" />
    </G>
    <D d="M12 21c1.6-1.2 3.2-1.2 4.4 0s2.8 1.2 4.1 0" draw p="scribble" className="ci-fx" />
  </>
));

export const FolderOpen = make('FolderOpen', (
  <>
    <D d="M3.5 18V6.6A2.6 2.6 0 0 1 6.1 4h3.4l2.2 2.5h6.4a2.6 2.6 0 0 1 2.6 2.6V10" />
    <G p="flap">
      <F d="M3.5 18 6.3 11.6A2 2 0 0 1 8.1 10.4H21l-3 7.8a2.2 2.2 0 0 1-2 1.3H5Z" />
      <D d="M3.5 18 6.3 11.6A2 2 0 0 1 8.1 10.4H21l-3 7.8a2.2 2.2 0 0 1-2 1.3H5" />
    </G>
  </>
));

export const ImagePlus = make('ImagePlus', (
  <>
    <D d="M20.5 12.5v4.4a2.6 2.6 0 0 1-2.6 2.6H6.1a2.6 2.6 0 0 1-2.6-2.6V7.1a2.6 2.6 0 0 1 2.6-2.6h7.4" />
    <G p="hill">
      <F d="m3.5 16.2 4.6-4.6a1.6 1.6 0 0 1 2.3 0l5.6 5.6v2.3H6.1a2.6 2.6 0 0 1-2.6-2.6Z" />
      <D d="m3.5 16.2 4.6-4.6a1.6 1.6 0 0 1 2.3 0l5.6 5.6" />
    </G>
    <G p="sun"><circle cx="8.6" cy="8.6" r="1.3" /></G>
    <G p="plus"><D d="M18.5 2.6v6.2M15.4 5.7h6.2" /></G>
  </>
));

const STAR = 'm12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8Z';
export const Star = make('Star', (
  <>
    <G p="star"><F d={STAR} /><D d={STAR} /></G>
    <Fx d="M20.5 3.5v2.2M19.4 4.6h2.2" p="glint" delay={220} />
  </>
));

export const RefreshCw = make('RefreshCw', (
  <G p="rotor">
    <D d="M19.5 11A7.5 7.5 0 0 0 6.2 7.3L4.5 9" />
    <D d="M4.5 4.5V9H9" />
    <D d="M4.5 13a7.5 7.5 0 0 0 13.3 3.7l1.7-1.7" />
    <D d="M19.5 19.5V15H15" />
  </G>
));

export const Headphones = make('Headphones', (
  <>
    <G p="band"><D d="M3.6 15.5V12a8.4 8.4 0 0 1 16.8 0v3.5" /></G>
    <G p="cup-a"><F d={nrect(3.6, 13.4, 4.8, 7.4, 1.6)} /><D d={nrect(3.6, 13.4, 4.8, 7.4, 1.6)} /></G>
    <G p="cup-b"><F d={nrect(15.6, 13.4, 4.8, 7.4, 1.6)} /><D d={nrect(15.6, 13.4, 4.8, 7.4, 1.6)} /></G>
  </>
));

const TRI = 'M10.3 4.2a2 2 0 0 1 3.4 0l7.6 13.2a2 2 0 0 1-1.7 3H4.4a2 2 0 0 1-1.7-3Z';
export const AlertTriangle = make('AlertTriangle', (
  <G p="shake">
    <F d={TRI} />
    <D d={TRI} />
    <G p="mark">
      <D d="M12 9.4v4.2" />
      <Dot cx={12} cy={16.8} />
    </G>
  </G>
));

export const Lock = make('Lock', (
  <>
    <G p="shackle"><D d="M8 10.5V7.6a4 4 0 0 1 8 0v2.9" /></G>
    <G p="body">
      <F d={nrect(4.5, 10.5, 15, 10, 2.6)} />
      <D d={nrect(4.5, 10.5, 15, 10, 2.6)} />
      <D d="M12 14.4v2.2" />
    </G>
  </>
));

const SEAL = 'M12 2.5 14.4 4.4 17.5 4.2 18.3 7.2 20.9 9 19.8 12 20.9 15 18.3 16.8 17.5 19.8 14.4 19.6 12 21.5 9.6 19.6 6.5 19.8 5.7 16.8 3.1 15 4.2 12 3.1 9 5.7 7.2 6.5 4.2 9.6 4.4Z';
/** Notched seal with a check — "verified". */
export const BadgeCheck = make('BadgeCheck', (
  <>
    <G p="seal"><F d={SEAL} /><D d={SEAL} /></G>
    <D d="m8.7 12.1 2.3 2.3 4.3-4.6" draw p="tick" />
  </>
));

const DOLLAR = 'M15 9.2c-.4-1-1.6-1.7-3-1.7-1.8 0-3 .9-3 2.2 0 3 6 1.6 6 4.6 0 1.3-1.3 2.2-3 2.2-1.5 0-2.7-.7-3.1-1.8';
export const CircleDollarSign = make('CircleDollarSign', (
  <>
    <G p="box"><F d={BOX} /><D d={BOX} /></G>
    <G p="coin">
      <D d={DOLLAR} />
      <D d="M12 5.8v1.7M12 16.5v1.7" />
    </G>
  </>
));

export const DollarSign = make('DollarSign', (
  <G p="coin">
    <D d="M16.5 7.5c-.6-1.6-2.3-2.7-4.5-2.7-2.6 0-4.5 1.4-4.5 3.4 0 4.6 9 2.5 9 7 0 2-2 3.4-4.5 3.4-2.3 0-4.1-1.1-4.7-2.8" />
    <D d="M12 2.5v2.3M12 19.2v2.3" />
  </G>
));

export const Flag = make('Flag', (
  <>
    <D d="M5 21V4" />
    <G p="cloth">
      <F d="M5 4.5h12.6L15 8.7l2.6 4.3H5Z" />
      <D d="M5 4.5h12.6L15 8.7l2.6 4.3H5" />
    </G>
  </>
));

const HORN = 'M3.5 10v4a1.5 1.5 0 0 0 1.5 1.5h2L16 20V4L7 8.5H5A1.5 1.5 0 0 0 3.5 10Z';
export const Megaphone = make('Megaphone', (
  <>
    <G p="horn"><F d={HORN} /><D d={HORN} /><D d="M7.5 15.5 9 20.5" /></G>
    <Fx d="M18.6 9.6c.7.7 1.1 1.5 1.1 2.4s-.4 1.7-1.1 2.4" p="wave1" />
    <Fx d="M20.6 7.6c1.2 1.2 1.9 2.7 1.9 4.4s-.7 3.2-1.9 4.4" p="wave2" delay={160} />
  </>
));

export const XCircle = make('XCircle', (
  <>
    <G p="box"><F d={BOX} /><D d={BOX} /></G>
    <G p="turn"><D d="m9 9 6 6M15 9l-6 6" /></G>
  </>
));

export const Info = make('Info', (
  <>
    <G p="box"><F d={BOX} /><D d={BOX} /></G>
    <G p="mark-i">
      <D d="M12 11v5.6" />
      <Dot cx={12} cy={7.8} />
    </G>
  </>
));

export const CheckCircle2 = make('CheckCircle2', (
  <>
    <G p="box"><F d={BOX} /><D d={BOX} /></G>
    <D d="m7.9 12.2 2.9 2.9 5.4-5.6" draw p="tick" />
  </>
));

const EYE = 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z';
export const Eye = make('Eye', (
  <G p="lid">
    <D d={EYE} />
    <G p="iris">
      <F d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
      <circle cx="12" cy="12" r="3" />
    </G>
  </G>
));

export const EyeOff = make('EyeOff', (
  <>
    <G p="lid">
      <D d="M9.6 5.8A9.6 9.6 0 0 1 12 5.5C18 5.5 21.5 12 21.5 12a17 17 0 0 1-2.6 3.4M6.2 7.4C3.9 9.1 2.5 12 2.5 12S6 18.5 12 18.5c1.6 0 3-.4 4.2-1" />
      <D d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </G>
    <D d="M3.5 3.5 20.5 20.5" draw p="tick" />
  </>
));

export const TrendingUp = make('TrendingUp', (
  <>
    <D d="m3 17 6-6 4 4 8-8" draw p="tick" />
    <G p="shoot"><D d="M15 7h6v6" /></G>
  </>
));

export const Menu = make('Menu', (
  <>
    <D d="M4 7h16" p="l1" />
    <D d="M4 12h11" p="l2" />
    <D d="M4 17h16" p="l3" />
  </>
));

export const Shield = make('Shield', <G p="shield"><F d={SHIELD} /><D d={SHIELD} /></G>);

const SPEAKER = 'M4 9.5v5h3.5L12 18.5V5.5L7.5 9.5Z';
export const Volume2 = make('Volume2', (
  <>
    <G p="horn"><F d={SPEAKER} /><D d={SPEAKER} /></G>
    <D d="M15.5 9a4 4 0 0 1 0 6" p="wave1" />
    <D d="M18.3 6.5a7.5 7.5 0 0 1 0 11" p="wave2" />
  </>
));

export const VolumeX = make('VolumeX', (
  <>
    <G p="horn"><F d={SPEAKER} /><D d={SPEAKER} /></G>
    <G p="turn"><D d="m16 9.5 5 5M21 9.5l-5 5" /></G>
  </>
));

const BOLT = 'M13.5 2.5 4.5 13.5H11l-1 8 9-11h-6.5Z';
/** Slanted bolt — the ribbon angle again. */
export const Zap = make('Zap', <G p="bolt"><F d={BOLT} /><D d={BOLT} /></G>);

const FLAME = 'M12 21.5c3.9 0 6.5-2.6 6.5-6.2 0-3.4-2.2-5.6-3.7-7.8-.4 2-1.3 3.2-2.5 3.8.3-3.4-1.2-6.5-4-8.8.2 3.6-3.8 6.4-3.8 11.2 0 4.6 3 7.8 7.5 7.8Z';
export const Flame = make('Flame', <G p="flame"><F d={FLAME} /><D d={FLAME} /></G>);

/* =============================== brand extras =============================== */

/** The clip mark: two slanted ribbons like the logo. */
export const ClipMark = make('ClipMark', (
  <>
    <G p="rib-a"><F d="M5 4.4 15.6 9.4 5 11Z" /><D d="M5 4.4 15.6 9.4 5 11Z" /></G>
    <G p="rib-b"><D d="M5 13 19.2 10.6 5 20Z" /></G>
  </>
));

/** Clipper mode: scissors with notched handles; the blades snip on play. */
export const Scissors = make('Scissors', (
  <>
    <G p="blade-a" style={{ transformBox: 'view-box', transformOrigin: '13px 12px' } as React.CSSProperties}>
      <F d={nrect(2.5, 3, 6.4, 6.4, 1.8)} />
      <D d={nrect(2.5, 3, 6.4, 6.4, 1.8)} />
      <D d="M8.9 8.4 21 16.6" />
    </G>
    <G p="blade-b" style={{ transformBox: 'view-box', transformOrigin: '13px 12px' } as React.CSSProperties}>
      <F d={nrect(2.5, 14.6, 6.4, 6.4, 1.8)} />
      <D d={nrect(2.5, 14.6, 6.4, 6.4, 1.8)} />
      <D d="M8.9 15.6 21 7.4" />
    </G>
    <Fx d="M22.2 11v2M21.2 12h2" p="glint" delay={260} />
  </>
));

const TAG = 'M3.2 12 8.4 5.6H18.4A2.4 2.4 0 0 0 20.8 8V16A2.4 2.4 0 0 0 18.4 18.4H8.4Z';
/** Brand mode: a notched tag with the "+" brand crosshair; swings from its hole on play. */
export const Tag = make('Tag', (
  <G p="tag">
    <F d={TAG} />
    <D d={TAG} />
    <circle cx="8.6" cy="12" r="1.2" />
    <G p="cross"><D d="M15.2 9.4v5.2M12.6 12h5.2" /></G>
  </G>
));

/** Plus crosshair from the landing eyebrows. */
export const Crosshair = make('Crosshair', <G p="turn"><D d="M12 4v16M4 12h16" /></G>);

export const ICONS = {
  LayoutGrid, Compass, Video, Wallet, Users, User, UserCheck, Target, PlusCircle, ShieldAlert, ShieldCheck, Sparkles, Bell,
  MessageSquare, PanelLeftClose, PanelLeft, LogOut, Settings, ArrowUpRight, ArrowRight, ArrowLeft, ArrowUp, ChevronDown,
  ChevronLeft, ChevronRight, X, Plus, Minus, Check, CheckCheck, Search, Copy, ExternalLink, Link2, Trash2, Pause, Play,
  Pencil, FolderOpen, ImagePlus, Star, RefreshCw, Headphones, AlertTriangle, Lock, BadgeCheck, CircleDollarSign, DollarSign,
  Flag, Megaphone, XCircle, Info, CheckCircle2, Eye, EyeOff, TrendingUp, Menu, Shield, Volume2, VolumeX, Zap, Flame,
  ClipMark, Scissors, Tag, Crosshair,
} as const;
