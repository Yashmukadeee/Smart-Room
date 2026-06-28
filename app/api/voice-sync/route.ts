import { NextResponse } from 'next/server';

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;
const requestLog: number[] = [];

function isRateLimited(): boolean {
  const now = Date.now();
  // Prune old entries
  while (requestLog.length > 0 && requestLog[0] < now - RATE_LIMIT_WINDOW_MS) {
    requestLog.shift();
  }
  if (requestLog.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  requestLog.push(now);
  return false;
}

// ─── Input sanitization ─────────────────────────────────────────────────────
const MAX_PROMPT_LENGTH = 500;
function sanitizePrompt(raw: string): string {
  return raw
    .slice(0, MAX_PROMPT_LENGTH)         // Truncate to max length
    .replace(/<[^>]*>/g, '')              // Strip any HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control chars
    .trim();
}

interface Alignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

const SPIDERMAN_QUOTES = [
  "Friendly neighborhood Spider-Man here, system controls are fully online and synced!",
  "With great power comes great responsibility. Let's manage these devices safely.",
  "Web fluid levels at one hundred percent. Ready for room control instructions.",
  "Dodge this! AC temperatures lowered for comfortable patrolling.",
  "Hey, Alexa commands intercepted. Calibrating bedroom desk LEDs now.",
  "Just a typical day: code by day, save the bedroom IoT system by night!"
];

// Generates a dynamic synthetic WAV audio stream representing speech sounds
// aligned with the characters in the text, ensuring a zero-config fallback.
function generateFallbackVoice(text: string): { audioBase64: string; alignment: Alignment } {
  const charCount = text.length;
  const durationPerChar = 0.08; // 80ms per character
  const totalDuration = charCount * durationPerChar;
  const sampleRate = 8000; // 8kHz mono
  const numSamples = Math.floor(sampleRate * totalDuration);
  
  // Allocate buffer for 44-byte WAV header + PCM sample bytes
  const buffer = Buffer.alloc(44 + numSamples);

  // 1. Write RIFF / WAVE Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + numSamples, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size
  buffer.writeUInt16LE(1, 20); // audio format (1 = PCM)
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24); // sample rate
  buffer.writeUInt32LE(sampleRate, 28); // byte rate (sampleRate * 1 channel * 8 bits / 8)
  buffer.writeUInt16LE(1, 32); // block align
  buffer.writeUInt16LE(8, 34); // 8-bit PCM
  buffer.write('data', 36);
  buffer.writeUInt32LE(numSamples, 40);

  // 2. Synthesize speech-like sound (formant sweep + envelope gating)
  const characters: string[] = [];
  const startTimes: number[] = [];
  const endTimes: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const charIdx = Math.floor(t / durationPerChar);
    
    // Fundamental human speech pitch ranges around 110-180Hz
    const pitch = 140 + Math.sin(2 * Math.PI * 1.8 * t) * 20;
    
    // Gating envelope to simulate gaps between words / letters
    const char = text[charIdx] || ' ';
    const isVowel = ['a','e','i','o','u','h','r','n','s'].includes(char.toLowerCase());
    const isSpace = char === ' ';
    const envelope = isSpace ? 0 : isVowel ? 0.8 : 0.4;
    
    const sampleVal = Math.sin(2 * Math.PI * pitch * t) * envelope;
    const byteValue = Math.floor(128 + sampleVal * 60);
    buffer.writeUInt8(byteValue, 44 + i);
  }

  // 3. Build alignment mappings
  for (let i = 0; i < charCount; i++) {
    characters.push(text[i]);
    startTimes.push(i * durationPerChar);
    endTimes.push((i + 1) * durationPerChar);
  }

  return {
    audioBase64: buffer.toString('base64'),
    alignment: {
      characters,
      character_start_times_seconds: startTimes,
      character_end_times_seconds: endTimes
    }
  };
}

export async function POST(request: Request) {
  // Rate limiting check
  if (isRateLimited()) {
    return NextResponse.json(
      { error: 'Rate limited — please slow down. Max 10 requests per minute.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const rawPrompt = typeof body.prompt === 'string' ? body.prompt : '';
    const prompt = sanitizePrompt(rawPrompt);

    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY;
    const openAiApiKey = process.env.OPENAI_API_KEY;

    const isMockMode = 
      !elevenLabsApiKey || 
      !openAiApiKey || 
      elevenLabsApiKey.startsWith('YOUR_') || 
      openAiApiKey.startsWith('YOUR_');

    // Zero-config fallback check
    if (isMockMode) {
      // Pick a random Spiderman quote as response
      const fallbackText = prompt && prompt.toLowerCase().includes('greeting')
        ? SPIDERMAN_QUOTES[0]
        : SPIDERMAN_QUOTES[Math.floor(Math.random() * SPIDERMAN_QUOTES.length)];

      const { audioBase64, alignment } = generateFallbackVoice(fallbackText);
      return NextResponse.json({
        text: fallbackText,
        audio: audioBase64,
        alignment,
        info: "Running in zero-config offline fallback mode. Configure ELEVENLABS_API_KEY and OPENAI_API_KEY to enable live AI voices."
      });
    }

    // 1. Generate response text from OpenAI
    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openAiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are Spiderman. Respond briefly in one short sentence.' },
          { role: 'user', content: prompt || 'Hello!' }
        ],
        max_tokens: 60
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`LLM Error: ${await llmResponse.text()}`);
    }

    const llmData = await llmResponse.json();
    const generatedText = llmData.choices[0].message.content;

    // 2. Fetch speech and alignment timings from ElevenLabs
    const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgq5paqqJJAq';
    const elevenLabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-with-timestamps`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: generatedText,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!elevenLabsResponse.ok) {
      throw new Error(`ElevenLabs TTS Error: ${await elevenLabsResponse.text()}`);
    }

    const ttsData = await elevenLabsResponse.json();

    return NextResponse.json({
      text: generatedText,
      audio: ttsData.audio_base64,
      alignment: ttsData.alignment
    });

  } catch (err: any) {
    console.error("Voice-Sync Endpoint Error:", err);
    return NextResponse.json({ error: err.message || 'Internal voice generation failure' }, { status: 500 });
  }
}
