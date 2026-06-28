'use client';

import React, { useState } from 'react';
import { Thermometer, Cpu, Droplets } from 'lucide-react';

interface ClimateGraphProps {
  realTemp?: number | null;
  realHumidity?: number | null;
}

// Generate beautiful, realistic mock points for the last 24 hours (hourly)
const generateMockData = (currentTemp: number, currentHum: number) => {
  const data = [];
  const now = new Date();
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000);
    const hourStr = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Simulate natural room temp drift (lower at night/morning, higher in afternoon)
    const hour = time.getHours();
    const tempDrift = Math.sin((hour - 8) * Math.PI / 12) * 2;
    const roomTemp = Math.round((currentTemp + tempDrift + Math.sin(i) * 0.4) * 10) / 10;
    
    // Humidity inversely drifts with temperature
    const humDrift = -Math.sin((hour - 8) * Math.PI / 12) * 5;
    const roomHum = Math.round((currentHum + humDrift + Math.cos(i) * 1.5) * 10) / 10;

    // Simulate high-performance PC rig thermals (fluctuates during gaming/compiling loads)
    // Runs hotter in afternoon or during simulated heavy runs
    const loadPhase = Math.sin(i / 1.5) > 0.5 ? 25 : 0;
    const pcTemp = Math.round((42 + tempDrift * 0.5 + loadPhase + Math.sin(i * 2) * 2) * 10) / 10;

    data.push({
      time: hourStr,
      roomTemp,
      roomHum,
      pcTemp,
    });
  }
  return data;
};

export function ClimateGraph({ realTemp = 27.2, realHumidity = 60 }: ClimateGraphProps) {
  const temp = realTemp || 27.2;
  const hum = realHumidity || 60;
  
  const chartData = generateMockData(temp, hum);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // SVG dimensions
  const width = 360;
  const height = 140;
  const paddingLeft = 30;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 20;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Scale calculations helper
  const maxVal = 90; // Hum can reach 90, PC temp can reach 80
  const minVal = 15; // Low temperature around 15

  const getX = (index: number) => paddingLeft + (index / (chartData.length - 1)) * chartWidth;
  const getY = (val: number) => {
    const ratio = (val - minVal) / (maxVal - minVal);
    return paddingTop + chartHeight - ratio * chartHeight;
  };

  // Build SVG path data for Room Temp (Red/Amber), Humidity (Teal), PC Temp (Cyan/Purple)
  const roomTempPoints = chartData.map((d, i) => `${getX(i)},${getY(d.roomTemp)}`).join(' ');
  const roomHumPoints = chartData.map((d, i) => `${getX(i)},${getY(d.roomHum)}`).join(' ');
  const pcTempPoints = chartData.map((d, i) => `${getX(i)},${getY(d.pcTemp)}`).join(' ');

  // Create area fill path below room temp and PC temp
  const roomTempArea = `M ${getX(0)},${getY(minVal)} L ${roomTempPoints} L ${getX(chartData.length - 1)},${getY(minVal)} Z`;
  const pcTempArea = `M ${getX(0)},${getY(minVal)} L ${pcTempPoints} L ${getX(chartData.length - 1)},${getY(minVal)} Z`;

  return (
    <div className="w-full max-w-[380px] bg-slate-950/75 border border-slate-800/80 backdrop-blur-md rounded-2xl p-4 md:p-5 shadow-2xl z-20 flex flex-col gap-3 font-sans select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-2">
        <div className="flex items-center gap-2">
          <Thermometer className="w-4 h-4 text-red-500" />
          <h3 className="text-xs font-black tracking-widest text-slate-300 uppercase">
            ENVIRONMENT & THERMALS
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[9px] font-mono font-bold text-slate-500">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> ROOM
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> RIG
          </div>
        </div>
      </div>

      {/* Realtime Badges */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col p-2 bg-slate-950/50 border border-slate-900 rounded-xl">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
            <Thermometer className="w-3 h-3 text-amber-500" /> Room Temp
          </div>
          <span className="text-sm font-black text-slate-200 mt-0.5">{temp}°C</span>
        </div>
        <div className="flex flex-col p-2 bg-slate-950/50 border border-slate-900 rounded-xl">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
            <Droplets className="w-3 h-3 text-teal-400" /> Humidity
          </div>
          <span className="text-sm font-black text-slate-200 mt-0.5">{hum}%</span>
        </div>
        <div className="flex flex-col p-2 bg-slate-950/50 border border-slate-900 rounded-xl">
          <div className="flex items-center gap-1 text-[9px] font-mono text-slate-500 uppercase">
            <Cpu className="w-3 h-3 text-cyan-400" /> PC Thermals
          </div>
          <span className="text-sm font-black text-slate-200 mt-0.5">
            {chartData[chartData.length - 1].pcTemp}°C
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative h-[140px] w-full mt-1">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            {/* Glow filters for spidery cyber effect */}
            <filter id="glow-room" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" floodOpacity="0.6"/>
            </filter>
            <filter id="glow-pc" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#06b6d4" floodOpacity="0.6"/>
            </filter>
            <linearGradient id="roomGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="pcGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingLeft} y1={getY(25)} x2={width - paddingRight} y2={getY(25)} stroke="#0f172a" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={getY(50)} x2={width - paddingRight} y2={getY(50)} stroke="#0f172a" strokeWidth="0.8" strokeDasharray="3 3" />
          <line x1={paddingLeft} y1={getY(75)} x2={width - paddingRight} y2={getY(75)} stroke="#0f172a" strokeWidth="0.8" strokeDasharray="3 3" />

          {/* Y Axis labels */}
          <text x={paddingLeft - 8} y={getY(25) + 3} fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">25°</text>
          <text x={paddingLeft - 8} y={getY(50) + 3} fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">50°</text>
          <text x={paddingLeft - 8} y={getY(75) + 3} fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">75°</text>

          {/* Area Gradients */}
          <path d={roomTempArea} fill="url(#roomGrad)" />
          <path d={pcTempArea} fill="url(#pcGrad)" />

          {/* Lines */}
          <polyline fill="none" stroke="#f59e0b" strokeWidth="2.2" points={roomTempPoints} filter="url(#glow-room)" strokeLinecap="round" strokeLinejoin="round" />
          <polyline fill="none" stroke="#0ea5e9" strokeWidth="1.8" points={roomHumPoints} strokeDasharray="2 3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
          <polyline fill="none" stroke="#06b6d4" strokeWidth="2.2" points={pcTempPoints} filter="url(#glow-pc)" strokeLinecap="round" strokeLinejoin="round" />

          {/* X Axis Timeline Labels (Midnight, Noon, Now) */}
          <text x={paddingLeft} y={height - 2} fill="#475569" fontSize="8" fontFamily="monospace">24h ago</text>
          <text x={paddingLeft + chartWidth / 2} y={height - 2} fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="middle">12h ago</text>
          <text x={width - paddingRight} y={height - 2} fill="#475569" fontSize="8" fontFamily="monospace" textAnchor="end">Now</text>

          {/* Hover interactive vertical line */}
          {hoverIndex !== null && (
            <>
              <line 
                x1={getX(hoverIndex)} 
                y1={paddingTop} 
                x2={getX(hoverIndex)} 
                y2={paddingTop + chartHeight} 
                stroke="#1e293b" 
                strokeWidth="1.5" 
              />
              <circle cx={getX(hoverIndex)} cy={getY(chartData[hoverIndex].roomTemp)} r="4" fill="#f59e0b" stroke="#090d16" strokeWidth="1.5" />
              <circle cx={getX(hoverIndex)} cy={getY(chartData[hoverIndex].pcTemp)} r="4" fill="#06b6d4" stroke="#090d16" strokeWidth="1.5" />
            </>
          )}

          {/* Invisible interactive overlay bars for hovering */}
          {chartData.map((d, i) => (
            <rect
              key={i}
              x={getX(i) - chartWidth / (chartData.length * 2)}
              y={paddingTop}
              width={chartWidth / chartData.length}
              height={chartHeight}
              fill="transparent"
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-crosshair"
            />
          ))}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoverIndex !== null && (
          <div 
            className="absolute bg-slate-950/95 border border-slate-800 rounded-xl p-2 text-[9px] font-mono text-slate-300 shadow-2xl flex flex-col gap-1 pointer-events-none z-50 transition-all duration-150"
            style={{ 
              left: `${(hoverIndex / (chartData.length - 1)) * 72 + 8}%`, 
              top: '-20px' 
            }}
          >
            <div className="text-slate-500 font-bold border-b border-slate-900 pb-0.5">{chartData[hoverIndex].time}</div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-amber-500 font-semibold">Room:</span>
              <span>{chartData[hoverIndex].roomTemp}°C</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-teal-400 font-semibold">Humid:</span>
              <span>{chartData[hoverIndex].roomHum}%</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-cyan-400 font-semibold">Rig:</span>
              <span>{chartData[hoverIndex].pcTemp}°C</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
