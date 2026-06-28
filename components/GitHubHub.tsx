'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitPullRequest, GitCommit, GitBranch, Globe, User } from 'lucide-react';

interface GitEvent {
  id: string;
  type: string;
  actor: { login: string; avatar_url: string };
  repo: { name: string };
  payload: any;
  created_at: string;
}

interface GitHubHubProps {
  repoOwner?: string;
  repos?: string[];
  onNewActivity?: (message: string) => void;
}

// Format relative time
const timeAgo = (dateStr: string) => {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const getEventIcon = (type: string) => {
  if (type === 'PullRequestEvent') return <GitPullRequest className="w-3.5 h-3.5 text-violet-400" />;
  if (type === 'PushEvent') return <GitCommit className="w-3.5 h-3.5 text-emerald-400" />;
  return <GitBranch className="w-3.5 h-3.5 text-cyan-400" />;
};

const getEventLabel = (event: GitEvent): string => {
  const repoShort = event.repo.name.split('/')[1] || event.repo.name;
  if (event.type === 'PullRequestEvent') {
    const action = event.payload?.action;
    const title = event.payload?.pull_request?.title || 'PR';
    return `${action} PR "${title.slice(0, 30)}"`;
  }
  if (event.type === 'PushEvent') {
    const commits = event.payload?.commits?.length || 1;
    const msg = event.payload?.commits?.[0]?.message?.split('\n')[0] || 'commit';
    return `Pushed ${commits} commit${commits > 1 ? 's' : ''}: "${msg.slice(0, 30)}"`;
  }
  return `Activity on ${repoShort}`;
};

const DEMO_EVENTS: GitEvent[] = [
  {
    id: '1',
    type: 'PushEvent',
    actor: { login: 'yashb-dev', avatar_url: '' },
    repo: { name: 'yashb-dev/smart-room' },
    payload: { commits: [{ message: 'feat: add sensor reactions hook' }], size: 1 },
    created_at: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
  },
  {
    id: '2',
    type: 'PullRequestEvent',
    actor: { login: 'teammate-1', avatar_url: '' },
    repo: { name: 'yashb-dev/smart-room' },
    payload: { action: 'opened', pull_request: { title: 'Hackathon UI improvements' } },
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
  },
  {
    id: '3',
    type: 'PushEvent',
    actor: { login: 'teammate-2', avatar_url: '' },
    repo: { name: 'yashb-dev/smart-room' },
    payload: { commits: [{ message: 'fix: supabase realtime subscription leak' }], size: 1 },
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
  },
  {
    id: '4',
    type: 'PushEvent',
    actor: { login: 'teammate-3', avatar_url: '' },
    repo: { name: 'yashb-dev/smart-room' },
    payload: { commits: [{ message: 'docs: update README with ESP32 wiring' }], size: 2 },
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

const SPIDERMAN_PUSH_QUOTES = [
  "New code pushed! Let's hope it doesn't break production.",
  "Someone's been busy swinging through the codebase!",
  "PR opened! Time for a code review faster than my web-slinging!",
  "Fresh commits — your dev team is on fire today!",
];

export const GitHubHub = React.memo(function GitHubHub({ repoOwner, repos = [], onNewActivity }: GitHubHubProps) {
  const [events, setEvents] = useState<GitEvent[]>(DEMO_EVENTS);
  const [lastSeenId, setLastSeenId] = useState<string>('1');
  const [isLive, setIsLive] = useState(false);
  const [newEventPulse, setNewEventPulse] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!repoOwner) {
      setEvents(DEMO_EVENTS);
      return;
    }

    try {
      const repoList = repos.length > 0 ? repos : [repoOwner];
      const allEvents: GitEvent[] = [];

      for (const repo of repoList.slice(0, 3)) {
        const [owner, repoName] = repo.includes('/') ? repo.split('/') : [repoOwner, repo];
        // Use server-side proxy to keep GitHub token secret
        const res = await fetch(`/api/github?owner=${encodeURIComponent(owner)}${repoName ? `&repo=${encodeURIComponent(repoName)}` : ''}`);
        if (res.ok) {
          const json = await res.json();
          if (json.demo) {
            // Server returned demo mode — no token configured
            setEvents(DEMO_EVENTS);
            return;
          }
          if (json.events) {
            allEvents.push(...json.events);
          }
        }
      }

      // Sort by date
      allEvents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const top6 = allEvents.slice(0, 6);

      // Detect new activity since last poll
      if (top6.length > 0 && top6[0].id !== lastSeenId && lastSeenId !== '') {
        const quote = SPIDERMAN_PUSH_QUOTES[Math.floor(Math.random() * SPIDERMAN_PUSH_QUOTES.length)];
        onNewActivity?.(quote);
        setNewEventPulse(true);
        setTimeout(() => setNewEventPulse(false), 3000);
        setLastSeenId(top6[0].id);
      }

      if (top6.length > 0) {
        setEvents(top6);
        setIsLive(true);
      }
    } catch (err) {
      console.warn('GitHub API unavailable, using demo mode:', err);
      setEvents(DEMO_EVENTS);
    }
  }, [repoOwner, repos, lastSeenId, onNewActivity]);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`w-full max-w-[320px] backdrop-blur-md rounded-2xl p-4 shadow-2xl z-20 flex flex-col gap-3 font-sans select-none border transition-all duration-500 ${
        newEventPulse
          ? 'bg-violet-950/60 border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.3)]'
          : 'bg-slate-950/75 border-slate-800/80'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            DEV WAR ROOM
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border bg-slate-950/80 border-slate-800 text-slate-500">
          <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          {isLive ? 'GITHUB LIVE' : 'DEMO MODE'}
        </div>
      </div>

      {/* Events Feed */}
      <div className="flex flex-col gap-2 max-h-[250px] overflow-y-auto scrollbar-thin">
        <AnimatePresence>
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-colors duration-300 ${
                i === 0 && newEventPulse
                  ? 'bg-violet-950/40 border-violet-500/30'
                  : 'bg-slate-950/40 border-slate-900/60'
              }`}
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="flex flex-col gap-0.5 min-w-0">
                {/* Actor + event type */}
                <div className="flex items-center gap-1.5">
                  {getEventIcon(event.type)}
                  <span className="text-[10px] font-bold text-slate-200 truncate">
                    {event.actor.login}
                  </span>
                </div>
                {/* Event description */}
                <p className="text-[9px] font-mono text-slate-400 leading-relaxed truncate max-w-[200px]">
                  {getEventLabel(event)}
                </p>
                {/* Repo + time */}
                <div className="flex items-center gap-2 text-[8px] font-mono text-slate-600">
                  <span className="text-slate-500">{event.repo.name.split('/')[1] || event.repo.name}</span>
                  <span>•</span>
                  <span>{timeAgo(event.created_at)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Quote bubble when new activity */}
      <AnimatePresence>
        {newEventPulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-[10px] font-mono text-violet-300 bg-violet-950/50 border border-violet-500/30 rounded-xl px-3 py-2 italic"
          >
            🕷️ &quot;{SPIDERMAN_PUSH_QUOTES[0]}&quot;
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
