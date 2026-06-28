'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertCircle, CheckCircle } from 'lucide-react';

export interface Deadline {
  id: string;
  label: string;
  date: string; // YYYY-MM-DD
  category: 'exam' | 'hackathon' | 'project' | 'assignment';
  completed?: boolean;
}

// Pre-seeded deadlines based on June 28, 2026
export const INITIAL_DEADLINES: Deadline[] = [
  { id: '1', label: 'OOP 40-Mark Assignment', date: '2026-06-30', category: 'assignment' }, // 2 days left (Flashing Red)
  { id: '2', label: 'Goa Hackathon Submission', date: '2026-07-04', category: 'hackathon' }, // 6 days left (Orange)
  { id: '3', label: 'DBMS Project Submission', date: '2026-07-10', category: 'project' }, // 12 days left (Green)
  { id: '4', label: 'Web Dev Exam Study', date: '2026-07-28', category: 'exam' }, // 30 days left (Green)
];

interface CountdownWidgetProps {
  onUrgentStatusChange?: (isUrgent: boolean, nearestDeadlineName: string) => void;
}

const LOCAL_STORAGE_KEY = 'smart_room_deadlines_v2';

export function CountdownWidget({
  onUrgentStatusChange,
}: CountdownWidgetProps) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        setDeadlines(JSON.parse(saved));
        return;
      } catch (e) {
        console.error('Failed to parse saved deadlines:', e);
      }
    }
    setDeadlines(INITIAL_DEADLINES);
  }, []);

  // Save to localStorage whenever state changes
  const saveAndSetDeadlines = (newDeadlines: Deadline[]) => {
    setDeadlines(newDeadlines);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDeadlines));
  };

  // Sort and filter out past deadlines, then calculate remaining days
  const activeDeadlines = deadlines
    .filter(d => !d.completed)
    .map(d => {
      const deadlineDate = new Date(`${d.date}T00:00:00`);
      const currentDate = new Date();
      // Set hours to 0 to compare days directly
      deadlineDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);

      const diffTime = deadlineDate.getTime() - currentDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...d, diffDays };
    })
    .filter(d => d.diffDays >= 0)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Determine if there's an urgent deadline (< 48 hours / <= 2 days)
  useEffect(() => {
    const nearestUrgent = activeDeadlines.find(d => d.diffDays >= 0 && d.diffDays <= 2);
    if (nearestUrgent) {
      onUrgentStatusChange?.(true, nearestUrgent.label);
    } else {
      onUrgentStatusChange?.(false, '');
    }
  }, [activeDeadlines, onUrgentStatusChange]);

  const handleMarkAsDone = (id: string) => {
    // Play a satisfying web-shoot sound
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3');
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } catch (e) {}

    const updated = deadlines.map(d => d.id === id ? { ...d, completed: true } : d);
    saveAndSetDeadlines(updated);
  };

  // Color picker based on urgency (Green > 7 days, Orange 3-7 days, Flashing Red <= 2 days/48 hours)
  const getUrgencyStyles = (days: number) => {
    if (days <= 2) {
      return {
        color: 'text-red-500',
        bg: 'bg-red-500/10 hover:bg-red-500/15',
        border: 'border-red-500/30',
        dot: 'bg-red-500 shadow-[0_0_10px_#ef4444]',
        pulse: true,
      };
    }
    if (days >= 3 && days <= 7) {
      return {
        color: 'text-orange-500',
        bg: 'bg-orange-500/10 hover:bg-orange-500/15',
        border: 'border-orange-500/30',
        dot: 'bg-orange-500 shadow-[0_0_8px_#f97316]',
        pulse: false,
      };
    }
    return {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10 hover:bg-emerald-500/15',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-500 shadow-[0_0_6px_#10b981]',
      pulse: false,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-[320px] bg-slate-950/75 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-2xl z-20 flex flex-col gap-3 font-sans select-none"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            DEADLINE TRACKER
          </h3>
        </div>
        {activeDeadlines.some(d => d.diffDays <= 3) && (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex items-center gap-1 text-[9px] font-mono font-bold text-red-400 bg-red-950/40 border border-red-900/50 px-2 py-0.5 rounded-full"
          >
            <AlertCircle className="w-2.5 h-2.5 text-red-400" />
            <span>CRITICAL</span>
          </motion.div>
        )}
      </div>

      {/* Deadlines List */}
      <div className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {activeDeadlines.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-mono text-slate-500 text-center py-4 uppercase"
            >
              No upcoming deadlines 🎉
            </motion.p>
          ) : (
            activeDeadlines.slice(0, 3).map((deadline) => {
              const styles = getUrgencyStyles(deadline.diffDays);
              return (
                <motion.div
                  key={deadline.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -100 }}
                  onClick={() => handleMarkAsDone(deadline.id)}
                  className={`group relative flex items-center justify-between p-2.5 rounded-xl border ${styles.bg} ${styles.border} transition-all duration-300 cursor-pointer overflow-hidden`}
                >
                  <div className="flex flex-col gap-0.5 max-w-[170px] transition-transform duration-300 group-hover:translate-x-1">
                    <span className="text-xs font-bold text-slate-200 truncate group-hover:text-cyan-300">
                      {deadline.label}
                    </span>
                    <span className="text-[9px] font-mono text-slate-500 uppercase">
                      {deadline.category} • {deadline.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right flex flex-col transition-all duration-300 group-hover:opacity-0 group-hover:scale-50">
                      <span className={`text-xs font-black ${styles.color}`}>
                        {deadline.diffDays === 0 ? 'TODAY' : `${deadline.diffDays}d`}
                      </span>
                      {deadline.diffDays > 0 && (
                        <span className="text-[8px] font-mono text-slate-400 uppercase">
                          left
                        </span>
                      )}
                    </div>
                    <div className="relative flex h-2 w-2 transition-all duration-300 group-hover:opacity-0 group-hover:scale-50">
                      {styles.pulse && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${styles.dot}`}></span>
                    </div>
                  </div>

                  {/* Complete Action Overlay on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase">
                      <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                      Mark Completed
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

