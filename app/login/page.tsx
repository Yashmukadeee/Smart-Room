'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // PIN login states
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);

  // General error/success states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Listen for auth state changes to handle hash-fragment redirects from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setSuccessMessage('Authenticated successfully! Redirecting...');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 800);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  // Reset messages after a few seconds
  useEffect(() => {
    if (errorMessage) {
      const t = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(t);
    }
  }, [errorMessage]);

  // Handle digit click on the PIN Pad
  const handlePinDigit = (digit: string) => {
    if (pin.length < 6 && !pinLoading) {
      setPin((prev) => prev + digit);
    }
  };

  // Handle backspace or clear on PIN Pad
  const handlePinBackspace = () => {
    if (!pinLoading) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const handlePinClear = () => {
    if (!pinLoading) {
      setPin('');
    }
  };

  // Submit PIN for authentication when it reaches 6 digits
  useEffect(() => {
    const submitPin = async () => {
      setPinLoading(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      try {
        const res = await fetch('/api/auth/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        });

        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error || 'PIN authentication failed');
          setPin('');
        } else if (data.success) {
          setSuccessMessage('PIN Verified! Redirecting to home...');
          setTimeout(() => {
            router.push('/');
            router.refresh();
          }, 800);
        }
      } catch (err: any) {
        setErrorMessage('Failed to connect to authentication server');
        setPin('');
      } finally {
        setPinLoading(false);
      }
    };

    if (pin.length === 6) {
      submitPin();
    }
  }, [pin, router]);

  return (
    <main className="h-dvh w-screen bg-[#04070d] text-slate-100 p-6 md:p-10 font-sans flex flex-col justify-between overflow-hidden relative select-none">
      {/* Halftone Dot Overlay */}
      <div className="absolute inset-0 opacity-[0.035] bg-[radial-gradient(#ef4444_1.5px,transparent_1.5px)] [background-size:20px_20px] pointer-events-none z-0" />

      {/* Ambient background glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-red-950/15 blur-[120px] pointer-events-none z-0" />

      {/* Logo/Header */}
      <header className="z-10 w-full flex items-center justify-between border-b border-slate-900 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-red-950/60 border border-red-500/30">
            <KeyRound className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-100">Smart Room Kiosk</h1>
            <p className="text-[10px] font-mono text-slate-500">SECURE PORTAL ACCESS</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-900">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Kiosk mode</span>
        </div>
      </header>

      {/* Centered Keypad Portal */}
      <div className="flex-1 w-full max-w-md mx-auto flex flex-col items-center justify-center z-10 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">Enter Access PIN</h2>
          <p className="text-xs text-slate-500 mt-1">Tap the 6-digit owner code to authenticate this tablet.</p>
        </div>

        {/* 6-DOT INDICATORS */}
        <div className="flex justify-center gap-4.5 mb-7">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const isActive = pin.length > index;
            return (
              <div key={index} className="relative flex items-center justify-center w-6 h-6">
                {pinLoading && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: index * 0.15 }}
                    className="absolute inset-0 rounded-full bg-red-500/10"
                  />
                )}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 0.8,
                    backgroundColor: isActive ? '#ef4444' : '#1e293b',
                    boxShadow: isActive ? '0 0 15px #ef4444' : 'none',
                  }}
                  className="w-3.5 h-3.5 rounded-full border border-slate-800 transition-all duration-150"
                />
              </div>
            );
          })}
        </div>

        {/* KEYPAD GRID */}
        <div className="grid grid-cols-3 gap-4 w-full max-w-[340px] aspect-[4/5]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handlePinDigit(digit)}
              disabled={pinLoading}
              className="w-full aspect-square rounded-2xl bg-slate-950/60 border border-slate-900 text-slate-200 text-xl font-black flex items-center justify-center shadow-md active:bg-red-950/40 active:border-red-500/50 active:text-red-400 active:scale-95 transition-all duration-75 cursor-pointer disabled:opacity-40"
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handlePinClear}
            disabled={pinLoading || !pin}
            className="w-full aspect-square rounded-2xl bg-slate-950/30 border border-transparent text-slate-500 text-xs font-black uppercase tracking-wider flex items-center justify-center active:text-slate-300 transition-all cursor-pointer disabled:opacity-0"
          >
            Clear
          </button>

          {/* 0 Button */}
          <button
            type="button"
            onClick={() => handlePinDigit('0')}
            disabled={pinLoading}
            className="w-full aspect-square rounded-2xl bg-slate-950/60 border border-slate-900 text-slate-200 text-xl font-black flex items-center justify-center shadow-md active:bg-red-950/40 active:border-red-500/50 active:text-red-400 active:scale-95 transition-all duration-75 cursor-pointer disabled:opacity-40"
          >
            0
          </button>

          {/* Backspace Button */}
          <button
            type="button"
            onClick={handlePinBackspace}
            disabled={pinLoading || !pin}
            className="w-full aspect-square rounded-2xl bg-slate-950/30 border border-transparent text-slate-500 text-xs font-black uppercase tracking-wider flex items-center justify-center active:text-slate-300 transition-all cursor-pointer disabled:opacity-0"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Notifications/Feedback Toast Bar */}
      <footer className="z-10 w-full flex items-center justify-center min-h-[40px] pt-4 border-t border-slate-900">
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs font-mono font-bold text-red-400 bg-red-950/40 border border-red-500/35 px-4 py-2 rounded-xl"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMessage}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/35 px-4 py-2 rounded-xl"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {successMessage}
            </motion.div>
          )}

          {!errorMessage && !successMessage && (
            <p className="text-[10px] font-mono text-slate-600">
              Tablet access is cryptographically restricted.
            </p>
          )}
        </AnimatePresence>
      </footer>
    </main>
  );
}
