import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { TrendingUp, Loader2, CheckCircle, AlertCircle, XCircle, BookOpen } from "lucide-react";

interface Skill { skill: string; level: string; relevance: string; }
interface MissingSkill { skill: string; priority: string; timeToLearn: string; resources: string[]; }
interface RoadmapItem { week: number; focus: string; actions: string[]; }

interface SkillGapResult {
  matchScore: number;
  presentSkills: Skill[];
  missingSkills: MissingSkill[];
  transferableSkills: string[];
  roadmap: RoadmapItem[];
  summary: string;
}

const priorityColor = (p: string) => p === "critical" ? "text-destructive" : p === "important" ? "text-yellow-500" : "text-muted-foreground";
const relevanceIcon = (r: string) => r === "high" ? <CheckCircle className="w-3 h-3 text-primary" /> : r === "medium" ? <AlertCircle className="w-3 h-3 text-yellow-500" /> : <XCircle className="w-3 h-3 text-muted-foreground" />;
const levelBadge = (l: string) => ({ beginner: "bg-muted text-muted-foreground", intermediate: "bg-primary/10 text-primary", advanced: "bg-primary/20 text-primary" }[l] || "bg-muted text-muted-foreground");

const SkillGapPage = () => {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [result, setResult] = useState<SkillGapResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast({ title: "Missing fields", description: "Please provide both resume and job description.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/skill-gap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ resumeText, jobDescription, targetRole }),
      });
      if (!resp.ok) { const err = await resp.json().catch(() => ({ error: "Analysis failed" })); throw new Error(err.error || "Analysis failed"); }
      setResult(await resp.json());
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Skill Gap Analyser</h1>
          <p className="text-muted-foreground mt-1">Discover exactly which skills you need to land your target role.</p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-1.5">
              <Label>Target Role</Label>
              <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="e.g. Senior Data Scientist" />
            </div>
            <div className="space-y-1.5">
              <Label>Your Resume</Label>
              <Textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume..." className="min-h-[180px] resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Job Description</Label>
              <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description..." className="min-h-[180px] resize-none" />
            </div>
            <Button onClick={handleAnalyze} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold h-11">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><TrendingUp className="w-4 h-4 mr-2" />Analyse Gap</>}
            </Button>
          </div>

          <div className="lg:col-span-3 space-y-5">
            {loading && (
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Analysing your skill gaps...</p>
              </div>
            )}

            {result && (
              <>
                {/* Match Score */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-display text-lg font-semibold text-foreground">Match Score</h2>
                    <div className={`text-3xl font-bold ${result.matchScore >= 70 ? "text-primary" : result.matchScore >= 50 ? "text-yellow-500" : "text-destructive"}`}>
                      {result.matchScore}%
                    </div>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${result.matchScore >= 70 ? "bg-primary" : result.matchScore >= 50 ? "bg-yellow-500" : "bg-destructive"}`} style={{ width: `${result.matchScore}%` }} />
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">{result.summary}</p>
                </div>

                {/* Present & Missing Skills */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />Your Skills</h3>
                    <div className="space-y-2">
                      {result.presentSkills.slice(0, 8).map((s) => (
                        <div key={s.skill} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">{relevanceIcon(s.relevance)}<span className="text-xs text-foreground">{s.skill}</span></div>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${levelBadge(s.level)}`}>{s.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2"><XCircle className="w-4 h-4 text-destructive" />Missing Skills</h3>
                    <div className="space-y-2">
                      {result.missingSkills.map((s) => (
                        <div key={s.skill} className="space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-foreground">{s.skill}</span>
                            <span className={`text-xs font-medium ${priorityColor(s.priority)}`}>{s.priority}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">~{s.timeToLearn}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Transferable Skills */}
                {result.transferableSkills.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-foreground text-sm mb-3">Transferable Skills</h3>
                    <div className="flex flex-wrap gap-1.5">
                      {result.transferableSkills.map((s) => (
                        <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Roadmap */}
                {result.roadmap.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-foreground text-sm mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4 text-primary" />Learning Roadmap</h3>
                    <div className="space-y-3">
                      {result.roadmap.map((item) => (
                        <div key={item.week} className="flex gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">W{item.week}</div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.focus}</p>
                            <ul className="mt-1 space-y-0.5">
                              {item.actions.map((a, i) => <li key={i} className="text-xs text-muted-foreground">• {a}</li>)}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {!result && !loading && (
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-[300px] text-muted-foreground">
                <TrendingUp className="w-10 h-10 opacity-30" />
                <p className="text-sm">Your skill gap analysis will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SkillGapPage;
