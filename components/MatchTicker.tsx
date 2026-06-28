'use client';

import React from 'react';
import { Trophy, Tv } from 'lucide-react';

interface MatchTickerProps {
  score?: string;
  status?: string;
  isActive?: boolean;
}

export const MatchTicker = React.memo(function MatchTicker({
  score = "MI 184/3 (18.4) • CSK 180/7 (20)",
  status = "Mumbai Indians need 2 runs in 8 balls to win! Rohit Sharma 86*(42)",
  isActive = false,
}: MatchTickerProps) {
  if (!isActive) return null;

  return (
    <div className="w-full bg-slate-950/80 border-b border-[#d4af37]/35 text-slate-100 py-1.5 px-4 font-sans select-none relative z-30 shadow-[0_4px_15px_rgba(0,75,135,0.3)] backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Live Badge */}
        <div className="flex items-center gap-1.5 shrink-0 bg-[#004b87] border border-[#d4af37]/50 px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
          <Trophy className="w-3 h-3 text-[#d4af37]" />
          <span>MI Match Live</span>
        </div>

        {/* Scrolling Scorecard Marquee */}
        <div className="flex-1 overflow-hidden relative h-5 flex items-center font-mono text-xs font-bold text-slate-200">
          <div className="animate-marquee whitespace-nowrap flex gap-12 absolute pl-[100%]">
            <span className="flex items-center gap-2">
              <Tv className="w-3.5 h-3.5 text-[#d4af37]" />
              SCORECARD: <strong className="text-[#d4af37]">{score}</strong>
            </span>
            <span className="text-slate-300">
              STATUS: <span className="text-emerald-400 font-bold">{status}</span>
            </span>
            <span className="text-slate-400">
              TARGET: <span className="font-bold">181 runs</span>
            </span>
            <span>
              LIVE FROM WANKHEDE STADIUM, MUMBAI
            </span>
          </div>
        </div>

        {/* CSS for custom infinite marquee animation */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes marquee {
            0% { transform: translate3d(0, 0, 0); }
            100% { transform: translate3d(-100%, 0, 0); }
          }
          .animate-marquee {
            animation: marquee 25s linear infinite;
          }
        ` }} />
      </div>
    </div>
  );
});
