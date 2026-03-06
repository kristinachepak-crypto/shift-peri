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
  // Confirmation flow fields
  generatedSummary?: string;
  confirmationResponse?: "yes" | "mostly" | "not-quite";
  confirmationFeedback?: string;
}

export interface RollingMeans {
  physical: number;
  mental: number;
}

export interface Assessment {
  date: string; // YYYY-MM-DD
  symptoms: string[];
}

export interface AppState {
  onboardingComplete: boolean;
  onboardingDate: string; // YYYY-MM-DD when onboarding was completed
  selectedSymptoms: string[];
  logs: DailyLog[];
  rollingMeans: RollingMeans;
  assessments: Assessment[];
  // Track how many times a non-profile symptom was selected via "add something else"
  adhocSymptomCounts: Record<string, number>;
  // Symptoms the user dismissed the promotion prompt for
  dismissedPromotions: string[];
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
  onboardingDate: "",
  selectedSymptoms: [],
  logs: [],
  rollingMeans: { physical: 0, mental: 0 },
  assessments: [],
  adhocSymptomCounts: {},
  dismissedPromotions: [],
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
      assessments: parsed.assessments || [],
      adhocSymptomCounts: parsed.adhocSymptomCounts || {},
      dismissedPromotions: parsed.dismissedPromotions || [],
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
    return currentValue <= 2;
  }
  return currentValue <= rollingMean - 1;
}

export function getNextAssessmentDate(state: AppState): string {
  if (state.assessments.length > 0) {
    const lastAssessment = [...state.assessments].sort((a, b) => b.date.localeCompare(a.date))[0];
    const d = new Date(lastAssessment.date);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }
  if (state.onboardingDate) {
    const d = new Date(state.onboardingDate);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  }
  return "";
}

export function isAssessmentDue(state: AppState): boolean {
  const nextDate = getNextAssessmentDate(state);
  if (!nextDate) return false;
  return getToday() >= nextDate;
}

export function recordAdhocSymptom(state: AppState, symptom: string): AppState {
  if (state.selectedSymptoms.includes(symptom)) return state;
  const counts = { ...state.adhocSymptomCounts };
  counts[symptom] = (counts[symptom] || 0) + 1;
  return { ...state, adhocSymptomCounts: counts };
}

export function getSymptomsEligibleForPromotion(state: AppState): string[] {
  return Object.entries(state.adhocSymptomCounts)
    .filter(([symptom, count]) =>
      count >= 3 &&
      !state.selectedSymptoms.includes(symptom) &&
      !state.dismissedPromotions.includes(symptom)
    )
    .map(([symptom]) => symptom);
}

export function addSymptomToProfile(state: AppState, symptom: string): AppState {
  if (state.selectedSymptoms.includes(symptom)) return state;
  const newCounts = { ...state.adhocSymptomCounts };
  delete newCounts[symptom];
  return {
    ...state,
    selectedSymptoms: [...state.selectedSymptoms, symptom],
    adhocSymptomCounts: newCounts,
  };
}

export function dismissSymptomPromotion(state: AppState, symptom: string): AppState {
  return {
    ...state,
    dismissedPromotions: [...state.dismissedPromotions, symptom],
  };
}
