'use client';

import React, { useState, useRef } from 'react';

interface LeCorreButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  className?: string;
}

export default function LeCorreButton({
  href = '#',
  onClick,
  children,
  variant = 'primary',
  className = '',
}: LeCorreButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const btnRef = useRef<HTMLAnchorElement>(null);

  // Magnetic Cursor Effect (Framer Mouse Follow)
  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btnRef.current.style.transform = `translate3d(${x * 0.15}px, ${y * 0.15}px, 0) scale(1.04)`;
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (!btnRef.current) return;
    btnRef.current.style.transform = 'translate3d(0px, 0px, 0px) scale(1)';
  };

  const isPrimary = variant === 'primary';

  return (
    <a
      ref={btnRef}
      href={href}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      className={`group/lecorre inline-flex items-center no-underline select-none cursor-pointer transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] active:scale-97 ${className}`}
    >
      {/* 1. Capsule Pill (Default State) */}
      <span
        className={`flex items-center justify-center h-12 px-7 sm:h-[52px] sm:px-8 rounded-full font-medium text-sm sm:text-base tracking-tight transition-all duration-300 shadow-md relative z-10 ${
          isPrimary
            ? 'bg-foreground text-background border border-foreground/20 group-hover/lecorre:bg-foreground/90'
            : 'bg-[#F5F2EB] text-neutral-950 border border-[#E6E1D6] group-hover/lecorre:bg-[#EAE5DA]'
        }`}
      >
        <span className="whitespace-nowrap font-medium">{children}</span>
      </span>

      {/* 2. Expanding Circle Button on Hover (Attaches seamlessly touching the capsule edge, NO gap) */}
      <div
        className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] flex items-center justify-center -ml-2"
        style={{
          width: isHovered ? '54px' : '0px',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'scale(1)' : 'scale(0.3)',
          transformOrigin: 'left center',
        }}
      >
        <span
          className={`flex items-center justify-center w-12 h-12 min-w-12 sm:w-[52px] sm:h-[52px] sm:min-w-[52px] rounded-full transition-colors duration-300 shadow-md ${
            isPrimary
              ? 'bg-foreground text-background border border-foreground/20'
              : 'bg-[#F5F2EB] text-neutral-950 border border-[#E6E1D6]'
          }`}
        >
          <svg
            className={`w-5 h-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isHovered ? 'translate-x-0.5' : '-translate-x-2'
            }`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          >
            <path
              d="M5 12h14M12 5l7 7-7 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </a>
  );
}
