'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { BandMarquee } from './pi';

interface FlipCardProps {
  frontImg: string;
  backImg: string;
  alt: string;
  className?: string;
  hasLeftBorder?: boolean;
}

function HeroFlipCell({
  frontImg,
  backImg,
  alt,
  className = '',
  hasLeftBorder = false,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className={`relative w-full aspect-[9/11] bg-[#f5f5f5] border-t border-r border-b ${
        hasLeftBorder ? 'border-l' : ''
      } border-[#434343] dark:border-[#cfcfcf]/40! cursor-pointer select-none [perspective:1000px] overflow-hidden group ${className}`}
      onMouseEnter={() => setIsFlipped(true)}
      onMouseLeave={() => setIsFlipped(false)}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className="relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ease-[cubic-bezier(0.4,0,0.2,1)]"
        style={{ transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
      >
        {/* FRONT: Exact Original Letter */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] flex items-center justify-center bg-[#f5f5f5]">
          <div className="relative w-full h-full">
            <Image
              src={frontImg}
              alt={alt}
              fill
              sizes="(max-width: 768px) 12.5vw, 12.5vw"
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* BACK: Exact Original Flip Art */}
        <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex items-center justify-center bg-[#f5f5f5]">
          <div className="relative w-full h-full">
            <Image
              src={backImg}
              alt={`${alt} flipped`}
              fill
              sizes="(max-width: 768px) 12.5vw, 12.5vw"
              className="object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProClipteGridSection() {
  return (
    <section className="w-full relative pb-24 md:pb-40!">
      <BandMarquee script="Clipte" index="03" words={['Pro', 'Clippers', 'Network']} duration={52} />

      {/* 
        Exact 8-Column Grid sizing without any empty border cells:
        Row 1: Cols 1..4 -> [ → ] [ P ] [ R ] [ O ] (Cols 5-8 are empty space, no boxes)
        Row 2: Cols 3..8 -> [ C ] [ L ] [ I ] [ P ] [ T ] [ E ] (Cols 1-2 are empty space, no boxes)
      */}
      <div className="w-full grid grid-cols-8 box-border overflow-hidden">
        
        {/* ========================================================================= */}
        {/* ROW 1: [ → ] [ P ] [ R ] [ O ] (Exact original 1/8 column sizes)          */}
        {/* ========================================================================= */}

        {/* Col 1: Arrow */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/arrow.png"
          backImg="/vietnamese-hero/flip-arrow.webp"
          alt="Arrow"
          hasLeftBorder
          className="col-start-1"
        />

        {/* Col 2: P */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-p.png"
          backImg="/vietnamese-hero/flip-p.webp"
          alt="Letter P"
          className="col-start-2 -ml-px"
        />

        {/* Col 3: R */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-r.png"
          backImg="/vietnamese-hero/flip-r.webp"
          alt="Letter R"
          className="col-start-3 -ml-px"
        />

        {/* Col 4: O */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-o.webp"
          backImg="/vietnamese-hero/flip-o.webp"
          alt="Letter O"
          className="col-start-4 -ml-px"
        />

        {/* ========================================================================= */}
        {/* ROW 2: [ C ] [ L ] [ I ] [ P ] [ T ] [ E ] (Cols 3..8, exact original)    */}
        {/* ========================================================================= */}

        {/* Col 3: C */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-c.webp"
          backImg="/vietnamese-hero/flip-c.webp"
          alt="Letter C"
          hasLeftBorder
          className="col-start-3 -mt-px"
        />

        {/* Col 4: L */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-l.png"
          backImg="/vietnamese-hero/flip-u.webp"
          alt="Letter L"
          className="col-start-4 -ml-px -mt-px"
        />

        {/* Col 5: I */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-i.svg"
          backImg="/vietnamese-hero/flip-d.webp"
          alt="Letter I"
          className="col-start-5 -ml-px -mt-px"
        />

        {/* Col 6: P */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-p.png"
          backImg="/vietnamese-hero/flip-p.webp"
          alt="Letter P"
          className="col-start-6 -ml-px -mt-px"
        />

        {/* Col 7: T */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-t.png"
          backImg="/vietnamese-hero/flip-t.webp"
          alt="Letter T"
          className="col-start-7 -ml-px -mt-px"
        />

        {/* Col 8: E */}
        <HeroFlipCell
          frontImg="/vietnamese-hero/letter-e.png"
          backImg="/vietnamese-hero/flip-s.webp"
          alt="Letter E"
          className="col-start-8 -ml-px -mt-px"
        />

      </div>
    </section>
  );
}
