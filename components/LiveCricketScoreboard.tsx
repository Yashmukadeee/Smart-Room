'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, RefreshCw } from 'lucide-react';
import type { LiveMatch } from '@/hooks/useMatchDay';

interface LiveCricketScoreboardProps {
  matches: LiveMatch[];
  isLoading: boolean;
  isDemo: boolean;
  onRefresh: () => void;
}

// Format the team name — short version for compact display
function shortTeamName(name: string): string {
  const map: Record<string, string> = {
    'mumbai indians': 'MI',
    'chennai super kings': 'CSK',
    'royal challengers bengaluru': 'RCB',
    'royal challengers bangalore': 'RCB',
    'kolkata knight riders': 'KKR',
    'delhi capitals': 'DC',
    'punjab kings': 'PBKS',
    'sunrisers hyderabad': 'SRH',
    'rajasthan royals': 'RR',
    'gujarat titans': 'GT',
    'lucknow super giants': 'LSG',
    'india': 'IND',
    'australia': 'AUS',
    'england': 'ENG',
    'new zealand': 'NZ',
    'south africa': 'SA',
    'pakistan': 'PAK',
    'sri lanka': 'SL',
    'west indies': 'WI',
    'bangladesh': 'BAN',
  };
  const lower = name.toLowerCase().trim();
  return map[lower] || name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 3);
}

// Match type badge color
function matchTypeBg(type: string): string {
  const t = type.toUpperCase();
  if (t === 'T20' || t.includes('IPL')) return 'bg-purple-500/30 border-purple-500/50 text-purple-300';
  if (t === 'ODI') return 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300';
  if (t === 'TEST') return 'bg-amber-500/30 border-amber-500/50 text-amber-300';
  return 'bg-slate-500/30 border-slate-500/50 text-slate-300';
}






export const LiveCricketScoreboard = React.memo(function LiveCricketScoreboard({
  matches,
  isLoading,
  isDemo,
  onRefresh,
}: LiveCricketScoreboardProps) {
  const hasMatches = matches.length > 0;

  if (isLoading && !hasMatches) {
    return (
      <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-950/70 border border-slate-800/60 backdrop-blur-md">
        <RefreshCw className="w-3.5 h-3.5 text-slate-600 animate-spin" />
        <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">Fetching scores…</span>
      </div>
    );
  }

  if (!hasMatches) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex items-center gap-3 flex-wrap justify-center"
    >
      {/* Label pill */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-950/80 border border-slate-800/60 backdrop-blur-md shrink-0">
        <Trophy className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs font-black tracking-widest text-slate-400 uppercase">Cricket</span>
        {isDemo && (
          <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-400 uppercase" title="Add CRICAPI_KEY to .env.local for live data">
            DEMO
          </span>
        )}
        <button onClick={onRefresh} className="ml-1 text-slate-600 hover:text-slate-300 transition-colors cursor-pointer">
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* One pill per match */}
      {matches.map((match) => {
        const t1 = shortTeamName(match.teams[0] || '');
        const t2 = shortTeamName(match.teams[1] || '');
        const s1 = match.score[0] ?? null;
        const s2 = match.score[1] ?? null;
        return (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex items-center gap-2.5 px-4.5 py-2 rounded-full border backdrop-blur-md shrink-0 ${
              match.isMI
                ? 'bg-[#001a2e]/80 border-[#d4af37]/40 shadow-[0_0_10px_rgba(212,175,55,0.12)]'
                : 'bg-slate-950/75 border-slate-800/60'
            }`}
          >
            {/* Live dot */}
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />

            {/* Team 1 score */}
            <span className={`text-xs font-black tracking-wide ${match.isMI && (match.teams[0]||'').toLowerCase().includes('mumbai') ? 'text-[#d4af37]' : 'text-slate-200'}`}>
              {t1}
            </span>
            {s1 && (
              <span className="text-xs font-mono font-bold text-slate-100 tabular-nums">
                {s1.runs}/{s1.wickets}
                <span className="text-slate-500 text-[10px] ml-0.5">({s1.overs})</span>
              </span>
            )}

            {/* Divider */}
            <span className="text-slate-700 text-xs font-bold">vs</span>

            {/* Team 2 score */}
            <span className={`text-xs font-black tracking-wide ${match.isMI && (match.teams[1]||'').toLowerCase().includes('mumbai') ? 'text-[#d4af37]' : 'text-slate-400'}`}>
              {t2}
            </span>
            {s2 && (
              <span className="text-xs font-mono font-bold text-slate-300 tabular-nums">
                {s2.runs}/{s2.wickets}
                <span className="text-slate-500 text-[10px] ml-0.5">({s2.overs})</span>
              </span>
            )}

            {/* Match type */}
            <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ml-0.5 shrink-0 ${matchTypeBg(match.matchType)}`}>
              {match.matchType}
            </span>
          </motion.div>
        );
      })}
    </motion.div>
  );
});


