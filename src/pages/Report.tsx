import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAppState } from "@/lib/storage";
import { FileText, Copy, Download, Check, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const clinicalTermMap: Record<string, string> = {
  "Hot flashes": "Vasomotor symptoms (hot flashes)",
  "Night sweats": "Vasomotor symptoms (night sweats)",
  "Mood swings": "Affective lability",
  "Anxiety": "Generalized anxiety symptoms",
  "Brain fog": "Cognitive dysfunction (subjective)",
  "Fatigue": "Fatigue / asthenia",
  "Insomnia": "Sleep disturbance",
  "Joint pain": "Arthralgia",
  "Low libido": "Decreased libido",
  "Weight gain": "Weight change",
  "Irritability": "Irritability / affective dysregulation",
  "Depression": "Depressive symptoms",
  "Hair thinning": "Alopecia (diffuse)",
  "Dry skin": "Xerosis",
  "Heart palpitations": "Palpitations",
  "Headaches": "Cephalgia",
  "Bloating": "Abdominal distension",
  "Irregular periods": "Menstrual irregularity",
  "Heavy periods": "Menorrhagia",
};

const mapToClinical = (name: string): string => clinicalTermMap[name] || name;

const Report = () => {
  const [clinical, setClinical] = useState(false);
  const [copied, setCopied] = useState(false);
  const state = getAppState();

  // Build frequency data from logs
  const symptomFreq: Record<string, { count: number; total: number }> = {};
  state.logs.forEach((log) => {
    log.symptoms.forEach((s) => {
      if (!symptomFreq[s]) symptomFreq[s] = { count: 0, total: 0 };
      symptomFreq[s].count++;
      symptomFreq[s].total += log.mood;
    });
  });

  const totalDays = state.logs.length;
  const rows = Object.entries(symptomFreq)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([name, data]) => ({
      name,
      days: data.count,
      severity: totalDays > 0 ? Math.round((data.count / totalDays) * 100) : 0,
    }));

  const plainSummary = `Over ${totalDays} days of tracking, the most frequently reported symptoms include ${
    rows.slice(0, 3).map((r) => r.name.toLowerCase()).join(", ") || "none yet"
  }. Mood ratings average around ${
    totalDays > 0
      ? (state.logs.reduce((a, l) => a + l.mood, 0) / totalDays).toFixed(1)
      : "—"
  } out of 5. These patterns may be worth discussing with your healthcare provider to explore hormonal changes.`;

  const clinicalSummary = `Self-reported symptom log over ${totalDays} days. Primary reported symptoms: ${
    rows.slice(0, 3).map((r) => mapToClinical(r.name)).join(", ") || "N/A"
  }. Mean subjective well-being score: ${
    totalDays > 0
      ? (state.logs.reduce((a, l) => a + l.mood, 0) / totalDays).toFixed(1)
      : "N/A"
  }/10. Symptom pattern may be consistent with the menopausal transition (STRAW+10 stages −2 to +1a). Reported vasomotor symptoms and neuropsychiatric features may warrant evaluation. Consider hormonal panel (FSH, estradiol) and clinical correlation per STRAW+10 staging criteria.`;

  const patterns = [
    rows.length > 0 ? `${rows[0].name} was the most frequently reported symptom (${rows[0].days} of ${totalDays} days).` : null,
    state.logs.some((l) => l.cycleStatus !== "none")
      ? "Cycle irregularities were noted during the tracking period."
      : null,
    totalDays >= 7
      ? "Mood scores show variation that may correlate with cycle timing."
      : null,
  ].filter(Boolean);

  const fullReport = `SHIFT — Symptom Report\n${"=".repeat(30)}\n\nDays Tracked: ${totalDays}\n\nSymptom Frequency:\n${
    rows.map((r) => `  ${r.name}: ${r.days} days (${r.severity}%)`).join("\n")
  }\n\nKey Patterns:\n${patterns.map((p) => `  • ${p}`).join("\n")}\n\nSummary:\n${clinical ? clinicalSummary : plainSummary}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullReport);
    setCopied(true);
    toast.success("Report copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullReport], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shift-report-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report downloaded");
  };

  return (
    <main className="min-h-screen bg-background px-6 pt-8 pb-28" aria-label="Doctor report">
      <header>
        <div className="flex items-center gap-2 mb-2">
          <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-serif text-foreground">Doctor Report</h1>
        </div>
        <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
          A pre-appointment export you can print or share — so your doctor sees the full picture, not just a snapshot.
        </p>
        <Card className="border-border/50 bg-muted/50 mb-6">
          <CardContent className="p-3 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              This report was generated from self-reported data and is intended to support clinical conversation, not replace clinical assessment.
            </p>
          </CardContent>
        </Card>
      </header>

      {/* Days logged indicator */}
      <p className="text-sm text-muted-foreground mb-3">
        Based on <span className="font-semibold text-foreground">{totalDays} {totalDays === 1 ? "day" : "days"}</span> of logged data.
      </p>

      {/* Symptom Table */}
      <section aria-label="Symptom frequency table">
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-xs font-semibold">Symptom</TableHead>
                  <TableHead className="text-xs font-semibold text-center">Days</TableHead>
                  <TableHead className="text-xs font-semibold text-right">Frequency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length > 0 ? (
                  rows.map((r) => (
                    <TableRow key={r.name} className="border-border">
                      <TableCell className="text-sm">{r.name}</TableCell>
                      <TableCell className="text-sm text-center">{r.days}</TableCell>
                      <TableCell className="text-sm text-right">{r.severity}%</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-8">
                      Start logging to build your report
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      {/* Key Patterns */}
      {patterns.length > 0 && (
        <section aria-label="Key patterns">
          <Card className="border-none shadow-sm mb-6">
            <CardContent className="p-5">
              <h2 className="font-semibold text-sm text-foreground mb-3">Key Patterns</h2>
              <ul className="space-y-2">
                {patterns.map((p, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary" aria-hidden="true">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Language Toggle */}
      <section aria-label="Summary language toggle" className="mb-4">
        <Card className="border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Summary Language</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {clinical ? "Using clinical terminology for your provider" : "Using plain language — easy to read and understand"}
                </p>
              </div>
              <div className="flex items-center gap-2.5">
                <span className={`text-xs font-medium ${!clinical ? "text-foreground" : "text-muted-foreground"}`}>Plain</span>
                <Switch
                  id="clinical-toggle"
                  checked={clinical}
                  onCheckedChange={setClinical}
                  aria-label="Toggle between plain language and clinical terminology"
                  className="min-h-[44px] min-w-[44px]"
                />
                <span className={`text-xs font-medium ${clinical ? "text-foreground" : "text-muted-foreground"}`}>Clinical</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Summary */}
      <section aria-label="Report summary">
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-5">
            <h2 className="font-semibold text-sm text-foreground mb-3">Summary</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {clinical ? clinicalSummary : plainSummary}
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Actions */}
      <footer className="flex gap-3">
        <Button
          onClick={handleDownload}
          className="flex-1 h-14 rounded-2xl font-semibold"
          size="lg"
          aria-label="Download report as text file"
        >
          <Download className="w-4 h-4 mr-2" aria-hidden="true" />
          Download Report
        </Button>
        <Button
          onClick={handleCopy}
          variant="secondary"
          className="min-w-[56px] h-14 rounded-2xl px-6"
          size="lg"
          aria-label={copied ? "Report copied" : "Copy report to clipboard"}
        >
          {copied ? <Check className="w-4 h-4" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
        </Button>
      </footer>
    </main>
  );
};

export default Report;
