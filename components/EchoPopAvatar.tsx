'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SpidermanMood, TaskCategory } from '@/hooks/useLifeSimulation';
import { VisemeShape } from '@/hooks/useLipSync';
import { Activity } from 'lucide-react';

interface EchoPopAvatarProps {
  currentState: 'speaking' | 'repairing' | 'idle';
  currentMood: SpidermanMood;
  currentCategory?: TaskCategory;
  activeViseme?: VisemeShape;
  isPlayingVoice?: boolean;
  isDeviceToggling?: boolean;
  lightsOn?: boolean;
  tempC?: number | null;
  isMatchLive?: boolean;
  audioData?: { bass: number; mid: number; treble: number };
  spideySenseActive?: boolean;
}

export type SpidermanOutfit = 'classic' | 'stealth' | 'casual' | 'summer' | 'mi_jersey';

const mouthVariants = {
  closed: { scaleY: 0.05, scaleX: 1.0, y: 0, rotate: 0 },
  open:   { scaleY: 1.0,  scaleX: 0.95, y: 3, rotate: 0 },
  wide:   { scaleY: 0.6,  scaleX: 1.3,  y: 1, rotate: 0 },
  wince:  { scaleY: 0.4,  scaleX: 0.8,  y: 0, rotate: -4 },
  narrow: { scaleY: 0.7,  scaleX: 0.7,  y: 2, rotate: 0 },
  oval:   { scaleY: 1.3,  scaleX: 0.6,  y: 4, rotate: 0 },
};

// Helper components for Spidey's gloved hands to make him look integrated with props
function LeftHand({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return (
    <motion.g style={{ originX: '80px', originY: '280px' }} animate={{ rotate }}>
      {/* Arm Sleeve */}
      <path d={`M 80 280 Q 110 320 ${x} ${y}`} stroke="#111827" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d={`M 80 280 Q 110 320 ${x} ${y}`} stroke="#b91c1c" strokeWidth="14" fill="none" strokeLinecap="round" />
      {/* Web pattern lines */}
      <path d={`M 80 280 Q 110 320 ${x} ${y}`} stroke="#111827" strokeWidth="1" strokeDasharray="4 4" fill="none" />
      {/* Glove cuff */}
      <ellipse cx={x} cy={y} rx="9" ry="12" fill="#b91c1c" stroke="#111827" strokeWidth="2.5" />
      {/* Hand knuckle bump */}
      <circle cx={x + 4} cy={y - 4} r="5" fill="#b91c1c" stroke="#111827" strokeWidth="2" />
    </motion.g>
  );
}

function RightHand({ x, y, rotate = 0 }: { x: number; y: number; rotate?: number }) {
  return (
    <motion.g style={{ originX: '320px', originY: '280px' }} animate={{ rotate }}>
      {/* Arm Sleeve */}
      <path d={`M 320 280 Q 290 320 ${x} ${y}`} stroke="#111827" strokeWidth="20" fill="none" strokeLinecap="round" />
      <path d={`M 320 280 Q 290 320 ${x} ${y}`} stroke="#b91c1c" strokeWidth="14" fill="none" strokeLinecap="round" />
      {/* Web pattern lines */}
      <path d={`M 320 280 Q 290 320 ${x} ${y}`} stroke="#111827" strokeWidth="1" strokeDasharray="4 4" fill="none" />
      {/* Glove cuff */}
      <ellipse cx={x} cy={y} rx="9" ry="12" fill="#b91c1c" stroke="#111827" strokeWidth="2.5" />
      {/* Hand knuckle bump */}
      <circle cx={x - 4} cy={y - 4} r="5" fill="#b91c1c" stroke="#111827" strokeWidth="2" />
    </motion.g>
  );
}

// ─── Activity prop SVG overlays ──────────────────────────────────────────────
function ActivityProp({ category }: { category: TaskCategory }) {
  switch (category) {
    case 'eating':
      return (
        <motion.g key="eating" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
          {/* Pizza slice held in hand */}
          <g transform="translate(10, 10)">
            <polygon points="180,260 220,260 200,195" fill="#fbbf24" stroke="#d97706" strokeWidth="3" />
            <polygon points="180,260 220,260 200,195" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8"/>
            {/* Pepperonis */}
            <circle cx="195" cy="240" r="5" fill="#ef4444" />
            <circle cx="208" cy="245" r="4.5" fill="#ef4444" />
            <circle cx="200" cy="220" r="4" fill="#ef4444" />
            {/* Crust */}
            <path d="M175 260 Q200 266 225 260" stroke="#92400e" strokeWidth="6" strokeLinecap="round" fill="none" />
            {/* Steam */}
            <motion.path d="M195 185 Q190 172 195 160" stroke="#fde68a" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ opacity: [0, 1, 0], y: [0, -6] }} transition={{ repeat: Infinity, duration: 1.8 }}/>
            <motion.path d="M208 185 Q203 172 208 160" stroke="#fde68a" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ opacity: [0, 1, 0], y: [0, -6] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }}/>
          </g>
          <RightHand x={230} y={270} />
        </motion.g>
      );

    case 'reading':
      return (
        <motion.g key="reading" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}>
          {/* Open Comic Book in front of chest */}
          <rect x="135" y="270" width="130" height="75" rx="5" fill="#b91c1c" stroke="#111827" strokeWidth="3"/>
          <rect x="142" y="275" width="55" height="65" fill="#f8fafc" />
          <rect x="203" y="275" width="55" height="65" fill="#f8fafc" />
          {/* Book spine line */}
          <line x1="200" y1="270" x2="200" y2="345" stroke="#111827" strokeWidth="2.5"/>
          {/* Left/Right comic panels and lines */}
          <rect x="147" y="280" width="20" height="20" fill="#3b82f6" stroke="#111827" strokeWidth="1"/>
          <rect x="172" y="280" width="20" height="20" fill="#fbbf24" stroke="#111827" strokeWidth="1"/>
          <line x1="147" y1="310" x2="192" y2="310" stroke="#64748b" strokeWidth="2"/>
          <line x1="147" y1="320" x2="192" y2="320" stroke="#64748b" strokeWidth="2"/>

          <circle cx="215" cy="290" r="10" fill="#ef4444" stroke="#111827" strokeWidth="1"/>
          <line x1="208" y1="310" x2="253" y2="310" stroke="#64748b" strokeWidth="2"/>
          <line x1="208" y1="320" x2="253" y2="320" stroke="#64748b" strokeWidth="2"/>

          {/* Hands holding pages */}
          <LeftHand x={145} y={325} />
          <RightHand x={255} y={325} />
        </motion.g>
      );

    case 'exercising':
      return (
        <motion.g key="exercising" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
          {/* Lifting Heavy Dumbbell (Curling up and down) */}
          <motion.g animate={{ y: [15, -15, 15] }} transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}>
            <rect x="150" y="225" width="100" height="12" rx="6" fill="#64748b" stroke="#111827" strokeWidth="2"/>
            {/* Left weights */}
            <rect x="135" y="200" width="15" height="62" rx="4" fill="#334155" stroke="#111827" strokeWidth="2"/>
            <rect x="125" y="210" width="10" height="42" rx="3" fill="#1e293b" stroke="#111827" strokeWidth="2"/>
            {/* Right weights */}
            <rect x="250" y="200" width="15" height="62" rx="4" fill="#334155" stroke="#111827" strokeWidth="2"/>
            <rect x="265" y="210" width="10" height="42" rx="3" fill="#1e293b" stroke="#111827" strokeWidth="2"/>
            {/* "100 LB" Comic Text */}
            <rect x="180" y="250" width="40" height="15" rx="3" fill="#fbbf24" stroke="#111827" strokeWidth="1.5" />
            <text x="200" y="261" fill="#111827" fontSize="8" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">100 LB</text>
            {/* Hands lifting bar */}
            <LeftHand x={170} y={230} />
            <RightHand x={230} y={230} />
          </motion.g>
          {/* Sweat droplets */}
          <motion.circle cx="110" cy="180" r="3.5" fill="#38bdf8" animate={{ y: [0, 15], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <motion.circle cx="290" cy="180" r="3.5" fill="#38bdf8" animate={{ y: [0, 15], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }} />
        </motion.g>
      );

    case 'sleeping':
      return (
        <motion.g key="sleeping" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.text x="280" y="90" fill="#f87171" fontSize="30" fontWeight="bold" fontFamily="monospace" animate={{ y: [0, -32], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3 }}>Z</motion.text>
          <motion.text x="305" y="70" fill="#fca5a5" fontSize="22" fontWeight="bold" fontFamily="monospace" animate={{ y: [0, -22], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.9 }}>z</motion.text>
          <motion.text x="325" y="52" fill="#fecaca" fontSize="15" fontWeight="bold" fontFamily="monospace" animate={{ y: [0, -14], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 1.7 }}>z</motion.text>
          {/* Sleep mask over face */}
          <rect x="135" y="125" width="130" height="32" rx="16" fill="#1e3a8a" stroke="#1d4ed8" strokeWidth="3" opacity="0.9" />
          <circle cx="165" cy="141" r="5" fill="#cbd5e1" />
          <circle cx="235" cy="141" r="5" fill="#cbd5e1" />
          <path d="M 155 141 Q 165 146 175 141" stroke="#cbd5e1" strokeWidth="2" fill="none" />
          <path d="M 225 141 Q 235 146 245 141" stroke="#cbd5e1" strokeWidth="2" fill="none" />
        </motion.g>
      );

    case 'coding':
      return (
        <motion.g key="coding" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {/* Cyberpunk Holographic Terminal Screen */}
          <rect x="120" y="240" width="160" height="90" rx="6" fill="#06b6d4" opacity="0.15" stroke="#22d3ee" strokeWidth="2.5" />
          <rect x="120" y="240" width="160" height="90" rx="6" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="5 5" />
          {/* Mini code graphics */}
          <text x="130" y="260" fill="#22d3ee" fontSize="7" fontFamily="monospace">&gt; SPIDEY CORE v4.6</text>
          <text x="130" y="272" fill="#4ade80" fontSize="7" fontFamily="monospace">&gt; npm run dev --host</text>
          <motion.text x="130" y="284" fill="#a78bfa" fontSize="7" fontFamily="monospace" animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>&gt; STATUS: web_fluid=100%</motion.text>
          <text x="130" y="296" fill="#e11d48" fontSize="7" fontFamily="monospace">&gt; alert=&apos;Secure&apos;</text>
          {/* Keyboard & Hands typing */}
          <rect x="140" y="335" width="120" height="10" rx="3" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <LeftHand x={155} y={335} />
          <RightHand x={245} y={335} />
        </motion.g>
      );

    case 'patrolling':
      return (
        <motion.g key="patrolling" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Circular Hologram Scanner */}
          <motion.circle cx="200" cy="300" r="45" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4"
            animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 6, ease: 'linear' }} />
          <motion.circle cx="200" cy="300" r="30" fill="none" stroke="#ef4444" strokeWidth="1.5"
            animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
          {/* Crosshair */}
          <line x1="200" y1="270" x2="200" y2="330" stroke="#ef4444" strokeWidth="1.5" opacity="0.6"/>
          <line x1="170" y1="300" x2="230" y2="300" stroke="#ef4444" strokeWidth="1.5" opacity="0.6"/>
          {/* Glowing target dots */}
          <circle cx="185" cy="290" r="3" fill="#facc15" />
          <circle cx="215" cy="315" r="3.5" fill="#facc15" />
          {/* Hands holding scanner control pad */}
          <LeftHand x={150} y={310} />
          <RightHand x={250} y={310} />
        </motion.g>
      );

    case 'web_slinging':
      return (
        <motion.g key="web" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Web lines shooting directly from center chest */}
          <motion.path d="M 200 300 Q 150 180 80 50" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={{ pathLength: [0, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} />
          <motion.path d="M 200 300 Q 250 180 320 50" stroke="#e2e8f0" strokeWidth="3" fill="none" strokeLinecap="round"
            animate={{ pathLength: [0, 1] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }} />
          {/* THWIP comic bubble */}
          <rect x="170" y="225" width="60" height="22" rx="4" fill="#fbbf24" stroke="#111827" strokeWidth="2" />
          <text x="200" y="240" fill="#111827" fontSize="10" fontWeight="900" fontFamily="monospace" textAnchor="middle">THWIP!</text>
          {/* Hands shooter pose */}
          <LeftHand x={175} y={305} rotate={15} />
          <RightHand x={225} y={305} rotate={-15} />
        </motion.g>
      );

    case 'music':
      return (
        <motion.g key="music" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Head DJ Headphones over mask ears */}
          <path d="M 120 140 A 80 80 0 0 1 280 140" fill="none" stroke="#ef4444" strokeWidth="9" strokeLinecap="round" />
          <rect x="110" y="125" width="16" height="34" rx="8" fill="#111827" stroke="#ef4444" strokeWidth="2.5" />
          <rect x="274" y="125" width="16" height="34" rx="8" fill="#111827" stroke="#ef4444" strokeWidth="2.5" />
          {/* Floating musical notes */}
          <motion.text x="90" y="110" fill="#a78bfa" fontSize="24" animate={{ y: [0, -18], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2 }}>♪</motion.text>
          <motion.text x="290" y="100" fill="#f472b6" fontSize="20" animate={{ y: [0, -18], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}>♫</motion.text>
        </motion.g>
      );

    case 'thinking':
      return (
        <motion.g key="thinking" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
          {/* Thought bubble with Spidey icon */}
          <motion.ellipse cx="295" cy="85" rx="42" ry="30" fill="#1e293b" stroke="#475569" strokeWidth="2" />
          <motion.text x="295" y="93" fill="#fbbf24" fontSize="22" textAnchor="middle">💡</motion.text>
          {/* Left Hand touching mask chin */}
          <LeftHand x={145} y={235} rotate={18} />
        </motion.g>
      );

    case 'gaming':
      return (
        <motion.g key="gaming" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
          {/* Retro handheld console */}
          <rect x="145" y="300" width="110" height="52" rx="8" fill="#1e293b" stroke="#b91c1c" strokeWidth="3" />
          {/* screen */}
          <rect x="175" y="306" width="50" height="40" rx="3" fill="#020617" stroke="#111827" strokeWidth="1.5" />
          <circle cx="188" cy="326" r="4" fill="#22d3ee" />
          {/* Controls */}
          <circle cx="160" cy="326" r="6" fill="#dc2626" />
          <circle cx="238" cy="320" r="4.5" fill="#facc15" />
          <circle cx="238" cy="332" r="4.5" fill="#4ade80" />
          {/* Hands holding controller */}
          <LeftHand x={155} y={325} />
          <RightHand x={245} y={325} />
        </motion.g>
      );

    case 'phone':
      return (
        <motion.g key="phone" initial={{ opacity: 0, rotate: -8 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0 }}>
          {/* Mobile phone held in right hand */}
          <g transform="translate(10, 5)">
            <rect x="180" y="275" width="48" height="85" rx="6" fill="#0f172a" stroke="#60a5fa" strokeWidth="2.5" />
            <rect x="184" y="284" width="40" height="65" rx="3" fill="#020617" />
            {/* Mini messages */}
            <rect x="188" y="292" width="22" height="7" rx="3.5" fill="#2563eb" />
            <rect x="198" y="304" width="22" height="7" rx="3.5" fill="#374151" />
            <rect x="188" y="316" width="26" height="7" rx="3.5" fill="#2563eb" />
            {/* home indicator */}
            <line x1="198" y1="354" x2="210" y2="354" stroke="#475569" strokeWidth="1.5" />
          </g>
          <RightHand x={215} y={320} />
        </motion.g>
      );

    case 'coffee':
      return (
        <motion.g key="coffee" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Spidey Mug */}
          <path d="M180 280 L180 330 Q180 338 188 338 L222 338 Q230 338 230 330 L230 280 Z" fill="#991b1b" stroke="#111827" strokeWidth="2.5" />
          {/* Spider emblem on mug */}
          <circle cx="205" cy="310" r="5" fill="#111827" />
          <line x1="197" y1="305" x2="213" y2="315" stroke="#111827" strokeWidth="1.5" />
          <line x1="197" y1="315" x2="213" y2="305" stroke="#111827" strokeWidth="1.5" />
          {/* Handle */}
          <path d="M230 290 Q248 290 248 305 Q248 320 230 320" stroke="#111827" strokeWidth="4.5" fill="none" />
          {/* Steam */}
          <motion.path d="M197 270 Q192 258 197 248" stroke="#fed7aa" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ opacity: [0, 1, 0], y: [0, -6] }} transition={{ repeat: Infinity, duration: 1.8 }} />
          <motion.path d="M211 268 Q206 256 211 246" stroke="#fed7aa" strokeWidth="2" fill="none" strokeLinecap="round" animate={{ opacity: [0, 1, 0], y: [0, -6] }} transition={{ repeat: Infinity, duration: 1.8, delay: 0.6 }} />
          <RightHand x={240} y={310} />
        </motion.g>
      );

    case 'stretching':
      return (
        <motion.g key="stretching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Both arms raised up high stretching */}
          <LeftHand x={100} y={210} rotate={-35} />
          <RightHand x={300} y={210} rotate={35} />
          {/* Energy rings */}
          <motion.circle cx="200" cy="140" r="95" fill="none" stroke="#22d3ee" strokeWidth="1.5" opacity="0.4" animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2 }} />
        </motion.g>
      );

    case 'cleaning':
      return (
        <motion.g key="cleaning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          {/* Spray bottle in right hand */}
          <g transform="translate(45, 10)">
            <rect x="185" y="260" width="30" height="50" rx="4" fill="#0284c7" stroke="#111827" strokeWidth="2" />
            <rect x="192" y="250" width="16" height="10" fill="#0369a1" />
            <path d="M190 252 L178 244" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
            {/* spray mist */}
            <motion.circle cx="165" cy="240" r="3" fill="#bae6fd" animate={{ x: [-5, -15], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }} />
            <motion.circle cx="168" cy="246" r="2" fill="#7dd3fc" animate={{ x: [-8, -18], opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} />
          </g>
          <RightHand x={230} y={290} />

          {/* Microfiber cleaning cloth in left hand */}
          <rect x="135" y="285" width="28" height="24" rx="4" fill="#e11d48" stroke="#111827" strokeWidth="2" />
          <LeftHand x={150} y={295} />
        </motion.g>
      );

    case 'cricket':
      return (
        <motion.g key="cricket" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
          {/* Cricket Bat in right hand */}
          <g transform="translate(45, 10)">
            {/* Blade */}
            <path d="M 185 240 L 195 240 L 195 320 L 180 320 Z" fill="#d4af37" stroke="#111827" strokeWidth="2.5" />
            {/* Handle */}
            <rect x="187" y="195" width="6" height="45" rx="2" fill="#ef4444" stroke="#111827" strokeWidth="1.5" />
          </g>
          {/* Cricket Ball next to bat */}
          <circle cx="215" cy="300" r="8" fill="#dc2626" stroke="#111827" strokeWidth="2" />
          <path d="M 207 300 Q 215 304 223 300" stroke="#ffffff" strokeWidth="1.5" fill="none" />
          <RightHand x={236} y={225} rotate={-10} />
        </motion.g>
      );

    default:
      return null;
  }
}

// ─── Eye shape resolver ───────────────────────────────────────────────────────
function resolveEyes(mood: SpidermanMood, currentState: string, isPlayingVoice: boolean, activeViseme: VisemeShape, isBlinking: boolean, outfit: SpidermanOutfit) {
  let lY = 1, lX = 1, lR = 0, rY = 1, rX = 1, rR = 0;

  if (isBlinking)          { return { lY: 0.05, lX, lR, rY: 0.05, rX, rR }; }
  if (outfit === 'stealth'){ return { lY: 0.3, lX: 1.0, lR: 8, rY: 0.3, rX: 1.0, rR: -8 }; }

  if (isPlayingVoice) {
    const big = activeViseme === 'closed' ? 0.9 : 1.15;
    const slim = activeViseme === 'closed' ? 1.0 : 0.95;
    return { lY: big, lX: slim, lR: 0, rY: big, rX: slim, rR: 0 };
  }

  if (currentState === 'repairing') { return { lY: 0.35, lX, lR: 8, rY: 0.35, rX, rR: -8 }; }

  switch (mood) {
    case 'tired':       return { lY: 0.05, lX, lR, rY: 0.05, rX, rR };
    case 'stressed':    return { lY: 0.4,  lX, lR: 10, rY: 0.4,  rX, rR: -10 };
    case 'anxious':     return { lY: 0.45, lX, lR: 8,  rY: 0.45, rX, rR: -8  };
    case 'nervous':     return { lY: 0.5,  lX, lR: 6,  rY: 0.5,  rX, rR: -6  };
    case 'alert':       return { lY: 1.15, lX, lR, rY: 1.15, rX, rR };
    case 'heroic':      return { lY: 0.7,  lX, lR: 4,  rY: 0.7,  rX, rR: -4  };
    case 'brave':       return { lY: 0.75, lX, lR: 3,  rY: 0.75, rX, rR: -3  };
    case 'fearless':    return { lY: 0.8,  lX, lR: 2,  rY: 0.8,  rX, rR: -2  };
    case 'curious':     return { lY: 0.5,  lX, lR: 6,  rY: 1.15, rX, rR: -2  };
    case 'confused':    return { lY: 0.6,  lX, lR: -6, rY: 1.1,  rX, rR: 3   };
    case 'surprised':   return { lY: 1.4,  lX: 0.9, lR, rY: 1.4, rX: 0.9, rR };
    case 'excited':     return { lY: 1.3,  lX: 0.95, lR, rY: 1.3, rX: 0.95, rR };
    case 'electric':    return { lY: 1.35, lX: 0.9, lR, rY: 1.35, rX: 0.9, rR };
    case 'hyper':       return { lY: 1.3,  lX: 0.92, lR: -2, rY: 1.3, rX: 0.92, rR: 2 };
    case 'energetic':   return { lY: 1.2,  lX, lR, rY: 1.2, rX, rR };
    case 'wild':        return { lY: 1.35, lX: 0.88, lR: -3, rY: 1.35, rX: 0.88, rR: 3 };
    case 'dramatic':    return { lY: 1.4,  lX: 0.85, lR: -4, rY: 1.4, rX: 0.85, rR: 4 };
    case 'playful':     return { lY: 0.85, lX, lR: -2, rY: 0.85, rX, rR: 2 };
    case 'silly':       return { lY: 1.15, lX, lR: -4, rY: 0.5, rX, rR: 6 };
    case 'goofy':       return { lY: 1.1,  lX, lR: -5, rY: 0.55, rX, rR: 7 };
    case 'zany':        return { lY: 1.2,  lX: 1.1, lR: -8, rY: 0.4, rX: 0.9, rR: 10 };
    case 'cheeky':      return { lY: 0.9,  lX, lR: -3, rY: 0.7,  rX, rR: 5  };
    case 'mischievous': return { lY: 0.4,  lX, lR: -4, rY: 0.7,  rX, rR: 6  };
    case 'amused':      return { lY: 0.8,  lX, lR: -2, rY: 0.8,  rX, rR: 2  };
    case 'sneaky':      return { lY: 0.3,  lX: 0.9, lR, rY: 0.3, rX: 0.9, rR };
    case 'mysterious':  return { lY: 0.35, lX: 0.9, lR: 4, rY: 0.35, rX: 0.9, rR: -4 };
    case 'bored':       return { lY: 0.55, lX, lR, rY: 0.55, rX, rR };
    case 'melancholic': return { lY: 0.5,  lX, lR: -3, rY: 0.5, rX, rR: -3 };
    case 'determined':  return { lY: 0.35, lX, lR: 8,  rY: 0.35, rX, rR: -8 };
    case 'intense':     return { lY: 0.3,  lX, lR: 10, rY: 0.3,  rX, rR: -10 };
    case 'fierce':      return { lY: 0.25, lX, lR: 12, rY: 0.25, rX, rR: -12 };
    case 'serious':     return { lY: 0.4,  lX, lR: 6,  rY: 0.4,  rX, rR: -6  };
    case 'rebellious':  return { lY: 0.4,  lX, lR: 12, rY: 0.9,  rX, rR: -3  };
    case 'cranky':      return { lY: 0.38, lX, lR: 9,  rY: 0.38, rX, rR: -9  };
    case 'protective':  return { lY: 0.6,  lX, lR: 5,  rY: 0.6,  rX, rR: -5  };
    case 'focused':     return { lY: 0.65, lX, lR: 3,  rY: 0.65, rX, rR: -3  };
    case 'motivated':   return { lY: 0.7,  lX, lR: 4,  rY: 0.7,  rX, rR: -4  };
    case 'confident':   return { lY: 0.75, lX, lR: 2,  rY: 0.75, rX, rR: -2  };
    case 'adventurous': return { lY: 0.9,  lX, lR: -2, rY: 1.1,  rX, rR: -1  };
    case 'hopeful':     return { lY: 1.05, lX, lR: -3, rY: 1.05, rX, rR: -3  };
    case 'cheerful':    return { lY: 0.85, lX, lR: -4, rY: 0.85, rX, rR: -4  };
    case 'joyful':      return { lY: 0.9,  lX, lR: -5, rY: 0.9,  rX, rR: -5  };
    case 'content':     return { lY: 0.8,  lX, lR: -3, rY: 0.8,  rX, rR: -3  };
    case 'peaceful':    return { lY: 0.7,  lX, lR: -2, rY: 0.7,  rX, rR: -2  };
    case 'calm':        return { lY: 0.75, lX, lR, rY: 0.75, rX, rR };
    case 'zen':         return { lY: 0.25, lX, lR, rY: 0.25, rX, rR };
    case 'grateful':    return { lY: 0.9,  lX, lR: -2, rY: 0.9, rX, rR: -2 };
    case 'humble':      return { lY: 0.65, lX, lR: -3, rY: 0.65, rX, rR: -3 };
    case 'nostalgic':   return { lY: 0.7,  lX, lR: -4, rY: 0.7,  rX, rR: -4 };
    case 'dreamy':      return { lY: 0.35, lX, lR: -2, rY: 0.35, rX, rR: -2 };
    case 'pensive':     return { lY: 0.7,  lX, lR: 2,  rY: 0.7,  rX, rR: -2 };
    case 'thoughtful':  return { lY: 0.8,  lX, lR: 3,  rY: 0.8,  rX, rR: -3 };
    case 'wise':        return { lY: 0.65, lX, lR: 3,  rY: 0.65, rX, rR: -3 };
    case 'proud':       return { lY: 0.85, lX, lR: 2,  rY: 0.85, rX, rR: -2 };
    case 'triumphant':  return { lY: 0.9,  lX, lR: 2,  rY: 0.75, rX, rR: -4 };
    case 'hungry':      return { lY: 1.1,  lX, lR, rY: 1.1, rX, rR };
    case 'relaxed':     return { lY: 0.8,  lX, lR, rY: 0.8, rX, rR };
    default:            return { lY, lX, lR, rY, rX, rR };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export function EchoPopAvatar({
  currentState = 'idle',
  currentMood = 'alert',
  currentCategory = 'idle',
  activeViseme = 'closed',
  isPlayingVoice = false,
  isDeviceToggling,
  lightsOn = true,
  tempC = null,
  isMatchLive = false,
  audioData,
  spideySenseActive = false,
}: EchoPopAvatarProps) {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 120);
      blinkTimeout = setTimeout(triggerBlink, Math.random() * 4000 + 2500);
    };
    blinkTimeout = setTimeout(triggerBlink, 3000);
    return () => clearTimeout(blinkTimeout);
  }, []);

  const characterVariants = {
    animate: {
      y: [0, -5, 0],
      transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' },
    },
  };

  const headVariants = {
    idle:       { rotate: [0, -1.2, 1.2, 0], y: [0, -1.5, 0], transition: { repeat: Infinity, duration: 4, ease: 'easeInOut' } },
    speaking:   { rotate: [0, -1, 1, 0], y: 0, transition: { duration: 0.1 } },
    repairing:  { rotate: [0, -8, -6, -8], y: [0, 2, 1, 2], transition: { repeat: Infinity, duration: 0.4 } },
    spideySense:{ x: [-2, 2, -2, 2, 0], y: [-1, 1, -1, 1, 0], rotate: [-1.5, 1.5, -1.5, 1.5, 0], transition: { repeat: Infinity, duration: 0.1 } }
  };

  // Outfit selection
  let outfit: SpidermanOutfit = 'classic';
  if (isPlayingVoice || audioData) {
    outfit = 'stealth';
  } else if (isMatchLive) {
    outfit = 'mi_jersey';
  } else if (tempC !== null && tempC > 28) {
    outfit = 'summer';
  } else if (!lightsOn || currentMood === 'sneaky' || currentMood === 'mysterious') {
    outfit = 'stealth';
  } else if (['relaxed', 'tired', 'bored', 'silly', 'grateful', 'thoughtful', 'peaceful', 'calm', 'zen', 'content', 'nostalgic', 'dreamy', 'humble'].includes(currentMood)) {
    outfit = 'casual';
  }

  const eyes = resolveEyes(currentMood, currentState, isPlayingVoice, activeViseme, isBlinking, outfit);
  let { lY, lX, lR, rY, rX, rR } = eyes;

  // Spidey Sense overrides eyes
  if (spideySenseActive) {
    lY = 0.4;
    rY = 0.4;
    lR = 10;
    rR = -10;
    // Add nervous vibration to eyes
    if (typeof window !== 'undefined') {
      const offset = Math.sin(Date.now() * 0.15) * 0.04;
      lY += offset;
      rY += offset;
    }
  } else if (!isBlinking && currentMood !== 'tired' && audioData) {
    // Audio sync eye dilation
    lY += audioData.mid * 0.18;
    rY += audioData.mid * 0.18;
    lX -= audioData.treble * 0.08;
    rX -= audioData.treble * 0.08;
  }

  const isStealth  = outfit === 'stealth';
  const maskFill   = isStealth ? '#27272a' : '#b91c1c';
  const webStroke  = isStealth ? '#3f3f46' : '#7f1d1d';
  const eyeStroke  = isStealth ? '#10b981' : '#111827';
  const eyeFill    = isStealth ? '#e6fffa' : '#ffffff';

  // Which category to show visually (suppress during special states)
  const visibleCategory: TaskCategory =
    isPlayingVoice || !!audioData || currentState === 'repairing' || currentState === 'speaking'
      ? 'idle'
      : currentCategory;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-transparent">

      {/* Top status chip */}
      <div className="absolute top-0 inset-x-0 flex items-center justify-between z-20 pointer-events-auto">
        <div className="px-3 py-1 rounded-full bg-slate-950/80 border border-slate-900 backdrop-blur-md flex items-center gap-2 text-[10px] font-mono tracking-wider text-slate-400">
          <span className={`w-2 h-2 rounded-full ${
            spideySenseActive ? 'bg-amber-400 animate-ping' :
            currentState === 'speaking' || isPlayingVoice ? 'bg-green-400 animate-ping' :
            currentState === 'repairing' ? 'bg-amber-400 animate-pulse' : 'bg-red-500'
          }`} />
          {spideySenseActive ? 'SPIDEY SENSE' : isPlayingVoice ? 'SPIDEY SPEAKING' : `${outfit.toUpperCase()} • ${currentMood.toUpperCase()}`}
        </div>
      </div>

      {/* Beat-reactive wrapper */}
      <motion.div
        animate={{
          scale: audioData && audioData.bass > 0 ? 1 + audioData.bass * 0.08 : 1,
          filter: audioData && audioData.bass > 0
            ? `drop-shadow(0 0 ${20 + audioData.bass * 30}px ${audioData.bass > 0.45 ? 'rgba(6, 182, 212, 0.45)' : 'rgba(239, 68, 68, 0.35)'})`
            : spideySenseActive
            ? 'drop-shadow(0 0 25px rgba(245, 158, 11, 0.6))'
            : 'drop-shadow(0 20px 25px rgba(0, 0, 0, 0.85))',
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 12 }}
        className="w-full h-full flex items-center justify-center z-10"
      >
        <motion.svg
          viewBox="0 0 400 400"
          className="w-full h-full gpu-accelerated mt-4"
          variants={characterVariants}
          animate="animate"
          style={{ filter: lightsOn ? 'brightness(1) saturate(1)' : 'brightness(0.35) saturate(0.4) contrast(1.15)' }}
          transition={{ duration: 1.5 }}
        >
          {/* ── Spidey Sense comic warning waves ── */}
          {spideySenseActive && (
            <g filter="drop-shadow(0 0 8px #facc15)" opacity={0.95}>
              <motion.path
                d="M 130 90 Q 100 60 120 20"
                stroke="#facc15"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                animate={{ x: [-2, 2, -2], y: [1, -1, 1] }}
                transition={{ repeat: Infinity, duration: 0.08 }}
              />
              <motion.path
                d="M 165 75 Q 150 40 170 10"
                stroke="#f59e0b"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                animate={{ x: [2, -2, 2], y: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 0.08, delay: 0.02 }}
              />
              <motion.path
                d="M 200 70 Q 200 30 200 5"
                stroke="#ef4444"
                strokeWidth="4.5"
                fill="none"
                strokeLinecap="round"
                animate={{ x: [-1.5, 1.5, -1.5], y: [2, -2, 2] }}
                transition={{ repeat: Infinity, duration: 0.07 }}
              />
              <motion.path
                d="M 235 75 Q 250 40 230 10"
                stroke="#f59e0b"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                animate={{ x: [-2, 2, -2], y: [1, -1, 1] }}
                transition={{ repeat: Infinity, duration: 0.08, delay: 0.04 }}
              />
              <motion.path
                d="M 270 90 Q 300 60 280 20"
                stroke="#facc15"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                animate={{ x: [2, -2, 2], y: [-1, 1, -1] }}
                transition={{ repeat: Infinity, duration: 0.08, delay: 0.06 }}
              />
            </g>
          )}

          {/* Activity props moved to AFTER head layer for visibility — see below */}

          {/* ── Hood (casual) ── */}
          {outfit === 'casual' && (
            <motion.g animate={{ y: [0, 1.5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
              <path d="M 110 160 C 110 40, 290 40, 290 160 C 290 260, 270 270, 200 270 C 130 270, 110 260, 110 160 Z" fill="#334155" stroke="#475569" strokeWidth="3" />
            </motion.g>
          )}

          {/* ── Body layer ── */}
          <motion.g animate={{ y: [0, 1.5, 0] }} transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}>
            {outfit === 'stealth' && (
              <>
                <path d="M 80 400 L 80 280 L 160 260 L 240 260 L 320 280 L 320 400 Z" fill="#18181b" stroke="#27272a" strokeWidth="4" />
                <path d="M 160 260 L 200 330 L 240 260 Z" fill="#27272a" />
                <path d="M 190 290 Q 200 300 210 290 L 212 330 L 200 345 L 188 330 Z" fill="#10b981" stroke="#047857" strokeWidth="2" filter="drop-shadow(0 0 4px #10b981)" />
                <path d="M 188 275 L 212 275 L 210 290 L 190 290 Z" fill="#059669" />
              </>
            )}
            {outfit === 'casual' && (
              <>
                <path d="M 80 400 L 80 280 L 160 260 L 240 260 L 320 280 L 320 400 Z" fill="#475569" stroke="#334155" strokeWidth="4" />
                <path d="M 130 350 L 270 350 L 250 400 L 150 400 Z" fill="#334155" opacity="0.6" />
                <path d="M 190 290 Q 200 300 210 290 L 212 320 L 200 335 L 188 320 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5" />
                <path d="M 185 265 L 185 310" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 215 265 L 215 305" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="185" cy="310" r="3" fill="#cbd5e1" />
                <circle cx="215" cy="305" r="3" fill="#cbd5e1" />
              </>
            )}
            {outfit === 'summer' && (
              <>
                <path d="M 80 400 L 80 280 L 160 260 L 240 260 L 320 280 L 320 400 Z" fill="#fbcfe8" stroke="#f48fb1" strokeWidth="4" />
                <path d="M 110 400 L 125 295 Q 160 280 200 280 Q 240 280 275 295 L 290 400 Z" fill="#fef08a" stroke="#fde047" strokeWidth="2" />
                <path d="M 125 295 L 135 260 L 155 260 L 145 295 Z" fill="#fef08a" />
                <path d="M 275 295 L 265 260 L 245 260 L 255 295 Z" fill="#fef08a" />
                <path d="M 190 310 Q 200 320 210 310 L 212 340 L 200 355 L 188 340 Z" fill="#dc2626" stroke="#991b1b" strokeWidth="2" />
              </>
            )}
            {outfit === 'mi_jersey' && (
              <>
                <path d="M 80 400 L 80 280 L 160 260 L 240 260 L 320 280 L 320 400 Z" fill="#004b87" stroke="#003560" strokeWidth="4" />
                <path d="M 80 280 L 115 275 L 130 400 L 105 400 Z" fill="#d4af37" />
                <path d="M 320 280 L 285 275 L 270 400 L 295 400 Z" fill="#d4af37" />
                <path d="M 170 260 L 200 310 L 230 260 Z" fill="#d4af37" />
                <text x="200" y="355" fill="#d4af37" fontSize="22" fontWeight="900" fontFamily="sans-serif" textAnchor="middle">MI</text>
              </>
            )}
            {outfit === 'classic' && (
              <>
                <path d="M 80 400 L 80 280 L 160 260 L 240 260 L 320 280 L 320 400 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="4" />
                <path d="M 160 260 L 200 330 L 240 260 Z" fill="#b91c1c" />
                <path d="M 190 290 Q 200 300 210 290 L 212 330 L 200 345 L 188 330 Z" fill="#111827" stroke="#1f2937" strokeWidth="2" />
                <path d="M 188 275 L 212 275 L 210 290 L 190 290 Z" fill="#111827" />
              </>
            )}
          </motion.g>

          {/* ── Head & mask ── */}
          <motion.g
            variants={headVariants}
            animate={spideySenseActive ? 'spideySense' : currentState === 'idle' ? 'idle' : (isPlayingVoice ? 'speaking' : currentState)}
            style={{ originX: '200px', originY: '260px' }}
          >
            <rect x="175" y="230" width="50" height="40" fill={isStealth ? '#18181b' : '#090d16'} />
            <path d="M 175 235 Q 200 250 225 235" stroke={maskFill} strokeWidth="2" fill="none" />

            {/* Mask base */}
            <motion.path
              d="M 120 140 C 120 60, 280 60, 280 140 C 280 210, 250 250, 200 250 C 150 250, 120 210, 120 140 Z"
              animate={{
                fill: lightsOn ? maskFill : (isStealth ? '#18181b' : '#310d0d'),
                stroke: lightsOn ? webStroke : (isStealth ? '#27272a' : '#1a0505'),
              }}
              transition={{ duration: 1.5 }}
              strokeWidth="5"
            />

            {/* Spiderweb lines */}
            <motion.g
              animate={{ stroke: lightsOn ? webStroke : (isStealth ? '#27272a' : '#1a0505') }}
              transition={{ duration: 1.5 }}
              strokeWidth="1.5"
              opacity="0.6"
              fill="none"
            >
              <path d="M 200 70 L 200 250" />
              <path d="M 140 100 Q 200 130 260 100" />
              <path d="M 130 140 Q 200 170 270 140" />
              <path d="M 140 190 Q 200 210 260 190" />
              <path d="M 200 140 L 130 90" />
              <path d="M 200 140 L 270 90" />
              <path d="M 200 140 L 140 210" />
              <path d="M 200 140 L 260 210" />
            </motion.g>

            {/* Left eye */}
            <motion.g
              animate={{ scaleY: lY, scaleX: lX, rotate: lR }}
              style={{ originX: '165px', originY: '140px' }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <path d="M 190 135 C 170 120, 140 120, 135 145 C 130 175, 165 185, 185 165 Z" fill={eyeFill} stroke={eyeStroke} strokeWidth="7" strokeLinejoin="round" />
            </motion.g>

            {/* Right eye */}
            <motion.g
              animate={{ scaleY: rY, scaleX: rX, rotate: rR }}
              style={{ originX: '235px', originY: '140px' }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              <path d="M 210 135 C 230 120, 260 120, 265 145 C 270 175, 235 185, 215 165 Z" fill={eyeFill} stroke={eyeStroke} strokeWidth="7" strokeLinejoin="round" />
            </motion.g>

            {/* Summer sunglasses */}
            {outfit === 'summer' && (
              <motion.g key="sunglasses" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <path d="M 120 135 L 180 130 L 185 160 L 130 165 Z" fill="#fb923c" stroke="#d97706" strokeWidth="3" opacity="0.9" />
                <path d="M 130 140 L 175 135" stroke="#ffedd5" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <path d="M 220 130 L 280 135 L 270 165 L 215 160 Z" fill="#fb923c" stroke="#d97706" strokeWidth="3" opacity="0.9" />
                <path d="M 225 135 L 270 140" stroke="#ffedd5" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
                <path d="M 180 133 Q 200 128 220 133" stroke="#d97706" strokeWidth="4.5" fill="none" />
                <motion.circle cx="110" cy="110" r="3.5" fill="#38bdf8" animate={{ y: [0, 15], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 1.8 }} />
                <motion.circle cx="290" cy="120" r="3.5" fill="#38bdf8" animate={{ y: [0, 20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 2.2, delay: 0.4 }} />
              </motion.g>
            )}

            {/* Talking mouth */}
            {isPlayingVoice ? (
              <motion.path
                d="M 185 220 Q 200 225 215 220"
                stroke="#111827"
                strokeWidth="3.2"
                strokeLinecap="round"
                fill="none"
                animate={activeViseme}
                variants={mouthVariants}
                transition={{ type: 'spring', stiffness: 350, damping: 18 }}
                style={{ originX: '200px', originY: '220px' }}
              />
            ) : null}
          </motion.g>

          {/* ── Activity prop layer (FRONT — rendered after body+head so it's visible) ── */}
          <AnimatePresence mode="wait">
            <ActivityProp key={visibleCategory} category={visibleCategory} />
          </AnimatePresence>

          {/* ── Overlay props (state-specific) ── */}
          <AnimatePresence mode="wait">
            {currentMood === 'tired' && !isPlayingVoice && (
              <motion.g key="sleep-z" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <motion.text x="275" y="110" fill="#f87171" fontSize="24" fontWeight="bold" animate={{ y: [0, -30], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3 }}>Z</motion.text>
                <motion.text x="295" y="85" fill="#fca5a5" fontSize="16" fontWeight="bold" animate={{ y: [0, -20], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 3, delay: 0.8 }}>z</motion.text>
              </motion.g>
            )}

            {currentState === 'repairing' && !isPlayingVoice && (
              <motion.g key="repairing" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <rect x="235" y="220" width="70" height="80" rx="6" fill="#7f1d1d" stroke="#ef4444" strokeWidth="2.5" />
                <rect x="245" y="235" width="50" height="45" fill="#450a0a" stroke="#f87171" strokeWidth="1" />
                <motion.g animate={{ x: [0, -8, 4, 0], y: [0, 8, -4, 0] }} transition={{ repeat: Infinity, duration: 0.4 }}>
                  <rect x="180" y="240" width="60" height="10" rx="5" fill="#475569" transform="rotate(25 180 240)" />
                  <motion.circle cx="245" cy="265" r="5" fill="#facc15" animate={{ scale: [1, 2, 0], opacity: [1, 0.7, 0] }} transition={{ repeat: Infinity, duration: 0.25 }} />
                </motion.g>
              </motion.g>
            )}

            {((currentState === 'speaking' && !isPlayingVoice) || isPlayingVoice) && (
              <motion.g key="speaking">
                <motion.circle cx="200" cy="140" r={95} fill="none" stroke="#dc2626" strokeWidth={1.7}
                  initial={{ opacity: 0.6, scale: 0.8 }} animate={{ opacity: 0, scale: 1.3 }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: 0.4 }} />
                <motion.circle cx="200" cy="140" r={120} fill="none" stroke="#dc2626" strokeWidth={0.9}
                  initial={{ opacity: 0.6, scale: 0.8 }} animate={{ opacity: 0, scale: 1.3 }}
                  transition={{ repeat: Infinity, duration: 1.4, delay: 0.8 }} />
              </motion.g>
            )}
          </AnimatePresence>
        </motion.svg>
      </motion.div>

      {/* Ambient activity label */}
      <div className="z-10 mt-2 text-center flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/60 border border-slate-900/60">
        <Activity className="w-3 h-3 text-red-500 animate-pulse" />
        <p className="text-[10px] text-slate-400 font-mono">
          {spideySenseActive ? 'Spidey Sense Tingling!' : isPlayingVoice || currentState === 'speaking' ? 'Spidey Speaking' : visibleCategory === 'cricket' ? 'Spidey is watching cricket' : `Spidey is ${visibleCategory.replace('_', ' ')}`}
        </p>
      </div>
    </div>
  );
}
