export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood: number;
  mentalMood: number;
  sleepQuality: number;
  symptoms: string[];
  physicalSymptoms: string[];
  emotionalSymptoms: string[];
  sleepSymptoms: string[];
  cycleStatus: "period" | "spotting" | "none";
  notes: string;
}

export interface RollingMeans {
  physical: number;
  mental: number;
}

export interface AppState {
  onboardingComplete: boolean;
  selectedSymptoms: string[];
  logs: DailyLog[];
  rollingMeans: RollingMeans;
}

const STORAGE_KEY = "shift-app-data";

export const SYMPTOM_CATEGORIES = {
  "Mood & Mind": ["Anxiety", "Rage", "Brain fog", "Depression", "Irritability", "Mood swings"],
  Sleep: ["Insomnia", "Night sweats", "Waking at 2–3am", "Restless sleep"],
  Body: ["Hot flashes", "Heart palpitations", "Joint pain", "Fatigue", "Headaches", "Weight changes"],
  Cycle: ["Irregular periods", "Heavy bleeding", "Spotting", "Missed periods"],
  "Hair, Skin & Nails": ["Hair thinning", "Dry skin", "Brittle nails", "Hair texture changes", "Adult acne"],
} as const;

const PHYSICAL_CATEGORIES = ["Body", "Cycle", "Hair, Skin & Nails", "Sleep"] as const;
const EMOTIONAL_CATEGORIES = ["Mood & Mind"] as const;

export function getPhysicalProfileSymptoms(selectedSymptoms: string[]): string[] {
  const physicalAll = PHYSICAL_CATEGORIES.flatMap(
    (cat) => SYMPTOM_CATEGORIES[cat as keyof typeof SYMPTOM_CATEGORIES] as readonly string[]
  );
  return selectedSymptoms.filter((s) => physicalAll.includes(s));
}

export function getEmotionalProfileSymptoms(selectedSymptoms: string[]): string[] {
  const emotionalAll = EMOTIONAL_CATEGORIES.flatMap(
    (cat) => SYMPTOM_CATEGORIES[cat as keyof typeof SYMPTOM_CATEGORIES] as readonly string[]
  );
  return selectedSymptoms.filter((s) => emotionalAll.includes(s));
}

const defaultState: AppState = {
  onboardingComplete: false,
  selectedSymptoms: [],
  logs: [],
  rollingMeans: { physical: 0, mental: 0 },
};

export function getAppState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...defaultState };
  try {
    const parsed = JSON.parse(raw);
    return {
      ...defaultState,
      ...parsed,
      rollingMeans: { ...defaultState.rollingMeans, ...(parsed.rollingMeans || {}) },
    };
  } catch {
    return { ...defaultState };
  }
}

export function saveAppState(state: AppState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = getToday();
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (sorted.find((l) => l.date === dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (i === 0) {
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function todayAlreadyLogged(logs: DailyLog[]): boolean {
  return logs.some((l) => l.date === getToday());
}

export function calculateRollingMean(logs: DailyLog[], field: "mood" | "mentalMood"): number {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const recent = sorted.slice(0, 7);
  if (recent.length === 0) return 0;
  const sum = recent.reduce((acc, log) => acc + (log[field] || 5), 0);
  return sum / recent.length;
}

export function getPhase(logs: DailyLog[]): 1 | 2 {
  return logs.length >= 7 ? 2 : 1;
}

export function shouldShowTags(
  currentValue: number,
  phase: 1 | 2,
  rollingMean: number
): boolean {
  if (phase === 1) {
    return currentValue <= 4; // ≤2 on 1-5 scale ≈ ≤4 on 1-10
  }
  return currentValue <= rollingMean - 1;
}
