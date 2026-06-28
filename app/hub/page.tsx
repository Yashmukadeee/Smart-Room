'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, ApplianceDevice } from '@/lib/supabase';
import { DeviceCard } from '@/components/DeviceCard';
import { motion } from 'framer-motion';
import { X, Palette, Sun } from 'lucide-react';

const mockDevices: ApplianceDevice[] = [
  { id: 'esp32_relay_1', name: 'Main Ceiling Lights', category: 'light', status: true, value: 85, room: 'Master Bedroom', updated_at: new Date().toISOString(), color: '#ffffff' },
  { id: 'esp32_relay_2', name: 'Ambient Desk LED', category: 'light', status: false, value: 50, room: 'Master Bedroom', updated_at: new Date().toISOString(), color: '#ffffff' },
  { id: 'esp32_rgb_1', name: 'RGB Mood Lights', category: 'light', status: true, value: 100, room: 'Master Bedroom', updated_at: new Date().toISOString(), color: '#ff007f' },
  { id: 'esp32_relay_3', name: 'Air Conditioner', category: 'ac', status: true, value: 22, room: 'Master Bedroom', updated_at: new Date().toISOString(), color: '#ffffff' },
  { id: 'esp32_relay_4', name: 'Exhaust & Fan', category: 'fan', status: false, value: 3, room: 'Master Bedroom', updated_at: new Date().toISOString(), color: '#ffffff' }
];

export default function ControlHubPage() {
  const [devices, setDevices] = useState<ApplianceDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUsingMock, setIsUsingMock] = useState<boolean>(false);
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

    // 2 second grace period before starting the inactivity countdown
    // Prevents instant redirect on slow-loading tablet browsers
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
    const fetchDevices = async () => {
      try {
        const { data, error } = await supabase.from('devices').select('*').order('name');
        
        if (error || !data || data.length === 0) {
          setDevices(mockDevices);
          setIsUsingMock(true);
        } else {
          setDevices(data as ApplianceDevice[]);
          setIsUsingMock(false);
        }
      } catch (err) {
        setDevices(mockDevices);
        setIsUsingMock(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'devices' },
        (payload) => {
          if (!isUsingMock) {
            setDevices((prev) =>
              prev.map((dev) => (dev.id === payload.new.id ? (payload.new as ApplianceDevice) : dev))
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUsingMock]);

  // Toggle Device handler
  const handleToggleDevice = async (id: string, currentStatus: boolean) => {
    setDevices((prev) =>
      prev.map((dev) => (dev.id === id ? { ...dev, status: !currentStatus } : dev))
    );

    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: !currentStatus })
      });
    } catch (e) {
      console.warn("Failed to update status via API:", e);
    }
  };

  // RGB Color handler
  const handleRgbColorChange = async (id: string, hexColor: string) => {
    setDevices((prev) =>
      prev.map((dev) => (dev.id === id ? { ...dev, color: hexColor } : dev))
    );

    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, color: hexColor })
      });
    } catch (e) {
      console.warn("Failed to update color via API:", e);
    }
  };

  // RGB Brightness handler
  const handleRgbBrightnessChange = async (id: string, brightness: number) => {
    setDevices((prev) =>
      prev.map((dev) => (dev.id === id ? { ...dev, value: brightness } : dev))
    );

    try {
      await fetch('/api/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value: brightness })
      });
    } catch (e) {
      console.warn("Failed to update brightness via API:", e);
    }
  };

  const rgbDevice = devices.find((d) => d.id === 'esp32_rgb_1');
  const otherDevices = devices.filter((d) => d.id !== 'esp32_rgb_1');

  const colorPresets = [
    '#ff0055', '#00ff66', '#0088ff', '#8b5cf6',
    '#eab308', '#06b6d4', '#ff5722', '#ffffff'
  ];

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

      {/* Main Grid Viewport - Fits Tablet Layout */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch pt-8">
        
        {/* Left: General Devices Grid (Span 7) */}
        <section className="lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Connected Appliances</h3>
            <span className="text-[10px] font-mono bg-slate-950/80 px-2 py-0.5 rounded border border-slate-900 text-slate-400">
              {otherDevices.filter(d => d.status).length} ACTIVE
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
                {otherDevices.map((device) => (
                  <DeviceCard key={device.id} device={device} onToggle={handleToggleDevice} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Dedicated RGB Customizer Panel (Span 5) */}
        <section className="lg:col-span-5 flex flex-col">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">RGB Mood Customizer</h3>
          </div>

          <div className="flex-1 bg-slate-950/50 border border-slate-900/80 rounded-3xl p-5 md:p-6 flex flex-col justify-between relative overflow-hidden">
            
            {/* Ambient Backglow of selected color */}
            {rgbDevice?.status && (
              <div 
                className="absolute -right-20 -bottom-20 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none transition-all duration-500"
                style={{ backgroundColor: rgbDevice.color }}
              />
            )}

            {rgbDevice ? (
              <div className="flex-1 flex flex-col justify-between gap-5">
                
                {/* RGB Toggle Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center transition-all shadow-md"
                      style={{ 
                        backgroundColor: rgbDevice.status ? `${rgbDevice.color}15` : '#1e293b15',
                        border: `1.5px solid ${rgbDevice.status ? rgbDevice.color : '#1e293b'}` 
                      }}
                    >
                      <Palette 
                        className="w-5 h-5 transition-colors" 
                        style={{ color: rgbDevice.status ? rgbDevice.color : '#64748b' }} 
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{rgbDevice.name}</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-semibold">{rgbDevice.room}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleDevice(rgbDevice.id, rgbDevice.status)}
                    className={`w-12 h-7 flex items-center rounded-full p-1 duration-300 transition-colors cursor-pointer ${
                      rgbDevice.status ? 'bg-red-600 justify-end' : 'bg-slate-900 border border-slate-800 justify-start'
                    }`}
                  >
                    <motion.div layout className="w-5 h-5 rounded-full bg-white shadow-sm" />
                  </button>
                </div>

                {/* Brightness Dimmer */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5" />
                      Brightness
                    </span>
                    <span>{rgbDevice.value}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rgbDevice.value}
                    disabled={!rgbDevice.status}
                    onChange={(e) => handleRgbBrightnessChange(rgbDevice.id, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Color Palette Presets */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 block">Color Presets</span>
                  <div className="grid grid-cols-4 gap-3">
                    {colorPresets.map((preset) => (
                      <button
                        key={preset}
                        disabled={!rgbDevice.status}
                        onClick={() => handleRgbColorChange(rgbDevice.id, preset)}
                        className={`h-9 rounded-xl border-2 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center ${
                          rgbDevice.color?.toLowerCase() === preset.toLowerCase()
                            ? 'border-white scale-105 shadow-md'
                            : 'border-transparent hover:scale-[1.02]'
                        }`}
                        style={{ backgroundColor: preset }}
                      >
                        {rgbDevice.color?.toLowerCase() === preset.toLowerCase() && (
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Color Selector */}
                <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-900 shrink-0">
                  <span className="text-xs font-bold text-slate-400">Custom Hex Code</span>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">{rgbDevice.color}</span>
                    <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-800 cursor-pointer">
                      <input
                        type="color"
                        value={rgbDevice.color || '#ffffff'}
                        disabled={!rgbDevice.status}
                        onChange={(e) => handleRgbColorChange(rgbDevice.id, e.target.value)}
                        className="absolute inset-0 w-full h-full scale-150 cursor-pointer opacity-100 disabled:opacity-30 bg-transparent border-0 p-0"
                      />
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-xs text-slate-500 italic">
                Initializing RGB Customizer...
              </div>
            )}
          </div>
        </section>

      </div>
    </main>
  );
}
