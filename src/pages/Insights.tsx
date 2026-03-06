import { Card, CardContent } from "@/components/ui/card";
import { getAppState } from "@/lib/storage";
import { Brain, Thermometer, Moon, TrendingDown, Info } from "lucide-react";

const mockInsights = [
  {
    icon: Brain,
    title: "Mood & Sleep Connection",
    observation: "Your anxiety and sleep disruptions tend to spike in the same 3-day window.",
    explanation: "During the menopausal transition, fluctuating estrogen and progesterone levels can disrupt sleep architecture and affect cortisol regulation. When these hormones shift, sleep quality and anxiety often move together — which is why these symptoms frequently cluster.",
    action: "This pattern is worth mentioning to your doctor. Sharing when these episodes occur can help them assess whether a hormonal factor may be involved and whether targeted support could help.",
  },
  {
    icon: Thermometer,
    title: "Symptom Clustering",
    observation: "Hot flashes, night sweats, and fatigue appear to be showing up together in your logs.",
    explanation: "These are vasomotor symptoms — driven by changes in the brain's thermoregulatory center as estrogen levels fluctuate. When the body's internal thermostat becomes less stable, heat episodes and the resulting sleep disruption can compound into daytime fatigue.",
    action: "Tracking the timing and frequency of these clusters gives your doctor a clearer picture. It can help them distinguish hormonal patterns from other causes and consider whether treatment options may be appropriate.",
  },
  {
    icon: TrendingDown,
    title: "Pre-Cycle Mood Pattern",
    observation: "Your mood ratings appear to dip in the days leading up to your cycle.",
    explanation: "In the late luteal phase, progesterone drops sharply. During perimenopause, these drops can become more pronounced and less predictable, which may amplify mood sensitivity in the days before a period — even if this wasn't an issue before.",
    action: "Noting these mood shifts alongside your cycle timing can help your doctor evaluate whether luteal-phase hormonal changes are contributing. This context helps them recommend the right next steps for you.",
  },
];

const Insights = () => {
  const state = getAppState();
  const hasEnoughData = state.logs.length >= 7;

  return (
    <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Pattern insights">
      <header>
        <h1 className="text-2xl font-serif text-foreground mb-2">Pattern Insights</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Your body is telling a story. Here's what we're noticing.
        </p>
      </header>

      <Card className="mb-6 bg-shift-lavender border-none" role="status">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {hasEnoughData
              ? "These insights are based on your logged data. They're observations — not diagnoses — and they're designed to help you have better conversations with your doctor."
              : `Insights appear after 7–14 days of logging. You've logged ${state.logs.length} day${state.logs.length !== 1 ? "s" : ""} so far — keep going!`}
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-label="Insight cards">
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
                <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0" aria-hidden="true">
                  <insight.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-foreground mb-1">{insight.title}</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{insight.text}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {!hasEnoughData && (
        <div className="mt-8 text-center" role="status">
          <Moon className="w-8 h-8 text-muted mx-auto mb-3" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            Log a few more days and patterns will emerge.
          </p>
        </div>
      )}
    </main>
  );
};

export default Insights;
