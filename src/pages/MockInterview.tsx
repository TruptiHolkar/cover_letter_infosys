import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import DashboardLayout from "@/components/DashboardLayout";
import { Mic, MicOff, RotateCcw, ChevronRight, CheckCircle, Star, Loader2, Volume2, Brain } from "lucide-react";

interface Question { id: number; text: string; }
interface Answer { question: string; answer: string; score: number; feedback: string; }

const DOMAINS = ["Software Engineering", "Data Science", "Product Management", "Marketing", "Finance", "HR/People Ops", "Sales", "Design (UX/UI)", "Operations", "Business Analyst"];
const INTERVIEW_TYPES = ["General Behavioral", "Technical Deep-Dive", "STAR Method", "Case Study", "Leadership & Management"];

// ─── Speech Recognition helpers ───
type SpeechRecognitionInstance = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const getSpeechRecognition = (): SpeechRecognitionInstance | null => {
  if (typeof window === "undefined") return null;
  const Ctor = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition
    || (window as Window & { webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
};

// ─── Score Ring Component ───
const ScoreRing = ({ score, size = 80 }: { score: number; size?: number }) => {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#eab308" : "#ef4444";
  const r = size / 2 - 8;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth="6" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${filled} ${circ}`} strokeLinecap="round" />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size * 0.22} fontWeight="700"
        style={{ transform: `rotate(90deg) translate(0, -${size}px)`, transformOrigin: "center" }}>
        {score}
      </text>
    </svg>
  );
};

// ─── Main Component ───
const MockInterviewPage = () => {
  const { toast } = useToast();

  // Setup state
  const [domain, setDomain] = useState("");
  const [skills, setSkills] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [resumeText, setResumeText] = useState("");

  // Interview state
  const [phase, setPhase] = useState<"setup" | "interview" | "results">("setup");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);

  useEffect(() => {
    const rec = getSpeechRecognition();
    if (!rec) { setSpeechSupported(false); return; }
    setSpeechSupported(true);
  }, []);

  const startRecording = useCallback(async () => {
    const rec = getSpeechRecognition();
    if (!rec) {
      toast({ title: "Not supported", description: "Speech recognition is not available in this browser. Please type your answer.", variant: "destructive" });
      return;
    }

    // Request mic permission explicitly first
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      toast({ title: "Microphone blocked", description: "Please allow microphone access in your browser settings and try again.", variant: "destructive" });
      return;
    }

    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";

    let finalTranscript = currentAnswer;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscript += e.results[i][0].transcript + " ";
        else interim = e.results[i][0].transcript;
      }
      setCurrentAnswer(finalTranscript + interim);
      setTranscript(finalTranscript + interim);
    };
    rec.onerror = (e: Event) => {
      const err = (e as ErrorEvent & { error?: string }).error;
      setIsRecording(false);
      if (err === "not-allowed") {
        toast({ title: "Microphone access denied", description: "Please allow microphone access in your browser settings.", variant: "destructive" });
      } else if (err === "no-speech") {
        toast({ title: "No speech detected", description: "No speech was detected. Please try again.", variant: "destructive" });
      } else {
        toast({ title: "Recording error", description: "An error occurred while recording. Please try again.", variant: "destructive" });
      }
    };
    rec.onend = () => { setIsRecording(false); };

    recognitionRef.current = rec;
    try {
      rec.start();
      setIsRecording(true);
    } catch {
      toast({ title: "Recording failed", description: "Could not start recording. Please try again.", variant: "destructive" });
    }
  }, [currentAnswer, toast]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    setIsRecording(false);
  }, []);

  // Fetch 10 questions from AI
  const handleStart = async () => {
    if (!domain || !interviewType) {
      toast({ title: "Missing fields", description: "Please select a domain and interview type.", variant: "destructive" });
      return;
    }
    setIsLoadingQuestions(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          mode: "generate_questions",
          domain,
          skills,
          interviewType,
          resumeText,
        }),
      });

      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || "Failed to load questions"); }

      const data = await resp.json();
      const qs: Question[] = (data.questions as string[]).map((text, i) => ({ id: i + 1, text }));
      setQuestions(qs);
      setCurrentQ(0);
      setAnswers([]);
      setCurrentAnswer("");
      setPhase("interview");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // Evaluate current answer and move to next
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim()) {
      toast({ title: "No answer", description: "Please record or type your answer first.", variant: "destructive" });
      return;
    }
    if (isRecording) stopRecording();
    setIsEvaluating(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mock-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({
          mode: "evaluate_answer",
          question: questions[currentQ].text,
          answer: currentAnswer,
          domain,
          interviewType,
        }),
      });

      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error || "Evaluation failed"); }

      const data = await resp.json();
      const newAnswer: Answer = {
        question: questions[currentQ].text,
        answer: currentAnswer,
        score: data.score ?? 70,
        feedback: data.feedback ?? "",
      };

      const updated = [...answers, newAnswer];
      setAnswers(updated);

      if (currentQ + 1 < questions.length) {
        setCurrentQ(currentQ + 1);
        setCurrentAnswer("");
        setTranscript("");
      } else {
        setPhase("results");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setPhase("setup");
    setQuestions([]);
    setCurrentQ(0);
    setAnswers([]);
    setCurrentAnswer("");
    setTranscript("");
    if (isRecording) stopRecording();
  };

  const avgScore = answers.length > 0 ? Math.round(answers.reduce((a, b) => a + b.score, 0) / answers.length) : 0;

  // ── SETUP SCREEN ──
  if (phase === "setup") return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">AI Mock Interview</h1>
          <p className="text-muted-foreground mt-1">Practice with 10 AI-generated questions, record your answers, and get scored instantly.</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-8 space-y-5">
          <div className="flex justify-center mb-2">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-8 h-8 text-primary" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Domain / Field *</Label>
            <Select value={domain} onValueChange={setDomain}>
              <SelectTrigger><SelectValue placeholder="Select your domain" /></SelectTrigger>
              <SelectContent>
                {DOMAINS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Key Skills <span className="text-xs text-muted-foreground">(comma separated)</span></Label>
            <Input value={skills} onChange={e => setSkills(e.target.value)} placeholder="e.g. React, Node.js, System Design, Leadership" />
          </div>

          <div className="space-y-1.5">
            <Label>Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger><SelectValue placeholder="Select interview style" /></SelectTrigger>
              <SelectContent>
                {INTERVIEW_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Your Resume <span className="text-xs text-muted-foreground">(optional – for personalized questions)</span></Label>
            <Textarea value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Paste your resume content here for tailored questions..." className="min-h-[80px] resize-none" />
          </div>

          <div className="bg-secondary/40 rounded-lg p-3 flex items-start gap-3">
            <Mic className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">You'll answer 10 questions either by <strong className="text-foreground">voice recording</strong> (mic button) or typing. Each answer is evaluated and scored by AI.</p>
          </div>

          <Button onClick={handleStart} disabled={isLoadingQuestions} className="w-full bg-gradient-gold text-primary-foreground font-semibold h-11">
            {isLoadingQuestions ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating questions...</> : <><ChevronRight className="w-4 h-4 mr-2" />Start Interview (10 Questions)</>}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );

  // ── INTERVIEW SCREEN ──
  if (phase === "interview") {
    const q = questions[currentQ];
    const progress = ((currentQ) / questions.length) * 100;

    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-3xl mx-auto flex flex-col gap-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Mock Interview</h1>
              <p className="text-sm text-muted-foreground">{domain} · {interviewType}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground"><RotateCcw className="w-4 h-4 mr-1" />Exit</Button>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Question {currentQ + 1} of {questions.length}</span>
              <span className="text-primary font-medium">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question card */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-primary font-bold text-sm">{currentQ + 1}</span>
              </div>
              <p className="text-foreground text-lg leading-relaxed font-medium">{q.text}</p>
            </div>

            {/* Answer textarea */}
            <div className="space-y-3">
              <Textarea
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here, or use the mic button to speak..."
                className="min-h-[140px] resize-none text-sm"
                disabled={isEvaluating}
              />

              {/* Controls */}
              <div className="flex items-center gap-3">
                {speechSupported ? (
                  <Button
                    variant={isRecording ? "destructive" : "outline"}
                    size="sm"
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isEvaluating}
                    className={isRecording ? "animate-pulse" : ""}
                  >
                    {isRecording ? <><MicOff className="w-4 h-4 mr-2" />Stop Recording</> : <><Mic className="w-4 h-4 mr-2" />Record Answer</>}
                  </Button>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Volume2 className="w-3 h-3" />Speech recognition not supported — please type.
                  </div>
                )}

                {isRecording && (
                  <span className="flex items-center gap-1.5 text-xs text-destructive">
                    <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />Recording...
                  </span>
                )}

                <Button
                  onClick={handleSubmitAnswer}
                  disabled={isEvaluating || !currentAnswer.trim()}
                  className="ml-auto bg-gradient-gold text-primary-foreground font-semibold"
                >
                  {isEvaluating
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Evaluating...</>
                    : currentQ + 1 === questions.length
                    ? <><CheckCircle className="w-4 h-4 mr-2" />Submit & Finish</>
                    : <><ChevronRight className="w-4 h-4 mr-2" />Submit & Next</>}
                </Button>
              </div>
            </div>
          </div>

          {/* Previous answers mini-list */}
          {answers.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Completed</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {answers.map((a, i) => (
                  <div key={i} className="bg-secondary/40 rounded-lg px-3 py-2 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                    <span className={`text-xs font-bold ${a.score >= 80 ? "text-green-400" : a.score >= 60 ? "text-yellow-400" : "text-red-400"}`}>{a.score}/100</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // ── RESULTS SCREEN ──
  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold text-foreground">Interview Results</h1>
          <Button variant="outline" size="sm" onClick={handleReset}><RotateCcw className="w-4 h-4 mr-2" />New Interview</Button>
        </div>

        {/* Overall score */}
        <div className="bg-card border border-border rounded-xl p-8 flex flex-col sm:flex-row items-center gap-6">
          <div className="relative">
            <ScoreRing score={avgScore} size={120} />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Overall Score: {avgScore}/100</h2>
            <p className="text-muted-foreground mt-1">{domain} · {interviewType} · 10 questions</p>
            <div className="flex gap-2 mt-3 flex-wrap">
              {avgScore >= 80 && <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Excellent</Badge>}
              {avgScore >= 60 && avgScore < 80 && <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Good</Badge>}
              {avgScore < 60 && <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Needs Work</Badge>}
              {skills && skills.split(",").slice(0, 3).map(s => <Badge key={s} variant="outline" className="text-xs">{s.trim()}</Badge>)}
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-foreground">Question Breakdown</h3>
          {answers.map((a, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="shrink-0">
                  <ScoreRing score={a.score} size={56} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-muted-foreground uppercase">Q{i + 1}</span>
                    <div className="flex">
                      {[1,2,3,4,5].map(s => <Star key={s} className={`w-3 h-3 ${s <= Math.round(a.score / 20) ? "text-primary fill-primary" : "text-muted-foreground"}`} />)}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-2">{a.question}</p>
                  <div className="bg-secondary/30 rounded-lg p-3 mb-3">
                    <p className="text-xs text-muted-foreground mb-1 font-medium">Your Answer:</p>
                    <p className="text-sm text-foreground/80 leading-relaxed">{a.answer}</p>
                  </div>
                  {a.feedback && (
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-primary font-medium mb-1">AI Feedback:</p>
                      <p className="text-sm text-foreground/80 leading-relaxed">{a.feedback}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MockInterviewPage;
