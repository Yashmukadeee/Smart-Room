'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Code, Terminal, Coffee, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TeamMember {
  id: number;
  member_name: string;
  status: string;
}

export function TeamStatusBoard() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Fetch initial states
    const fetchTeamStatuses = async () => {
      try {
        const { data, error } = await supabase
          .from('team_status')
          .select('id, member_name, status')
          .order('id', { ascending: true });

        if (error) throw error;
        if (data) {
          setMembers(data);
        }
      } catch (err) {
        console.error('Error fetching team statuses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamStatuses();

    // 2. Real-time subscription to 'team_status' changes
    const channel = supabase
      .channel('team-status-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'team_status' },
        (payload) => {
          console.log('Real-time team status update:', payload);
          if (payload.eventType === 'UPDATE' && payload.new) {
            const updated = payload.new as TeamMember;
            setMembers((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m))
            );
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const inserted = payload.new as TeamMember;
            setMembers((prev) => {
              if (prev.some((m) => m.id === inserted.id)) return prev;
              return [...prev, inserted].sort((a, b) => a.id - b.id);
            });
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const deleted = payload.old as { id: number };
            setMembers((prev) => prev.filter((m) => m.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const getStatusDetails = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('code') || s.includes('coding') || s.includes('work') || s.includes('active')) {
      return {
        dot: 'bg-emerald-500 shadow-[0_0_10px_#10b981]',
        text: 'text-emerald-400',
        bg: 'bg-emerald-500/5 border-emerald-500/10',
        icon: <Code className="w-3.5 h-3.5 text-emerald-400" />,
        ping: true,
      };
    }
    if (s.includes('debug') || s.includes('test')) {
      return {
        dot: 'bg-amber-500 shadow-[0_0_10px_#f59e0b]',
        text: 'text-amber-400',
        bg: 'bg-amber-500/5 border-amber-500/10',
        icon: <Terminal className="w-3.5 h-3.5 text-amber-400" />,
        ping: true,
      };
    }
    if (s.includes('coffee') || s.includes('break') || s.includes('away') || s.includes('eat')) {
      return {
        dot: 'bg-purple-500 shadow-[0_0_10px_#a855f7]',
        text: 'text-purple-400',
        bg: 'bg-purple-500/5 border-purple-500/10',
        icon: <Coffee className="w-3.5 h-3.5 text-purple-400" />,
        ping: false,
      };
    }
    return {
      dot: 'bg-slate-600',
      text: 'text-slate-500',
      bg: 'bg-slate-900/20 border-slate-800/40',
      icon: <Moon className="w-3.5 h-3.5 text-slate-500" />,
      ping: false,
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
      className="w-full max-w-[320px] bg-slate-950/75 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-2xl z-20 flex flex-col gap-3 font-sans select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-400" />
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            War Room Hub
          </h3>
        </div>
        <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase">
          4 Members
        </span>
      </div>

      {/* Grid Status Board */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 py-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-900/60 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <AnimatePresence>
            {members.slice(0, 4).map((member) => {
              const details = getStatusDetails(member.status);
              return (
                <motion.div
                  key={member.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl border ${details.bg} transition-all duration-300 hover:border-slate-700/60 hover:bg-slate-900/20`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-black text-slate-200 truncate">
                      {member.member_name}
                    </span>
                    {details.icon}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2 shrink-0">
                      {details.ping && (
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${member.status.toLowerCase().includes('debug') ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      )}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${details.dot}`} />
                    </div>
                    <span className={`text-[10px] font-bold font-mono uppercase truncate ${details.text}`}>
                      {member.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}
