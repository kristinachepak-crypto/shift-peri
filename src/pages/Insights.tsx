import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { getAppState, DailyLog } from "@/lib/storage";
import { Brain, Thermometer, TrendingDown, Info, Sparkles } from "lucide-react";

const mockInsights = [
  {
    icon: Brain,
    title: "Mood & Sleep Connection",
    observation: "Your anxiety and sleep seem to flare up around the same time — often within the same few days.",
    explanation: "When estrogen and progesterone shift, they can affect both how you sleep and how you feel emotionally. It's not uncommon for these two things to move together, especially during perimenopause — your body isn't making this up.",
    action: "This could be a really useful thing to bring to your doctor. If you can show them when these episodes cluster, it helps them figure out whether something hormonal might be at play.",
  },
  {
    icon: Thermometer,
    title: "Symptom Clustering",
    observation: "Hot flashes, night sweats, and fatigue keep showing up together in your logs — that's not a coincidence.",
    explanation: "These are all connected to how your body regulates temperature. When estrogen fluctuates, your internal thermostat can become less stable — the heat episodes disrupt sleep, and the sleep disruption feeds into daytime exhaustion. It's a cycle a lot of people recognize.",
    action: "Sharing this cluster with your doctor could be really helpful. It gives them a fuller picture and makes it easier to figure out the right kind of support.",
  },
  {
    icon: TrendingDown,
    title: "Pre-Cycle Mood Pattern",
    observation: "Your mood seems to dip in the days just before your cycle — you might already feel this happening.",
    explanation: "In the days before a period, progesterone drops. During perimenopause, that drop can become steeper and less predictable, which can make mood feel more fragile than it used to — even if this is new for you.",
    action: "Mentioning these mood shifts alongside your cycle timing gives your doctor something concrete to work with. It can help them understand whether hormonal changes might be part of the picture.",
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
  if (logs.length === 0) return "Once you start logging, we'll begin picking up on what matters to you.";

  const symptomCounts: Record<string, number> = {};
  logs.forEach((log) => {
    const allSymptoms = [
      ...(log.symptoms || []),
      ...(log.physicalSymptoms || []),
      ...(log.emotionalSymptoms || []),
      ...(log.sleepSymptoms || []),
    ];
    allSymptoms.forEach((s) => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  });

  const sorted = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);
  const recurring = sorted.filter(([, count]) => count >= 2);

  if (recurring.length >= 2) {
    const top = recurring.slice(0, 2).map(([name]) => name.toLowerCase());
    return `${top[0]} and ${top[1]} have come up more than once already. A few more days and we'll start to see if there's a rhythm to it.`;
  }

  if (recurring.length === 1) {
    return `${recurring[0][0]} has come up ${recurring[0][1]} times in your first ${logs.length} logs. That's the kind of thing that becomes really useful to track over a week.`;
  }

  const avgMood = logs.reduce((a, l) => a + l.mood, 0) / logs.length;
  return `You've been rating your physical wellbeing around ${avgMood.toFixed(1)} out of 10 most days. A few more entries and we'll have a better sense of what might be behind that.`;
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
            ? "Here's something worth paying attention to."
            : "Your story is just getting started — every check-in adds a little more."}
        </p>
      </header>

      {hasEnoughData && (
        <>
          <Card className="mb-6 bg-shift-lavender border-none" role="status">
            <CardContent className="p-4 flex items-start gap-3">
              <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                These are things we've picked up from your logs — not diagnoses, just patterns that might be worth exploring with your doctor.
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
                Day {Math.min(daysLogged, 7)} of 7 — your first insights are almost here.
              </p>
            </CardContent>
          </Card>

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

          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {dataReflection}
              </p>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground/70 italic">
            The more you log, the clearer your picture becomes.
          </p>
        </section>
      )}
    </main>
  );
};

export default Insights;