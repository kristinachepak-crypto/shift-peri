export interface DailyLog {
  date: string; // YYYY-MM-DD
  mood: number;
  sleepQuality: number;
  symptoms: string[];
  cycleStatus: "period" | "spotting" | "none";
  notes: string;
}

export interface AppState {
  onboardingComplete: boolean;
  selectedSymptoms: string[];
  logs: DailyLog[];
}

const STORAGE_KEY = "shift-app-data";

export const SYMPTOM_CATEGORIES = {
  "Mood & Mind": ["Anxiety", "Rage", "Brain fog", "Depression", "Irritability"],
  Sleep: ["Insomnia", "Night sweats", "Waking at 2–3am"],
  Body: ["Hot flashes", "Heart palpitations", "Joint pain", "Fatigue", "Headaches"],
  Cycle: ["Irregular periods", "Heavy bleeding", "Spotting"],
} as const;

export function getAppState(): AppState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { onboardingComplete: false, selectedSymptoms: [], logs: [] };
  try {
    return JSON.parse(raw);
  } catch {
    return { onboardingComplete: false, selectedSymptoms: [], logs: [] };
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
      // Today not logged yet, check from yesterday
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
