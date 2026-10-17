'use client';

import React, { useState } from 'react';

interface SpringButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: string;
}

export default function SpringButton({
  href = '/dashboard',
  onClick,
  children,
  className = '',
  style = {},
  fontSize = '0.85rem',
}: SpringButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Easing constants
  const elasticEase = 'linear(0, .5737 7.6%, .8382 11.87%, .9463 14.19%, 1.0292 16.54%, 1.0886 18.97%, 1.1258 21.53%, 1.137 22.97%, 1.1424 24.48%, 1.1423 26.1%, 1.1366 27.86%, 1.1165 31.01%, 1.0507 38.62%, 1.0219 42.57%, .9995 46.99%, .9872 51.63%, .9842 58.77%, 1.0011 81.26%, 1)';
  const bouncyEase = 'cubic-bezier(.34, 1.42, .64, 1)';
  const defaultEase = 'cubic-bezier(.72, .17, .17, 1)';

  return (
    <a
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      className={`group/spring-btn relative inline-flex items-center justify-center select-none cursor-pointer text-[#0F1015] no-underline ${className}`}
      style={{
        fontSize,
        ...style,
      }}
    >
      {/* =========================================================================
          1. FIRST CIRCLE (In flow on the left - collapses to scale(0) on hover)
         ========================================================================= */}
      <div
        className="pointer-events-none grid place-items-center rounded-full shrink-0"
        style={{
          width: '2.5em',
          height: '2.5em',
        }}
      >
        {/* First Circle Arrow */}
        <svg
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            gridArea: '1 / 1',
            zIndex: 3,
            width: '0.625em',
            height: '0.625em',
            color: '#0F1015',
            transform: isHovered ? 'translate(-0.75em, 0.75em) scale(0.625)' : 'translate(0, 0) scale(1)',
            opacity: isHovered ? 0 : 1,
            filter: isHovered ? 'blur(0.5rem)' : 'blur(0px)',
            transition: isHovered
              ? `transform 0.75s 0.1s ${elasticEase}, opacity 0.1s 0.15s ease-out, filter 0.1s 0.15s ease-out`
              : `transform 0.3s 0.15s ${bouncyEase}, opacity 0.15s 0.15s ease-out, filter 0.15s 0.15s ease-out`,
          }}
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 1.827 1.71 0H10v8.22L8.11 10V5.93c0-.992.009-1.89.03-2.695l-6.642 6.58-1.316-1.44 6.641-6.58c-.787.022-1.67.032-2.647.032H0Z"
          />
        </svg>

        {/* First Circle Background */}
        <div
          style={{
            gridArea: '1 / 1',
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            transform: isHovered ? 'scale(0)' : 'scale(1)',
            opacity: isHovered ? 0 : 1,
            transition: isHovered
              ? `transform 0.35s ${defaultEase}, opacity 0.15s 0.15s ease-out`
              : `transform 0.75s ${elasticEase}, opacity 0.15s ease-out`,
          }}
        />
      </div>

      {/* =========================================================================
          2. CENTER PILL WITH TEXT
          (Shifts left by exactly -2.5em and tilts -4deg on hover)
         ========================================================================= */}
      <div
        className="relative z-10 flex items-center justify-center whitespace-nowrap"
        style={{
          padding: '0.3125em 0.9375em 0.5625em',
          backgroundColor: '#FFFFFF',
          borderRadius: '12.5em',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
          transform: isHovered
            ? 'translate3d(-2.5em, -0.325em, 0) rotate(-4deg) scale(1)'
            : 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
          transformOrigin: 'center center',
          transition: isHovered
            ? `transform 0.8s 0.1s ${elasticEase}, box-shadow 0.35s ease`
            : `transform 0.8s ${elasticEase}, box-shadow 0.35s ease`,
        }}
      >
        <span
          style={{
            fontSize: '1.15em',
            fontWeight: 600,
            lineHeight: '100%',
            letterSpacing: '-0.01em',
            color: '#0F1015',
          }}
        >
          {children}
        </span>
      </div>

      {/* =========================================================================
          3. SECOND CIRCLE (Absolute on the right - expands to scale(1) on hover)
         ========================================================================= */}
      <div
        className="pointer-events-none absolute top-[-0.125em] right-0 grid place-items-center rounded-full"
        style={{
          width: '2.5em',
          height: '2.5em',
        }}
      >
        {/* Second Circle Arrow */}
        <svg
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            gridArea: '1 / 1',
            zIndex: 3,
            width: '0.625em',
            height: '0.625em',
            color: '#0F1015',
            transform: isHovered ? 'translate(0, 0) scale(1)' : 'translate(-0.75em, 0.75em) scale(0.625)',
            opacity: isHovered ? 1 : 0,
            filter: isHovered ? 'blur(0px)' : 'blur(0.5rem)',
            transition: isHovered
              ? `transform 0.3s 0.2s ${bouncyEase}, opacity 0.15s 0.2s ease-out, filter 0.15s 0.2s ease-out`
              : `transform 0.75s ${elasticEase}, opacity 0.15s 0.05s ease-out, filter 0.15s 0.05s ease-out`,
          }}
        >
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M0 1.827 1.71 0H10v8.22L8.11 10V5.93c0-.992.009-1.89.03-2.695l-6.642 6.58-1.316-1.44 6.641-6.58c-.787.022-1.67.032-2.647.032H0Z"
          />
        </svg>

        {/* Second Circle Background */}
        <div
          style={{
            gridArea: '1 / 1',
            width: '100%',
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
            transform: isHovered ? 'scale(1)' : 'scale(0)',
            opacity: isHovered ? 1 : 0,
            transition: isHovered
              ? `transform 0.75s 0.1s ${elasticEase}, opacity 0.15s ease-out`
              : `transform 0.75s ${elasticEase}, opacity 0.15s 0.1s ease-out`,
          }}
        />
      </div>
    </a>
  );
}
