'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Palette, Sun, Lightbulb, Wind, Sparkles, 
  ThermometerSnowflake, Power, ChevronUp, ChevronDown, Zap, Activity
} from 'lucide-react';

interface RoomState {
  id: string;
  light: 'ON' | 'OFF';
  fan: 'ON' | 'OFF';
  rgb: 'ON' | 'OFF';
  neon: 'ON' | 'OFF';
  decor: 'ON' | 'OFF';
  neon_color: string;
  temperature: number;
  humidity: number;
  ac_cmd: string;
}

const DEFAULT_STATE: RoomState = {
  id: 'my_room',
  light: 'OFF',
  fan: 'OFF',
  rgb: 'OFF',
  neon: 'OFF',
  decor: 'OFF',
  neon_color: '#ffffff',
  temperature: 26.5,
  humidity: 65.0,
  ac_cmd: 'IDLE'
};

export default function ControlHubPage() {
  const [roomState, setRoomState] = useState<RoomState>(DEFAULT_STATE);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 30 Seconds Inactivity Timer Setup
  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      router.push('/');
    }, 30000); // 30 seconds
  }, [router]);

  useEffect(() => {
    const activities = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll', 'pointerdown'];
    
    activities.forEach(event => {
      window.addEventListener(event, resetInactivityTimer, { passive: true });
    });

    const graceTimer = setTimeout(() => {
      resetInactivityTimer();
    }, 2000);

    return () => {
      activities.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      clearTimeout(graceTimer);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [resetInactivityTimer]);

  // Initial Fetch & Real-time WebSockets setup
  useEffect(() => {
    const fetchRoomState = async () => {
      try {
        const { data, error } = await supabase
          .from('devices')
          .select('*')
          .eq('id', 'my_room')
          .single();
        
        if (data) {
          setRoomState(data as RoomState);
        }
      } catch (err) {
        console.error("Error fetching room telemetry:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomState();

    const channel = supabase
      .channel('my-room-controls')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices', filter: 'id=eq.my_room' },
        (payload) => {
          console.log('Realtime control update received:', payload.new);
          if (payload.new) {
            setRoomState(payload.new as RoomState);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Toggle Appliance handler
  const handleToggleAppliance = async (key: 'light' | 'fan' | 'rgb' | 'neon' | 'decor', currentValue: 'ON' | 'OFF') => {
    const nextValue = currentValue === 'ON' ? 'OFF' : 'ON';
    
    // Optimistic update
    setRoomState(prev => ({ ...prev, [key]: nextValue }));

    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: nextValue })
      });
    } catch (e) {
      console.warn("Failed to update appliance state:", e);
    }
  };

  // AC Command handler
  const handleAcCommand = async (cmd: string) => {
    // Optimistic update
    setRoomState(prev => ({ ...prev, ac_cmd: cmd }));

    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ac_cmd: cmd })
      });
    } catch (e) {
      console.warn("Failed to send AC command:", e);
    }
  };

  // Neon Color handler
  const handleNeonColorChange = async (hexColor: string) => {
    // Optimistic update
    setRoomState(prev => ({ ...prev, neon_color: hexColor }));

    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ neon_color: hexColor })
      });
    } catch (e) {
      console.warn("Failed to update neon color:", e);
    }
  };

  const colorPresets = [
    '#ff0055', '#00ff66', '#0088ff', '#8b5cf6',
    '#eab308', '#06b6d4', '#ff5722', '#ffffff'
  ];

  const getAcCommandLabel = (cmd: string) => {
    switch (cmd) {
      case 'ON': return 'Powered ON';
      case 'OFF': return 'Powered OFF';
      case 'TEMP_HIGH': return 'Temp Up (+1°C)';
      case 'TEMP_LOW': return 'Temp Down (-1°C)';
      case 'TURBO_ON': return 'Turbo Active';
      case 'TURBO_OFF': return 'Turbo Inactive';
      default: return cmd;
    }
  };

  return (
    <main className="h-dvh w-screen bg-[#05070d] text-slate-100 p-6 md:p-8 lg:p-10 font-sans flex flex-col justify-center overflow-hidden relative">
      {/* Background Halftone Layer */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none" />

      {/* Floating Close Button */}
      <div className="absolute top-6 right-6 z-20">
        <Link href="/" className="p-3 rounded-full bg-slate-950/80 border border-slate-900/80 text-slate-400 hover:text-white transition active:scale-95 flex items-center justify-center shadow-lg backdrop-blur-md">
          <X className="w-5 h-5" />
        </Link>
      </div>

      {/* Grid Viewport */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-8">
        
        {/* Left column: Appliance Grid (Span 7) */}
        <section className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Smart Appliances</h3>
            <span className="text-[10px] font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900 text-slate-400">
              {['light', 'fan', 'rgb', 'neon', 'decor'].filter(k => roomState[k as keyof RoomState] === 'ON').length} ACTIVE
            </span>
          </div>
          
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-32 bg-slate-950/40 rounded-xl border border-slate-900" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Main Light */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    roomState.light === 'ON'
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.1)]' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  onClick={() => handleToggleAppliance('light', roomState.light)}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${roomState.light === 'ON' ? 'bg-amber-500/10 border border-amber-500/25' : 'bg-slate-950 border border-slate-800'}`}>
                      <Lightbulb className={`w-6 h-6 ${roomState.light === 'ON' ? 'text-amber-400' : 'text-slate-500'}`} />
                    </div>
                    <button 
                      className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        roomState.light === 'ON' ? 'bg-amber-500 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Primary Light</p>
                    <h3 className="text-sm font-black text-white mt-0.5">Main Light</h3>
                  </div>
                </motion.div>

                {/* 2. Fan Power */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    roomState.fan === 'ON'
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 border-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.1)]' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  onClick={() => handleToggleAppliance('fan', roomState.fan)}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${roomState.fan === 'ON' ? 'bg-emerald-500/10 border border-emerald-500/25' : 'bg-slate-950 border border-slate-800'}`}>
                      <Wind className={`w-6 h-6 ${roomState.fan === 'ON' ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} style={{ animationDuration: roomState.fan === 'ON' ? '1.8s' : '0s' }} />
                    </div>
                    <button 
                      className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        roomState.fan === 'ON' ? 'bg-emerald-500 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ceiling Fan</p>
                    <h3 className="text-sm font-black text-white mt-0.5">Fan Power</h3>
                  </div>
                </motion.div>

                {/* 3. Custom RGB */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    roomState.rgb === 'ON'
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.1)]' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  onClick={() => handleToggleAppliance('rgb', roomState.rgb)}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${roomState.rgb === 'ON' ? 'bg-cyan-500/10 border border-cyan-500/25' : 'bg-slate-950 border border-slate-800'}`}>
                      <Palette className={`w-6 h-6 ${roomState.rgb === 'ON' ? 'text-cyan-400' : 'text-slate-500'}`} />
                    </div>
                    <button 
                      className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        roomState.rgb === 'ON' ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Accent Lights</p>
                    <h3 className="text-sm font-black text-white mt-0.5">Custom RGB Controller</h3>
                  </div>
                </motion.div>

                {/* 4. Neon RGB Strip */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    roomState.neon === 'ON'
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-pink-950/20 border-pink-500/40 shadow-[0_0_25px_rgba(236,72,153,0.1)]' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  onClick={() => handleToggleAppliance('neon', roomState.neon)}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${roomState.neon === 'ON' ? 'bg-pink-500/10 border border-pink-500/25' : 'bg-slate-950 border border-slate-800'}`}>
                      <Zap className={`w-6 h-6 ${roomState.neon === 'ON' ? 'text-pink-400' : 'text-slate-500'}`} />
                    </div>
                    <button 
                      className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        roomState.neon === 'ON' ? 'bg-pink-500 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Vibrant Neon</p>
                    <h3 className="text-sm font-black text-white mt-0.5">Neon RGB Strip</h3>
                  </div>
                </motion.div>

                {/* 5. Extra Decor */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-36 ${
                    roomState.decor === 'ON'
                      ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-violet-950/20 border-violet-500/40 shadow-[0_0_25px_rgba(139,92,246,0.1)]' 
                      : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                  }`}
                  onClick={() => handleToggleAppliance('decor', roomState.decor)}
                >
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-xl ${roomState.decor === 'ON' ? 'bg-violet-500/10 border border-violet-500/25' : 'bg-slate-950 border border-slate-800'}`}>
                      <Sparkles className={`w-6 h-6 ${roomState.decor === 'ON' ? 'text-violet-400' : 'text-slate-500'}`} />
                    </div>
                    <button 
                      className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                        roomState.decor === 'ON' ? 'bg-violet-500 justify-end' : 'bg-slate-800 justify-start'
                      }`}
                    >
                      <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Ambient Decor</p>
                    <h3 className="text-sm font-black text-white mt-0.5">Extra Decor Lights</h3>
                  </div>
                </motion.div>

                {/* 6. Telemetry Status */}
                <div className="p-5 rounded-2xl border bg-slate-950/40 border-slate-900/80 flex flex-col justify-between h-36">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-cyan-950/40 border border-cyan-800/30">
                      <Activity className="w-4.5 h-4.5 text-cyan-400 animate-pulse" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telemetry Log</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Temp</span>
                      <p className="text-base font-mono font-bold text-slate-100">{roomState.temperature}°C</p>
                    </div>
                    <div>
                      <span className="text-[9px] font-mono text-slate-500 uppercase">Humidity</span>
                      <p className="text-base font-mono font-bold text-slate-100">{roomState.humidity}%</p>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </section>

        {/* Right Column: AC + Neon Presets (Span 5) */}
        <section className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Air Conditioner Console */}
          <div className="flex flex-col flex-1 min-h-[50%]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 shrink-0">Air Conditioner</h3>
            <div className="flex-1 bg-slate-950/50 border border-slate-900/80 rounded-3xl p-5 md:p-6 flex flex-col justify-between">
              
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25">
                    <ThermometerSnowflake className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200">AC Control Board</h4>
                    <p className="text-[9px] font-mono text-slate-500 uppercase">Master AC Command</p>
                  </div>
                </div>
                <div className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold text-cyan-400">
                  {getAcCommandLabel(roomState.ac_cmd)}
                </div>
              </div>

              {/* Six Control Buttons Grid */}
              <div className="grid grid-cols-2 gap-3 my-4">
                <button 
                  onClick={() => handleAcCommand('ON')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    roomState.ac_cmd === 'ON'
                      ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Power className="w-4 h-4 text-emerald-400" />
                  Power ON
                </button>

                <button 
                  onClick={() => handleAcCommand('OFF')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    roomState.ac_cmd === 'OFF'
                      ? 'bg-slate-950/60 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.25)]'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Power className="w-4 h-4 text-red-400" />
                  Power OFF
                </button>

                <button 
                  onClick={() => handleAcCommand('TEMP_HIGH')}
                  className="py-3.5 px-4 rounded-xl border bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <ChevronUp className="w-4 h-4 text-orange-400" />
                  Temp High
                </button>

                <button 
                  onClick={() => handleAcCommand('TEMP_LOW')}
                  className="py-3.5 px-4 rounded-xl border bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition active:scale-95"
                >
                  <ChevronDown className="w-4 h-4 text-cyan-400" />
                  Temp Low
                </button>

                <button 
                  onClick={() => handleAcCommand('TURBO_ON')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    roomState.ac_cmd === 'TURBO_ON'
                      ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  Turbo ON
                </button>

                <button 
                  onClick={() => handleAcCommand('TURBO_OFF')}
                  className={`py-3.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition ${
                    roomState.ac_cmd === 'TURBO_OFF'
                      ? 'bg-slate-950/60 border-slate-800 text-slate-400'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-slate-600" />
                  Turbo OFF
                </button>
              </div>

            </div>
          </div>

          {/* Neon Strip Color Preset Board */}
          <div className="flex flex-col flex-1 min-h-[40%]">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3 shrink-0">Neon Strip Color</h3>
            <div className="flex-1 bg-slate-950/50 border border-slate-900/80 rounded-3xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
              
              {/* Backglow of selected neon color */}
              {roomState.neon === 'ON' && (
                <div 
                  className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
                  style={{ backgroundColor: roomState.neon_color }}
                />
              )}

              <div className="flex-1 flex flex-col justify-between gap-4">
                
                {/* Presets Grid */}
                <div className="space-y-2">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset}
                        disabled={roomState.neon !== 'ON'}
                        onClick={() => handleNeonColorChange(preset)}
                        className={`h-8 rounded-xl border-2 transition-all active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed flex items-center justify-center ${
                          roomState.neon_color?.toLowerCase() === preset.toLowerCase()
                            ? 'border-white scale-105 shadow-md'
                            : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: preset }}
                      >
                        {roomState.neon_color?.toLowerCase() === preset.toLowerCase() && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Selector */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-900 shrink-0">
                  <span className="text-xs font-bold text-slate-400">Custom Neon Hex</span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{roomState.neon_color}</span>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800 cursor-pointer">
                      <input
                        type="color"
                        value={roomState.neon_color || '#ffffff'}
                        disabled={roomState.neon !== 'ON'}
                        onChange={(e) => handleNeonColorChange(e.target.value)}
                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 disabled:opacity-30 bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </section>

      </div>
    </main>
  );
}
