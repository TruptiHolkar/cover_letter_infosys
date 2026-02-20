import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { ShieldCheck, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

interface ATSResult {
  overallScore: number;
  keywordMatch: number;
  formatScore: number;
  readabilityScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

const ScoreRing = ({ score, label, size = "lg" }: { score: number; label: string; size?: "sm" | "lg" }) => {
  const color = score >= 75 ? "text-primary" : score >= 50 ? "text-yellow-500" : "text-destructive";
  const isLg = size === "lg";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`${isLg ? "w-24 h-24" : "w-16 h-16"} rounded-full border-4 ${score >= 75 ? "border-primary" : score >= 50 ? "border-yellow-500" : "border-destructive"} flex items-center justify-center bg-card`}>
        <span className={`${isLg ? "text-2xl" : "text-lg"} font-bold ${color}`}>{score}</span>
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
};

const ATSCheckerPage = () => {
  const { toast } = useToast();
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState<ATSResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheck = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast({ title: "Missing fields", description: "Please provide both resume and job description.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ats-checker`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ resumeText, jobDescription }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Check failed" }));
        throw new Error(err.error || "Check failed");
      }
      const data = await resp.json();
      setResult(data);
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
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">ATS Resume Checker</h1>
          <p className="text-muted-foreground mt-1">Analyze your resume against job requirements and get an ATS compatibility score.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Your Resume</Label>
              <Textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="Paste your resume text here..." className="min-h-[200px] resize-none" />
            </div>
            <div className="space-y-2">
              <Label>Job Description</Label>
              <Textarea value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste the job description here..." className="min-h-[200px] resize-none" />
            </div>
            <Button onClick={handleCheck} disabled={loading} className="w-full bg-gradient-gold text-primary-foreground font-semibold h-11">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</> : <><ShieldCheck className="w-4 h-4 mr-2" />Check ATS Score</>}
            </Button>
          </div>

          <div className="space-y-5">
            {loading && (
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">AI is analyzing your resume...</p>
              </div>
            )}
            {result && (
              <>
                {/* Scores */}
                <div className="bg-card border border-border rounded-xl p-6">
                  <h2 className="font-display text-lg font-semibold text-foreground mb-5">Score Overview</h2>
                  <div className="flex flex-wrap justify-around gap-4">
                    <ScoreRing score={result.overallScore} label="Overall Score" size="lg" />
                    <ScoreRing score={result.keywordMatch} label="Keyword Match" size="sm" />
                    <ScoreRing score={result.formatScore} label="Format" size="sm" />
                    <ScoreRing score={result.readabilityScore} label="Readability" size="sm" />
                  </div>
                  <p className="text-sm text-muted-foreground mt-5 text-center">{result.summary}</p>
                </div>

                {/* Keywords */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <h3 className="font-medium text-foreground text-sm">Matched Keywords</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matchedKeywords.map((kw) => (
                        <span key={kw} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <XCircle className="w-4 h-4 text-destructive" />
                      <h3 className="font-medium text-foreground text-sm">Missing Keywords</h3>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missingKeywords.map((kw) => (
                        <span key={kw} className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Strengths & Improvements */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" /> Strengths
                    </h3>
                    <ul className="space-y-1.5">
                      {result.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-primary mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4">
                    <h3 className="font-medium text-foreground text-sm mb-3 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-500" /> To Improve
                    </h3>
                    <ul className="space-y-1.5">
                      {result.improvements.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-yellow-500 mt-0.5">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
            {!result && !loading && (
              <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center justify-center gap-3 min-h-[300px] text-muted-foreground">
                <ShieldCheck className="w-10 h-10 opacity-30" />
                <p className="text-sm">Your ATS analysis will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ATSCheckerPage;
