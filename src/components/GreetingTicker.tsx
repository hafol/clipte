'use client';

import React, { useState, useEffect, useRef } from 'react';

const GREETINGS = [
  'Hello',
  'Bonjour',
  'こんにちは',
  'Hola',
  'Ciao',
  '你好',
  'Hallo',
  'مرحباً',
  'नमस्ते',
  'Merhaba',
  '안녕하세요',
  'Привет',
  'Сәлем',
];

export default function GreetingTicker() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isFinishedRef = useRef(false);

  useEffect(() => {
    if (isFinishedRef.current) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = prev + 1;
        if (next >= GREETINGS.length - 1) {
          clearInterval(interval);
          isFinishedRef.current = true;
          return GREETINGS.length - 1; // Permanently stay on 'Сәлем'
        }
        return next;
      });
    }, 1300);

    return () => clearInterval(interval);
  }, []);

  const total = GREETINGS.length;
  const currentOffsetPercent = (currentIndex / total) * 100;

  return (
    <div
      className="relative overflow-hidden h-10 md:h-12! select-none min-w-[160px]"
      aria-label="Multilingual Greeting Ticker"
    >
      <div
        className="flex flex-col will-change-transform"
        style={{
          transform: `translateY(-${currentOffsetPercent}%)`,
          transition: 'transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {GREETINGS.map((word, idx) => (
          <div
            key={idx}
            className="h-10 md:h-12! flex items-center justify-start shrink-0"
          >
            <span
              className="font-light text-2xl md:text-4xl! tracking-[-0.04em] whitespace-nowrap leading-none inline-block text-[var(--pi-ink-strong,currentColor)]"
            >
              {word}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
