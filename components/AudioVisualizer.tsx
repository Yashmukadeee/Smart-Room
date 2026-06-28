'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  analyser: AnalyserNode | null;
}

export function AudioVisualizer({ analyser }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing and scale for Retina displays
    const handleResize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Clear with very slight transparency to leave a small trails effect
      ctx.fillStyle = 'rgba(4, 7, 13, 0.2)'; 
      ctx.fillRect(0, 0, width, height);

      if (!analyser) {
        // Draw static subtle pulsing ring when idle
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(width, height) * 0.28;
        const pulse = Math.sin(Date.now() / 600) * 3;
        const radius = Math.max(1, baseRadius + pulse); // guard against negative

        ctx.shadowBlur = 15 + Math.abs(pulse);
        ctx.shadowColor = 'rgba(239, 68, 68, 0.25)';
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();

        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteFrequencyData(dataArray);

      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) * 0.32; // Circle size slightly larger than avatar

      // Draw background ring glow
      ctx.shadowBlur = 20;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.3)';
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Loop through frequency bins and draw radial spikes
      for (let i = 0; i < bufferLength; i++) {
        // Skip higher frequencies that might be empty or silent
        if (i > bufferLength * 0.85) continue;

        const value = dataArray[i];
        const percent = value / 255;
        
        // Double-ended symmetric circle (draw both left and right sides)
        const angle = (i / (bufferLength * 0.85)) * Math.PI;
        
        // Render left and right symmetry
        [-angle - Math.PI / 2, angle - Math.PI / 2].forEach((renderAngle) => {
          const barHeight = percent * 65; // Max height of neon spikes
          if (barHeight <= 1) return;

          const startX = centerX + Math.cos(renderAngle) * radius;
          const startY = centerY + Math.sin(renderAngle) * radius;
          const endX = centerX + Math.cos(renderAngle) * (radius + barHeight);
          const endY = centerY + Math.sin(renderAngle) * (radius + barHeight);

          // Neon red (inside) fading to electric cyan (outside spikes)
          const grad = ctx.createLinearGradient(startX, startY, endX, endY);
          grad.addColorStop(0, '#dc2626'); // Spidey Red
          grad.addColorStop(0.5, '#7c3aed'); // Thoughtful Purple
          grad.addColorStop(1, '#06b6d4'); // Electric Cyan

          ctx.strokeStyle = grad;
          ctx.shadowColor = percent > 0.5 ? '#06b6d4' : '#ef4444';
          ctx.shadowBlur = 8 + percent * 18;
          ctx.lineWidth = 2 + percent * 2.5;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        });
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [analyser]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}
