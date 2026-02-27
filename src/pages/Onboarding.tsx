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
    state.onboardingComplete = true;
    state.selectedSymptoms = selected;
    saveAppState(state);
    navigate("/log");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-32">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">Shift</span>
        </div>
        <h1 className="text-3xl font-serif text-foreground mb-2">
          What have you been experiencing?
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Select everything that resonates. There are no wrong answers here.
        </p>

        <div className="space-y-6">
          {Object.entries(SYMPTOM_CATEGORIES).map(([category, symptoms]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {category}
              </h2>
              <div className="flex flex-wrap gap-2">
                {symptoms.map((symptom) => (
                  <button
                    key={symptom}
                    onClick={() => toggle(symptom)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      selected.includes(symptom)
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {symptom}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {showAffirmation && (
          <Card className="mt-8 bg-shift-lavender border-none animate-fade-in">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
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
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-background/80 backdrop-blur-lg border-t border-border">
          <div className="max-w-[430px] mx-auto">
            <Button
              onClick={handleContinue}
              className="w-full h-14 text-base rounded-2xl font-semibold"
              size="lg"
            >
              Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Onboarding;
