'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogOut, Lightbulb, Fan,
  Lock, Unlock, Zap, Sparkles, RefreshCw,
  Palette, Power
} from 'lucide-react';

/* ─── Types ─────────────────────────────────── */
interface Device {
  id: string; name: string; category: string;
  status: boolean; value: number; color: string;
  room: string; updated_at: string;
}


/* ─── Ripple Hook ────────────────────────────── */
function useRipple() {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  const trigger = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const id = Date.now();
    setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
  }, []);
  return { ripples, trigger };
}

/* ─── Device Tile Component ─────────────────── */
function DeviceTile({ device, onToggle }: { device: Device; onToggle: (id: string, s: boolean) => void }) {
  const { ripples, trigger } = useRipple();
  const isOn = device.status;
  const isFan = device.id === 'esp32_relay_4';
  const isRgb = device.id === 'esp32_rgb_1';

  const Icon = (() => {
    if (isFan) return Fan;
    if (isRgb) return Palette;
    if (device.id === 'esp32_relay_5' || device.id === 'esp32_relay_6') return Sparkles;
    return Lightbulb;
  })();

  const rgbColor = isRgb && isOn ? device.color : undefined;

  return (
    <motion.div
      whileHover={{ scale: 1.025, y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={(e) => { trigger(e); onToggle(device.id, device.status); }}
      className={`
        relative overflow-hidden cursor-pointer rounded-2xl flex flex-col items-center justify-center gap-3 p-4
        select-none transition-all duration-300
        ${isOn
          ? 'bg-[#00D4FF]/[0.07] border-2 border-[#00D4FF]/60 shadow-[0_0_24px_rgba(0,212,255,0.2),inset_0_0_20px_rgba(0,212,255,0.04)]'
          : 'bg-[#0D1117] border-2 border-white/[0.07] hover:border-white/[0.15]'
        }
      `}
      style={isOn && rgbColor ? {
        borderColor: rgbColor + '99',
        boxShadow: `0 0 24px ${rgbColor}33, inset 0 0 20px ${rgbColor}0a`
      } : {}}
    >
      {/* Ripple */}
      {ripples.map(r => (
        <motion.span
          key={r.id}
          initial={{ scale: 0, opacity: 0.7 }}
          animate={{ scale: 5, opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="absolute rounded-full w-16 h-16 pointer-events-none"
          style={{
            left: r.x - 32, top: r.y - 32,
            backgroundColor: rgbColor || 'rgba(0,212,255,0.35)'
          }}
        />
      ))}

      {/* Breathing glow overlay when ON */}
      {isOn && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{ opacity: [0.03, 0.09, 0.03] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: rgbColor ? `radial-gradient(ellipse at 50% 0%, ${rgbColor} 0%, transparent 70%)` : 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.6) 0%, transparent 70%)' }}
        />
      )}

      {/* Status dot */}
      <div className="absolute top-3 right-3">
        <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${isOn ? 'shadow-[0_0_8px_currentColor]' : 'bg-slate-700'}`}
          style={isOn ? { backgroundColor: rgbColor || '#00D4FF', boxShadow: `0 0 8px ${rgbColor || '#00D4FF'}` } : {}}
        />
      </div>

      {/* ACTIVE badge */}
      <AnimatePresence>
        {isOn && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.8 }}
            className="absolute top-2.5 left-3"
          >
            <span className="text-[8px] font-black uppercase tracking-[0.2em] font-mono px-1.5 py-0.5 rounded"
              style={{ color: rgbColor || '#00D4FF', backgroundColor: (rgbColor || '#00D4FF') + '20' }}>
              ACTIVE
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon */}
      <motion.div animate={{ scale: isOn ? 1.1 : 1 }} transition={{ duration: 0.3 }}>
        <Icon
          className="transition-all duration-300"
          style={{
            width: 36, height: 36,
            color: isOn ? (rgbColor || '#00D4FF') : '#475569',
            filter: isOn ? `drop-shadow(0 0 8px ${rgbColor || '#00D4FF'})` : 'none',
            animation: isFan && isOn ? 'fan-spin 1.5s linear infinite' : 'none'
          }}
        />
      </motion.div>

      {/* Name */}
      <div className="text-center">
        <p className={`text-sm font-bold uppercase tracking-wider leading-tight transition-colors duration-300 ${isOn ? 'text-white' : 'text-slate-500'}`}>
          {device.name}
        </p>
      </div>
    </motion.div>
  );
}

/* ─── Main Dashboard ─────────────────────────── */
export default function DashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [devices, setDevices] = useState<Device[]>([]);
  const [climate, setClimate] = useState<{ temp: number | null; hum: number | null }>({ temp: null, hum: null });
  const [loading, setLoading] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Just now');
  const [espStatus, setEspStatus] = useState<'Online' | 'Offline'>('Offline');
  const lastRecordedAtRef = useRef<string | null>(null);
  const [activeScene, setActiveScene] = useState<string | null>(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh(); router.push('/login');
  };

  const updateSyncTimestamp = () => {
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const evaluateEspStatus = useCallback(() => {
    if (!lastRecordedAtRef.current) { setEspStatus('Offline'); return; }
    const diff = (Date.now() - new Date(lastRecordedAtRef.current).getTime()) / 1000;
    setEspStatus(diff < 75 ? 'Online' : 'Offline');
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: devData } = await supabase.from('devices').select('*').order('id', { ascending: true });
      if (devData) setDevices(devData.filter(d => d.id !== 'current_active_scene') as Device[]);

      const { data: climateLogs } = await supabase
        .from('sensor_log').select('temp_c, humidity, recorded_at')
        .order('recorded_at', { ascending: false }).limit(1);
      if (climateLogs?.length) {
        setClimate({ temp: Number(climateLogs[0].temp_c), hum: Number(climateLogs[0].humidity) });
        lastRecordedAtRef.current = climateLogs[0].recorded_at;
        evaluateEspStatus();
      }
      updateSyncTimestamp();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [supabase, evaluateEspStatus]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(evaluateEspStatus, 10000);
    const devCh = supabase.channel('dash-dev-v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, (p) => {
        updateSyncTimestamp();
        if (p.eventType === 'UPDATE') { const u = p.new as Device; if (u.id !== 'current_active_scene') setDevices(prev => prev.map(d => d.id === u.id ? u : d)); }
        else if (p.eventType === 'INSERT') { const n = p.new as Device; if (n.id !== 'current_active_scene') setDevices(prev => [...prev, n].sort((a, b) => a.id.localeCompare(b.id))); }
        else if (p.eventType === 'DELETE') setDevices(prev => prev.filter(d => d.id !== p.old.id));
      }).subscribe();
    const climateCh = supabase.channel('dash-climate-v3')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sensor_log' }, (p) => {
        updateSyncTimestamp();
        const l = p.new as { temp_c: number; humidity: number; recorded_at: string };
        setClimate({ temp: Number(l.temp_c), hum: Number(l.humidity) });
        lastRecordedAtRef.current = l.recorded_at; setEspStatus('Online');
      }).subscribe();
    return () => { clearInterval(timer); supabase.removeChannel(devCh); supabase.removeChannel(climateCh); };
  }, [supabase, fetchData, evaluateEspStatus]);

  const toggleDevice = async (id: string, cur: boolean) => {
    const next = !cur;
    setDevices(prev => prev.map(d => d.id === id ? { ...d, status: next } : d));
    setActiveScene(null);
    try {
      const { error } = await supabase.from('devices').update({ status: next, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    } catch { setDevices(prev => prev.map(d => d.id === id ? { ...d, status: cur } : d)); }
  };

  const handleAcUpdate = async (power: boolean, temp: number) => {
    setActiveScene(null);
    setDevices(prev => prev.map(d => d.id === 'esp32_relay_3' ? { ...d, status: power, value: temp } : d));
    try { await supabase.from('devices').update({ status: power, value: temp, updated_at: new Date().toISOString() }).eq('id', 'esp32_relay_3'); } catch { fetchData(); }
  };

  const handleAcModeUpdate = async (mode: string) => {
    setActiveScene(null);
    setDevices(prev => prev.map(d => d.id === 'esp32_relay_3' ? { ...d, color: mode } : d));
    try { await supabase.from('devices').update({ color: mode, updated_at: new Date().toISOString() }).eq('id', 'esp32_relay_3'); } catch { fetchData(); }
  };

  const handleRgbColorUpdate = async (color: string) => {
    setActiveScene(null);
    setDevices(prev => prev.map(d => d.id === 'esp32_rgb_1' ? { ...d, color, status: true } : d));
    try { await supabase.from('devices').update({ color, status: true, updated_at: new Date().toISOString() }).eq('id', 'esp32_rgb_1'); } catch { fetchData(); }
  };

  const handleRgbBrightnessUpdate = async (brightness: number) => {
    setActiveScene(null);
    setDevices(prev => prev.map(d => d.id === 'esp32_rgb_1' ? { ...d, value: brightness } : d));
    try { await supabase.from('devices').update({ value: brightness, updated_at: new Date().toISOString() }).eq('id', 'esp32_rgb_1'); } catch { fetchData(); }
  };

  const activateScene = async (sceneId: string) => {
    setActiveScene(sceneId);
    const updated = devices.map(d => {
      const dev = { ...d, updated_at: new Date().toISOString() };
      if (sceneId === 'all_off') {
        if (d.id.startsWith('esp32_relay') || d.id === 'esp32_rgb_1') dev.status = false;
      } else if (sceneId === 'sleep') {
        // Sleep: Fan ON, AC 24° cool, everything else OFF
        if (d.id === 'esp32_relay_1') dev.status = false;
        if (d.id === 'esp32_relay_4') dev.status = true;
        if (d.id === 'esp32_relay_6') dev.status = false;
        if (d.id === 'esp32_relay_5') dev.status = false;
        if (d.id === 'esp32_relay_2') dev.status = false;
        if (d.id === 'esp32_rgb_1') dev.status = false;
        if (d.id === 'esp32_relay_3') { dev.status = true; dev.value = 24; dev.color = 'cool'; }
      } else if (sceneId === 'movie') {
        // Movie: Fan ON, RGB purple, AC 23° cool, rest OFF
        if (d.id === 'esp32_relay_1') dev.status = false;
        if (d.id === 'esp32_relay_4') dev.status = true;
        if (d.id === 'esp32_relay_6') dev.status = false;
        if (d.id === 'esp32_relay_5') dev.status = false;
        if (d.id === 'esp32_relay_2') dev.status = false;
        if (d.id === 'esp32_rgb_1') { dev.status = true; dev.color = '#8b5cf6'; dev.value = 100; }
        if (d.id === 'esp32_relay_3') { dev.status = true; dev.value = 23; dev.color = 'cool'; }
      } else if (sceneId === 'focus') {
        // Focus: Main Light + Desk LED ON, AC 22° cool, rest OFF
        if (d.id === 'esp32_relay_1') dev.status = true;
        if (d.id === 'esp32_relay_2') dev.status = true;
        if (d.id === 'esp32_relay_4') dev.status = false;
        if (d.id === 'esp32_relay_6') dev.status = false;
        if (d.id === 'esp32_relay_5') dev.status = false;
        if (d.id === 'esp32_rgb_1') dev.status = false;
        if (d.id === 'esp32_relay_3') { dev.status = true; dev.value = 22; dev.color = 'cool'; }
      } else if (sceneId === 'morning') {
        // Morning: All lights ON, Fan ON, AC OFF
        if (d.id === 'esp32_relay_1') dev.status = true;
        if (d.id === 'esp32_relay_2') dev.status = true;
        if (d.id === 'esp32_relay_4') dev.status = true;
        if (d.id === 'esp32_relay_5') dev.status = true;
        if (d.id === 'esp32_relay_6') dev.status = true;
        if (d.id === 'esp32_rgb_1') { dev.status = true; dev.color = '#ffffff'; dev.value = 80; }
        if (d.id === 'esp32_relay_3') dev.status = false;
      } else if (sceneId === 'gaming') {
        // Gaming: RGB red, Desk LED ON, Fan ON, AC 21° cool, main light OFF
        if (d.id === 'esp32_relay_1') dev.status = false;
        if (d.id === 'esp32_relay_2') dev.status = true;
        if (d.id === 'esp32_relay_4') dev.status = true;
        if (d.id === 'esp32_relay_5') dev.status = true;
        if (d.id === 'esp32_relay_6') dev.status = false;
        if (d.id === 'esp32_rgb_1') { dev.status = true; dev.color = '#ff0055'; dev.value = 100; }
        if (d.id === 'esp32_relay_3') { dev.status = true; dev.value = 21; dev.color = 'cool'; }
      } else if (sceneId === 'relax') {
        // Relax: Warm RGB amber, Decor lights ON, Fan ON, AC 26°
        if (d.id === 'esp32_relay_1') dev.status = false;
        if (d.id === 'esp32_relay_2') dev.status = false;
        if (d.id === 'esp32_relay_4') dev.status = true;
        if (d.id === 'esp32_relay_5') dev.status = true;
        if (d.id === 'esp32_relay_6') dev.status = true;
        if (d.id === 'esp32_rgb_1') { dev.status = true; dev.color = '#ff6600'; dev.value = 60; }
        if (d.id === 'esp32_relay_3') { dev.status = true; dev.value = 26; dev.color = 'auto'; }
      } else if (sceneId === 'party') {
        // Party: Everything ON, RGB green, no AC
        if (d.id === 'esp32_relay_1') dev.status = true;
        if (d.id === 'esp32_relay_2') dev.status = true;
        if (d.id === 'esp32_relay_4') dev.status = true;
        if (d.id === 'esp32_relay_5') dev.status = true;
        if (d.id === 'esp32_relay_6') dev.status = true;
        if (d.id === 'esp32_rgb_1') { dev.status = true; dev.color = '#00ff66'; dev.value = 100; }
        if (d.id === 'esp32_relay_3') dev.status = false;
      }
      return dev;
    });
    setDevices(updated);
    try { await Promise.all(updated.map(d => supabase.from('devices').update({ status: d.status, value: d.value, color: d.color, updated_at: d.updated_at }).eq('id', d.id))); } catch { fetchData(); }
  };

  /* ── Derived state ── */
  const isDoorOpen = devices.find(d => d.id === 'esp32_door_sensor')?.status ?? false;
  const acDevice = devices.find(d => d.id === 'esp32_relay_3');
  const acPower = acDevice?.status ?? false;
  const acTemp = acDevice?.value ?? 22;
  const acMode = acDevice?.color || 'cool';
  const rgbDevice = devices.find(d => d.id === 'esp32_rgb_1');
  const tileOrder = ['esp32_relay_1', 'esp32_relay_4', 'esp32_rgb_1', 'esp32_relay_5', 'esp32_relay_6', 'esp32_relay_2'];
  const tileDev = tileOrder.map(id => devices.find(d => d.id === id)).filter(Boolean) as Device[];
  const colorPresets = [
    { name: 'Red', hex: '#ff0055' }, { name: 'Green', hex: '#00ff66' },
    { name: 'Blue', hex: '#0088ff' }, { name: 'Purple', hex: '#8b5cf6' },
    { name: 'Yellow', hex: '#eab308' }, { name: 'White', hex: '#ffffff' }
  ];

  return (
    <main className="h-screen w-screen bg-[#090B10] text-slate-100 flex flex-col overflow-hidden relative select-none"
      style={{ fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif" }}>

      {/* ═══════════════════ AMBIENT BACKGROUND ═══════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        {/* Noise grain */}
        <div className="absolute inset-0 noise-overlay opacity-[0.025]" />
        {/* Corner glows */}
        <div className="ambient-glow absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.12) 0%, transparent 65%)' }} />
        <div className="ambient-glow absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 65%)', animationDelay: '4s' }} />
        <div className="ambient-glow absolute top-10 right-0 w-80 h-80 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(80,40,200,0.06) 0%, transparent 65%)', animationDelay: '2s' }} />
        {/* Scan line */}
        <div className="scan-line absolute left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(0,212,255,0.35) 30%, rgba(0,212,255,0.6) 50%, rgba(0,212,255,0.35) 70%, transparent 100%)' }} />
        {/* Particles */}
        {[...Array(10)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2,
              backgroundColor: 'rgba(0,212,255,0.5)',
              left: `${8 + i * 9}%`, bottom: `${12 + (i % 4) * 15}%`,
              animation: `particle-float ${7 + i * 0.7}s ease-in-out infinite`,
              animationDelay: `${i * 0.8}s`
            }}
          />
        ))}
      </div>

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="relative z-10 flex items-center justify-between px-6 py-3 border-b border-slate-800/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full bg-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
          <div>
            <h1 className="text-sm font-black uppercase tracking-[0.2em] text-white">Smart Room Kiosk</h1>
            <p className="text-[9px] font-mono text-[#00D4FF]/60 tracking-widest mt-0.5">ESP32 CONNECTED · MASTER BEDROOM</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest border transition-all ${isDoorOpen ? 'border-red-500/50 text-red-400 bg-red-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'}`}>
            {isDoorOpen ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
            {isDoorOpen ? 'Unsecured' : 'Secure'}
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-700 hover:border-[#00D4FF]/50 hover:text-[#00D4FF] text-[9px] font-mono font-bold uppercase tracking-wider transition cursor-pointer text-slate-400">
            <LogOut className="w-3 h-3" />Logout
          </button>
        </div>
      </header>

      {/* ═══════════════════ LOADING ═══════════════════ */}
      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 z-10">
          <RefreshCw className="w-8 h-8 text-[#00D4FF] animate-spin" />
          <p className="text-xs font-mono text-[#8A94A6] tracking-[0.3em] uppercase">Connecting Smart Room…</p>
        </div>
      ) : (
        /* ═══════════════════ MAIN GRID ═══════════════════ */
        <div className="flex-1 min-h-0 grid grid-cols-12 gap-4 px-5 py-4 z-10 overflow-hidden">

          {/* ══════ LEFT SIDEBAR (col 1–3) ══════ */}
          <aside className="col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden">

            {/* Climate Card */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
              className="bg-[#0D1117]/90 border border-slate-800/60 rounded-2xl p-5 shrink-0 backdrop-blur-sm">
              <p className="text-[8px] font-mono font-black uppercase tracking-[0.25em] text-[#00D4FF]/70 mb-4">CLIMATE</p>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-[8px] font-mono text-slate-600 mb-1 uppercase">🌡 Temp</p>
                  <p className="text-3xl font-black text-white leading-none tabular-nums">
                    {climate.temp !== null ? `${Math.round(climate.temp)}°` : '--'}
                  </p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">Celsius</p>
                </div>
                <div>
                  <p className="text-[8px] font-mono text-slate-600 mb-1 uppercase">💧 Hum</p>
                  <p className="text-3xl font-black text-white leading-none tabular-nums">
                    {climate.hum !== null ? `${Math.round(climate.hum)}%` : '--'}
                  </p>
                  <p className="text-[9px] font-mono text-slate-600 mt-0.5">Relative</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-800/60 pt-3">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${espStatus === 'Online' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse' : 'bg-red-500'}`} />
                  <span className={`text-[9px] font-mono font-bold uppercase ${espStatus === 'Online' ? 'text-emerald-400' : 'text-red-400'}`}>{espStatus}</span>
                </div>
                <span className="text-[8px] font-mono text-slate-600">{lastSyncTime}</span>
              </div>
            </motion.div>

            {/* Scene Buttons — 8 modes in 2×4 grid */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="flex flex-col gap-2 flex-1 min-h-0">
              <p className="text-[8px] font-mono font-black uppercase tracking-[0.25em] text-slate-600 px-0.5">SCENES</p>
              <div className="grid grid-cols-2 gap-2.5 flex-1">
                {[
                  { id: 'sleep',   emoji: '🌙', name: 'Sleep',   sub: 'Fan · AC 24°',      color: '#4f6ef7' },
                  { id: 'movie',   emoji: '🎬', name: 'Movie',   sub: 'RGB · AC 23°',      color: '#8b5cf6' },
                  { id: 'focus',   emoji: '📚', name: 'Focus',   sub: 'Desk · AC 22°',     color: '#00D4FF' },
                  { id: 'morning', emoji: '🌅', name: 'Morning', sub: 'All lights · Fan',   color: '#f59e0b' },
                  { id: 'gaming',  emoji: '🎮', name: 'Gaming',  sub: 'RGB Red · AC 21°',  color: '#ef4444' },
                  { id: 'relax',   emoji: '🛋️', name: 'Relax',   sub: 'Warm RGB · AC 26°', color: '#f97316' },
                  { id: 'party',   emoji: '🎉', name: 'Party',   sub: 'All ON · RGB Green', color: '#22c55e' },
                  { id: 'all_off', emoji: '⚫', name: 'All Off', sub: 'Power everything down', color: '#475569' }
                ].map((s, i) => {
                  const active = activeScene === s.id;
                  return (
                    <motion.div key={s.id}
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.12 + i * 0.04 }}
                      whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.96 }}
                      onClick={() => activateScene(s.id)}
                      className={`p-3.5 rounded-xl cursor-pointer border flex flex-col gap-1.5 transition-all duration-200 relative overflow-hidden ${
                        active
                          ? 'border-opacity-60 shadow-lg'
                          : 'bg-[#0D1117] border-slate-800/60 hover:border-slate-700'
                      }`}
                      style={active ? {
                        backgroundColor: s.color + '12',
                        borderColor: s.color + '80',
                        boxShadow: `0 0 16px ${s.color}25`
                      } : {}}
                    >
                      {/* Subtle bg glow when active */}
                      {active && (
                        <div className="absolute inset-0 rounded-xl pointer-events-none"
                          style={{ background: `radial-gradient(ellipse at 50% 0%, ${s.color}18 0%, transparent 70%)` }} />
                      )}
                      <span className="text-xl leading-none">{s.emoji}</span>
                      <div>
                        <p className="text-sm font-bold transition-colors" style={{ color: active ? s.color : 'white' }}>{s.name}</p>
                        <p className="text-[8px] font-mono text-slate-600 mt-0.5 leading-tight">{s.sub}</p>
                      </div>
                      {active && <div className="w-8 h-0.5 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}` }} />}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </aside>

          {/* ══════ RIGHT MAIN AREA (col 4–12) ══════ */}
          <section className="col-span-9 flex flex-col gap-4 min-h-0 overflow-hidden">

            {/* ── Device Tile Grid 2×3 ─────────────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="shrink-0">
              <p className="text-[8px] font-mono font-black uppercase tracking-[0.25em] text-slate-600 mb-3">DEVICE CONTROL</p>
              <div className="grid grid-cols-3 grid-rows-2 gap-3" style={{ height: 280 }}>
                {tileDev.map((device, i) => (
                  <motion.div key={device.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 + i * 0.05 }} className="h-full">
                    <DeviceTile device={device} onToggle={toggleDevice} />
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* ── RGB + AC Row ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0 overflow-hidden">

              {/* RGB Panel */}
              {rgbDevice && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                  className={`bg-[#0D1117]/90 backdrop-blur-sm border rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden transition-all duration-300 ${rgbDevice.status ? 'border-[#00D4FF]/30 shadow-[0_0_20px_rgba(0,212,255,0.08)]' : 'border-slate-800/60'}`}
                  style={rgbDevice.status && rgbDevice.color ? { borderColor: rgbDevice.color + '55' } : {}}>
                  {/* Color glow backplate */}
                  {rgbDevice.status && (
                    <motion.div className="absolute -right-12 -top-12 w-52 h-52 rounded-full blur-3xl pointer-events-none"
                      animate={{ opacity: [0.08, 0.18, 0.08] }} transition={{ duration: 4, repeat: Infinity }}
                      style={{ backgroundColor: rgbDevice.color || '#00D4FF' }} />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Palette className="w-4 h-4" style={{ color: rgbDevice.status ? (rgbDevice.color || '#00D4FF') : '#475569' }} />
                      <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">🌈 RGB MOOD LIGHT</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* HEX badge */}
                      <div className="flex items-center gap-2 bg-slate-900/70 border border-slate-800/60 rounded-lg px-3 py-1">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: rgbDevice.status ? rgbDevice.color : '#1e293b' }} />
                        <span className="text-[9px] font-mono font-bold text-white uppercase">{rgbDevice.status ? (rgbDevice.color || 'N/A') : 'OFF'}</span>
                      </div>
                      {/* Color picker */}
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-700 cursor-pointer hover:border-slate-500 transition">
                        <input type="color" disabled={!rgbDevice.status}
                          value={rgbDevice.color?.startsWith('#') ? rgbDevice.color : '#ffffff'}
                          onChange={e => handleRgbColorUpdate(e.target.value)}
                          className="absolute -inset-2 w-14 h-14 cursor-pointer border-none p-0 bg-transparent disabled:opacity-30" />
                      </div>
                    </div>
                  </div>

                  {/* Brightness */}
                  <div>
                    <div className="flex justify-between text-[9px] font-mono text-slate-600 mb-2">
                      <span className="uppercase tracking-wider">Brightness</span>
                      <span className="font-bold text-white">{rgbDevice.value}%</span>
                    </div>
                    <div className="relative h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-200"
                        style={{ width: `${rgbDevice.value}%`, background: rgbDevice.status ? `linear-gradient(90deg, ${rgbDevice.color}88, ${rgbDevice.color})` : '#1e293b' }} />
                    </div>
                    <input type="range" min="0" max="100" disabled={!rgbDevice.status}
                      value={rgbDevice.value}
                      onChange={e => handleRgbBrightnessUpdate(Number(e.target.value))}
                      className="w-full mt-1 h-1 bg-transparent rounded-full appearance-none cursor-pointer opacity-0 absolute"
                      style={{ marginTop: '-12px' }}
                    />
                    <input type="range" min="0" max="100" disabled={!rgbDevice.status}
                      value={rgbDevice.value}
                      onChange={e => handleRgbBrightnessUpdate(Number(e.target.value))}
                      className="w-full h-1 bg-slate-900 rounded-full appearance-none cursor-pointer accent-[#00D4FF] disabled:opacity-30 mt-1"
                    />
                  </div>

                  {/* Color presets */}
                  <div>
                    <p className="text-[8px] font-mono text-slate-600 uppercase tracking-wider mb-2">Quick Colors</p>
                    <div className="flex gap-2.5">
                      {colorPresets.map(cp => {
                        const sel = rgbDevice.color?.toLowerCase() === cp.hex && rgbDevice.status;
                        return (
                          <motion.button key={cp.name} disabled={!rgbDevice.status}
                            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.85 }}
                            onClick={() => handleRgbColorUpdate(cp.hex)}
                            className="w-7 h-7 rounded-full cursor-pointer disabled:opacity-30 transition-all"
                            style={{ backgroundColor: cp.hex, outline: sel ? '2.5px solid white' : '2px solid transparent', outlineOffset: '2px', boxShadow: sel ? `0 0 10px ${cp.hex}` : 'none' }}
                            title={cp.name}
                          />
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AC Panel */}
              {acDevice && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className={`bg-[#0D1117]/90 backdrop-blur-sm border rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300 ${acPower ? 'border-[#00D4FF]/30 shadow-[0_0_20px_rgba(0,212,255,0.08)]' : 'border-slate-800/60'}`}>
                  
                  {/* AC Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className={`w-5 h-5 transition-colors ${acPower ? 'text-[#00D4FF]' : 'text-slate-600'}`} style={acPower ? { filter: 'drop-shadow(0 0 6px rgba(0,212,255,0.8))' } : {}} />
                      <p className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-slate-500">❄ Air Conditioner</p>
                    </div>
                    {/* Power toggle */}
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handleAcUpdate(!acPower, acTemp)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${acPower ? 'bg-[#00D4FF]/15 border-[#00D4FF]/50 text-[#00D4FF] shadow-[0_0_10px_rgba(0,212,255,0.2)]' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {acPower ? 'ON' : 'OFF'}
                    </motion.button>
                  </div>

                  {/* Temperature display */}
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-1">Target Temp</p>
                      <motion.p
                        key={acTemp}
                        initial={{ scale: 0.9, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-5xl font-black tabular-nums leading-none"
                        style={{ color: acPower ? '#00D4FF' : '#475569', textShadow: acPower ? '0 0 20px rgba(0,212,255,0.5)' : 'none' }}
                      >
                        {acTemp}°<span className="text-2xl">C</span>
                      </motion.p>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[{ label: '+', delta: 1 }, { label: '−', delta: -1 }].map(btn => (
                        <motion.button key={btn.label}
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          disabled={!acPower}
                          onClick={() => handleAcUpdate(acPower, btn.delta > 0 ? acTemp + 1 : Math.max(16, acTemp - 1))}
                          className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 text-white text-xl font-bold cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#00D4FF]/40 hover:bg-slate-800 transition flex items-center justify-center"
                        >
                          {btn.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* AC Mode selectors */}
                  <div>
                    <p className="text-[8px] font-mono text-slate-600 uppercase tracking-widest mb-2">AC Mode</p>
                    <div className="grid grid-cols-4 gap-2">
                      {['cool', 'fan', 'dry', 'auto'].map(mode => {
                        const active = acMode.toLowerCase() === mode && acPower;
                        return (
                          <motion.button key={mode}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            disabled={!acPower}
                            onClick={() => handleAcModeUpdate(mode)}
                            className={`py-2.5 rounded-xl text-[10px] font-mono font-black uppercase cursor-pointer transition-all disabled:opacity-30 border ${active ? 'bg-[#00D4FF]/15 border-[#00D4FF]/50 text-[#00D4FF] shadow-[0_0_8px_rgba(0,212,255,0.15)]' : 'bg-slate-900/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'}`}
                          >
                            {mode}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="relative z-10 flex items-center justify-between px-6 py-2 border-t border-slate-800/30 shrink-0">
        <div className="flex gap-6 text-[8px] font-mono text-slate-700">
          <span>TEMP <span className="text-slate-500">{climate.temp !== null ? `${Math.round(climate.temp)}°C` : '--'}</span></span>
          <span>HUM <span className="text-slate-500">{climate.hum !== null ? `${Math.round(climate.hum)}%` : '--'}</span></span>
        </div>
        <span className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">ESP32 · Smart Room v2</span>
      </footer>
    </main>
  );
}
