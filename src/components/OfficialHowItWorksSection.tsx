'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { BandMarquee, Eyebrow, NeonStrip, NotchButton, RevealWords, useInView } from './pi';

const DOTS = ['var(--pi-green)', 'var(--pi-pink)', 'var(--pi-blue)', 'var(--pi-orange)', 'var(--pi-yellow)'];

export default function OfficialHowItWorksSection() {
  const { t, tr, lang } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const stepRefs = useRef<(HTMLElement | null)[]>([]);
  const header = useInView<HTMLDivElement>(0.4);

  // 5 steps — each pairs a floating stone with a numbered "service" block
  const steps = [
    {
      id: 'step1',
      rock: '/stones/rock-1.webp',
      rockRotate: '-18deg',
      title:
        lang === 'ru'
          ? 'Выберите кампанию'
          : lang === 'kk'
          ? 'Кампанияны таңдаңыз'
          : 'Pick a Campaign',
      desc:
        lang === 'ru'
          ? 'Изучите открытые кампании от топовых стримеров, брендов и музыкальных лейблов. Выбирайте офферы с фиксированной оплатой за просмотры и понятными правилами монетизации.'
          : lang === 'kk'
          ? 'Үздік стримерлердің, брендтердің және музыкалық лейблдардың қолжетімді кампанияларын қараңыз. Қаралымдарға белгіленген төлемі бар ұсыныстарды таңдаңыз.'
          : 'Browse active campaigns from verified streamers, record labels, and global brands. Select bounties with guaranteed pay per view and clear payout criteria.',
    },
    {
      id: 'step2',
      rock: '/stones/rock-2.webp',
      rockRotate: '22deg',
      title:
        lang === 'ru'
          ? 'Привяжите аккаунты'
          : lang === 'kk'
          ? 'Аккаунттарды қосыңыз'
          : 'Connect Social Accounts',
      desc:
        lang === 'ru'
          ? 'Подключите ваши профили TikTok, Instagram Reels или YouTube Shorts в один клик. Статистика и просмотры будут автоматически привязываться к вашему кабинету.'
          : lang === 'kk'
          ? 'TikTok, Instagram Reels немесе YouTube Shorts профильдеріңізді 1 басу арқылы қосыңыз. Қаралымдар статистикасы жеке кабинетіңізге автоматты түрде тіркеледі.'
          : 'Link your TikTok, Instagram Reels, or YouTube Shorts channels with instant 1-click authorization. View analytics sync directly to your dashboard.',
    },
    {
      id: 'step3',
      rock: '/stones/rock-3.webp',
      rockRotate: '-24deg',
      title:
        lang === 'ru'
          ? 'Укажите способ вывода'
          : lang === 'kk'
          ? 'Ақша шығару әдісін көрсетіңіз'
          : 'Set Up Payout Rails',
      desc:
        lang === 'ru'
          ? 'Добавьте реквизиты для получения выплат: PayPal или криптовалюта (USDT, USDC и другие). Средства перечисляются автоматически каждую неделю.'
          : lang === 'kk'
          ? 'Төлемдерді алу үшін деректемелерді қосыңыз: PayPal немесе криптовалюта (USDT, USDC және басқалар). Қаражат апта сайын автоматты түрде аударылады.'
          : 'Configure your preferred withdrawal method — PayPal or instant crypto transfers (USDT, USDC and more). Automated weekly payouts.',
    },
    {
      id: 'step4',
      rock: '/stones/rock-4.webp',
      rockRotate: '20deg',
      title:
        lang === 'ru'
          ? 'Публикуйте нарезки'
          : lang === 'kk'
          ? 'Клиптерді жариялаңыз'
          : 'Drop Viral Cuts',
      desc:
        lang === 'ru'
          ? 'Создавайте вирусные короткие видео, публикуйте их на своих каналах и прикрепляйте ссылки. Система отслеживает органические просмотры в реальном времени.'
          : lang === 'kk'
          ? 'Вирустық қысқа роликтер жасаңыз, өз арналарыңызда жариялаңыз және сілтемелерді енгізіңіз. Жүйе органикалық қаралымдарды нақты уақытта есептейді.'
          : 'Produce engaging short-form clips with viral hooks, publish to your linked accounts, and submit links. Our crawlers monitor real-time verified view counts.',
    },
    {
      id: 'step5',
      rock: '/stones/rock-5.webp',
      rockRotate: '-16deg',
      title:
        lang === 'ru'
          ? 'Получайте выплаты'
          : lang === 'kk'
          ? 'Төлемдерді алыңыз'
          : 'Get Paid Per View',
      desc:
        lang === 'ru'
          ? 'Ваш баланс пополняется с каждым подтвержденным просмотром. Заработанные средства автоматически зачисляются на выбранный кошелек по окончании цикла.'
          : lang === 'kk'
          ? 'Сіздің теңгеріміңіз әрбір расталған қаралым сайын толығып отырады. Табысыңыз цикл аяқталғанда таңдалған әмиянға автоматты түрде аударылады.'
          : 'Your revenue balance accumulates live as your clips gain traction. Earnings are transferred directly to your account at the end of each billing cycle.',
    },
  ];

  const rows = tr<[string, string][][]>('landing.how.rows') ?? [];

  // Track which step sits in the middle of the viewport
  useEffect(() => {
    const els = stepRefs.current.filter(Boolean) as HTMLElement[];
    if (!els.length || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveIndex(Number((entry.target as HTMLElement).dataset.index));
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="relative w-full">
      <BandMarquee script="Process" index="02" words={['Clip', 'Post', 'Get Paid']} duration={40} />

      <div className="px-6 md:px-12!">
        <Eyebrow>{t('landing.how.label')}</Eyebrow>
        <RevealWords
          key={`how-${lang}`}
          text={t('howItWorks.clipperTitle')}
          as="h2"
          className="mt-4 max-w-[20ch] text-2xl md:text-4xl! font-light leading-none tracking-[-0.04em] text-[var(--pi-ink)]"
        />

        {/* Column headers */}
        <div ref={header.ref} className={`mt-16 md:mt-24! ${header.className}`}>
          <div className="hidden md:grid! grid-cols-2 pb-3 tracking-tight text-[var(--pi-ink)]">
            <span className="pi-fade">{t('landing.how.number')}</span>
            <span className="pi-fade">{t('landing.how.step')}</span>
          </div>
          <div className="pi-rule h-px w-full bg-[var(--pi-line-strong)]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2!">
          {/* ---------- Sticky numeral + stone (desktop) ---------- */}
          <div className="relative hidden md:block!">
            <div data-pi-pause className="sticky top-0 flex h-[100svh] items-center">
              <div className="relative h-[80svh] w-full">
                {steps.map((step, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <div
                      key={step.id}
                      aria-hidden={!active}
                      className="absolute inset-0 flex items-center justify-center transition-all duration-[900ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
                      style={{
                        opacity: active ? 1 : 0,
                        visibility: active ? 'visible' : 'hidden',
                        transform: active ? 'rotate(0deg) scale(1)' : `rotate(${step.rockRotate}) scale(0.82)`,
                      }}
                    >
                      <CarvedStone
                        rock={step.rock}
                        n={idx + 1}
                        priority={idx === 0}
                        sizes="(max-width: 1024px) 40vw, 30vw"
                        className={`h-[70%] w-[55%] ${active ? 'animate-[rock-float_7s_ease-in-out_infinite]' : ''}`}
                      />
                    </div>
                  );
                })}

                {/* Step counter */}
                <p className="absolute bottom-6 left-0 text-sm tabular-nums text-[var(--pi-muted)]" aria-hidden="true">
                  (<span key={activeIndex} className="pi-panel-in inline-block text-[var(--pi-ink-strong)]">{String(activeIndex + 1).padStart(2, '0')}</span>
                  {' / '}
                  {String(steps.length).padStart(2, '0')})
                </p>
              </div>
            </div>
          </div>

          {/* ---------- Steps list ---------- */}
          <ol>
            {steps.map((step, idx) => (
              <li
                key={step.id}
                data-index={idx}
                ref={(el) => {
                  stepRefs.current[idx] = el;
                }}
                className="flex flex-col justify-center border-b border-[var(--pi-line)] py-14 md:min-h-[85svh]! md:border-none! md:py-16!"
              >
                <StepBody
                  index={idx}
                  badge={t(`howItWorks.step${idx + 1}.badge`)}
                  title={step.title}
                  desc={step.desc}
                  rows={rows[idx] ?? []}
                  rock={step.rock}
                  dot={DOTS[idx]}
                  cta={idx === steps.length - 1 ? t('howItWorks.startClipping') : undefined}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="mt-16 md:mt-24!">
        <NeonStrip text={t('landing.how.strip')} href="/register" />
      </div>
    </section>
  );
}

function StepBody({
  index,
  badge,
  title,
  desc,
  rows,
  rock,
  dot,
  cta,
}: {
  index: number;
  badge: string;
  title: string;
  desc: string;
  rows: [string, string][];
  rock: string;
  dot: string;
  cta?: string;
}) {
  const view = useInView<HTMLDivElement>(0.3);
  return (
    <div ref={view.ref} className={view.className}>
      {/* Mobile numeral + stone */}
      <div className="mb-8 flex items-end justify-between md:hidden!">
        <span className="text-sm tabular-nums text-[var(--pi-muted)]" aria-hidden="true">
          ({String(index + 1).padStart(2, '0')} / 05)
        </span>
        <CarvedStone rock={rock} n={index + 1} sizes="160px" className="h-48 w-40" />
      </div>

      <Eyebrow>{badge}</Eyebrow>
      <h3 className="pi-fade mt-5 flex items-center gap-3 text-3xl md:text-[2.5rem]! font-normal leading-none tracking-[-0.04em] text-[var(--pi-ink-strong)]">
        <span className="size-4 md:size-5! shrink-0 rounded-full" style={{ backgroundColor: dot }} />
        {title}
      </h3>
      <p
        className="pi-fade mt-5 max-w-xl text-base md:text-lg! font-light leading-snug text-[var(--pi-ink)]"
        style={{ transitionDelay: '0.1s' }}
      >
        {desc}
      </p>

      <div className="mt-8">
        {rows.map(([label, value], i) => (
          <div key={label}>
            <div className="pi-rule h-px w-full bg-[var(--pi-line-strong)]" style={{ transitionDelay: `${0.15 + i * 0.08}s` }} />
            <div
              className="pi-fade flex items-center justify-between gap-4 py-2 text-sm md:text-base! tracking-tight text-[var(--pi-ink)]"
              style={{ transitionDelay: `${0.2 + i * 0.08}s` }}
            >
              <span>{label}</span>
              <span className="text-right text-[var(--pi-muted)]">{value}</span>
            </div>
          </div>
        ))}
        {rows.length > 0 && <div className="pi-rule h-px w-full bg-[var(--pi-line-strong)]" style={{ transitionDelay: '0.45s' }} />}
      </div>

      {cta && (
        <div className="mt-8">
          <NotchButton href="/register">{cta}</NotchButton>
        </div>
      )}
    </div>
  );
}

/** Stone with its step numeral carved into the face (masked to the stone's silhouette). */
function CarvedStone({
  rock,
  n,
  sizes,
  className = '',
  priority = false,
}: {
  rock: string;
  n: number;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const mask = { ['--stone' as string]: `url(${rock})` } as React.CSSProperties;
  const ink = useInkCenter(String(n));
  const glyph = { transform: `translate(${ink.x}em, ${ink.y}em)` };
  return (
    <div className={`pi-stone ${className}`}>
      <Image src={rock} alt="" fill sizes={sizes} priority={priority} className="object-contain drop-shadow-[0_30px_40px_rgba(0,0,0,0.22)]" />
      <div className="pi-carve-wrap" aria-hidden="true">
        <div className="pi-carve pi-carve--edge" style={mask}>
          <span style={glyph}>
            <span>{n}</span>
          </span>
        </div>
        <div className="pi-carve pi-carve--cut" style={mask}>
          <span style={glyph}>
            <span>{n}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Script numerals sit off-centre in their em box. Measure the real ink bounds
 * (canvas TextMetrics) once Ballet has loaded and return the em offset that
 * puts the ink centre on the box centre (line-height: 1, horizontally centred).
 */
function useInkCenter(text: string) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  useEffect(() => {
    let cancelled = false;
    const font = "100px Ballet";
    document.fonts.load(font, text).then(() => {
      if (cancelled) return;
      const ctx = document.createElement('canvas').getContext('2d');
      if (!ctx) return;
      ctx.font = font;
      const m = ctx.measureText(text);
      // Baseline position inside a 1em line box (half-leading model)
      const ascent = m.fontBoundingBoxAscent;
      const descent = m.fontBoundingBoxDescent;
      const baseline = (100 - (ascent + descent)) / 2 + ascent;
      const inkCenterY = baseline - (m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2;
      const inkCenterX = (m.actualBoundingBoxRight - m.actualBoundingBoxLeft) / 2;
      setOffset({ x: (m.width / 2 - inkCenterX) / 100, y: (50 - inkCenterY) / 100 });
    });
    return () => {
      cancelled = true;
    };
  }, [text]);
  return offset;
}
