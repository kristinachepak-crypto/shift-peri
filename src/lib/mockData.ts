import { AppState, DailyLog, saveAppState, getAppState } from "./storage";

const MAYA_SYMPTOMS = [
  "Mood changes", "Anxiety", "Brain fog",
  "Sleep disruption", "Night sweats",
  "Fatigue", "Heart palpitations", "Joint pain",
  "Hair thinning", "Brittle nails",
];

function generateMayaLogs(): DailyLog[] {
  const logs: DailyLog[] = [];

  // 18-day current streak: Feb 23 - Mar 12, 2026
  // Plus 3 earlier logs: Feb 5, Feb 10, Feb 15
  const streakDates: string[] = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(2026, 1, 23 + i); // Feb 23 + i
    streakDates.push(d.toISOString().split("T")[0]);
  }
  const earlyDates = ["2026-02-05", "2026-02-10", "2026-02-15"];
  const allDates = [...earlyDates, ...streakDates];

  // Deterministic symptom patterns to match report frequencies
  const symptomSchedule: Record<string, string[]> = {};
  allDates.forEach((date, i) => {
    const physical: string[] = [];
    const emotional: string[] = [];
    const sleep: string[] = [];

    // Sleep disruption 91% ≈ 19/21
    if (i !== 2 && i !== 10) sleep.push("Sleep disruption");
    // Night sweats ~67%
    if (i % 3 !== 2) sleep.push("Night sweats");
    // Mood changes 86% ≈ 18/21
    if (i !== 0 && i !== 7 && i !== 14) emotional.push("Mood changes");
    // Brain fog 79% ≈ 17/21
    if (i % 5 !== 0) emotional.push("Brain fog");
    // Anxiety ~57%
    if (i % 7 < 4) emotional.push("Anxiety");
    // Hair thinning 76% ≈ 16/21
    if (i !== 1 && i !== 6 && i !== 11 && i !== 16 && i !== 20) physical.push("Hair thinning");
    // Fatigue 71% ≈ 15/21
    if (i % 7 < 5) physical.push("Fatigue");
    // Brittle nails ~48%
    if (i % 2 === 0) physical.push("Brittle nails");
    // Heart palpitations ~38%
    if (i % 5 < 2) physical.push("Heart palpitations");
    // Joint pain ~43%
    if (i % 7 < 3) physical.push("Joint pain");

    symptomSchedule[date] = [...physical, ...emotional, ...sleep];
  });

  // Generate mood scores averaging ~2.4
  const moodValues = [2, 3, 2, 1, 3, 2, 2, 3, 2, 1, 3, 2, 2, 3, 2, 1, 2, 3, 2, 2, 3];
  const mentalValues = [3, 2, 3, 2, 3, 2, 3, 3, 2, 2, 3, 2, 3, 2, 3, 2, 3, 3, 2, 3, 2];
  const sleepValues = [2, 2, 3, 1, 2, 2, 3, 2, 1, 2, 3, 2, 2, 1, 2, 3, 2, 2, 1, 2, 3];

  allDates.forEach((date, i) => {
    const allSymptoms = symptomSchedule[date] || [];
    const physicalSymptoms = allSymptoms.filter(s =>
      ["Fatigue", "Heart palpitations", "Joint pain", "Hair thinning", "Brittle nails"].includes(s)
    );
    const emotionalSymptoms = allSymptoms.filter(s =>
      ["Mood changes", "Anxiety", "Brain fog"].includes(s)
    );
    const sleepSymptoms = allSymptoms.filter(s =>
      ["Sleep disruption", "Night sweats"].includes(s)
    );

    logs.push({
      date,
      mood: moodValues[i] || 2,
      mentalMood: mentalValues[i] || 3,
      sleepQuality: sleepValues[i] || 2,
      symptoms: [],
      physicalSymptoms,
      emotionalSymptoms,
      sleepSymptoms,
      newSymptomFlags: [],
      cycleStatus: "none",
      notes: "",
    });
  });

  return logs;
}

export function seedMayaData(): void {
  const existing = getAppState();
  // Only seed if no data exists
  if (existing.onboardingComplete && existing.logs.length > 0) return;

  const logs = generateMayaLogs();

  const state: AppState = {
    onboardingComplete: true,
    onboardingDate: "2026-02-01",
    selectedSymptoms: MAYA_SYMPTOMS,
    logs,
    rollingMeans: { physical: 2.14, mental: 2.57 },
    assessments: [
      { date: "2026-02-19", symptoms: [...MAYA_SYMPTOMS] },
    ],
    adhocSymptomCounts: {},
    dismissedPromotions: [],
  };

  saveAppState(state);
}
