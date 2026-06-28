import { useEffect, useRef, useState, useCallback } from 'react';

export interface AudioSyncResult {
  volume: number; // Normalized 0.0 to 1.0
  bass: number;   // Bass level 0.0 to 1.0
  mid: number;    // Mid level 0.0 to 1.0
  treble: number; // Treble level 0.0 to 1.0
  analyser: AnalyserNode | null;
  isSpeaking: boolean;
  isAudioLocked: boolean;
  startAudioListener: () => Promise<void>;
  stopAudioListener: () => void;
}

export function useWebAudioSync(threshold = 0.12, smoothing = 0.8): AudioSyncResult {
  const [volume, setVolume] = useState<number>(0);
  const [bass, setBass] = useState<number>(0);
  const [mid, setMid] = useState<number>(0);
  const [treble, setTreble] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isAudioLocked, setIsAudioLocked] = useState<boolean>(true);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const currentVolRef = useRef<number>(0);

  const analyzeAudio = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // RMS calculation focused on vocal frequencies (bins 4 to 32)
    let sum = 0;
    for (let i = 4; i < 35; i++) {
      sum += dataArray[i] * dataArray[i];
    }
    const rms = Math.sqrt(sum / 30) / 255;

    // Linear Interpolation (LERP) for smooth mouth flaps
    currentVolRef.current = currentVolRef.current * smoothing + rms * (1 - smoothing);
    
    const finalVolume = Number(currentVolRef.current.toFixed(3));
    setVolume(finalVolume);
    setIsSpeaking(finalVolume > threshold);

    // Calculate Bass (bins 0-6)
    let bassSum = 0;
    for (let i = 0; i <= 6; i++) {
      bassSum += dataArray[i];
    }
    const rawBass = (bassSum / 7) / 255;
    
    // Calculate Mid (bins 7-35)
    let midSum = 0;
    for (let i = 7; i <= 35; i++) {
      midSum += dataArray[i];
    }
    const rawMid = (midSum / 29) / 255;

    // Calculate Treble (bins 36-100)
    let trebleSum = 0;
    for (let i = 36; i <= 100; i++) {
      trebleSum += dataArray[i];
    }
    const rawTreble = (trebleSum / 65) / 255;

    setBass(Number(rawBass.toFixed(3)));
    setMid(Number(rawMid.toFixed(3)));
    setTreble(Number(rawTreble.toFixed(3)));

    rafIdRef.current = requestAnimationFrame(analyzeAudio);
  }, [smoothing, threshold]);

  const startAudioListener = async () => {
    try {
      if (audioCtxRef.current) return;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = smoothing;

      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);

      setIsAudioLocked(false);
      analyzeAudio();
    } catch (err) {
      console.error("Failed to unlock Web Audio API:", err);
      alert("Please allow microphone/audio stream access to enable lip-sync.");
    }
  };

  const stopAudioListener = () => {
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    if (sourceRef.current) sourceRef.current.disconnect();
    if (audioCtxRef.current) audioCtxRef.current.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setVolume(0);
    setBass(0);
    setMid(0);
    setTreble(0);
    setIsSpeaking(false);
    setIsAudioLocked(true);
  };

  useEffect(() => {
    return () => stopAudioListener();
  }, []);

  return { 
    volume, 
    bass, 
    mid, 
    treble, 
    analyser: analyserRef.current, 
    isSpeaking, 
    isAudioLocked, 
    startAudioListener, 
    stopAudioListener 
  };
}
