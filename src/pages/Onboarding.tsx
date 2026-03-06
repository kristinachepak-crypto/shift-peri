import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SYMPTOM_CATEGORIES, getAppState, saveAppState } from "@/lib/storage";
import { Heart, Sparkles } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [showAffirmation, setShowAffirmation] = useState(false);

  const toggle = (symptom: string) => {
    setSelected((prev) => {
      const next = prev.includes(symptom)
        ? prev.filter((s) => s !== symptom)
        : [...prev, symptom];
      if (next.length > 0 && !showAffirmation) setShowAffirmation(true);
      if (next.length === 0) setShowAffirmation(false);
      return next;
    });
  };

  const handleContinue = () => {
    const state = getAppState();
    const todayStr = new Date().toISOString().split("T")[0];
    state.onboardingComplete = true;
    state.onboardingDate = todayStr;
    state.selectedSymptoms = selected;
    state.assessments = [{ date: todayStr, symptoms: [...selected] }];
    saveAppState(state);
    navigate("/log");
  };

  return (
    <main className="min-h-screen bg-background flex flex-col" aria-label="Symptom selection">
      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-44">
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-5 h-5 text-primary" aria-hidden="true" />
            <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Shift</span>
          </div>
          <h1 className="text-3xl font-serif text-foreground mb-2">
            What have you been experiencing?
          </h1>
          <p className="text-muted-foreground leading-relaxed">
            Select everything that resonates — including things you may not have connected to hormones yet. There are no wrong answers here.
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
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>

        {showAffirmation && (
          <Card className="mt-8 bg-shift-lavender border-none animate-fade-in" role="status">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <div>
                  <p className="text-sm leading-relaxed text-foreground">
                    These symptoms are commonly associated with perimenopause.{" "}
                    <strong>You're not imagining this</strong> — and tracking them
                    is a powerful first step toward understanding what your body is
                    telling you.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {selected.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-6 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-[430px] mx-auto">
            <Button
              onClick={handleContinue}
              className="w-full h-14 text-base rounded-2xl font-semibold"
              size="lg"
              aria-label={`Continue with ${selected.length} symptom${selected.length !== 1 ? "s" : ""} selected`}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </main>
  );
};

export default Onboarding;
