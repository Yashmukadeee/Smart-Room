import { useState, useEffect, useCallback } from 'react';

export type SpidermanMood =
  | 'alert'
  | 'relaxed'
  | 'thoughtful'
  | 'tired'
  | 'heroic'
  | 'curious'
  | 'playful'
  | 'excited'
  | 'stressed'
  | 'proud'
  | 'silly'
  | 'bored'
  | 'determined'
  | 'grateful'
  | 'sneaky'
  | 'focused'
  | 'energetic'
  | 'confused'
  | 'anxious'
  | 'cheerful'
  | 'melancholic'
  | 'fierce'
  | 'calm'
  | 'surprised'
  | 'nostalgic'
  | 'motivated'
  | 'peaceful'
  | 'goofy'
  | 'brave'
  | 'wise'
  | 'nervous'
  | 'joyful'
  | 'intense'
  | 'dreamy'
  | 'cranky'
  | 'confident'
  | 'humble'
  | 'adventurous'
  | 'mischievous'
  | 'protective'
  | 'hopeful'
  | 'amused'
  | 'fearless'
  | 'zany'
  | 'serious'
  | 'rebellious'
  | 'electric'
  | 'zen'
  | 'hungry'
  | 'hyper'
  | 'mysterious'
  | 'dramatic'
  | 'content'
  | 'triumphant'
  | 'cheeky'
  | 'pensive'
  | 'wild';

export type TaskCategory =
  | 'eating'
  | 'reading'
  | 'exercising'
  | 'sleeping'
  | 'coding'
  | 'patrolling'
  | 'web_slinging'
  | 'music'
  | 'thinking'
  | 'gaming'
  | 'cleaning'
  | 'phone'
  | 'coffee'
  | 'stretching'
  | 'cricket'
  | 'idle';

export interface LifeTask {
  id: number;
  description: string;
  mood: SpidermanMood;
  category: TaskCategory;
}

export const LIFE_TASKS: LifeTask[] = [
  // eating
  { id: 1,  description: "Eating a slice of New York pizza",         mood: "relaxed",     category: "eating" },
  { id: 2,  description: "Munching on Aunt May's wheat cakes",       mood: "relaxed",     category: "eating" },
  { id: 3,  description: "Wolfing down a spicy chicken burger",      mood: "hungry",      category: "eating" },
  { id: 4,  description: "Sneaking a midnight snack",                mood: "sneaky",      category: "eating" },
  { id: 5,  description: "Taste-testing MJ's new pasta recipe",      mood: "grateful",    category: "eating" },
  { id: 6,  description: "Popping protein gummies mid-patrol",       mood: "energetic",   category: "eating" },
  { id: 7,  description: "Eating cereal straight from the box",      mood: "bored",       category: "eating" },
  { id: 8,  description: "Stress-eating a bag of chips",             mood: "stressed",    category: "eating" },

  // reading
  { id: 9,  description: "Studying bio-chemistry notes",             mood: "thoughtful",  category: "reading" },
  { id: 10, description: "Flipping through a comic book",            mood: "relaxed",     category: "reading" },
  { id: 11, description: "Checking Daily Bugle headlines",           mood: "curious",     category: "reading" },
  { id: 12, description: "Skimming through a coding manual",         mood: "thoughtful",  category: "reading" },
  { id: 13, description: "Reading quantum mechanics textbook",        mood: "focused",     category: "reading" },
  { id: 14, description: "Re-reading a favourite Spider-Man arc",    mood: "nostalgic",   category: "reading" },
  { id: 15, description: "Memorising chemistry formulas",            mood: "determined",  category: "reading" },

  // exercising
  { id: 16, description: "Doing a one-arm handstand",                mood: "heroic",      category: "exercising" },
  { id: 17, description: "Slamming out 100 pushups",                 mood: "determined",  category: "exercising" },
  { id: 18, description: "Practicing double-under flips",            mood: "playful",     category: "exercising" },
  { id: 19, description: "Lifting desk heavy weights",               mood: "determined",  category: "exercising" },
  { id: 20, description: "Doing a standing double backflip",         mood: "heroic",      category: "exercising" },
  { id: 21, description: "Stretching stiff shoulder muscles",        mood: "relaxed",     category: "stretching" },
  { id: 22, description: "Attempting to touch head to knees",        mood: "silly",       category: "stretching" },
  { id: 23, description: "Warming up with wall-crawl squats",        mood: "motivated",   category: "exercising" },
  { id: 24, description: "Shadow boxing in front of mirror",         mood: "fierce",      category: "exercising" },
  { id: 25, description: "Holding a yoga tree pose mid-air",         mood: "zen",         category: "stretching" },

  // sleeping
  { id: 26, description: "Taking a quick power nap",                 mood: "tired",       category: "sleeping" },
  { id: 27, description: "Yawning and rubbing eyes",                 mood: "tired",       category: "sleeping" },
  { id: 28, description: "Dozing off on the web hammock",            mood: "peaceful",    category: "sleeping" },
  { id: 29, description: "Dreaming about stopping Doc Ock",          mood: "dreamy",      category: "sleeping" },
  { id: 30, description: "Staring blankly at the wall",              mood: "bored",       category: "idle" },

  // coding
  { id: 31, description: "Writing Next.js API routes",               mood: "thoughtful",  category: "coding" },
  { id: 32, description: "Analyzing ESP32 telemetry data",           mood: "curious",     category: "coding" },
  { id: 33, description: "Debugging Wi-Fi connection drops",         mood: "stressed",    category: "coding" },
  { id: 34, description: "Cleaning up the desktop junk files",       mood: "bored",       category: "coding" },
  { id: 35, description: "Reviewing quantum mechanical models",       mood: "thoughtful",  category: "reading" },
  { id: 36, description: "Monitoring the bedroom humidity sensor",   mood: "curious",     category: "coding" },
  { id: 37, description: "Patching up a bug in the dashboard",       mood: "focused",     category: "coding" },
  { id: 38, description: "Pushing a hotfix to GitHub at 3 AM",       mood: "intense",     category: "coding" },
  { id: 39, description: "Setting up a new Supabase table",          mood: "motivated",   category: "coding" },
  { id: 40, description: "Optimizing framer-motion animations",      mood: "proud",       category: "coding" },

  // patrolling / alert
  { id: 41, description: "Patrolling the bedroom ceiling",           mood: "alert",       category: "patrolling" },
  { id: 42, description: "Listening to the police scanner",          mood: "alert",       category: "patrolling" },
  { id: 43, description: "Scanning local radio frequencies",         mood: "alert",       category: "patrolling" },
  { id: 44, description: "Wiping dust from the smart light bulb",    mood: "alert",       category: "cleaning" },
  { id: 45, description: "Perching like a stone gargoyle",           mood: "heroic",      category: "patrolling" },
  { id: 46, description: "Watching the door sensor feed intently",   mood: "protective",  category: "patrolling" },

  // web slinging
  { id: 47, description: "Shooting web-lines at target posters",     mood: "playful",     category: "web_slinging" },
  { id: 48, description: "Calibrating web shooter nozzles",          mood: "determined",  category: "web_slinging" },
  { id: 49, description: "Checking web fluid pressure levels",       mood: "curious",     category: "web_slinging" },
  { id: 50, description: "Waiting for web fluid to dry",             mood: "bored",       category: "web_slinging" },
  { id: 51, description: "Wall crawling behind the curtain",         mood: "sneaky",      category: "web_slinging" },
  { id: 52, description: "Hanging upside down from web line",        mood: "playful",     category: "web_slinging" },
  { id: 53, description: "Splicing a loose web-shooter wire",        mood: "stressed",    category: "web_slinging" },

  // music
  { id: 54, description: "Grooving to Alexa music",                  mood: "excited",     category: "music" },
  { id: 55, description: "Air-guitaring to a punk track",            mood: "wild",        category: "music" },
  { id: 56, description: "Nodding along to hip-hop beats",           mood: "cheerful",    category: "music" },
  { id: 57, description: "Humming the Spider-Man theme quietly",     mood: "nostalgic",   category: "music" },
  { id: 58, description: "Beatboxing while doing chin-ups",          mood: "hyper",       category: "music" },

  // thinking / idle
  { id: 59, description: "Meditating for inner peace",               mood: "grateful",    category: "thinking" },
  { id: 60, description: "Thinking about Mary Jane",                 mood: "grateful",    category: "thinking" },
  { id: 61, description: "Taking a deep breath to center",           mood: "calm",        category: "thinking" },
  { id: 62, description: "Pondering the multiverse implications",    mood: "pensive",     category: "thinking" },
  { id: 63, description: "Staring at the ceiling with a big idea",  mood: "dreamy",      category: "thinking" },
  { id: 64, description: "Questioning whether pineapple on pizza",  mood: "confused",    category: "thinking" },
  { id: 65, description: "Drafting a mental list of enemies",        mood: "serious",     category: "thinking" },

  // gaming
  { id: 66, description: "Playing an old handheld console",          mood: "playful",     category: "gaming" },
  { id: 67, description: "Rage-quitting a mobile game",              mood: "cranky",      category: "gaming" },
  { id: 68, description: "Speedrunning a Spidey PS4 game",           mood: "excited",     category: "gaming" },
  { id: 69, description: "Beating Flash Thompson's high score",      mood: "triumphant",  category: "gaming" },

  // phone
  { id: 70, description: "Texting Ned about the new mission",        mood: "cheerful",    category: "phone" },
  { id: 71, description: "Scrolling through social media",           mood: "bored",       category: "phone" },
  { id: 72, description: "Calling Aunt May to check in",             mood: "grateful",    category: "phone" },
  { id: 73, description: "Taking a quick phone selfie",              mood: "proud",       category: "phone" },
  { id: 74, description: "Posting a cryptic tweet as Spider-Man",    mood: "mischievous", category: "phone" },

  // coffee
  { id: 75, description: "Sipping a hot mug of coffee",              mood: "bored",       category: "coffee" },
  { id: 76, description: "Brewing extra-strong espresso",            mood: "focused",     category: "coffee" },
  { id: 77, description: "Spilling coffee on the keyboard again",    mood: "anxious",     category: "coffee" },

  // cleaning / misc
  { id: 78, description: "Polishing the suit eye lenses",            mood: "proud",       category: "cleaning" },
  { id: 79, description: "Brushing the chest spider emblem",         mood: "proud",       category: "cleaning" },
  { id: 80, description: "Patching a small tear in the glove",       mood: "thoughtful",  category: "cleaning" },
  { id: 81, description: "Searching under bed for web fluid",        mood: "sneaky",      category: "idle" },
  { id: 82, description: "Hunting for the other matching sock",      mood: "silly",       category: "idle" },
  { id: 83, description: "Spinning a basketball on a finger",        mood: "silly",       category: "idle" },
  { id: 84, description: "Chasing a stray red laser light",          mood: "silly",       category: "idle" },
  { id: 85, description: "Dusting off the PC keyboard",              mood: "tired",       category: "cleaning" },
];

const playSFX = (soundUrl: string, volume = 0.3) => {
  try {
    const audio = new Audio(soundUrl);
    audio.volume = volume;
    audio.play().catch(() => {/* Ignore autoplay restrictions */});
  } catch (e) {
    console.warn('SFX playback warning:', e);
  }
};

export function useLifeSimulation(
  externalStateOverride: 'speaking' | 'repairing' | null,
  sensorMoodOverride?: SpidermanMood | null,
  sensorTaskOverride?: string | null,
  pendingTasksCount = 0,
  firstPendingTaskTitle: string | null = null
) {
  const [currentTask, setCurrentTask] = useState<LifeTask>(LIFE_TASKS[0]);
  const [internalState, setInternalState] = useState<'idle' | 'repairing'>('idle');
  const [repairTimeout, setRepairTimeout] = useState<NodeJS.Timeout | null>(null);

  const triggerRepair = useCallback((durationMs = 3500) => {
    if (repairTimeout) clearTimeout(repairTimeout);
    playSFX('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', 0.4);
    setInternalState('repairing');
    const timer = setTimeout(() => {
      playSFX('https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3', 0.2);
      setInternalState('idle');
    }, durationMs);
    setRepairTimeout(timer);
  }, [repairTimeout]);

  // Autonomous random task loop
  useEffect(() => {
    if (externalStateOverride || sensorMoodOverride || internalState === 'repairing') return;

    const intervalTime = Math.floor(Math.random() * 5000) + 7000;

    const timer = setTimeout(() => {
      // 50% chance to show a user mission if pending
      if (pendingTasksCount > 0 && firstPendingTaskTitle && Math.random() > 0.5) {
        const userMissions = [
          `Waiting for you to: "${firstPendingTaskTitle}"`,
          `Reminder: "${firstPendingTaskTitle}" is still pending!`,
          `Active Mission: "${firstPendingTaskTitle}"`,
          `Peter needs you to complete: "${firstPendingTaskTitle}"`,
          `Hey! Don't forget: "${firstPendingTaskTitle}"`,
        ];

        let userTaskMood: SpidermanMood = 'alert';
        if (pendingTasksCount > 5) userTaskMood = 'stressed';
        else if (pendingTasksCount > 3) userTaskMood = 'anxious';
        else if (pendingTasksCount > 1) userTaskMood = 'determined';
        else userTaskMood = 'focused';

        setCurrentTask({
          id: -1,
          description: userMissions[Math.floor(Math.random() * userMissions.length)],
          mood: userTaskMood,
          category: 'phone',
        });
      } else {
        setCurrentTask(LIFE_TASKS[Math.floor(Math.random() * LIFE_TASKS.length)]);
      }
    }, intervalTime);

    return () => clearTimeout(timer);
  }, [currentTask, internalState, externalStateOverride, sensorMoodOverride, pendingTasksCount, firstPendingTaskTitle]);

  // Handle overrides and state mapping
  let activeState: 'speaking' | 'repairing' | 'idle' = 'idle';
  let activeTask: string = currentTask.description;
  let activeMood: SpidermanMood = currentTask.mood;
  let activeCategory: TaskCategory = currentTask.category;

  // Workload-based mood adaptation
  if (!externalStateOverride && !sensorMoodOverride && internalState !== 'repairing') {
    if (pendingTasksCount > 5) {
      const stressedMoods: SpidermanMood[] = ['stressed', 'tired', 'anxious', 'intense'];
      if (!stressedMoods.includes(activeMood)) {
        activeMood = stressedMoods[Math.floor(Math.random() * stressedMoods.length)];
      }
    } else if (pendingTasksCount > 2) {
      const busyMoods: SpidermanMood[] = ['determined', 'focused', 'motivated'];
      if (!busyMoods.includes(activeMood)) {
        activeMood = busyMoods[Math.floor(Math.random() * busyMoods.length)];
      }
    } else if (pendingTasksCount === 0) {
      const happyMoods: SpidermanMood[] = ['relaxed', 'playful', 'silly', 'grateful', 'excited', 'cheerful', 'content', 'joyful'];
      if (!happyMoods.includes(activeMood)) {
        activeMood = happyMoods[Math.floor(Math.random() * happyMoods.length)];
      }
    }
  }

  if (externalStateOverride === 'speaking') {
    activeState = 'speaking';
    activeTask = 'WebAudio Sync Active...';
    activeMood = 'excited';
    activeCategory = 'idle';
  } else if (sensorMoodOverride) {
    activeState = 'idle';
    activeTask = sensorTaskOverride || 'Analyzing sensor feedback...';
    activeMood = sensorMoodOverride;
    activeCategory = sensorMoodOverride === 'heroic' ? 'cricket' : 'patrolling';
  } else if (externalStateOverride === 'repairing' || internalState === 'repairing') {
    activeState = 'repairing';
    activeTask = 'Rewiring ESP32 Relay Circuit...';
    activeMood = 'determined';
    activeCategory = 'coding';
  }

  return {
    currentState: activeState,
    currentTask: activeTask,
    currentMood: activeMood,
    currentCategory: activeCategory,
    triggerRepair,
  };
}
