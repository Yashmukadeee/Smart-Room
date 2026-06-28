import { useState, useRef, useEffect, useCallback } from 'react';

export type VisemeShape = 'closed' | 'open' | 'wide' | 'wince' | 'narrow' | 'oval';

export interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

export interface AudioPayload {
  audio: string; // Base64 audio stream
  alignment: Alignment;
  text?: string;
}

const mapCharacterToViseme = (char: string): VisemeShape => {
  const c = char.toLowerCase();
  if (['a', 'e', 'i'].includes(c)) return 'wide';
  if (['o', 'u', 'w'].includes(c)) return 'oval';
  if (['b', 'm', 'p'].includes(c)) return 'closed';
  if (['f', 'v'].includes(c)) return 'wince';
  if (['c', 'd', 'g', 'k', 'n', 'r', 's', 't', 'y', 'z'].includes(c)) return 'narrow';
  return 'open';
};

export function useLipSync() {
  const [activeViseme, setActiveViseme] = useState<VisemeShape>('closed');
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const alignmentDataRef = useRef<Alignment | null>(null);

  const stop = useCallback(() => {
    if (audioSourceRef.current) {
      try {
        audioSourceRef.current.stop();
      } catch (e) {
        // Source may not have started or already finished
      }
      audioSourceRef.current.disconnect();
      audioSourceRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setActiveViseme('closed');
    setIsPlaying(false);
  }, []);

  const play = useCallback(async (payload: AudioPayload) => {
    stop();
    setError(null);

    try {
      // 1. Decode base64 audio stream
      const binaryString = atob(payload.audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 2. Instantiate AudioContext
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;

      // 3. Decode audio data array buffer
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer);

      // 4. Set up source node
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      alignmentDataRef.current = payload.alignment;
      audioSourceRef.current = source;
      setIsPlaying(true);

      // 5. Schedule playback
      startTimeRef.current = ctx.currentTime;
      source.start(0);

      source.onended = () => {
        setIsPlaying(false);
        setActiveViseme('closed');
      };

      // 6. Viseme tick sync loop
      const tick = () => {
        if (!alignmentDataRef.current) return;
        const elapsed = ctx.currentTime - startTimeRef.current;
        const { characters, character_start_times_seconds, character_end_times_seconds } = alignmentDataRef.current;

        let activeIdx = -1;
        for (let i = 0; i < character_start_times_seconds.length; i++) {
          const start = character_start_times_seconds[i];
          const end = character_end_times_seconds[i];
          if (elapsed >= start && elapsed <= end) {
            activeIdx = i;
            break;
          }
        }

        if (activeIdx !== -1) {
          const char = characters[activeIdx];
          setActiveViseme(mapCharacterToViseme(char));
        } else {
          setActiveViseme('closed');
        }

        animationFrameRef.current = requestAnimationFrame(tick);
      };

      animationFrameRef.current = requestAnimationFrame(tick);

    } catch (err: any) {
      console.error("LipSync hook playback failure:", err);
      setError(err.message || "Lip-sync audio decoding failed");
      setIsPlaying(false);
      setActiveViseme('closed');
    }
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stop]);

  return { play, stop, activeViseme, isPlaying, error };
}
