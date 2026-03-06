import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { getAppState, saveAppState, getStreak, getToday, todayAlreadyLogged } from "@/lib/storage";
import { Flame, Star, Check } from "lucide-react";
import { toast } from "sonner";

const PHYSICAL_SYMPTOMS = [
"Hot flashes", "Heart palpitations", "Joint pain", "Fatigue",
"Headaches", "Weight changes", "Muscle tension", "Dizziness", "Nausea"];

const EMOTIONAL_SYMPTOMS = [
"Anxiety", "Irritability", "Mood swings", "Brain fog", "Depression",
"Rage", "Tearfulness", "Low motivation", "Overwhelm"];


const DailyLog = () => {
  const state = getAppState();
  const [mood, setMood] = useState(5);
  const [sleep, setSleep] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [physicalSymptoms, setPhysicalSymptoms] = useState<string[]>([]);
  const [cycleStatus, setCycleStatus] = useState<"period" | "spotting" | "none">("none");
  const [notes, setNotes] = useState("");
  const [logged, setLogged] = useState(todayAlreadyLogged(state.logs));

  const streak = getStreak(state.logs);

  const toggleSymptom = (s: string) => {
    setSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const togglePhysicalSymptom = (s: string) => {
    setPhysicalSymptoms((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  };

  const handleLog = () => {
    const current = getAppState();
    const todayStr = getToday();
    current.logs = current.logs.filter((l) => l.date !== todayStr);
    current.logs.push({ date: todayStr, mood, sleepQuality: sleep, symptoms, cycleStatus, notes });
    saveAppState(current);
    setLogged(true);
    toast.success("Today's log saved ✨");
  };

  const moodLabels: Record<number, string> = {
    1: "Really rough", 2: "Struggling", 3: "Not great", 4: "Meh", 5: "Okay",
    6: "Decent", 7: "Pretty good", 8: "Good", 9: "Great", 10: "Amazing"
  };

  return (
    <div className="min-h-screen bg-background px-6 pt-8 pb-28">
      {/* Streak */}
      <div className="flex items-center gap-2 mb-6">
        <Flame className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          {streak > 0 ? `${streak}-day streak` : "Start your streak today"}
        </span>
      </div>

      <h1 className="text-2xl font-serif text-foreground mb-1">Daily Check-in</h1>
      <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
        Under 2 minutes. Consistency matters more than detail.
      </p>

      {logged &&
      <Card className="mb-6 bg-shift-lavender border-none">
          <CardContent className="p-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-primary" />
            <p className="text-sm text-foreground">You've already logged today. You can update it below.</p>
          </CardContent>
        </Card>
      }

      <div className="space-y-8">
        {/* Mood */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">Physically, how are you feeling today?

          </label>
          <Slider
            value={[mood]}
            onValueChange={(v) => setMood(v[0])}
            min={1}
            max={10}
            step={1}
            className="mb-2" />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>1</span>
            <span className="font-medium text-foreground">{mood} — {moodLabels[mood]}</span>
            <span>10</span>
          </div>
          {/* Physical Symptoms */}
          <div className="mt-4">
            <label className="text-sm font-semibold text-foreground block mb-3">Physical symptoms

            </label>
            <div className="flex flex-wrap gap-2">
              {PHYSICAL_SYMPTOMS.map((s) =>
              <button
                key={s}
                onClick={() => togglePhysicalSymptom(s)}
                className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                physicalSymptoms.includes(s) ?
                "bg-primary text-primary-foreground shadow-md" :
                "bg-secondary text-secondary-foreground"}`
                }>
                  {s}
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">
            Sleep quality
          </label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) =>
            <button key={n} onClick={() => setSleep(n)} className="transition-transform hover:scale-110">
                <Star
                className={`w-8 h-8 ${n <= sleep ? "text-primary fill-primary" : "text-muted"}`} />
              
              </button>
            )}
          </div>
        </div>

        {/* Symptoms */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">
            Today's symptoms
          </label>
          <div className="flex flex-wrap gap-2">
            {state.selectedSymptoms.map((s) =>
            <button
              key={s}
              onClick={() => toggleSymptom(s)}
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
              symptoms.includes(s) ?
              "bg-primary text-primary-foreground shadow-md" :
              "bg-secondary text-secondary-foreground"}`
              }>
              
                {s}
              </button>
            )}
          </div>
        </div>

        {/* Cycle */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">
            Cycle status
          </label>
          <div className="flex gap-2">
            {(["none", "spotting", "period"] as const).map((status) =>
            <button
              key={status}
              onClick={() => setCycleStatus(status)}
              className={`px-4 py-2.5 rounded-full text-sm font-medium capitalize transition-all ${
              cycleStatus === status ?
              "bg-primary text-primary-foreground shadow-md" :
              "bg-secondary text-secondary-foreground"}`
              }>
              
                {status === "none" ? "None" : status}
              </button>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-foreground block mb-3">
            Anything else to note?
          </label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How you're feeling, what happened today..."
            className="bg-card border-border rounded-2xl min-h-[100px] resize-none" />
          
        </div>

        <Button
          onClick={handleLog}
          className="w-full h-14 text-base rounded-2xl font-semibold"
          size="lg">
          
          {logged ? "Update Today's Log" : "Log Today"}
        </Button>
      </div>
    </div>);

};

export default DailyLog;