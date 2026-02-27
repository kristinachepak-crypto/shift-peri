import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, TrendingUp, FileText, Sparkles } from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "Track what matters",
    description: "Log mood, sleep, symptoms & cycle in under 2 minutes a day.",
  },
  {
    icon: TrendingUp,
    title: "See your patterns",
    description: "AI-powered insights reveal connections you might not expect.",
  },
  {
    icon: FileText,
    title: "Own your story",
    description: "Generate a doctor-ready report so you walk in prepared, not dismissed.",
  },
];

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col px-6 pt-16 pb-28">
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-serif text-foreground">Shift</span>
      </div>

      <h1 className="text-3xl font-serif text-foreground mb-3 leading-tight">
        You're not imagining it.
        <br />
        Let's make sense of it.
      </h1>
      <p className="text-muted-foreground leading-relaxed mb-10">
        Shift is your personal perimenopause companion — helping you track symptoms, uncover patterns, and feel heard by your doctor.
      </p>

      <div className="space-y-5 mb-12">
        {features.map((feature) => (
          <div key={feature.title} className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <feature.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-0.5 font-sans">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto">
        <Button
          onClick={() => navigate("/onboarding")}
          className="w-full h-14 text-base rounded-2xl font-semibold"
          size="lg"
        >
          Get Started
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-4">
          No account needed · Your data stays on your device
        </p>
      </div>
    </div>
  );
};

export default Welcome;
