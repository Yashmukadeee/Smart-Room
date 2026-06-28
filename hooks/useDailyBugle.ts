import { useEffect, useRef, useCallback } from 'react';

interface DailyBugleOptions {
  onBriefingReady: (prompt: string) => void;
}

const BRIEFING_HOUR = 7; // 7am local time

// Free weather from wttr.in (no API key needed)
async function fetchWeather(): Promise<string> {
  try {
    const res = await fetch('https://wttr.in/Goa?format=%C+%t+%h');
    if (!res.ok) throw new Error('wttr.in failed');
    const text = await res.text();
    return text.trim();
  } catch {
    return 'Warm and sunny, 29°C, 70% humidity';
  }
}

// Free headlines from Hacker News (no API key needed)
async function fetchHeadlines(): Promise<string[]> {
  try {
    const topStoriesRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const ids: number[] = await topStoriesRes.json();

    const topFive = await Promise.all(
      ids.slice(0, 5).map(async (id) => {
        const storyRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
        const story = await storyRes.json();
        return story.title as string;
      })
    );

    return topFive.filter(Boolean);
  } catch {
    return [
      'Next.js 15 released with major performance improvements',
      'ESP32 now supports Matter smart home protocol natively',
      'Supabase launches vector embeddings for all plans',
    ];
  }
}

export function useDailyBugle({ onBriefingReady }: DailyBugleOptions) {
  const lastBriefingDate = useRef<string>('');
  const hasTriggeredToday = useRef(false);

  const triggerBriefing = useCallback(async () => {
    try {
      const weather = await fetchWeather();
      const headlines = await fetchHeadlines();
      const dateStr = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });

      const prompt = [
        `You are Spiderman delivering your Daily Bugle morning briefing. Keep it under 60 words. Be witty and fun.`,
        `Today is ${dateStr}.`,
        `Goa weather right now: ${weather}.`,
        `Top tech headlines:`,
        ...headlines.slice(0, 3).map((h, i) => `${i + 1}. ${h}`),
        `Give me a punchy one-sentence briefing mentioning the weather and one headline in your spidey style.`,
      ].join(' ');

      onBriefingReady(prompt);
      hasTriggeredToday.current = true;
      lastBriefingDate.current = new Date().toDateString();
    } catch (err) {
      console.warn('Daily Bugle briefing generation failed:', err);
    }
  }, [onBriefingReady]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const dateKey = now.toDateString();

      // Fire once per day at the briefing hour
      if (
        hour === BRIEFING_HOUR &&
        lastBriefingDate.current !== dateKey &&
        !hasTriggeredToday.current
      ) {
        triggerBriefing();
      }

      // Reset daily trigger flag at midnight
      if (hour === 0) {
        hasTriggeredToday.current = false;
      }
    };

    // Check every 60 seconds
    const interval = setInterval(checkTime, 60 * 1000);

    return () => clearInterval(interval);
  }, [triggerBriefing]);

  // Expose manual trigger for testing
  return { triggerBriefingNow: triggerBriefing };
}
