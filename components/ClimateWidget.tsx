'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function ClimateWidget({ compact = false }: { compact?: boolean }) {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [humidity, setHumidity] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Fetch initial values
    const fetchInitialClimate = async () => {
      try {
        const { data, error } = await supabase
          .from('devices')
          .select('temperature, humidity')
          .eq('id', 'my_room')
          .single();

        if (error) throw error;
        if (data) {
          setTemperature(data.temperature !== null ? Number(data.temperature) : null);
          setHumidity(data.humidity !== null ? Number(data.humidity) : null);
        }
      } catch (err) {
        console.error('Error fetching initial climate data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialClimate();

    // 2. Real-time subscription for my_room climate updates
    const channel = supabase
      .channel('climate-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'devices',
          filter: 'id=eq.my_room',
        },
        (payload) => {
          console.log('Realtime climate update:', payload.new);
          if (payload.new) {
            const updated = payload.new as { temperature?: number; humidity?: number };
            if (updated.temperature !== undefined) setTemperature(Number(updated.temperature));
            if (updated.humidity !== undefined) setHumidity(Number(updated.humidity));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4.5 px-4.5 py-2.5 rounded-full bg-slate-950/80 border border-cyan-500/35 text-slate-200 text-xs font-mono font-bold shadow-[0_0_15px_rgba(6,182,212,0.15)] select-none shrink-0"
      >
        <div className="flex items-center gap-1.5">
          <Thermometer className="w-3.5 h-3.5 text-orange-400" />
          {loading ? (
            <span className="w-8 h-4 bg-slate-800 animate-pulse rounded" />
          ) : (
            <span className="text-slate-100 tabular-nums">
              {temperature !== null ? `${temperature.toFixed(1)}°C` : '--'}
            </span>
          )}
        </div>
        <span className="text-slate-800 font-bold select-none">|</span>
        <div className="flex items-center gap-1.5">
          <Droplets className="w-3.5 h-3.5 text-cyan-400" />
          {loading ? (
            <span className="w-6 h-4 bg-slate-800 animate-pulse rounded" />
          ) : (
            <span className="text-slate-100 tabular-nums">
              {humidity !== null ? `${humidity.toFixed(0)}%` : '--'}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full max-w-[320px] bg-slate-950/75 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] hover:border-cyan-500/30 transition-all duration-500 z-20 flex flex-col gap-4 font-sans select-none"
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            Climate Status
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-[9px] font-mono font-bold text-cyan-400 tracking-wider uppercase">
            LIVE
          </span>
        </div>
      </div>

      {/* Climate Values Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Temp Card */}
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-900/60 transition-colors">
          <div className="flex items-center gap-1 text-slate-400">
            <Thermometer className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Temp</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded" />
          ) : (
            <span className="text-xl font-black font-mono text-slate-100 tabular-nums">
              {temperature !== null ? `${temperature.toFixed(1)}°C` : '--'}
            </span>
          )}
        </div>

        {/* Humidity Card */}
        <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 hover:bg-slate-900/60 transition-colors">
          <div className="flex items-center gap-1 text-slate-400">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono uppercase tracking-wider">Humidity</span>
          </div>
          {loading ? (
            <div className="h-7 w-12 bg-slate-800 animate-pulse rounded" />
          ) : (
            <span className="text-xl font-black font-mono text-slate-100 tabular-nums">
              {humidity !== null ? `${humidity.toFixed(0)}%` : '--'}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
