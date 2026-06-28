import { useState, useEffect, useCallback } from 'react';

export interface MatchScore {
  inning: string;
  runs: number;
  wickets: number;
  overs: string;
}

export interface LiveMatch {
  id: string;
  name: string;
  matchType: string;
  status: string;
  venue: string;
  teams: string[];
  score: MatchScore[];
  isMI: boolean;
  dateTimeGMT: string;
}

export interface MatchDayData {
  isMatchLive: boolean;
  miMatch: LiveMatch | null;
  allMatches: LiveMatch[];
  score: string;
  status: string;
  isLoading: boolean;
  isDemo: boolean;
  lastUpdated: Date | null;
  refresh: () => void;
}

const INITIAL_STATE: MatchDayData = {
  isMatchLive: false,
  miMatch: null,
  allMatches: [],
  score: 'No live match',
  status: 'Check schedule',
  isLoading: true,
  isDemo: false,
  lastUpdated: null,
  refresh: () => {},
};

export function useMatchDay(): MatchDayData {
  const [allMatches, setAllMatches] = useState<LiveMatch[]>([]);
  const [miMatch, setMiMatch] = useState<LiveMatch | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const res = await fetch('/api/scores');
      if (!res.ok) {
        setAllMatches([]);
        setMiMatch(null);
        return;
      }

      const data = await res.json();
      setAllMatches(data.matches || []);
      setMiMatch(data.miMatch || null);
      setIsDemo(!!data.demo);
      setLastUpdated(new Date());
    } catch (err) {
      console.warn('Cricket API fetch failed:', err);
      setAllMatches([]);
      setMiMatch(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    // Poll every 60 seconds
    const interval = setInterval(fetchMatches, 60_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  // Backward-compatible MI score/status
  const isMatchLive = miMatch !== null;
  const score = miMatch
    ? miMatch.score.map(s => `${s.inning}: ${s.runs}/${s.wickets} (${s.overs})`).join(' • ')
    : 'No live match';
  const status = miMatch?.status || 'Check schedule';

  return {
    isMatchLive,
    miMatch,
    allMatches,
    score,
    status,
    isLoading,
    isDemo,
    lastUpdated,
    refresh: fetchMatches,
  };
}
