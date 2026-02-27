import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getAppState } from "@/lib/storage";
import { FileText, Copy, Download, Check } from "lucide-react";
import { toast } from "sonner";

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
  } out of 10. These patterns may be worth discussing with your healthcare provider to explore hormonal changes.`;

  const clinicalSummary = `Patient reports ${totalDays}-day symptom log. Primary complaints: ${
    rows.slice(0, 3).map((r) => r.name).join(", ") || "N/A"
  }. Mean subjective mood score: ${
    totalDays > 0
      ? (state.logs.reduce((a, l) => a + l.mood, 0) / totalDays).toFixed(1)
      : "N/A"
  }/10. Symptom frequency suggests possible perimenopausal vasomotor and neuropsychiatric manifestations. Recommend hormonal panel (FSH, estradiol, progesterone) and clinical correlation.`;

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
    <div className="min-h-screen bg-background px-6 pt-8 pb-28">
      <div className="flex items-center gap-2 mb-2">
        <FileText className="w-5 h-5 text-primary" />
        <h1 className="text-2xl font-serif text-foreground">Doctor Report</h1>
      </div>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        A pre-appointment export you can print or share — so your doctor sees the full picture, not just a snapshot.
      </p>

      {/* Days logged indicator */}
      <p className="text-sm text-muted-foreground mb-3">
        Based on <span className="font-semibold text-foreground">{totalDays} {totalDays === 1 ? "day" : "days"}</span> of logged data.
      </p>

      {/* Symptom Table */}
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

      {/* Key Patterns */}
      {patterns.length > 0 && (
        <Card className="border-none shadow-sm mb-6">
          <CardContent className="p-5">
            <h3 className="font-semibold text-sm text-foreground mb-3">Key Patterns</h3>
            <ul className="space-y-2">
              {patterns.map((p, i) => (
                <li key={i} className="text-sm text-muted-foreground flex gap-2">
                  <span className="text-primary">•</span>
                  {p}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      <Card className="border-none shadow-sm mb-6">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">Summary</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Clinical</span>
              <Switch checked={clinical} onCheckedChange={setClinical} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {clinical ? clinicalSummary : plainSummary}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          className="flex-1 h-14 rounded-2xl font-semibold"
          size="lg"
        >
          <Download className="w-4 h-4 mr-2" />
          Download Report
        </Button>
        <Button
          onClick={handleCopy}
          variant="secondary"
          className="h-14 rounded-2xl px-6"
          size="lg"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
};

export default Report;
