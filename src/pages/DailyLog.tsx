import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import { Separator } from "@/components/ui/separator";
import {
  getAppState, saveAppState, getStreak, getToday, todayAlreadyLogged,
  getPhysicalProfileSymptoms, getEmotionalProfileSymptoms,
  calculateRollingMean, getPhase, shouldShowTags,
  recordAdhocSymptom, getSymptomsEligibleForPromotion,
  addSymptomToProfile, dismissSymptomPromotion,
  SYMPTOM_CATEGORIES, DailyLog as DailyLogType } from
"@/lib/storage";
import { Flame, Check, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

const ALL_PHYSICAL_SYMPTOMS = [
...SYMPTOM_CATEGORIES["Body"],
...SYMPTOM_CATEGORIES["Cycle"],
...SYMPTOM_CATEGORIES["Hair, Skin & Nails"],
...SYMPTOM_CATEGORIES["Sleep"]];


const ALL_EMOTIONAL_SYMPTOMS = [
...SYMPTOM_CATEGORIES["Mood & Mind"]];


const SLEEP_SYMPTOMS = [
"Trouble falling asleep",
"Woke during the night",
"Woke too early",
"Unrefreshing sleep"];


// --- Summary Generation ---

function generateSummary(log: {
  mood: number;
  mentalMood: number;
  sleepQuality: number;
  physicalSymptoms: string[];
  emotionalSymptoms: string[];
  sleepSymptoms: string[];
  symptoms: string[];
  cycleStatus: "period" | "spotting" | "none";
  notes: string;
}): string {
  const parts: string[] = [];

  // Physical + emotional overall shape
  const physDesc = log.mood <= 1 ? "physically tough" : log.mood <= 2 ? "physically rough" : log.mood <= 3 ? "physically so-so" : log.mood <= 4 ? "physically manageable" : "physically pretty good";
  const emotDesc = log.mentalMood <= 1 ? "emotionally heavy" : log.mentalMood <= 2 ? "emotionally low" : log.mentalMood <= 3 ? "emotionally mixed" : log.mentalMood <= 4 ? "emotionally steady" : "emotionally bright";

  if (Math.abs(log.mood - log.mentalMood) <= 1) {
    if (log.mood <= 2 && log.mentalMood <= 2) {
      parts.push("Today sounds like it was a harder day all around — both physically and emotionally.");
    } else if (log.mood >= 4 && log.mentalMood >= 4) {
      parts.push("Sounds like today was a solid day — you were feeling good both physically and emotionally.");
    } else {
      parts.push(`Today felt ${physDesc} and ${emotDesc}.`);
    }
  } else {
    parts.push(`Today felt ${physDesc} but ${emotDesc}.`);
  }

  // Sleep
  if (log.sleepQuality <= 2) {
    const sleepDetails = log.sleepSymptoms.length > 0 ?
    ` — ${log.sleepSymptoms.map((s) => s.toLowerCase()).join(" and ")}` :
    "";
    parts.push(`Sleep was rough${sleepDetails}.`);
  } else if (log.sleepQuality >= 4) {
    parts.push("Sleep went well.");
  }

  // Symptoms
  const allSymptoms = [
  ...log.physicalSymptoms,
  ...log.emotionalSymptoms,
  ...log.symptoms];

  if (allSymptoms.length > 0) {
    const listed = allSymptoms.slice(0, 3).map((s) => s.toLowerCase()).join(", ");
    const extra = allSymptoms.length > 3 ? ` and ${allSymptoms.length - 3} more` : "";
    parts.push(`${listed}${extra} showed up today.`);
  }

  // Cycle
  if (log.cycleStatus === "period") {
    parts.push("You noted you're on your period.");
  } else if (log.cycleStatus === "spotting") {
    parts.push("You noted some spotting.");
  }

  // Notes
  if (log.notes.trim().length > 0) {
    parts.push("You also left some personal notes.");
  }

  return parts.join(" ");
}

const DailyLog = () => {
  const [appState, setAppState] = useState(getAppState);
  const state = appState;
  const [mood, setMood] = useState(3);
  const [committedMood, setCommittedMood] = useState(3);
  const [mentalMood, setMentalMood] = useState(3);
  const [committedMentalMood, setCommittedMentalMood] = useState(3);
  const [sleep, setSleep] = useState(3);
  const [committedSleep, setCommittedSleep] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [physicalSymptoms, setPhysicalSymptoms] = useState<string[]>([]);
  const [emotionalSymptoms, setEmotionalSymptoms] = useState<string[]>([]);
  const [sleepSymptoms, setSleepSymptoms] = useState<string[]>([]);
  const [cycleStatus, setCycleStatus] = useState<"period" | "spotting" | "none">("none");
  const [notes, setNotes] = useState("");
  const [logged, setLogged] = useState(todayAlreadyLogged(state.logs));
  const [showAllPhysical, setShowAllPhysical] = useState(false);
  const [showAllEmotional, setShowAllEmotional] = useState(false);

  // Confirmation state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState("");
  const [confirmationResponse, setConfirmationResponse] = useState<"yes" | "mostly" | "not-quite" | null>(null);
  const [confirmationFeedback, setConfirmationFeedback] = useState("");
  const [confirmationDone, setConfirmationDone] = useState(false);

  // New symptom flag state
  const [showNewSymptomPanel, setShowNewSymptomPanel] = useState(false);
  const [newSymptomFlags, setNewSymptomFlags] = useState<string[]>([]);
  const [newSymptomPrompts, setNewSymptomPrompts] = useState<string[]>([]);

  const streak = getStreak(state.logs);
  const phase = getPhase(state.logs);

  const physicalProfileTags = useMemo(() => getPhysicalProfileSymptoms(state.selectedSymptoms), [state.selectedSymptoms]);
  const emotionalProfileTags = useMemo(() => getEmotionalProfileSymptoms(state.selectedSymptoms), [state.selectedSymptoms]);

  const physicalMean = useMemo(() => calculateRollingMean(state.logs, "mood"), [state.logs]);
  const mentalMean = useMemo(() => calculateRollingMean(state.logs, "mentalMood"), [state.logs]);

  const showPhysicalTags = shouldShowTags(committedMood, phase, physicalMean);
  const showEmotionalTags = shouldShowTags(committedMentalMood, phase, mentalMean);
  const showSleepTags = committedSleep <= 2;

  const promotionCandidates = useMemo(() => getSymptomsEligibleForPromotion(state), [state]);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const togglePhysicalSymptom = useCallback((s: string) => {
    setPhysicalSymptoms((prev) => {
      const adding = !prev.includes(s);
      if (adding && !state.selectedSymptoms.includes(s)) {
        const updated = recordAdhocSymptom(state, s);
        saveAppState(updated);
        setAppState(updated);
      }
      return adding ? [...prev, s] : prev.filter((x) => x !== s);
    });
  }, [state]);

  const toggleEmotionalSymptom = useCallback((s: string) => {
    setEmotionalSymptoms((prev) => {
      const adding = !prev.includes(s);
      if (adding && !state.selectedSymptoms.includes(s)) {
        const updated = recordAdhocSymptom(state, s);
        saveAppState(updated);
        setAppState(updated);
      }
      return adding ? [...prev, s] : prev.filter((x) => x !== s);
    });
  }, [state]);

  const toggleSleepSymptom = (s: string) => {
    setSleepSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handlePromoteSymptom = (symptom: string) => {
    const updated = addSymptomToProfile(state, symptom);
    saveAppState(updated);
    setAppState(updated);
    toast.success(`"${symptom}" added to your profile`);
  };

  const handleDismissPromotion = (symptom: string) => {
    const updated = dismissSymptomPromotion(state, symptom);
    saveAppState(updated);
    setAppState(updated);
  };

  const handleLog = () => {
    const current = getAppState();
    const todayStr = getToday();

    const summary = generateSummary({
      mood: committedMood,
      mentalMood: committedMentalMood,
      sleepQuality: committedSleep,
      physicalSymptoms,
      emotionalSymptoms,
      sleepSymptoms,
      symptoms,
      cycleStatus,
      notes
    });

    current.logs = current.logs.filter((l) => l.date !== todayStr);
    current.logs.push({
      date: todayStr,
      mood: committedMood,
      mentalMood: committedMentalMood,
      sleepQuality: committedSleep,
      symptoms,
      physicalSymptoms,
      emotionalSymptoms,
      sleepSymptoms,
      newSymptomFlags,
      cycleStatus,
      notes,
      generatedSummary: summary
    });

    // Track adhoc counts for new symptom flags
    newSymptomFlags.forEach((s) => {
      if (!current.selectedSymptoms.includes(s)) {
        const counts = { ...current.adhocSymptomCounts };
        counts[s] = (counts[s] || 0) + 1;
        current.adhocSymptomCounts = counts;
      }
    });
    current.rollingMeans = {
      physical: calculateRollingMean(current.logs, "mood"),
      mental: calculateRollingMean(current.logs, "mentalMood")
    };
    saveAppState(current);
    setAppState(current);
    setLogged(true);
    setGeneratedSummary(summary);
    setShowConfirmation(true);
  };

  const handleConfirmationSelect = (response: "yes" | "mostly" | "not-quite") => {
    setConfirmationResponse(response);
    if (response === "yes") {
      saveConfirmation(response, "");
      setConfirmationDone(true);
    }
  };

  const handleConfirmationDone = () => {
    if (confirmationResponse) {
      saveConfirmation(confirmationResponse, confirmationFeedback);
    }
    setConfirmationDone(true);
  };

  const saveConfirmation = (response: "yes" | "mostly" | "not-quite", feedback: string) => {
    const current = getAppState();
    const todayStr = getToday();
    const logIndex = current.logs.findIndex((l) => l.date === todayStr);
    if (logIndex !== -1) {
      current.logs[logIndex].confirmationResponse = response;
      if (feedback.trim()) {
        current.logs[logIndex].confirmationFeedback = feedback;
      }
      saveAppState(current);
      setAppState(current);
    }
  };

  const moodLabels: Record<number, string> = {
    1: "Very poor", 2: "Rough", 3: "Okay", 4: "Good", 5: "Great"
  };

  const mentalMoodLabels: Record<number, string> = {
    1: "Very poor", 2: "Struggling", 3: "Okay", 4: "Good", 5: "Great"
  };

  const sleepLabels: Record<number, string> = {
    1: "Very poor", 2: "Poor", 3: "Okay", 4: "Good", 5: "Great"
  };

  const physicalTagsToShow = showAllPhysical ?
  ALL_PHYSICAL_SYMPTOMS :
  physicalProfileTags;

  const emotionalTagsToShow = showAllEmotional ?
  ALL_EMOTIONAL_SYMPTOMS :
  emotionalProfileTags;

  // --- Confirmation State ---
  if (showConfirmation) {
    return (
      <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Log confirmation">
        <header>
          <h1 className="text-2xl font-serif text-foreground mb-1">Check-in Complete</h1>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Here's how today sounds based on what you shared.
          </p>
        </header>

        {/* Generated Summary */}
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-5">
            <p className="text-sm text-foreground leading-relaxed">
              {generatedSummary}
            </p>
          </CardContent>
        </Card>

        {!confirmationDone &&
        <>
            {/* Confirmation Prompt */}
            <p className="text-sm font-semibold text-foreground mb-4">
              Does this feel like an accurate reflection of your day?
            </p>

            {/* Response Chips */}
            <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Confirmation response">
              {[
            { key: "yes" as const, label: "Yes, that captures it" },
            { key: "mostly" as const, label: "Mostly" },
            { key: "not-quite" as const, label: "Not quite" }].
            map(({ key, label }) =>
            <button
              key={key}
              onClick={() => handleConfirmationSelect(key)}
              aria-pressed={confirmationResponse === key}
              className={`min-h-[44px] px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
              confirmationResponse === key ?
              "bg-primary text-primary-foreground shadow-md" :
              "bg-secondary text-secondary-foreground"}`
              }>
              
                  {label}
                </button>
            )}
            </div>

            {/* Conditional Follow-up */}
            {(confirmationResponse === "mostly" || confirmationResponse === "not-quite") &&
          <div className="space-y-4 animate-fade-in">
                <div>
                  <label htmlFor="confirmation-feedback" className="text-sm font-medium text-muted-foreground block mb-2">
                    What did we miss?
                  </label>
                  <Textarea
                id="confirmation-feedback"
                value={confirmationFeedback}
                onChange={(e) => setConfirmationFeedback(e.target.value)}
                placeholder="Anything you'd like to add or correct..."
                className="bg-card border-border rounded-2xl min-h-[80px] resize-none" />
              
                </div>
                <Button
              onClick={handleConfirmationDone}
              className="w-full h-14 text-base rounded-2xl font-semibold"
              size="lg">
              
                  Done
                </Button>
              </div>
          }
          </>
        }

        {/* Affirming Close */}
        {confirmationDone &&
        <Card className="border-none bg-shift-lavender animate-fade-in">
            <CardContent className="p-5 text-center">
              <Check className="w-6 h-6 text-primary mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-foreground font-medium">
                Got it. See you tomorrow.
              </p>
            </CardContent>
          </Card>
        }
      </main>);

  }

  // --- Main Log Form ---
  return (
    <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Daily check-in">
      {/* Streak */}
      <div className="flex items-center gap-2 mb-6" aria-label={streak > 0 ? `${streak}-day logging streak` : "No streak yet"}>
        <Flame className="w-5 h-5 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold text-foreground">
          {streak > 0 ? `${streak}-day streak` : "Start your streak today"}
        </span>
      </div>

      <header>
        <h1 className="text-2xl font-serif text-foreground mb-1">Daily Check-in</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Under 2 minutes. Consistency matters more than detail.
        </p>
      </header>

      {logged && !showConfirmation &&
      <Card className="mb-6 bg-shift-lavender border-none" role="status">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-primary" aria-hidden="true" />
            <p className="text-sm text-foreground">You've already logged today. You can update it below.</p>
          </CardContent>
        </Card>
      }

      {/* Symptom promotion prompts */}
      {promotionCandidates.length > 0 &&
      <div className="mb-6 space-y-3">
          {promotionCandidates.map((symptom) =>
        <Card key={symptom} className="bg-shift-lavender border-none animate-fade-in">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <p className="text-sm text-foreground leading-relaxed mb-3">
                      It looks like <strong>{symptom}</strong> has been coming up regularly — would you like to add it to your profile?
                    </p>
                    <div className="flex gap-2">
                      <Button
                    size="sm"
                    onClick={() => handlePromoteSymptom(symptom)}
                    className="rounded-xl min-h-[44px] font-medium">
                    
                        Add to profile
                      </Button>
                      <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDismissPromotion(symptom)}
                    className="rounded-xl min-h-[44px] font-medium text-muted-foreground">
                    
                        Not now
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
        )}
        </div>
      }

      <div className="space-y-8">
        {/* Physical Mood */}
        <fieldset>
          <legend className="text-sm font-semibold text-foreground block mb-3">Physically, how are you feeling today?</legend>
          <div className="flex gap-2 mb-2" role="radiogroup" aria-label={`Physical feeling: ${mood} out of 5, ${moodLabels[mood]}`}>
            {[1, 2, 3, 4, 5].map((n) =>
            <button
              key={n}
              onClick={() => {setMood(n);setCommittedMood(n);}}
              aria-pressed={mood === n}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
              mood === n ?
              "bg-primary text-primary-foreground shadow-md scale-105" :
              "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`
              }>
              
                {n}
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground" aria-hidden="true">
            <span>Very poor</span>
            <span />
            <span className="font-medium text-foreground text-center">{moodLabels[mood]}</span>
            <span />
            <span className="text-right">Great</span>
          </div>

          {/* Conditional physical symptom tags */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
            showPhysicalTags ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}`
            }
            role="group"
            aria-label="Physical symptoms flaring today">
            
            <label className="text-sm font-medium text-muted-foreground block mb-3" id="physical-flare-label">
              Anything flaring today?
            </label>
            <div className="flex flex-wrap gap-2" aria-labelledby="physical-flare-label">
              {physicalTagsToShow.map((s) =>
              <button
                key={s}
                onClick={() => togglePhysicalSymptom(s)}
                aria-pressed={physicalSymptoms.includes(s)}
                className={`min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                physicalSymptoms.includes(s) ?
                "bg-primary text-primary-foreground shadow-md" :
                "bg-secondary text-secondary-foreground"}`
                }>
                
                  {s}
                </button>
              )}
              {!showAllPhysical &&
              <button
                onClick={() => setShowAllPhysical(true)}
                className="min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium bg-accent text-accent-foreground flex items-center gap-1.5 transition-all hover:bg-accent/80"
                aria-label="Show all physical symptoms">
                
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add something else
                </button>
              }
            </div>
          </div>
        </fieldset>

        <Separator className="bg-border/50" />

        {/* Mental/Emotional */}
        <fieldset>
          <legend className="text-sm font-semibold text-foreground block mb-3">Mentally & emotionally, how are you feeling?</legend>
          <div className="flex gap-2 mb-2" role="radiogroup" aria-label={`Mental feeling: ${mentalMood} out of 5, ${mentalMoodLabels[mentalMood]}`}>
            {[1, 2, 3, 4, 5].map((n) =>
            <button
              key={n}
              onClick={() => {setMentalMood(n);setCommittedMentalMood(n);}}
              aria-pressed={mentalMood === n}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
              mentalMood === n ?
              "bg-primary text-primary-foreground shadow-md scale-105" :
              "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`
              }>
              
                {n}
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground" aria-hidden="true">
            <span>Very poor</span>
            <span />
            <span className="font-medium text-foreground text-center">{mentalMoodLabels[mentalMood]}</span>
            <span />
            <span className="text-right">Great</span>
          </div>

          {/* Conditional emotional symptom tags */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
            showEmotionalTags ? "max-h-[500px] opacity-100 mt-4" : "max-h-0 opacity-0"}`
            }
            role="group"
            aria-label="Emotional symptoms flaring today">
            
            <label className="text-sm font-medium text-muted-foreground block mb-3" id="emotional-flare-label">
              Anything flaring today?
            </label>
            <div className="flex flex-wrap gap-2" aria-labelledby="emotional-flare-label">
              {emotionalTagsToShow.map((s) =>
              <button
                key={s}
                onClick={() => toggleEmotionalSymptom(s)}
                aria-pressed={emotionalSymptoms.includes(s)}
                className={`min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                emotionalSymptoms.includes(s) ?
                "bg-primary text-primary-foreground shadow-md" :
                "bg-secondary text-secondary-foreground"}`
                }>
                
                  {s}
                </button>
              )}
              {!showAllEmotional &&
              <button
                onClick={() => setShowAllEmotional(true)}
                className="min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium bg-accent text-accent-foreground flex items-center gap-1.5 transition-all hover:bg-accent/80"
                aria-label="Show all emotional symptoms">
                
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Add something else
                </button>
              }
            </div>
          </div>
        </fieldset>

        <Separator className="bg-border/50" />

        {/* Sleep */}
        <fieldset>
          <legend className="text-sm font-semibold text-foreground block mb-3">
            How did you sleep?
          </legend>
          <div className="flex gap-2 mb-2" role="radiogroup" aria-label={`Sleep quality: ${sleep} out of 5, ${sleepLabels[sleep]}`}>
            {[1, 2, 3, 4, 5].map((n) =>
            <button
              key={n}
              onClick={() => {setSleep(n);setCommittedSleep(n);}}
              aria-pressed={sleep === n}
              className={`flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-all ${
              sleep === n ?
              "bg-primary text-primary-foreground shadow-md scale-105" :
              "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`
              }>
              
                {n}
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground" aria-hidden="true">
            <span>Very poor</span>
            <span />
            <span className="font-medium text-foreground text-center">{sleepLabels[sleep]}</span>
            <span />
            <span className="text-right">Great

            </span>
          </div>

          {/* Conditional sleep symptom tags */}
          <div className={`overflow-hidden transition-all duration-300 ease-out ${showSleepTags ? "max-h-[300px] opacity-100 mt-4" : "max-h-0 opacity-0"}`
          }
          role="group"
          aria-label="Sleep issues">
            
            <label className="text-sm font-medium text-muted-foreground block mb-3" id="sleep-flare-label">
              What was off about your sleep?
            </label>
            <div className="flex flex-wrap gap-2" aria-labelledby="sleep-flare-label">
              {SLEEP_SYMPTOMS.map((s) =>
              <button
                key={s}
                onClick={() => toggleSleepSymptom(s)}
                aria-pressed={sleepSymptoms.includes(s)}
                className={`min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                sleepSymptoms.includes(s) ?
                "bg-primary text-primary-foreground shadow-md" :
                "bg-secondary text-secondary-foreground"}`
                }>
                
                  {s}
                </button>
              )}
            </div>
          </div>
        </fieldset>

        <Separator className="bg-border/50" />

        {/* Cycle */}
        <fieldset>
          <legend className="text-sm font-semibold text-foreground block mb-3">
            Cycle status
          </legend>
          <div className="flex gap-2" role="radiogroup" aria-label="Cycle status selection">
            {(["none", "spotting", "period"] as const).map((status) =>
            <button
              key={status}
              onClick={() => setCycleStatus(status)}
              role="radio"
              aria-checked={cycleStatus === status}
              className={`min-h-[44px] px-5 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
              cycleStatus === status ?
              "bg-primary text-primary-foreground shadow-md" :
              "bg-secondary text-secondary-foreground"}`
              }>
              
                {status === "none" ? "None" : status}
              </button>
            )}
          </div>
        </fieldset>

        <Separator className="bg-border/50" />

        {/* Notes */}
        <div>
          <label htmlFor="daily-notes" className="text-sm font-semibold text-foreground block mb-3">
            Anything else to note?
          </label>
          <Textarea
            id="daily-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How you're feeling, what happened today..."
            className="bg-card border-border rounded-2xl min-h-[100px] resize-none" />
          
        </div>
        {/* New symptom flag button + panel */}
        <div>
          <Button
            variant="outline"
            onClick={() => setShowNewSymptomPanel((prev) => !prev)}
            className="w-full h-12 rounded-2xl font-medium text-sm border-border"
            aria-expanded={showNewSymptomPanel}
            aria-label="I noticed some new symptoms today">
            
            <Plus className="w-4 h-4 mr-2" aria-hidden="true" />
            I noticed some new symptoms today
          </Button>

          {/* Expandable panel */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-out ${
            showNewSymptomPanel ? "max-h-[2000px] opacity-100 mt-4" : "max-h-0 opacity-0"}`
            }>
            
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-4">
                {Object.entries(SYMPTOM_CATEGORIES).map(([category, categorySymptoms]) =>
                <div key={category}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      {category}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(categorySymptoms as readonly string[]).map((s) => {
                      const inProfile = state.selectedSymptoms.includes(s);
                      const selected = newSymptomFlags.includes(s);
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            if (inProfile) return;
                            setNewSymptomFlags((prev) =>
                            prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
                            );
                          }}
                          disabled={inProfile}
                          aria-pressed={selected}
                          className={`min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                          inProfile ?
                          "bg-muted/50 text-muted-foreground/40 cursor-not-allowed" :
                          selected ?
                          "bg-primary text-primary-foreground shadow-md" :
                          "bg-secondary text-secondary-foreground"}`
                          }>
                          
                            {s}
                            {inProfile && <span className="ml-1 text-xs">(in profile)</span>}
                          </button>);

                    })}
                    </div>
                  </div>
                )}

                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowNewSymptomPanel(false);
                    // Trigger immediate profile prompts for newly flagged symptoms
                    if (newSymptomFlags.length > 0) {
                      setNewSymptomPrompts([...newSymptomFlags]);
                    }
                  }}
                  className="w-full h-11 rounded-2xl font-medium text-sm">
                  
                  Done
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* New symptom profile prompts */}
        {newSymptomPrompts.length > 0 &&
        <div className="space-y-3 animate-fade-in">
            {newSymptomPrompts.map((symptom) =>
          <Card key={symptom} className="bg-shift-lavender border-none">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        It looks like <strong>{symptom}</strong> is something you're noticing. Would you like to add it to your profile so it's easier to track going forward?
                      </p>
                      <div className="flex gap-2">
                        <Button
                      size="sm"
                      onClick={() => {
                        handlePromoteSymptom(symptom);
                        setNewSymptomPrompts((prev) => prev.filter((s) => s !== symptom));
                      }}
                      className="rounded-xl min-h-[44px] font-medium">
                      
                          Add to profile
                        </Button>
                        <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNewSymptomPrompts((prev) => prev.filter((s) => s !== symptom));
                      }}
                      className="rounded-xl min-h-[44px] font-medium text-muted-foreground">
                      
                          Just for today
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
          )}
          </div>
        }

        <Button
          onClick={handleLog}
          className="w-full h-14 text-base rounded-2xl font-semibold"
          size="lg"
          aria-label={logged ? "Update today's log entry" : "Save today's log entry"}>
          
          {logged ? "Update Today's Log" : "Log Today"}
        </Button>
      </div>
    </main>);

};

export default DailyLog;