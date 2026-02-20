import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, FileText, Zap, Target, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: FileText,
    title: "Resume Parsing",
    description: "Paste your resume and our AI extracts key skills, achievements, and experience automatically.",
  },
  {
    icon: Target,
    title: "Job Matching",
    description: "Our agent analyzes job descriptions to identify exact requirements and keyword matches.",
  },
  {
    icon: Zap,
    title: "Instant Generation",
    description: "Get a polished, ATS-optimized cover letter in seconds — tailored to every application.",
  },
];

const benefits = [
  "Under 400 words, ATS-optimized",
  "Highlights measurable achievements",
  "Matches company culture & tone",
  "Never copies your resume verbatim",
  "Sounds human, not robotic",
  "Save & download as PDF",
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50 bg-background/80">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <span className="font-display text-lg font-bold text-foreground">CoverCraft AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild className="bg-gradient-gold text-primary-foreground font-semibold">
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-secondary border border-border rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="text-sm text-secondary-foreground">AI-Powered Career Tool</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold text-foreground leading-tight max-w-4xl mx-auto">
            Cover letters that
            <span className="text-gradient-gold"> land interviews</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto leading-relaxed">
            Paste your resume and a job description. Our AI agent crafts a perfectly tailored, 
            ATS-optimized cover letter in seconds.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Button size="lg" asChild className="bg-gradient-gold text-primary-foreground font-semibold px-8 h-12 text-base animate-glow-pulse">
              <Link to="/auth">
                Start for Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
            How it works
          </h2>
          <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
            Three simple steps to a cover letter that stands out.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-4">
                <feature.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-12 max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display text-3xl font-bold text-foreground mb-4">
                Built for real job seekers
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Our AI agent thinks like a senior recruiter — matching your skills to what 
                hiring managers actually look for.
              </p>
            </div>
            <div className="space-y-3">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3">
                  <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-foreground text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-display text-sm font-semibold text-foreground">CoverCraft AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 CoverCraft AI</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
