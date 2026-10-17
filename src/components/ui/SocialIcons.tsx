import { CLIPTE_MARK_PATH } from './ClipteMark';
import React from 'react';

// ============================================================================
// REICON STICKYNOTE SVG (EXACT SPEC MATCH)
// ============================================================================

export function ReiconStickyNote({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
        <path strokeMiterlimit="10" d="M8 2v3m8-3v3m-9 6h8m-8 4h5m3 7H9c-5 0-6-2.06-6-6.18V9.65c0-4.7 1.67-5.96 5-6.15h8c3.33.18 5 1.45 5 6.15V16" />
        <path d="m21 16l-6 6v-3q0-3 3-3z" />
      </g>
    </svg>
  );
}

// ============================================================================
// OFFICIAL VIBRANT BRAND COLOR ICONS (ALL-SVG-ICONS / SKILL-ICONS PREMIUM HD BADGES)
// ============================================================================

export function TikTokColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#010101" rx="60" />
      <g transform="translate(48, 44) scale(0.62)">
        <path fill="#ff004f" d="M189.72 104.421c18.678 13.345 41.56 21.197 66.273 21.197v-47.53a67 67 0 0 1-13.918-1.456v37.413c-24.711 0-47.59-7.851-66.272-21.195v96.996c0 48.523-39.356 87.855-87.9 87.855c-18.113 0-34.949-5.473-48.934-14.86c15.962 16.313 38.222 26.432 62.848 26.432c48.548 0 87.905-39.332 87.905-87.857v-96.995zm17.17-47.952c-9.546-10.423-15.814-23.893-17.17-38.785v-6.113h-13.189c3.32 18.927 14.644 35.097 30.358 44.898M69.673 225.607a40 40 0 0 1-8.203-24.33c0-22.192 18.001-40.186 40.21-40.186a40.3 40.3 0 0 1 12.197 1.883v-48.593c-4.61-.631-9.262-.9-13.912-.801v37.822a40.3 40.3 0 0 0-12.203-1.882c-22.208 0-40.208 17.992-40.208 40.187c0 15.694 8.997 29.281 22.119 35.9" />
        <path fill="#ffffff" d="M175.803 92.849c18.683 13.344 41.56 21.195 66.272 21.195V76.631c-13.794-2.937-26.005-10.141-35.186-20.162c-15.715-9.802-27.038-25.972-30.358-44.898h-34.643v189.843c-.079 22.132-18.049 40.052-40.21 40.052c-13.058 0-24.66-6.221-32.007-15.86c-13.12-6.618-22.118-20.206-22.118-35.898c0-22.193 18-40.187 40.208-40.187c4.255 0 8.356.662 12.203 1.882v-37.822c-47.692.985-86.047 39.933-86.047 87.834c0 23.912 9.551 45.589 25.053 61.428c13.985 9.385 30.82 14.86 48.934 14.86c48.545 0 87.9-39.335 87.9-87.857z" />
        <path fill="#00f2ea" d="M242.075 76.63V66.516a66.3 66.3 0 0 1-35.186-10.047a66.47 66.47 0 0 0 35.186 20.163M176.53 11.57a68 68 0 0 1-.728-5.457V0h-47.834v189.845c-.076 22.13-18.046 40.05-40.208 40.05a40.06 40.06 0 0 1-18.09-4.287c7.347 9.637 18.949 15.857 32.007 15.857c22.16 0 40.132-17.918 40.21-40.05V11.571zM99.966 113.58v-10.769a89 89 0 0 0-12.061-.818C39.355 101.993 0 141.327 0 189.845c0 30.419 15.467 57.227 38.971 72.996c-15.502-15.838-25.053-37.516-25.053-61.427c0-47.9 38.354-86.848 86.048-87.833" />
      </g>
    </svg>
  );
}

export function InstagramColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-[24%] overflow-hidden shrink-0 aspect-square shadow-xs ${className}`}
      style={{
        background:
          'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)',
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" className="w-[66%] h-[66%]" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="20" height="20" rx="5" stroke="#ffffff" strokeWidth="2" />
        <circle cx="12" cy="12" r="4.2" stroke="#ffffff" strokeWidth="2" />
        <circle cx="17.2" cy="6.8" r="1.2" fill="#ffffff" />
      </svg>
    </span>
  );
}

export function YouTubeColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
        fill="#FF0000"
      />
      <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
    </svg>
  );
}

export function XColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#000000" rx="60" />
      <path fill="#ffffff" d="M151.2 108.8L205.8 45H192.9L145.5 100.2L107.7 45H64L121.2 128.4L64 195H76.9L126.9 137L166.7 195H210.4L151.2 108.8ZM133.5 129.3L127.7 121L81.5 55H101.4L138.6 108.2L144.4 116.5L192.9 185.8H173L133.5 129.3Z" />
    </svg>
  );
}

export function TwitterColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#1d9bf0" rx="60" />
      <path fill="#fff" d="M199.572 91.411c.11 1.587.11 3.174.11 4.776c0 48.797-37.148 105.075-105.075 105.075v-.03A104.54 104.54 0 0 1 38 184.677q4.379.525 8.79.533a74.15 74.15 0 0 0 45.865-15.839a36.98 36.98 0 0 1-34.501-25.645a36.8 36.8 0 0 0 16.672-.636c-17.228-3.481-29.623-18.618-29.623-36.198v-.468a36.7 36.7 0 0 0 16.76 4.622c-16.226-10.845-21.228-32.432-11.43-49.31a104.8 104.8 0 0 0 76.111 38.582a36.95 36.95 0 0 1 10.683-35.283c14.874-13.982 38.267-13.265 52.249 1.601a74.1 74.1 0 0 0 23.451-8.965a37.06 37.06 0 0 1-16.234 20.424A73.5 73.5 0 0 0 218 72.282a75 75 0 0 1-18.428 19.13" />
    </svg>
  );
}

export function LinkedInColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#0a66c2" rx="60" />
      <path fill="#fff" d="M184.715 217.685h29.27a4 4 0 0 0 4-3.999l.015-61.842c0-32.323-6.965-57.168-44.738-57.168c-14.359-.534-27.9 6.868-35.207 19.228a.32.32 0 0 1-.595-.161V101.66a4 4 0 0 0-4-4h-27.777a4 4 0 0 0-4 4v112.02a4 4 0 0 0 4 4h29.268a4 4 0 0 0 4-4v-55.373c0-15.657 2.97-30.82 22.381-30.82c19.135 0 19.383 17.916 19.383 31.834v54.364a4 4 0 0 0 4 4M38 59.628c0 11.864 9.767 21.626 21.632 21.626c11.862-.001 21.623-9.769 21.623-21.631C81.253 47.761 71.491 38 59.628 38C47.762 38 38 47.763 38 59.627m6.959 158.058h29.307a4 4 0 0 0 4-4V101.66a4 4 0 0 0-4-4H44.959a4 4 0 0 0-4 4v112.025a4 4 0 0 0 4 4" />
    </svg>
  );
}

export function GitHubColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#242938" rx="60" />
      <path fill="#fff" d="M128.001 30C72.779 30 28 74.77 28 130.001c0 44.183 28.653 81.667 68.387 94.89c4.997.926 6.832-2.169 6.832-4.81c0-2.385-.093-10.262-.136-18.618c-27.82 6.049-33.69-11.799-33.69-11.799c-4.55-11.559-11.104-14.632-11.104-14.632c-9.073-6.207.684-6.079.684-6.079c10.042.705 15.33 10.305 15.33 10.305c8.919 15.288 23.394 10.868 29.1 8.313c.898-6.464 3.489-10.875 6.349-13.372c-22.211-2.529-45.56-11.104-45.56-49.421c0-10.918 3.906-19.839 10.303-26.842c-1.039-2.519-4.462-12.69.968-26.464c0 0 8.398-2.687 27.508 10.25c7.977-2.215 16.531-3.326 25.03-3.364c8.498.038 17.06 1.149 25.051 3.365c19.087-12.939 27.473-10.25 27.473-10.25c5.443 13.773 2.019 23.945.98 26.463c6.412 7.003 10.292 15.924 10.292 26.842c0 38.409-23.394 46.866-45.662 49.341c3.587 3.104 6.783 9.189 6.783 18.519c0 13.38-.116 24.149-.116 27.443c0 2.661 1.8 5.779 6.869 4.797C199.383 211.64 228 174.169 228 130.001C228 74.771 183.227 30 128.001 30M65.454 172.453c-.22.497-1.002.646-1.714.305c-.726-.326-1.133-1.004-.898-1.502c.215-.512.999-.654 1.722-.311c.727.326 1.141 1.01.89 1.508m4.919 4.389c-.477.443-1.41.237-2.042-.462c-.654-.697-.777-1.629-.293-2.078c.491-.442 1.396-.235 2.051.462c.654.706.782 1.631.284 2.078m3.374 5.616c-.613.426-1.615.027-2.234-.863c-.613-.889-.613-1.955.013-2.383c.621-.427 1.608-.043 2.236.84c.611.904.611 1.971-.015 2.406m5.707 6.504c-.548.604-1.715.442-2.57-.383c-.874-.806-1.118-1.95-.568-2.555c.555-.606 1.729-.435 2.59.383c.868.804 1.133 1.957.548 2.555m7.376 2.195c-.242.784-1.366 1.14-2.499.807c-1.13-.343-1.871-1.26-1.642-2.052c.235-.788 1.364-1.159 2.505-.803c1.13.341 1.871 1.252 1.636 2.048m8.394.932c.028.824-.932 1.508-2.121 1.523c-1.196.027-2.163-.641-2.176-1.452c0-.833.939-1.51 2.134-1.53c1.19-.023 2.163.639 2.163 1.459m8.246-.316c.143.804-.683 1.631-1.864 1.851c-1.161.212-2.236-.285-2.383-1.083c-.144-.825.697-1.651 1.856-1.865c1.183-.205 2.241.279 2.391 1.097" />
    </svg>
  );
}

export function DiscordColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#5865f2" rx="60" />
      <g clipPath="url(#SVGKXSAsd8x_discord)">
        <path fill="#fff" d="M197.308 64.797a165 165 0 0 0-40.709-12.627a.62.62 0 0 0-.654.31c-1.758 3.126-3.706 7.206-5.069 10.412c-15.373-2.302-30.666-2.302-45.723 0c-1.364-3.278-3.382-7.286-5.148-10.412a.64.64 0 0 0-.655-.31a164.5 164.5 0 0 0-40.709 12.627a.6.6 0 0 0-.268.23c-25.928 38.736-33.03 76.52-29.546 113.836a.7.7 0 0 0 .26.468c17.106 12.563 33.677 20.19 49.94 25.245a.65.65 0 0 0 .702-.23c3.847-5.254 7.276-10.793 10.217-16.618a.633.633 0 0 0-.347-.881c-5.44-2.064-10.619-4.579-15.601-7.436a.642.642 0 0 1-.063-1.064a86 86 0 0 0 3.098-2.428a.62.62 0 0 1 .646-.088c32.732 14.944 68.167 14.944 100.512 0a.62.62 0 0 1 .655.08a80 80 0 0 0 3.106 2.436a.642.642 0 0 1-.055 1.064a102.6 102.6 0 0 1-15.609 7.428a.64.64 0 0 0-.339.889a133 133 0 0 0 10.208 16.61a.64.64 0 0 0 .702.238c16.342-5.055 32.913-12.682 50.02-25.245a.65.65 0 0 0 .26-.46c4.17-43.141-6.985-80.616-29.571-113.836a.5.5 0 0 0-.26-.238M94.834 156.142c-9.855 0-17.975-9.047-17.975-20.158s7.963-20.158 17.975-20.158c10.09 0 18.131 9.127 17.973 20.158c0 11.111-7.962 20.158-17.973 20.158m66.456 0c-9.855 0-17.974-9.047-17.974-20.158s7.962-20.158 17.974-20.158c10.09 0 18.131 9.127 17.974 20.158c0 11.111-7.884 20.158-17.974 20.158" />
      </g>
      <defs>
        <clipPath id="SVGKXSAsd8x_discord">
          <path fill="#fff" d="M28 51h200v154.93H28z" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function TelegramColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#24A1DE" rx="60" />
      <path fill="#ffffff" d="M192.5 73.5L59.2 125c-9.1 3.7-9 8.8-1.6 11.1l34.2 10.7 79.2-50c3.7-2.3 7.2-1 4.4 1.4L111.3 156l-2.4 36.3c3.5 0 5-1.6 7-3.5l16.8-16.3 35 25.8c6.4 3.5 11 1.7 12.6-6l23-108.5c2.3-9.3-3.4-13.4-10.8-10.3z" />
    </svg>
  );
}

export function TwitchColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#9146FF" rx="60" />
      <path d="M124 72h16v48h-16V72zm48 0h16v48h-16V72zM72 40L40 72v128h48v32l32-32h32l56-56V40H72zm120 96l-32 32h-32l-24 24v-24H72V56h120v80z" fill="#FFFFFF" />
    </svg>
  );
}

export function SpotifyColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" fill="#1DB954" rx="60" />
      <g transform="translate(48, 48) scale(6.67)">
        <path d="M22.5 22.3c-.3.4-.8.5-1.2.3-3.3-2-7.5-2.5-12.4-1.3-.5.1-.9-.2-1-.6s.2-.9.6-1c5.4-1.2 10-0.7 13.7 1.5.4.2.5.8.3 1.1zm1.7-3.9c-.4.5-1 .7-1.5.3-3.8-2.3-9.6-3-14.1-1.6-.6.2-1.2-.1-1.4-.7s.1-1.2.7-1.4c5.1-1.5 11.5-.8 15.9 1.9.5.3.7 1 .4 1.5zm.1-4c-.5.6-1.4.8-2 .4-4.5-2.7-12.1-2.9-16.5-1.6-.7.2-1.4-.2-1.6-.9s.2-1.4.9-1.6c5-1.5 13.3-1.2 18.4 1.8.7.4.9 1.3.4 1.9z" fill="#FFFFFF" />
      </g>
    </svg>
  );
}

// ============================================================================
// CRYPTO & PAYMENTS COLOR ICONS (OFFICIAL HD VECTOR COINS)
// ============================================================================

export function BitcoinColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#F7931A" />
      <path
        d="M23.189 14.02c.314-2.096-1.283-3.223-3.466-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783-1.728-.431-.709 2.839c-.376-.086-.745-.17-1.103-.258l.002-.007-2.385-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.532-.793.41.018.025-1.256-.314-1.256-.314l-.858 1.978 2.25.561c.419.105.83.214 1.236.318l-.715 2.871 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.705 2.828 1.728.432.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.384-1.587-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.945 5.534c-.535 2.146-4.148.986-5.318.695l.949-3.803c1.17.292 4.92.869 4.369 3.108zm.535-5.568c-.488 1.954-3.496.962-4.472.718l.86-3.45c.976.243 4.118.698 3.612 2.732z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function EthereumColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <g fill="#FFFFFF">
        <path d="M16.498 4v8.87l7.497 3.35L16.498 4z" fillOpacity="0.602" />
        <path d="M16.498 4L9 16.22l7.498-3.35V4z" />
        <path d="M16.498 21.968v6.027L24 17.616l-7.502 4.352z" fillOpacity="0.602" />
        <path d="M16.498 27.995v-6.027L9 17.616l7.498 10.379z" />
        <path d="M16.498 20.573l7.497-4.353-7.497-3.348v7.701z" fillOpacity="0.2" />
        <path d="M9 16.22l7.498 4.353v-7.701L9 16.22z" fillOpacity="0.602" />
      </g>
    </svg>
  );
}

export function TetherColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#26A17B" />
      <path
        d="M17.922 17.383c-.11.008-.68.043-1.945.043-1.055 0-1.745-.034-1.93-.043v-.002c-3.79-.172-6.617-.832-6.617-1.625 0-.792 2.827-1.453 6.617-1.625v2.574c.19.012.89.052 1.954.052 1.23 0 1.817-.044 1.921-.052V14.13c3.78.173 6.598.834 6.598 1.626 0 .793-2.818 1.454-6.598 1.626v.001zm0-3.84v-2.072h5.794V8.539H8.257v2.932h5.742v2.072c-4.385.207-7.697 1.055-7.697 2.068 0 1.013 3.312 1.861 7.697 2.068v6.782h3.923v-6.782c4.376-.207 7.68-1.055 7.68-2.068 0-1.013-3.304-1.861-7.68-2.068z"
        fill="#FFFFFF"
      />
    </svg>
  );
}

export function UsdcColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path
        d="M20.2 17.5c0-2.2-1.3-3-3.9-3.3-1.8-.2-2.2-.6-2.2-1.5s.8-1.3 2-1.3c1.3 0 2 .5 2.3 1.3l2.2-.9c-.6-1.4-1.8-2.3-3.5-2.6V7h-2.2v2.1c-2.1.3-3.6 1.7-3.6 3.6 0 2.2 1.4 3 4 3.4 1.7.3 2.1.7 2.1 1.5s-.8 1.4-2.2 1.4c-1.6 0-2.3-.7-2.6-1.7l-2.3.9c.5 1.7 1.8 2.7 3.9 3V25h2.2v-2.1c2.2-.4 3.8-1.8 3.8-3.9z"
        fill="#FFFFFF"
      />
      <path
        d="M16 4.5C9.649 4.5 4.5 9.649 4.5 16S9.649 27.5 16 27.5 27.5 22.351 27.5 16 22.351 4.5 16 4.5zm0 21.2c-5.357 0-9.7-4.343-9.7-9.7S10.643 6.3 16 6.3s9.7 4.343 9.7 9.7-4.343 9.7-9.7 9.7z"
        fill="#FFFFFF"
        fillOpacity="0.4"
      />
    </svg>
  );
}

export function SolanaColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#000000" />
      <defs>
        <linearGradient id="solColorGrad" x1="6.8" y1="23.5" x2="25.2" y2="8.5" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#DC1FFF" />
        </linearGradient>
      </defs>
      <path
        d="M9.54 21.65c.13-.13.31-.2.5-.2h14.4c.32 0 .48.38.25.61l-2.23 2.23c-.13.13-.31.2-.5.2H7.56c-.32 0-.48-.38-.25-.61l2.23-2.23zm12.92-6.77c-.13-.13-.31-.2-.5-.2H7.56c-.32 0-.48.38-.25.61l2.23 2.23c.13.13.31.2.5.2h14.4c.32 0 .48-.38.25-.61l-2.23-2.23zm-12.92-6.77c.13-.13.31-.2.5-.2h14.4c.32 0 .48.38.25.61l-2.23 2.23c-.13.13-.31.2-.5.2H7.56c-.32 0-.48-.38-.25-.61l2.23-2.23z"
        fill="url(#solColorGrad)"
      />
    </svg>
  );
}

export function PaypalColorIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#003087" />
      <path
        d="M20.25 11.23c-.22 2.21-1.8 3.75-4.14 3.75h-1.58c-.35 0-.64.26-.69.6l-.88 5.61-.26 1.63c-.04.28.18.52.46.52h2.46c.35 0 .64-.26.69-.6l.73-4.63c.05-.34.34-.6.69-.6h.54c3.08 0 5.48-1.25 6.18-4.85.3-1.53.07-2.8-.75-3.67-.32-.34-.73-.6-1.25-.76-.08.79-.41 1.77-1.2 2.4z"
        fill="#0079C1"
      />
      <path
        d="M19.05 10.47c-.7 3.6-3.1 4.85-6.18 4.85h-.54c-.35 0-.64.26-.69.6l-.73 4.63c-.05.34-.34.6-.69.6H7.76c-.28 0-.5-.24-.46-.52L9.4 6.95c.06-.39.4-.69.8-.69h5.12c2.6 0 4.54.58 5.17 2.15.28.69.29 1.41.13 2.06-.52.01-1.05.04-1.57.0z"
        fill="#FFFFFF"
      />
      <path
        d="M17.48 10.47c-.08.79-.41 1.77-1.2 2.4-.22 2.21-1.8 3.75-4.14 3.75h-1.58c-.35 0-.64.26-.69.6l-.88 5.61-.26 1.63c-.04.28.18.52.46.52h2.46c.35 0 .64-.26.69-.6l.73-4.63c.05-.34.34-.6.69-.6h.54c3.08 0 5.48-1.25 6.18-4.85.3-1.53.07-2.8-.75-3.67-.32-.34-.73-.6-1.25-.76z"
        fill="#0079C1"
        fillOpacity="0.4"
      />
    </svg>
  );
}

// ============================================================================
// COMPACT / TABLE ICONS
// ============================================================================

export function TikTokIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <TikTokColorIcon className={className} />;
}

export function InstagramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <InstagramColorIcon className={className} />;
}

export function YouTubeIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <YouTubeColorIcon className={className} />;
}

export function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <XColorIcon className={className} />;
}

export function TwitterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <TwitterColorIcon className={className} />;
}

export function LinkedInIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <LinkedInColorIcon className={className} />;
}

export function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <GitHubColorIcon className={className} />;
}

export function DiscordIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <DiscordColorIcon className={className} />;
}

export function TelegramIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <TelegramColorIcon className={className} />;
}

export function TwitchIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <TwitchColorIcon className={className} />;
}

export function SpotifyIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <SpotifyColorIcon className={className} />;
}

export function BitcoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <BitcoinColorIcon className={className} />;
}

export function EthereumIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <EthereumColorIcon className={className} />;
}

export function TetherIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <TetherColorIcon className={className} />;
}

export function UsdcIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <UsdcColorIcon className={className} />;
}

export function SolanaIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <SolanaColorIcon className={className} />;
}

export function PaypalIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <PaypalColorIcon className={className} />;
}

export function AppleColorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.69-3.04-7.59-7.79-11.72-14.25-5.37-8.38-9.69-17.75-12.96-28.11-3.27-10.37-4.91-20.44-4.91-30.23 0-14.15 3.63-25.76 10.89-34.84 7.26-9.08 16.32-13.72 27.17-13.93 4.89 0 10.22 1.25 16 3.75 5.78 2.5 9.47 3.81 11.08 3.93 1.39-.23 5.37-1.63 11.95-4.22 6.58-2.58 12.33-3.71 17.26-3.39 12.83.65 22.84 5.31 30.03 13.98-11.19 6.81-16.66 16.27-16.42 28.38.24 9.47 3.93 17.38 11.08 23.72 7.15 6.34 15.7 9.87 25.64 10.59-2.28 6.97-5.06 14.19-8.34 21.68zM119.22 33.14c-.09 3.82-1.57 7.74-4.44 11.75-2.87 4.01-6.66 7.12-11.37 9.34-.87-3.48-1.07-6.97-.6-10.47.47-3.5 1.9-7.14 4.29-10.92 2.39-3.78 5.48-6.81 9.27-9.09 3.79-2.28 7.39-3.48 10.8-3.6.12 4.35-.91 8.68-7.95 12.99z" />
    </svg>
  );
}

export function AppleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <AppleColorIcon className={className} />;
}

export function GoogleColorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <GoogleColorIcon className={className} />;
}

export function ClipteLogoIcon({ className = "h-5 w-5" }: { className?: string }) {
  // Official Clipte mark (centred in a square box so existing h-/w- sizes keep working)
  return (
    <svg className={className} viewBox="-110.5 0 1094 1094" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d={CLIPTE_MARK_PATH} />
    </svg>
  );
}
