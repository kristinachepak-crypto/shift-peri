import { Card, CardContent } from "@/components/ui/card";
import { getAppState } from "@/lib/storage";
import { Brain, Thermometer, Moon, TrendingDown, Info } from "lucide-react";

const mockInsights = [
  {
    icon: Brain,
    title: "Mood & Sleep Connection",
    text: "Your anxiety and sleep disruptions tend to spike in the same 3-day window. This pattern is consistent with hormonal fluctuation during perimenopause.",
  },
  {
    icon: Thermometer,
    title: "Symptom Clustering",
    text: "Hot flashes, night sweats, and fatigue are showing up together — this clustering is a common hormonal signature. Tracking this helps your doctor see the full picture.",
  },
  {
    icon: TrendingDown,
    title: "Pre-Cycle Mood Pattern",
    text: "Your mood ratings drop in the days before your cycle. This is very common in perimenopause and worth discussing with your doctor.",
  },
];

const Insights = () => {
  const state = getAppState();
  const hasEnoughData = state.logs.length >= 7;

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-28">
      <h1 className="text-2xl font-serif text-foreground mb-2">Pattern Insights</h1>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        Your body is telling a story. Here's what we're noticing.
      </p>

      <Card className="mb-6 bg-shift-lavender border-none">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasEnoughData
              ? "These insights are based on your logged data. They're observations — not diagnoses — and they're designed to help you have better conversations with your doctor."
              : `Insights appear after 7–14 days of logging. You've logged ${state.logs.length} day${state.logs.length !== 1 ? "s" : ""} so far — keep going!`}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {mockInsights.map((insight, i) => (
          <Card
            key={i}
            className={`border-none shadow-sm animate-fade-in ${
              !hasEnoughData ? "opacity-50" : ""
            }`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <insight.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground mb-1">{insight.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasEnoughData && (
        <div className="mt-8 text-center">
          <Moon className="w-8 h-8 text-muted mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Log a few more days and patterns will emerge.
          </p>
        </div>
      )}
    </div>
  );
};

export default Insights;
