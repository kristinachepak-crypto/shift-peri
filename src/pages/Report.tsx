import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Download, Share2, Calendar, Activity, TrendingUp, Lightbulb, MessageCircle, Check, Watch, Heart } from "lucide-react";
import { toast } from "sonner";

const topSymptoms = [
  { name: "Sleep disruption", pct: 89 },
  { name: "Mood changes", pct: 82 },
  { name: "Brain fog", pct: 75 },
  { name: "Fatigue", pct: 71 },
  { name: "Night sweats", pct: 64 },
];

const plainInsights = [
  {
    badge: "Apple Health + Self-reported",
    stat: "78% co-occurrence rate",
    pattern:
      "Sleep disruption and mood changes co-occur on 78% of nights logged. Your Apple Health data shows average HRV drops to 28ms on these nights, compared to your 45ms baseline.",
    explanation:
      "HRV suppression and mood instability share a common driver — estrogen fluctuation disrupts both autonomic nervous system regulation and serotonin production simultaneously.",
    prompt:
      "My wearable data shows HRV drops significantly on my worst nights — could this be hormonally driven rather than stress-related?",
  },
  {
    badge: "Apple Health + Self-reported",
    stat: "23% below your monthly average",
    pattern:
      "Your Apple Health sleep data shows you're averaging 5.2 hours this week versus your 6.8 hour monthly baseline — a 23% drop that precedes brain fog scores within 24 hours.",
    explanation:
      "Cognitive symptoms in perimenopause are frequently linked to sleep architecture disruption rather than cognitive decline. Your data shows the lag consistently.",
    prompt:
      "My sleep tracker and symptom log show a consistent pattern — is this the kind of brain fog that responds to sleep intervention or hormone therapy?",
  },
];

const clinicalInsightText =
  "Neuropsychiatric and vasomotor symptom clustering consistent with STRAW+10 stages -2 to +1a. Sleep-mood co-occurrence rate 78% suggests HPA axis dysregulation. Recommend FSH and estradiol panel. Consider referral to menopause specialist.";

const Report = () => {
  const [clinical, setClinical] = useState(false);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleShare = async () => {
    const shareData = {
      title: "Shift — Symptom Report",
      text: "My Shift symptom report, prepared for my appointment.",
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 pt-8 pb-28" aria-label="Symptom report">
      {/* Toggle */}
      <div className="flex items-center justify-end gap-2 mb-6 print:hidden">
        <span className={`text-xs font-medium ${!clinical ? "text-foreground" : "text-muted-foreground"}`}>
          Plain Language
        </span>
        <Switch
          checked={clinical}
          onCheckedChange={setClinical}
          aria-label="Toggle between plain language and clinical view"
        />
        <span className={`text-xs font-medium ${clinical ? "text-foreground" : "text-muted-foreground"}`}>
          Clinical View
        </span>
      </div>

      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-serif text-primary tracking-tight">Shift</h1>
        <h2 className="text-xl font-serif text-foreground mt-1">Symptom Report</h2>
        <p className="text-sm text-muted-foreground mt-1">Prepared for your appointment</p>
        <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
      </header>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Days Tracked", value: "28", icon: Calendar },
          { label: "Symptoms Logged", value: "12", icon: Activity },
          { label: "Avg Wellbeing", value: "2.8/5", icon: TrendingUp },
        ].map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-secondary/60">
            <CardContent className="p-4 text-center">
              <stat.icon className="w-4 h-4 text-primary mx-auto mb-1.5" aria-hidden="true" />
              <p className="text-xl font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Symptoms */}
      <section className="mb-8">
        <h3 className="text-base font-serif text-foreground mb-4">Top Symptoms</h3>
        <Card className="border-none shadow-sm">
          <CardContent className="p-5 space-y-4">
            {topSymptoms.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm text-foreground font-medium">{s.name}</span>
                  <span className="text-xs text-muted-foreground font-semibold">{s.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* Pattern Insights */}
      <section className="mb-8">
        <h3 className="text-base font-serif text-foreground mb-4">Pattern Insights</h3>
        {clinical ? (
          <Card className="border-none shadow-sm bg-accent/40">
            <CardContent className="p-5">
              <p className="text-sm text-foreground leading-relaxed">{clinicalInsightText}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {plainInsights.map((insight, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <p className="text-lg font-bold text-primary leading-snug">{insight.stat}</p>
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
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <p className="text-[11px] text-muted-foreground text-center leading-relaxed mb-6 px-2">
        This report is generated from self-reported data and is intended to support clinical
        conversation, not replace clinical assessment.
      </p>

      {/* Action Buttons */}
      <div className="flex gap-3 print:hidden">
        <Button className="flex-1 h-14 rounded-2xl font-semibold" size="lg" onClick={() => window.print()}>
          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
          Download Report
        </Button>
        <Button variant="secondary" className="flex-1 h-14 rounded-2xl font-semibold" size="lg" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-2" aria-hidden="true" />
          Share Report
        </Button>
      </div>
    </main>
  );
};

export default Report;
