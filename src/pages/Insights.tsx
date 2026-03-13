import { Card, CardContent } from "@/components/ui/card";
import { Info, Lightbulb, MessageCircle } from "lucide-react";

const insightCards = [
  {
    badge: "Apple Health + Self-reported",
    stat: "78% co-occurrence rate",
    pattern:
      "Sleep disruption and mood changes co-occur on 78% of nights logged",
    explanation:
      "This pattern is consistent with estrogen-related disruption of serotonin and cortisol regulation — the same hormonal shift affects both sleep architecture and mood stability.",
    prompt:
      "Could my sleep and mood symptoms have a common hormonal driver worth treating together?",
  },
  {
    badge: "Apple Health + Self-reported",
    stat: "23% below your monthly average",
    pattern:
      "Your sleep quality this week is 23% below your monthly baseline, and brain fog scores follow within 24 hours",
    explanation:
      "Cognitive symptoms in perimenopause are frequently linked to sleep architecture disruption rather than cognitive decline — poor sleep precedes brain fog consistently in your data.",
    prompt:
      "Is this the kind of brain fog that responds to sleep intervention or hormone therapy?",
  },
  {
    badge: "Self-reported",
    stat: "4 of the last 7 evenings",
    pattern:
      "Anxiety and heart palpitations are clustering in the evening, appearing together on 4 of the last 7 evenings",
    explanation:
      "Evening surges in anxiety and palpitations are a recognised but frequently overlooked perimenopause symptom, driven by declining estrogen's effect on the autonomic nervous system.",
    prompt:
      "Could my evening anxiety and heart palpitations be hormonal rather than stress or cardiac-related?",
  },
  {
    badge: "Self-reported",
    stat: "Logged 19 of 21 days",
    pattern:
      "Hair thinning and brittle nails have been logged on 19 of your 21 tracked days — one of your most consistent symptom patterns",
    explanation:
      "Estrogen drives keratin and collagen production. As estrogen declines during perimenopause, hair texture, volume, and nail integrity are among the earliest affected — and the most frequently attributed to stress or aging instead.",
    prompt:
      "Could my hair and nail changes be hormonal? These symptoms started around the same time as my other symptoms.",
  },
];

const Insights = () => {
  return (
    <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Pattern insights">
      <header>
        <h1 className="text-2xl font-serif text-foreground mb-2">Pattern Insights</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Here's something worth paying attention to.
        </p>
      </header>

      <Card className="mb-6 bg-shift-lavender border-none" role="status">
        <CardContent className="p-4 flex items-start gap-3">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            These are things we've picked up from your logs — not diagnoses, just patterns that might be worth exploring with your doctor.
          </p>
        </CardContent>
      </Card>

      <section className="space-y-4" aria-label="Insight cards">
        {insightCards.map((insight, i) => (
          <Card
            key={i}
            className="border-none shadow-sm animate-fade-in"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <CardContent className="p-5 space-y-3">
              <div className="flex flex-wrap items-start gap-2 mb-1">
                <p className="text-base font-bold text-primary leading-snug break-words">{insight.stat}</p>
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                  {insight.badge}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-foreground leading-snug">{insight.pattern}</p>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-6">
                {insight.explanation}
              </p>
              <div className="flex items-start gap-2 pl-6 pt-2 border-t border-border/50">
                <MessageCircle className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-xs text-primary font-medium italic leading-relaxed">
                  Ask your doctor: {insight.prompt}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
};

export default Insights;
