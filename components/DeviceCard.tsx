'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, Wind, ThermometerSnowflake, Lock } from 'lucide-react';
import { ApplianceDevice } from '@/lib/supabase';

interface DeviceCardProps {
  device: ApplianceDevice;
  onToggle: (id: string, currentStatus: boolean) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({ device, onToggle }) => {
  const getIcon = () => {
    switch (device.category) {
      case 'light': return <Lightbulb className={`w-6 h-6 ${device.status ? 'text-amber-400' : 'text-slate-500'}`} />;
      case 'ac': return <ThermometerSnowflake className={`w-6 h-6 ${device.status ? 'text-cyan-400' : 'text-slate-500'}`} />;
      case 'fan': return <Wind className={`w-6 h-6 ${device.status ? 'text-emerald-400 animate-spin' : 'text-slate-500'}`} />;
      case 'lock': return <Lock className={`w-6 h-6 ${device.status ? 'text-red-400' : 'text-slate-500'}`} />;
    }
  };

  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between h-40 ${
        device.status 
          ? 'bg-gradient-to-br from-slate-900 via-slate-900 to-red-950/40 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.1)]' 
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`}
      onClick={() => onToggle(device.id, device.status)}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${device.status ? 'bg-slate-800/80 border border-slate-700' : 'bg-slate-950 border border-slate-800'}`}>
          {getIcon()}
        </div>
        <button 
          className={`w-10 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
            device.status ? 'bg-red-600 justify-end' : 'bg-slate-800 justify-start'
          }`}
        >
          <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-md" />
        </button>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{device.room}</p>
        <h3 className="text-base font-bold text-white mt-0.5">{device.name}</h3>
      </div>
    </motion.div>
  );
};
