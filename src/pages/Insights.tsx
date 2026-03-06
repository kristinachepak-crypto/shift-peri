import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAppState, DailyLog } from "@/lib/storage";
import { Brain, Thermometer, TrendingDown, Info, Sparkles } from "lucide-react";

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

function getStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let streak = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].date);
    const curr = new Date(sorted[i].date);
    const diff = (prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24);
    if (Math.round(diff) === 1) streak++;
    else break;
  }
  return streak;
}

function generateDataReflection(logs: DailyLog[]): string {
  if (logs.length === 0) return "Start logging to see your patterns take shape.";

  // Check for recurring symptoms
  const symptomCounts: Record<string, number> = {};
  logs.forEach((log) => {
    [...log.symptoms, ...log.physicalSymptoms, ...log.emotionalSymptoms, ...log.sleepSymptoms].forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const sorted = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
  const recurring = sorted.filter(([, count]) => count >= 2);

  if (recurring.length >= 2) {
    const top = recurring.slice(0, 2).map(([name]) => name.toLowerCase());
    return `You've mentioned ${top[0]} and ${top[1]} on multiple days. Patterns like these start to become clearer around day 7.`;
  }

  if (recurring.length === 1) {
    return `${recurring[0][0]} has shown up in ${recurring[0][1]} of your ${logs.length} logs so far. Keep going — context builds quickly.`;
  }

  // Fall back to slider data
  const avgMood = logs.reduce((a, l) => a + l.mood, 0) / logs.length;
  return `Your physical well-being ratings have averaged ${avgMood.toFixed(1)} out of 10 so far. A few more days will help us understand what's driving that.`;
}

const Insights = () => {
  const state = getAppState();
  const hasEnoughData = state.logs.length >= 7;
  const daysLogged = state.logs.length;
  const streak = useMemo(() => getStreak(state.logs), [state.logs]);
  const dataReflection = useMemo(() => generateDataReflection(state.logs), [state.logs]);

  return (
    <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Pattern insights">
      <header>
        <h1 className="text-2xl font-serif text-foreground mb-2">Pattern Insights</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          {hasEnoughData
            ? "Your body is telling a story. Here's what we're noticing."
            : "Your insights are building — every log adds detail."}
        </p>
      </header>

      {hasEnoughData && (
        <>
          <Card className="mb-6 bg-shift-lavender border-none" role="status">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                These insights are based on your logged data. They're observations — not diagnoses — and they're designed to help you have better conversations with your doctor.
              </p>
            </CardContent>
          </Card>

          <section className="space-y-4" aria-label="Insight cards">
            {mockInsights.map((insight, i) => (
              <Card
                key={i}
                className="border-none shadow-sm animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <div className="w-11 h-11 rounded-xl bg-secondary flex items-center justify-center shrink-0" aria-hidden="true">
                      <insight.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm text-foreground mb-1.5">{insight.title}</h2>
                      <p className="text-sm text-foreground/90 leading-relaxed mb-2">{insight.observation}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2">{insight.explanation}</p>
                      <p className="text-sm text-primary/80 leading-relaxed italic">{insight.action}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </>
      )}

      {!hasEnoughData && (
        <section className="space-y-6" aria-label="Insights progress">
          {/* Progress track */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-1.5 mb-3" role="progressbar" aria-valuenow={daysLogged} aria-valuemin={0} aria-valuemax={7} aria-label={`Day ${daysLogged} of 7`}>
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                      i < daysLogged ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-foreground font-medium">
                Day {Math.min(daysLogged, 7)} of 7 — your first insights are on their way.
              </p>
            </CardContent>
          </Card>

          {/* Streak */}
          {streak > 0 && (
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary">
                <Sparkles className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                <span className="text-xs font-semibold text-foreground">{streak}-day streak</span>
              </div>
              {streak === daysLogged && daysLogged > 1 && (
                <p className="text-xs text-muted-foreground">You're building something real.</p>
              )}
            </div>
          )}

          {/* Data reflection */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dataReflection}
              </p>
            </CardContent>
          </Card>

          {/* Closing prompt */}
          <p className="text-center text-xs text-muted-foreground/70 italic">
            The more you log, the clearer your picture becomes.
          </p>
        </section>
      )}
    </main>
  );
};

export default Insights;