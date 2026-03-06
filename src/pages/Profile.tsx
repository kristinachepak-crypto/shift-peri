import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getAppState, saveAppState, getToday,
  getNextAssessmentDate, isAssessmentDue,
  SYMPTOM_CATEGORIES,
} from "@/lib/storage";
import { Heart, CalendarClock, ClipboardCheck, Settings, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const Profile = () => {
  const navigate = useNavigate();
  const [state, setState] = useState(getAppState());
  const [reassessing, setReassessing] = useState(false);
  const [selected, setSelected] = useState<string[]>([...state.selectedSymptoms]);

  const nextDate = getNextAssessmentDate(state);
  const assessmentDue = isAssessmentDue(state);

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
    <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Profile">
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Shift</span>
        </div>
        <h1 className="text-2xl font-serif text-foreground">Your Profile</h1>
      </header>

      {/* Assessment due banner */}
      {assessmentDue && (
        <Card className="mb-6 bg-shift-lavender border-none animate-fade-in" role="status">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">Time to reassess</p>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Your patterns may have shifted — update your symptom profile to keep your daily log relevant.
                </p>
                <Button
                  onClick={() => setReassessing(true)}
                  size="sm"
                  className="rounded-xl font-semibold min-h-[44px]"
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
      <section aria-labelledby="symptom-profile-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
            <h2 id="symptom-profile-heading" className="text-lg font-serif text-foreground">
              Symptom Profile
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setReassessing(true)}
            className="text-primary text-sm font-medium min-h-[44px]"
            aria-label="Edit symptom profile"
          >
            Edit
          </Button>
        </div>
        {state.selectedSymptoms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {state.selectedSymptoms.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-sm font-medium bg-secondary text-secondary-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No symptoms selected yet.</p>
        )}
      </section>

      <Separator className="bg-border/50 mb-8" />

      {/* Assessment History */}
      <section aria-labelledby="assessment-history-heading" className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="assessment-history-heading" className="text-lg font-serif text-foreground">
            Assessment History
          </h2>
        </div>
        {state.assessments.length > 0 ? (
          <div className="space-y-3">
            {[...state.assessments].reverse().map((assessment, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    {formatDate(assessment.date)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {assessment.symptoms.length} symptom{assessment.symptoms.length !== 1 ? "s" : ""} tracked
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {assessment.symptoms.slice(0, 5).map((s) => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        {s}
                      </span>
                    ))}
                    {assessment.symptoms.length > 5 && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                        +{assessment.symptoms.length - 5} more
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Your onboarding assessment is your first record. Future reassessments will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="bg-border/50 mb-8" />

      {/* Upcoming Assessment */}
      <section aria-labelledby="upcoming-assessment-heading" className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="upcoming-assessment-heading" className="text-lg font-serif text-foreground">
            Upcoming Assessment
          </h2>
        </div>
        {nextDate ? (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-foreground font-semibold mb-1">
                {assessmentDue ? "Due now" : formatDate(nextDate)}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {assessmentDue
                  ? "Your monthly reassessment is ready. Tap \"Update Profile\" above to review your symptoms."
                  : "We'll remind you to review your symptom profile. Your patterns may shift over time — this helps keep your daily log relevant."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">
                Complete onboarding to schedule your first reassessment.
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator className="bg-border/50 mb-8" />

      {/* Account Settings */}
      <section aria-labelledby="settings-heading">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-4 h-4 text-primary" aria-hidden="true" />
          <h2 id="settings-heading" className="text-lg font-serif text-foreground">
            Settings
          </h2>
        </div>
        <div className="space-y-3">
          <Button
            variant="outline"
            onClick={() => setReassessing(true)}
            className="w-full justify-start h-12 rounded-xl text-sm font-medium"
            aria-label="Reassess symptoms now"
          >
            Reassess symptoms now
          </Button>
          <Button
            variant="outline"
            onClick={handleClearData}
            className="w-full justify-start h-12 rounded-xl text-sm font-medium text-destructive hover:text-destructive"
            aria-label="Clear all data"
          >
            Clear all data
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Profile;
