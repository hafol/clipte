// Clipte Illustrations — animated spot illustrations for empty / success / error states.
// Same language as Clipte Icons: ink line (currentColor) · soft duotone tint · notched corners ·
// slanted ribbons from the logo · neon accents from the landing palette, always inside an ink outline.
// Motion lives in globals.css under `.ill` (gentle loop + one-time entrance; respects reduced motion).

import React from 'react';
import { nrect } from '@/components/icons';

type Props = { className?: string; title?: string };

function Frame({ name, className = 'w-full', title, children }: Props & { name: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 220 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`ill ${className}`}
      data-ill={name}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** Soft ground shadow under a floating object. */
const Ground = ({ cx = 110, w = 70 }: { cx?: number; w?: number }) => (
  <ellipse cx={cx} cy={146} rx={w / 2} ry={4} className="ill-ground" fill="currentColor" stroke="none" />
);
/** Panel surface (follows the theme) */
const Surf = ({ d }: { d: string }) => <path d={d} className="ill-surf" stroke="none" />;
/** Duotone tint */
const Tint = ({ d }: { d: string }) => <path d={d} className="ill-tint" fill="currentColor" stroke="none" />;
/** Neon accent fill (always under an ink outline) */
const Neon = ({ d, c }: { d: string; c: 'green' | 'pink' | 'orange' | 'blue' | 'yellow' }) => (
  <path d={d} stroke="none" style={{ fill: `var(--pi-${c})` }} />
);
const A = ({ a, children, style }: { a: string; children: React.ReactNode; style?: React.CSSProperties }) => (
  <g data-a={a} style={style}>
    {children}
  </g>
);
const Plus = ({ x, y, s = 4 }: { x: number; y: number; s?: number }) => <path d={`M${x} ${y - s}v${s * 2}M${x - s} ${y}h${s * 2}`} />;

/* =============================== 1 · no campaigns =============================== */

export function EmptyCampaigns(p: Props) {
  const card = nrect(48, 30, 104, 92, 8);
  const cover = nrect(56, 38, 88, 44, 5);
  return (
    <Frame name="campaigns" {...p}>
      <Ground w={96} />
      <A a="float">
        <Surf d={card} />
        <path d={card} />
        <Tint d={cover} />
        <path d={cover} />
        {/* logo ribbons on the cover */}
        <A a="ribbons">
          <path d="M72 48 92 57 72 60Z" />
          <path d="M72 64 100 59 72 74Z" />
        </A>
        <path d="M58 94h52M58 104h34" />
        <Neon d={nrect(114, 99, 30, 12, 4)} c="blue" />
        <path d={nrect(114, 99, 30, 12, 4)} />
        <path d="M120 105h18" strokeWidth={1.2} />
      </A>
      {/* magnifier scanning */}
      <A a="scan">
        <circle cx="152" cy="70" r="17" className="ill-surf" stroke="none" />
        <circle cx="152" cy="70" r="17" className="ill-tint-strong" fill="currentColor" stroke="none" />
        <circle cx="152" cy="70" r="17" />
        <path d="M164 82 178 96" strokeWidth={3} />
      </A>
      <A a="twinkle"><Plus x={40} y={36} /></A>
      <A a="twinkle-2"><Plus x={182} y={40} s={3} /></A>
    </Frame>
  );
}

/* =============================== 2 · no clips =============================== */

export function EmptyClips(p: Props) {
  const phone = nrect(80, 22, 60, 112, 9);
  const screen = nrect(87, 32, 46, 84, 5);
  return (
    <Frame name="clips" {...p}>
      <Ground w={70} />
      <A a="float">
        <Surf d={phone} />
        <path d={phone} />
        <Tint d={screen} />
        <path d={screen} />
        <path d="M104 124h12" />
        <A a="play">
          <Neon d="M104 64 120 74 104 84Z" c="green" />
          <path d="M104 64 120 74 104 84Z" />
        </A>
        <path d="M93 104h20M93 110h12" strokeWidth={1.2} />
      </A>
      {/* upload arrow rising */}
      <A a="rise">
        <path d="M168 96V58M156 70l12-12 12 12" />
      </A>
      {/* view counters popping */}
      <A a="pop-1">
        <path d={nrect(36, 46, 30, 16, 5)} className="ill-surf" stroke="none" />
        <path d={nrect(36, 46, 30, 16, 5)} />
        <path d="M43 54h4M51 54h8" strokeWidth={1.2} />
      </A>
      <A a="pop-2">
        <path d={nrect(28, 80, 38, 16, 5)} className="ill-surf" stroke="none" />
        <path d={nrect(28, 80, 38, 16, 5)} />
        <Plus x={38} y={88} s={3} />
        <path d="M45 88h14" strokeWidth={1.2} />
      </A>
    </Frame>
  );
}

/* =============================== 3 · no messages =============================== */

export function EmptyChat(p: Props) {
  const b1 = 'M52 40H118A8 8 0 0 0 126 48V78A8 8 0 0 0 118 86H74L58 100V86H52A8 8 0 0 0 44 78V48A8 8 0 0 0 52 40Z';
  const b2 = 'M110 74H168A8 8 0 0 0 176 82V108A8 8 0 0 0 168 116H160V128L146 116H110A8 8 0 0 0 102 108V82A8 8 0 0 0 110 74Z';
  return (
    <Frame name="chat" {...p}>
      <Ground w={110} />
      <A a="float">
        <Surf d={b1} />
        <Tint d={b1} />
        <path d={b1} />
        <path d="M58 56h40M58 66h52" />
      </A>
      <A a="float-2">
        <Surf d={b2} />
        <path d={b2} />
        <circle cx="124" cy="95" r="3.4" fill="currentColor" stroke="none" data-a="dot-1" />
        <circle cx="139" cy="95" r="3.4" fill="currentColor" stroke="none" data-a="dot-2" />
        <circle cx="154" cy="95" r="3.4" fill="currentColor" stroke="none" data-a="dot-3" />
      </A>
      <A a="twinkle"><Plus x={186} y={52} /></A>
    </Frame>
  );
}

/* =============================== 4 · no notifications =============================== */

export function EmptyNotifications(p: Props) {
  const bell = 'M78 104V72a32 32 0 0 1 64 0v32l9 12H69Z';
  return (
    <Frame name="bell" {...p}>
      <Ground w={86} />
      <A a="rock" style={{ transformBox: 'view-box', transformOrigin: '110px 30px' }}>
        <Surf d={bell} />
        <Tint d={bell} />
        <path d={bell} />
        <path d="M110 30v10" />
        {/* sleeping eyes */}
        <path d="M96 84q5 4 10 0M114 84q5 4 10 0" />
        <path d="M100 126a10 10 0 0 0 20 0" />
      </A>
      <g className="ill-z">
        <path d="M150 50h10l-10 12h10" data-a="z-1" />
        <path d="M166 32h8l-8 9h8" data-a="z-2" strokeWidth={1.4} />
        <path d="M180 18h6l-6 7h6" data-a="z-3" strokeWidth={1.2} />
      </g>
    </Frame>
  );
}

/* =============================== 5 · no payouts =============================== */

export function EmptyWallet(p: Props) {
  const body = nrect(56, 58, 108, 74, 9);
  const pocket = 'M164 82H140a13 13 0 0 0 0 26H164';
  const coin = (cx: number, cy: number) => (
    <>
      <circle cx={cx} cy={cy} r={11} style={{ fill: 'var(--pi-yellow)' }} stroke="none" />
      <circle cx={cx} cy={cy} r={11} />
      {/* tenge ₸ */}
      <path d={`M${cx - 4.5} ${cy - 5.5}h9M${cx - 4.5} ${cy - 2}h9M${cx} ${cy - 2}v8`} strokeWidth={1.6} strokeLinecap="round" />
    </>
  );
  return (
    <Frame name="wallet" {...p}>
      <Ground w={110} />
      <A a="coin-1">{coin(96, 24)}</A>
      <A a="coin-2">{coin(122, 18)}</A>
      <A a="bump" style={{ transformBox: 'view-box', transformOrigin: '110px 132px' }}>
        <Surf d={body} />
        <Tint d={body} />
        <path d={body} />
        <path d="M66 58 128 40c5-1.5 10 2 10 7v11" />
        <Surf d={`${pocket}Z`} />
        <path d={pocket} />
        <circle cx="142" cy="95" r="3.4" fill="currentColor" stroke="none" />
      </A>
    </Frame>
  );
}

/* =============================== 6 · success =============================== */

export function Success(p: Props) {
  const seal =
    'M110 26 120 34 133 33 137 45 148 52 144 64 148 76 137 83 133 95 120 94 110 102 100 94 87 95 83 83 72 76 76 64 72 52 83 45 87 33 100 34Z';
  const conf: [number, number, string, number][] = [
    [52, 40, 'pink', -20], [168, 36, 'green', 15], [44, 92, 'blue', 30], [176, 96, 'orange', -25],
    [72, 120, 'yellow', 10], [150, 124, 'pink', -12], [62, 66, 'green', 40], [160, 66, 'blue', -35],
  ];
  return (
    <Frame name="success" {...p}>
      <Ground w={70} />
      <g className="ill-confetti">
        {conf.map(([x, y, c, r], i) => (
          <g key={i} data-a="confetti" style={{ ['--i' as string]: i, transformBox: 'view-box', transformOrigin: '110px 64px' } as React.CSSProperties}>
            <rect x={x - 4} y={y - 2} width="8" height="4" rx="1" transform={`rotate(${r} ${x} ${y})`} style={{ fill: `var(--pi-${c})` }} stroke="none" />
          </g>
        ))}
      </g>
      <A a="stamp" style={{ transformBox: 'view-box', transformOrigin: '110px 64px' }}>
        <A a="spin-slow" style={{ transformBox: 'view-box', transformOrigin: '110px 64px' }}>
          <Surf d={seal} />
          <Neon d={seal} c="green" />
          <path d={seal} />
        </A>
        <path d="m94 64 11 11 22-23" strokeWidth={3} pathLength={1} data-a="check" />
      </A>
      <A a="twinkle"><Plus x={40} y={128} /></A>
      <A a="twinkle-2"><Plus x={186} y={124} s={3} /></A>
    </Frame>
  );
}

/* =============================== 7 · verify account =============================== */

export function VerifyAccount(p: Props) {
  const card = nrect(40, 28, 140, 100, 9);
  return (
    <Frame name="verify" {...p}>
      <Ground w={130} />
      <A a="float">
        <Surf d={card} />
        <path d={card} />
        <circle cx="72" cy="58" r="14" className="ill-tint-strong" fill="currentColor" stroke="none" />
        <circle cx="72" cy="58" r="14" />
        <path d="M94 52h44M94 62h28" />
        {/* bio code chip */}
        <A a="code">
          <path d={nrect(56, 84, 88, 22, 6)} className="ill-surf" stroke="none" />
          <path d={nrect(56, 84, 88, 22, 6)} className="ill-code-hl" stroke="none" style={{ fill: 'var(--pi-yellow)' }} />
          <path d={nrect(56, 84, 88, 22, 6)} />
          <path d="M66 95h6M78 95h6M90 95h6M102 95h6M114 95h6M126 95h6" strokeWidth={2.4} />
        </A>
      </A>
      <A a="badge" style={{ transformBox: 'view-box', transformOrigin: '170px 36px' }}>
        <circle cx="170" cy="36" r="14" style={{ fill: 'var(--pi-green)' }} stroke="none" />
        <circle cx="170" cy="36" r="14" />
        <path d="m163 36 5 5 9-9" strokeWidth={2.4} pathLength={1} data-a="check" />
      </A>
    </Frame>
  );
}

/* =============================== 8 · not found =============================== */

export function NotFound(p: Props) {
  const holes = (x0: number, n: number, y: number) =>
    Array.from({ length: n }).map((_, i) => <path key={i} d={nrect(x0 + i * 14, y, 7, 6, 1.6)} />);
  return (
    <Frame name="notfound" {...p}>
      <Ground w={150} />
      <A a="strip-l" style={{ transformBox: 'view-box', transformOrigin: '100px 80px' }}>
        <path d="M24 56H98L92 80 98 104H24Z" className="ill-surf" stroke="none" />
        <path d="M24 56H98L92 80 98 104H24Z" className="ill-tint" fill="currentColor" stroke="none" />
        <path d="M24 56H98L92 80 98 104H24" />
        {holes(30, 5, 60)}
        {holes(30, 5, 94)}
        <path d="M44 72 60 80 44 88Z" />
      </A>
      <A a="strip-r" style={{ transformBox: 'view-box', transformOrigin: '120px 80px' }}>
        <path d="M196 56H122L128 80 122 104H196Z" className="ill-surf" stroke="none" />
        <path d="M196 56H122L128 80 122 104H196" />
        {holes(134, 4, 60)}
        {holes(134, 4, 94)}
      </A>
      {/* the scissors from the clipper icon */}
      <A a="snip" style={{ transformBox: 'view-box', transformOrigin: '110px 30px' }}>
        <path d={nrect(78, 10, 14, 14, 3.5)} className="ill-surf" stroke="none" />
        <path d={nrect(78, 10, 14, 14, 3.5)} />
        <path d={nrect(128, 10, 14, 14, 3.5)} className="ill-surf" stroke="none" />
        <path d={nrect(128, 10, 14, 14, 3.5)} />
        <path d="M91 22 112 46M129 22 108 46" strokeWidth={2} />
      </A>
      <A a="twinkle"><Plus x={110} y={130} s={3} /></A>
    </Frame>
  );
}

export const ILLUSTRATIONS = {
  EmptyCampaigns, EmptyClips, EmptyChat, EmptyNotifications, EmptyWallet, Success, VerifyAccount, NotFound,
} as const;
