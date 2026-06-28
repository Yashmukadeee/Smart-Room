'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Single flip digit tile
function FlipTile({ digit, color }: { digit: string; color: string }) {
  return (
    <div className="relative w-20 h-28 md:w-[8.5rem] md:h-[12rem] bg-gradient-to-b from-slate-900 to-[#030712] border border-slate-700/50 rounded-2xl flex items-center justify-center shadow-[0_16px_60px_rgba(0,0,0,0.8)] overflow-hidden">
      {/* top sheen */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/[0.025] border-b border-black/40 z-10 pointer-events-none rounded-t-2xl" />
      {/* seam */}
      <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-black/80 z-20" />
      {/* notches */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-[#030712] border-r border-slate-800/80 rounded-r-full z-30" />
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-6 bg-[#030712] border-l border-slate-800/80 rounded-l-full z-30" />

      <AnimatePresence mode="popLayout">
        <motion.span
          key={digit}
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: 90, opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeInOut' }}
          className={`z-10 font-mono font-black text-5xl md:text-[8rem] tabular-nums leading-none select-none ${color}`}
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

// Two-digit flip panel with label
function FlipPanel({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 md:gap-3 select-none">
      <span className="text-[9px] md:text-[10px] font-black tracking-[0.5em] text-slate-600 uppercase">{label}</span>
      <div className="flex gap-1.5 md:gap-2.5">
        <FlipTile digit={value[0]} color={color} />
        <FlipTile digit={value[1]} color={color} />
      </div>
    </div>
  );
}

export function InteractiveClock() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  if (!time) return null;

  let h = time.getHours();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const hoursStr = String(h).padStart(2, '0');
  const minutesStr = String(time.getMinutes()).padStart(2, '0');

  return (
    <div className="flex items-center justify-center gap-3 md:gap-6 select-none z-20">
      <FlipPanel value={hoursStr} label="hours" color="text-amber-400" />
      <div className="flex flex-col justify-center items-center h-20 md:h-[12rem] -mt-4 md:-mt-6">
        <span className="text-3xl md:text-5xl font-black text-slate-700 animate-pulse">:</span>
      </div>
      <FlipPanel value={minutesStr} label="min" color="text-slate-200" />
    </div>
  );
}
