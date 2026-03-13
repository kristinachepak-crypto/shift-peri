import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  getAppState, saveAppState, getToday,
  getNextAssessmentDate, isAssessmentDue,
  calculateRollingMean,
  SYMPTOM_CATEGORIES, DailyLog,
} from "@/lib/storage";
import { Heart, CalendarClock, ClipboardCheck, Settings, Sparkles, AlertCircle, Bug, Check, Watch, Radio } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const APP_VERSION = "0.4.0";
const IS_DEV = import.meta.env.DEV;

const TEST_PROFILE_SYMPTOMS = ["Anxiety", "Brain fog", "Fatigue", "Night sweats", "Hot flashes", "Insomnia", "Irritability", "Joint pain"];

function generateMockLogs(days: number): DailyLog[] {
  const logs: DailyLog[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const mood = Math.floor(Math.random() * 5) + 1;
    const mentalMood = Math.floor(Math.random() * 5) + 1;
    const sleepQuality = Math.floor(Math.random() * 5) + 1;

    const pickRandom = (arr: string[], count: number) => {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, Math.min(count, arr.length));
    };

    const physicalSymptoms = mood <= 2 ? pickRandom(["Hot flashes", "Fatigue", "Joint pain", "Night sweats"], 2) : [];
    const emotionalSymptoms = mentalMood <= 2 ? pickRandom(["Anxiety", "Brain fog", "Irritability"], 2) : [];
    const sleepSymptoms = sleepQuality <= 2 ? pickRandom(["Trouble falling asleep", "Woke during the night", "Unrefreshing sleep"], 1) : [];

    logs.push({
      date: dateStr,
      mood,
      mentalMood,
      sleepQuality,
      symptoms: [],
      physicalSymptoms,
      emotionalSymptoms,
      sleepSymptoms,
      newSymptomFlags: [],
      cycleStatus: Math.random() > 0.8 ? "period" : "none",
      notes: "",
    });
  }
  return logs;
}

const Profile = () => {
  const navigate = useNavigate();
  const [state, setState] = useState(getAppState());
  const [reassessing, setReassessing] = useState(false);
  const [selected, setSelected] = useState<string[]>([...state.selectedSymptoms]);
  const [expandedAssessments, setExpandedAssessments] = useState<Set<number>>(new Set());
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [mockDays, setMockDays] = useState(7);
  const devTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const devTapCountRef = useRef(0);
  const touchHandledRef = useRef(false);

  const nextDate = getNextAssessmentDate(state);
  const assessmentDue = isAssessmentDue(state);

  const physicalMean = calculateRollingMean(state.logs, "mood");
  const mentalMean = calculateRollingMean(state.logs, "mentalMood");

  const handleVersionTap = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    // On touch devices, onTouchEnd fires before onClick — skip the onClick
    if (e.type === 'touchend') {
      e.preventDefault();
      touchHandledRef.current = true;
      setTimeout(() => { touchHandledRef.current = false; }, 300);
    } else if (e.type === 'click' && touchHandledRef.current) {
      return;
    }
    devTapCountRef.current += 1;
    if (devTapTimer.current) clearTimeout(devTapTimer.current);
    devTapTimer.current = setTimeout(() => { devTapCountRef.current = 0; }, 2000);
    if (devTapCountRef.current >= 7) {
      setShowDevPanel((prev) => !prev);
      devTapCountRef.current = 0;
      if (!showDevPanel) toast("Developer panel unlocked 🔧");
    }
  }, [showDevPanel]);

  const handlePopulateMockData = () => {
    const current = getAppState();
    current.logs = generateMockLogs(mockDays);
    current.selectedSymptoms = TEST_PROFILE_SYMPTOMS;
    current.onboardingComplete = true;
    current.onboardingDate = current.logs[0]?.date || getToday();
    current.rollingMeans = {
      physical: calculateRollingMean(current.logs, "mood"),
      mental: calculateRollingMean(current.logs, "mentalMood"),
    };
    if (current.assessments.length === 0) {
      current.assessments.push({ date: current.onboardingDate, symptoms: [...TEST_PROFILE_SYMPTOMS] });
    }
    saveAppState(current);
    setState(getAppState());
    toast.success(`Populated ${mockDays} days of mock data`);
  };

  const handleResetToDay0 = () => {
    if (window.confirm("This will wipe ALL data and return to onboarding. Continue?")) {
      localStorage.removeItem("shift-app-data");
      navigate("/welcome");
    }
  };

  const toggle = (symptom: string) => {
    setSelected((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const handleSaveReassessment = () => {
    const current = getAppState();
    const todayStr = getToday();
    current.selectedSymptoms = selected;
    current.assessments.push({ date: todayStr, symptoms: [...selected] });
    saveAppState(current);
    setState(getAppState());
    setReassessing(false);
    toast.success("Symptom profile updated ✨");
  };

  const handleClearData = () => {
    if (window.confirm("This will erase all your data. Are you sure?")) {
      localStorage.removeItem("shift-app-data");
      navigate("/welcome");
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  if (reassessing) {
    return (
      <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Symptom reassessment">
        <header className="mb-6">
          <h1 className="text-2xl font-serif text-foreground mb-2">Update Your Symptom Profile</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Your patterns may have shifted. Select everything you're currently experiencing.
          </p>
        </header>

        <div className="space-y-6">
          {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
            <fieldset key={category}>
              <legend className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </legend>
              <div className="flex flex-wrap gap-2" role="group" aria-label={`${category} symptoms`}>
                {symptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => toggle(symptom)}
                    aria-pressed={selected.includes(symptom)}
                    className={`min-h-[44px] px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      selected.includes(symptom)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setSelected([...state.selectedSymptoms]);
              setReassessing(false);
            }}
            className="flex-1 h-14 rounded-2xl font-semibold"
            aria-label="Cancel reassessment"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveReassessment}
            className="flex-1 h-14 rounded-2xl font-semibold"
            aria-label="Save updated symptom profile"
          >
            Save Profile
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-5 pt-6 pb-24" aria-label="Profile">
      <header className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-primary" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Shift</span>
        </div>
        <h1 className="text-xl font-serif text-foreground">Your Profile</h1>
      </header>

      {/* Assessment due banner */}
      {assessmentDue && (
        <Card className="mb-5 bg-shift-lavender border-none animate-fade-in" role="status">
          <CardContent className="p-3">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">Time to reassess</p>
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                  Your patterns may have shifted — update your symptom profile.
                </p>
                <Button
                  onClick={() => setReassessing(true)}
                  size="sm"
                  className="rounded-xl font-semibold min-h-[40px] h-10"
                  aria-label="Start symptom reassessment"
                >
                  Update Profile
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Symptom Profile */}
      <section aria-labelledby="symptom-profile-heading" className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="symptom-profile-heading" className="text-base font-serif text-foreground">
              Symptom Profile
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReassessing(true)}
            className="text-primary text-xs font-medium min-h-[36px] h-9 px-2"
            aria-label="Edit symptom profile"
          >
            Edit
          </Button>
        </div>
        {state.selectedSymptoms.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {state.selectedSymptoms.map((s) => (
              <span
                key={s}
                className="px-2.5 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No symptoms selected yet.</p>
        )}
      </section>

      <Separator className="bg-border/50 mb-5" />

      {/* Assessment History */}
      <section aria-labelledby="assessment-history-heading" className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="assessment-history-heading" className="text-base font-serif text-foreground">
            Assessment History
          </h2>
        </div>
        {state.assessments.length > 0 ? (
          <div className="space-y-2">
            {[...state.assessments].reverse().map((assessment, i) => {
              const isExpanded = expandedAssessments.has(i);
              const hasMore = assessment.symptoms.length > 5;
              const visibleSymptoms = isExpanded ? assessment.symptoms : assessment.symptoms.slice(0, 5);

              return (
                <Card key={i} className="border-border/50">
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold text-foreground mb-0.5">
                      {formatDate(assessment.date)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {assessment.symptoms.length} symptom{assessment.symptoms.length !== 1 ? "s" : ""} tracked
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {visibleSymptoms.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                          {s}
                        </span>
                      ))}
                      {hasMore && (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedAssessments((prev) => {
                              const next = new Set(prev);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              return next;
                            });
                          }}
                          className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground min-h-[28px] cursor-pointer hover:bg-accent/80 transition-colors"
                          aria-expanded={isExpanded}
                          aria-label={isExpanded ? "Show fewer symptoms" : `Show ${assessment.symptoms.length - 5} more symptoms`}
                        >
                          {isExpanded ? "Show less" : `+${assessment.symptoms.length - 5} more`}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">
                Your onboarding assessment is your first record. Future reassessments will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="bg-border/50 mb-5" />

      {/* Upcoming Assessment */}
      <section aria-labelledby="upcoming-assessment-heading" className="mb-5">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="upcoming-assessment-heading" className="text-base font-serif text-foreground">
            Upcoming Assessment
          </h2>
        </div>
        {nextDate ? (
          <Card className="border-border/50">
            <CardContent className="p-3">
              <p className="text-sm text-foreground font-semibold mb-0.5">
                {assessmentDue ? "Due now" : formatDate(nextDate)}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {assessmentDue
                  ? "Your monthly reassessment is ready. Tap \"Update Profile\" above."
                  : "We'll remind you to review your symptom profile as patterns shift over time."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-3">
              <p className="text-sm text-muted-foreground">
                Complete onboarding to schedule your first reassessment.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="bg-border/50 mb-5" />

      {/* Data Sources */}
      <section aria-labelledby="data-sources-heading" className="mb-5">
        <div className="flex items-center gap-2 mb-1">
          <Radio className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="data-sources-heading" className="text-base font-serif text-foreground">
            Data Sources
          </h2>
        </div>
        <p className="text-xs text-muted-foreground mb-3 ml-6">
          Shift uses connected data to enrich your insights automatically.
        </p>
        <Card className="border-border/50">
          <CardContent className="p-3 space-y-3">
            {/* Apple Health */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Apple Health</p>
                  <p className="text-xs text-muted-foreground">Sleep · HRV · Activity</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium" style={{ color: 'hsl(150, 50%, 40%)' }}>
                <Check className="w-3.5 h-3.5" aria-hidden="true" />
                Connected
              </div>
            </div>
            <div className="border-t border-border/50" />
            {/* Oura Ring */}
            <div className="flex items-center justify-between opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Watch className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Oura Ring</p>
                  <p className="text-xs text-muted-foreground">Skin Temperature · Sleep Stages · Readiness</p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full whitespace-nowrap">
                Coming soon
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="bg-border/50 mb-5" />

      {/* Account Settings */}
      <section aria-labelledby="settings-heading">
        <div className="flex items-center gap-2 mb-3">
          <Settings className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="settings-heading" className="text-base font-serif text-foreground">
            Settings
          </h2>
        </div>
        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => setReassessing(true)}
            className="w-full justify-start h-11 rounded-xl text-sm font-medium"
            aria-label="Reassess symptoms now"
          >
            Reassess symptoms now
          </Button>
          <Button
            variant="outline"
            onClick={handleClearData}
            className="w-full justify-start h-11 rounded-xl text-sm font-medium text-destructive hover:text-destructive"
            aria-label="Clear all data"
          >
            Clear all data
          </Button>
        </div>
      </section>

      {/* Version number */}
      <div className="mt-8 text-center">
        <button
          onTouchEnd={handleVersionTap}
          onClick={handleVersionTap}
          className="text-xs text-muted-foreground/40 cursor-default select-none"
          style={{ touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none' }}
          data-testid="version-tap"
        >
          Shift v{APP_VERSION}
        </button>
      </div>

      {/* Developer Testing Panel */}
      {showDevPanel && (
        <section className="mt-6 animate-fade-in" aria-label="Developer testing panel">
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center gap-2 mb-1">
                <Bug className="w-4 h-4 text-primary" aria-hidden="true" />
                <h2 className="text-sm font-bold text-foreground">Developer Testing</h2>
              </div>
              <p className="text-xs text-destructive font-medium">
                Not visible in production.
              </p>

              {/* Rolling Mean Display */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rolling Means (7-day)</p>
                <div className="grid grid-cols-2 gap-2">
                  <Card className="border-border/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{physicalMean.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Physical</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-lg font-bold text-foreground">{mentalMean.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">Mental</p>
                    </CardContent>
                  </Card>
                </div>
                <p className="text-xs text-muted-foreground">
                  Days logged: <strong>{state.logs.length}</strong> · Phase: <strong>{state.logs.length >= 7 ? "2" : "1"}</strong>
                </p>
              </div>

              <Separator className="bg-border/50" />

              {/* Days logged override + populate */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mock Data</p>
                <div className="flex items-center gap-3">
                  <label htmlFor="mock-days" className="text-xs text-muted-foreground whitespace-nowrap">Days:</label>
                  <Input
                    id="mock-days"
                    type="number"
                    min={0}
                    max={30}
                    value={mockDays}
                    onChange={(e) => setMockDays(Math.min(30, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-20 h-10 text-center rounded-xl"
                  />
                  <Button
                    size="sm"
                    onClick={handlePopulateMockData}
                    className="rounded-xl min-h-[44px] flex-1 font-medium"
                  >
                    Populate mock data
                  </Button>
                </div>
              </div>

              <Separator className="bg-border/50" />

              {/* Reset */}
              <Button
                variant="destructive"
                onClick={handleResetToDay0}
                className="w-full h-12 rounded-xl font-semibold"
              >
                Reset to Day 0
              </Button>
            </CardContent>
          </Card>
        </section>
      )}
    </main>
  );
};

export default Profile;
