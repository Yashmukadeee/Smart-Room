'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { EchoPopAvatar } from '@/components/EchoPopAvatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Volume2, Newspaper, ListTodo, Trophy, Mic } from 'lucide-react';
import { useLifeSimulation } from '@/hooks/useLifeSimulation';
import { useLipSync } from '@/hooks/useLipSync';
import { supabase } from '@/lib/supabase';
import { useSensorReactions } from '@/hooks/useSensorReactions';
import { CountdownWidget } from '@/components/CountdownWidget';
import { useWebAudioSync } from '@/hooks/useWebAudioSync';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { ClimateGraph } from '@/components/ClimateGraph';
import { MatchTicker } from '@/components/MatchTicker';
import { GitHubHub } from '@/components/GitHubHub';
import { LiveCricketScoreboard } from '@/components/LiveCricketScoreboard';
import { InteractiveClock } from '@/components/InteractiveClock';
import { useMatchDay } from '@/hooks/useMatchDay';
import { useDailyBugle } from '@/hooks/useDailyBugle';
import { useTodoSync } from '@/hooks/useTodoSync';
import { TodoList } from '@/components/TodoList';
import { ClimateWidget } from '@/components/ClimateWidget';
import { TeamStatusBoard } from '@/components/TeamStatusBoard';

const MOOD_GLOWS: Record<string, string> = {
  // Core moods
  alert:       '#dc2626',
  relaxed:     '#2563eb',
  thoughtful:  '#7c3aed',
  tired:       '#475569',
  heroic:      '#d97706',
  curious:     '#0891b2',
  playful:     '#db2777',
  excited:     '#059669',
  stressed:    '#ef4444',
  proud:       '#4f46e5',
  silly:       '#65a30d',
  bored:       '#1e293b',
  determined:  '#b91c1c',
  grateful:    '#be123c',
  sneaky:      '#0d9488',
  // Expanded moods
  focused:     '#0369a1',
  energetic:   '#16a34a',
  confused:    '#9333ea',
  anxious:     '#c2410c',
  cheerful:    '#f59e0b',
  melancholic: '#4338ca',
  fierce:      '#9b1c1c',
  calm:        '#0891b2',
  surprised:   '#d946ef',
  nostalgic:   '#6d28d9',
  motivated:   '#15803d',
  peaceful:    '#0e7490',
  goofy:       '#84cc16',
  brave:       '#b45309',
  wise:        '#6366f1',
  nervous:     '#ea580c',
  joyful:      '#10b981',
  intense:     '#7f1d1d',
  dreamy:      '#8b5cf6',
  cranky:      '#92400e',
  confident:   '#1d4ed8',
  humble:      '#0f766e',
  adventurous: '#0c4a6e',
  mischievous: '#0f766e',
  protective:  '#b45309',
  hopeful:     '#2dd4bf',
  amused:      '#f472b6',
  fearless:    '#d97706',
  zany:        '#a3e635',
  serious:     '#374151',
  rebellious:  '#be185d',
  electric:    '#22d3ee',
  zen:         '#99f6e4',
  hungry:      '#f97316',
  hyper:       '#4ade80',
  mysterious:  '#312e81',
  dramatic:    '#dc2626',
  content:     '#0284c7',
  triumphant:  '#facc15',
  cheeky:      '#fb7185',
  pensive:     '#7c3aed',
  wild:        '#ef4444',
};

// Alexa phrases that mean "add task X"
const ADD_TASK_PATTERNS = [
  /add (?:a )?(?:task|todo|mission|reminder)(?: to)?[: ]+(.+)/i,
  /remind me to (.+)/i,
  /put (.+) on (?:my |the )?(?:list|todo|tasks)/i,
  /add (.+) to (?:my )?(?:list|todo|tasks)/i,
  /(?:note|jot) down[: ]+(.+)/i,
  /i need to (.+)/i,
];

function extractAlexaTask(text: string): string | null {
  for (const pattern of ADD_TASK_PATTERNS) {
    const m = text.match(pattern);
    if (m?.[1]) return m[1].replace(/[.!?]$/, '').trim();
  }
  return null;
}

export default function HomePage() {
  const { play: playVoice, stop: stopVoice, activeViseme, isPlaying: isPlayingVoice } = useLipSync();

  const [spokenText, setSpokenText] = useState<string | null>(null);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [isUrgentDeadline, setIsUrgentDeadline] = useState(false);
  const [urgentDeadlineName, setUrgentDeadlineName] = useState('');
  const [showClimate, setShowClimate] = useState(false);
  const [showGitHub, setShowGitHub] = useState(false);
  const [showTodos, setShowTodos] = useState(false);
  const [spideySense, setSpideySense] = useState(false);

  const sensorCtx = useSensorReactions();
  const matchDay = useMatchDay();
  const {
    bass,
    mid,
    treble,
    analyser,
    isSpeaking,
    isAudioLocked,
    startAudioListener,
    stopAudioListener
  } = useWebAudioSync();

  // Todo list — Supabase-backed with localStorage fallback
  const { todos, addTodo, toggleTodo, deleteTodo } = useTodoSync();
  const pendingTodos = todos.filter(t => !t.completed);
  const pendingCount = pendingTodos.length;
  const firstPendingTitle = pendingTodos[0]?.title ?? null;

  // Daily Bugle — fires at 7am each morning
  const { triggerBriefingNow } = useDailyBugle({
    onBriefingReady: (prompt) => playSpeech(prompt),
  });

  // Priority logic for active mood and task override (critical events only)
  let activeMoodOverride = sensorCtx.sensorMoodOverride;
  let activeTaskOverride = sensorCtx.sensorTaskOverride;

  if (sensorCtx.doorOpen) {
    activeMoodOverride = 'alert';
    activeTaskOverride = 'INTRUDER ALERT — Scanning doorway...';
  } else if (matchDay.isMatchLive) {
    activeMoodOverride = 'heroic';
    activeTaskOverride = `MI MATCH LIVE! ${matchDay.status}`;
  }

  const externalOverride = isPlayingVoice ? 'speaking' : null;
  const { currentState, currentTask, currentMood, currentCategory } = useLifeSimulation(
    externalOverride,
    activeMoodOverride,
    activeTaskOverride,
    pendingCount,
    firstPendingTitle
  );

  // Play Speech handler (hoisted above useDailyBugle usage)
  const playSpeech = useCallback(async (text: string) => {
    if (loadingVoice) return;
    stopVoice();

    try {
      setLoadingVoice(true);
      setSpokenText(text);

      const res = await fetch('/api/voice-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text })
      });

      if (!res.ok) throw new Error('Voice API failed');

      const data = await res.json();
      setSpokenText(data.text);

      await playVoice({
        audio: data.audio,
        alignment: data.alignment,
        text: data.text
      });
    } catch (e) {
      console.warn('Failed to play AI voice sync:', e);
    } finally {
      setLoadingVoice(false);
    }
  }, [loadingVoice, playVoice, stopVoice]);

  // Click Spiderman triggers a greeting and turns on Spidey-Sense
  const handleAvatarClick = () => {
    setSpideySense(true);
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.volume = 0.35;
      audio.play().catch(() => {});
    } catch (e) {}

    playSpeech('Give me a brief superhero system status update.');

    setTimeout(() => {
      setSpideySense(false);
    }, 6500);
  };

  // Alexa Supabase Bridge Listener — also parses "add task" and "ask spidey" commands
  useEffect(() => {
    const channel = supabase
      .channel('commands-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'commands' },
        async (payload) => {
          const text: string = payload.new.text ?? '';
          console.log('Alexa Command Received:', text);
          const lowercaseText = text.toLowerCase();

          // Check if this is an "ask spidey" or "spidey sense" trigger
          if (lowercaseText.includes('ask spidey') || lowercaseText.includes('spidey sense')) {
            setSpideySense(true);
            try {
              const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
              audio.volume = 0.35;
              audio.play().catch(() => {});
            } catch (e) {}

            // Dynamic room status report
            const currentTemp = sensorCtx.tempC ?? 24;
            const doorStatus = sensorCtx.doorOpen ? 'breached' : 'secure';
            const pendingTasksMsg = pendingCount > 0 
              ? `You have ${pendingCount} pending missions on your board.` 
              : 'All missions are clear.';

            const responses = [
              `My Spidey-Sense is tingling! Let me check the room status... Temperature is ${currentTemp} degrees Celsius, and the door is ${doorStatus}. ${pendingTasksMsg}`,
              `Spidey-Sense activated! Room telemetry scanned: Temp is ${currentTemp} degrees, and the perimeter is ${doorStatus}. What is your next command?`,
              `Whoa, that was a close one! My Spidey-sense just went off. Current temperature is ${currentTemp} degrees, and the door is ${doorStatus}. Ready for action!`
            ];

            const chosenResponse = responses[Math.floor(Math.random() * responses.length)];
            playSpeech(chosenResponse);

            setTimeout(() => {
              setSpideySense(false);
            }, 6500);
          } else {
            // Check if this is a "add task" command
            const taskTitle = extractAlexaTask(text);
            if (taskTitle) {
              await addTodo(taskTitle);
              setShowTodos(true); // Auto-open the panel so the user sees the new task
              playSpeech(`Got it! I've added "${taskTitle}" to your missions list.`);
            } else if (text) {
              playSpeech(text);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playSpeech, addTodo, sensorCtx.tempC, sensorCtx.doorOpen, pendingCount]);

  // Map mood to glow color
  const activeMood = isPlayingVoice ? 'excited' : currentMood;
  const glowColor = matchDay.isMatchLive
    ? '#d4af37'
    : !sensorCtx.lightsOn
    ? '#0f2625'
    : (MOOD_GLOWS[activeMood] || '#dc2626');

  let activeTask = isPlayingVoice && spokenText ? spokenText : currentTask;
  if (!isPlayingVoice && currentState !== 'repairing') {
    const suffixes = [];
    if (sensorCtx.tempC !== null && sensorCtx.tempC > 28) {
      suffixes.push(`Temp: ${sensorCtx.tempC}°C 🔥`);
    }
    if (!sensorCtx.lightsOn) {
      suffixes.push('Stealth Mode 🕶️');
    }
    if (matchDay.isMatchLive) {
      suffixes.push('MI Live 🏏');
    }
    if (!isAudioLocked) {
      suffixes.push('Beat Sync 🎵');
    }
    if (pendingCount > 0) {
      suffixes.push(`${pendingCount} Mission${pendingCount > 1 ? 's' : ''} Pending 📋`);
    }
    if (suffixes.length > 0) {
      activeTask = `${activeTask} [${suffixes.join(' • ')}]`;
    }
  }

  // Match-day CSS overrides
  const matchDayStyle = matchDay.isMatchLive
    ? {
        '--match-accent': '#004b87',
        '--match-gold': '#d4af37',
        background: 'radial-gradient(ellipse at 50% 0%, #001a2e 0%, #04070d 60%)',
      } as React.CSSProperties
    : {};

  return (
    <main
      style={{
        boxShadow: !isAudioLocked && bass > 0
          ? `inset 0 0 ${15 + bass * 40}px rgba(239, 68, 68, ${0.15 + bass * 0.45}), 0 0 ${10 + bass * 25}px rgba(6, 182, 212, ${0.1 + bass * 0.3})`
          : matchDay.isMatchLive
          ? 'inset 0 0 40px rgba(0, 75, 135, 0.4), 0 0 20px rgba(212, 175, 55, 0.2)'
          : 'none',
        transition: 'box-shadow 0.08s ease-out',
        ...matchDayStyle
      }}
      className="h-dvh w-screen bg-[#04070d] text-slate-100 p-4 md:p-6 lg:p-8 font-sans flex flex-col items-center justify-between overflow-hidden relative"
    >

      {/* Audio Visualizer Halo Background */}
      <AudioVisualizer analyser={isAudioLocked ? null : analyser} />

      {/* Door breach alarm overlay */}
      <AnimatePresence>
        {sensorCtx.doorOpen && (
          <motion.div
            key="door-alarm-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.45, 0, 0.45, 0] }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0 z-40 bg-red-600 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Dynamic Ambient Background Glow */}
      <motion.div
        animate={{
          background: `radial-gradient(circle at center, ${glowColor}22 0%, #04070d 100%)`
        }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Halftone Overlay */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none z-0" />


      {/* Top-left controls: Beat Sync */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => {
            if (isAudioLocked) {
              startAudioListener();
            } else {
              stopAudioListener();
            }
          }}
          className={`px-4 py-2 rounded-full border text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 shadow-lg backdrop-blur-md flex items-center gap-2 cursor-pointer ${
            isAudioLocked
              ? 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-600 hover:text-slate-200'
              : 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:border-cyan-400'
          }`}
        >
          <span className={`w-2 h-2 rounded-full ${isAudioLocked ? 'bg-slate-600' : 'bg-cyan-400 animate-ping'}`} />
          {isAudioLocked ? 'Sync Room Beat' : 'Beat Sync Active'}
        </button>
      </div>

      {/* Top-right controls: Mic Visualizer + Daily Bugle */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
        {/* Mic/Voice Action Indicator */}
        <div className="relative flex items-center justify-center">
          {((!isAudioLocked && isSpeaking) || isPlayingVoice) && (
            <>
              <span className="absolute inline-flex h-8 w-8 rounded-full bg-cyan-400 opacity-75 animate-ping" />
              <span className="absolute inline-flex h-8 w-8 rounded-full border-2 border-cyan-400 opacity-50 animate-pulse" />
            </>
          )}
          <div className={`p-2 rounded-full border transition-all duration-300 bg-slate-950/80 backdrop-blur-md flex items-center justify-center w-8 h-8 ${
            ((!isAudioLocked && isSpeaking) || isPlayingVoice)
              ? 'border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.5)]'
              : 'border-slate-800 text-slate-500'
          }`}>
            <Mic className="w-3.5 h-3.5" />
          </div>
        </div>

        <button
          onClick={() => triggerBriefingNow()}
          className="px-4 py-2 rounded-full border text-xs font-mono font-bold uppercase tracking-wider bg-slate-950/80 border-amber-800/50 text-amber-400/80 hover:border-amber-500 hover:text-amber-300 transition-all duration-300 shadow-lg backdrop-blur-md flex items-center gap-2 cursor-pointer"
        >
          <Newspaper className="w-3 h-3" />
          Daily Bugle
        </button>
      </div>

      {/* Dashboard Center Layout */}
      <div className="flex-1 w-full max-w-7xl z-10 flex flex-col lg:flex-row items-center justify-center gap-6 md:gap-10 -translate-y-4 px-4 overflow-y-auto lg:overflow-visible">
        {/* Left Grid Card Column (Climate + Team Status) */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-4 w-full lg:w-72 items-center justify-center shrink-0">
          <ClimateWidget />
          <TeamStatusBoard />
        </div>

        {/* Center: Clock + Spidey Avatar */}
        <div className="flex flex-col items-center justify-center gap-4 shrink-0">
          <InteractiveClock />

          <motion.div
            onClick={handleAvatarClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-[240px] sm:max-w-[280px] lg:max-w-[320px] aspect-square flex items-center justify-center pointer-events-auto cursor-pointer relative"
          >
            {loadingVoice && (
              <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px] rounded-full z-30 flex items-center justify-center pointer-events-none">
                <div className="w-12 h-12 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
              </div>
            )}
            <EchoPopAvatar
              currentState={currentState}
              currentMood={activeMood}
              currentCategory={currentCategory}
              activeViseme={activeViseme}
              isPlayingVoice={isPlayingVoice}
              lightsOn={sensorCtx.lightsOn}
              tempC={sensorCtx.tempC}
              isMatchLive={matchDay.isMatchLive}
              audioData={isAudioLocked ? undefined : { bass, mid, treble }}
              spideySenseActive={spideySense}
            />
          </motion.div>
        </div>

        {/* Right Grid Card Column (Milestone Deadlines) */}
        <div className="flex flex-col gap-4 w-full lg:w-72 items-center justify-center shrink-0">
          <CountdownWidget
            onUrgentStatusChange={(isUrgent, name) => {
              setIsUrgentDeadline(isUrgent);
              setUrgentDeadlineName(name);
            }}
          />
        </div>
      </div>

      {/* Left-Side Floating Panels: GitHub Hub + TodoList */}
      <div className="absolute bottom-6 left-6 z-30 hidden md:flex flex-col gap-3 items-start">
        <AnimatePresence>
          {showGitHub && (
            <motion.div
              key="github-hub"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <GitHubHub
                onNewActivity={(msg) => playSpeech(msg)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showTodos && (
            <motion.div
              key="todo-list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TodoList
                todos={todos}
                onAddTodo={addTodo}
                onToggleTodo={toggleTodo}
                onDeleteTodo={deleteTodo}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Buttons */}
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowGitHub(v => !v)}
            className={`px-5 py-2.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2 ${
              showGitHub
                ? 'bg-violet-950/80 border-violet-500/50 text-violet-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showGitHub ? 'bg-violet-400' : 'bg-slate-600'}`} />
            Dev Hub
          </button>

          <button
            onClick={() => setShowTodos(v => !v)}
            className={`px-5 py-2.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2 ${
              showTodos
                ? 'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <ListTodo className={`w-4 h-4 ${showTodos ? 'text-cyan-400' : 'text-slate-600'}`} />
            Missions
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-[11px] font-black">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowClimate(v => !v)}
            className={`px-5 py-2.5 rounded-full border text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 backdrop-blur-md cursor-pointer flex items-center gap-2 ${
              showClimate
                ? 'bg-amber-950/80 border-amber-600/50 text-amber-300'
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${showClimate ? 'bg-amber-400' : 'bg-slate-600'}`} />
            Thermals
          </button>
        </div>
      </div>

      {/* Right-Side Floating Panels: Climate Graph only */}
      <div className="absolute bottom-6 right-6 z-30 hidden md:flex flex-col items-end gap-3">
        <AnimatePresence>
          {showClimate && (
            <motion.div
              key="climate-graph"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <ClimateGraph
                realTemp={sensorCtx.tempC}
                realHumidity={sensorCtx.humidity}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Hub Button + Cricket Scores below */}
      <footer className="w-full flex flex-col items-center pb-4 md:pb-6 z-20 shrink-0 gap-3.5 translate-y-0">
        <Link
          href="/hub"
          className="flex items-center gap-4 px-20 py-6 rounded-full bg-gradient-to-r from-red-700 via-red-800 to-red-950 border border-red-500/45 text-white font-black tracking-[0.2em] text-base shadow-[0_0_30px_rgba(239,68,68,0.35)] uppercase transition duration-300 active:scale-95 hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(239,68,68,0.55)] hover:border-red-400 cursor-pointer"
        >
          <Sliders className="w-6 h-6 text-white animate-pulse" />
          CONTROL HUB
        </Link>

        {/* Compact horizontal cricket strip below button */}
        <LiveCricketScoreboard
          matches={matchDay.allMatches}
          isLoading={matchDay.isLoading}
          isDemo={matchDay.isDemo}
          onRefresh={matchDay.refresh}
        />
      </footer>
    </main>
  );
}
