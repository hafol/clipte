'use client';

import React from 'react';

export default function IndustryLeadersSection() {
  const industryLeaders = [
    { name: 'Young Thug', img: '/clients/young-thug.webp' },
    { name: 'Bobbi Althoff', img: '/clients/bobbi-althoff.webp' },
    { name: 'Jay Shetty', img: '/clients/jay-shetty.webp' },
    { name: 'Lacy', img: '/clients/lacy.webp' },
    { name: 'PlaqueBoyMax', img: '/clients/plaqueboymax.webp' },
    { name: 'Emma Chamberlain', img: '/clients/emma-chamberlain.webp' },
    { name: 'Super Bowl', img: '/clients/super-bowl.webp' },
    { name: 'KreekCraft', img: '/clients/kreekcraft.webp' },
    { name: 'Playboi Carti', img: '/clients/playboi-carti.webp' },
    { name: 'Bruno Mars', img: '/clients/bruno-mars.webp' },
    { name: 'Lil Baby', img: '/clients/lil-baby.webp' },
    { name: 'Ed Sheeran', img: '/clients/ed-sheeran.webp' },
    { name: 'Adin Ross', img: '/clients/adin-ross.webp' },
    { name: 'xQc', img: '/clients/xqc.webp' },
    { name: 'SteveWillDoIt', img: '/clients/stevewilldoit.webp' },
    { name: 'Trainwreckstv', img: '/clients/trainwreckstv.webp' },
  ];

  return (
    <section id="leaders" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-white/[0.08] bg-[#07080B] text-center">
      <div className="max-w-[85rem] mx-auto space-y-12">
        
        <div className="space-y-3 max-w-2xl mx-auto">
          <div className="font-mono text-xs uppercase tracking-widest text-white/50">
            USED BY INDUSTRY LEADERS
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            The creators and brands <br />
            behind the campaigns.
          </h2>
          <p className="text-sm sm:text-base text-white/70">
            Streamers, record labels, and global brands run campaigns here. Their clips are the ones your network gets paid to post.
          </p>
        </div>

        {/* 16 Real Client / Talent Avatars */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 max-w-5xl mx-auto">
          {industryLeaders.map((leader, lIdx) => (
            <div
              key={lIdx}
              className="group relative aspect-square rounded-2xl overflow-hidden bg-white/5 border border-white/10 p-1 hover:border-white/40 transition-all cursor-pointer shadow-lg"
              title={leader.name}
            >
              <img
                src={leader.img}
                alt={leader.name}
                className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 text-[10px] font-bold text-white font-mono rounded-2xl">
                {leader.name}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
