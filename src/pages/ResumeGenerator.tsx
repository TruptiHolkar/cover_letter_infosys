import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Printer, FileText, Loader2, Sparkles, FileDown } from "lucide-react";
import html2pdf from "html2pdf.js";
import DashboardLayout from "@/components/DashboardLayout";

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  targetRole: string;
  summary: string;
  experience: { company: string; role: string; duration: string; bullets: string[] }[];
  education: { degree: string; school: string; year: string }[];
  skills: string[];
  certifications: string[];
}

const parseResumeText = (text: string, form: typeof defaultForm): ResumeData => {
  // Basic structured extraction from AI plain text output
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const result: ResumeData = {
    name: form.name,
    email: form.email,
    phone: form.phone,
    location: form.location,
    targetRole: form.targetRole,
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
  };

  let currentSection = "";
  let currentExp: ResumeData["experience"][0] | null = null;
  let summaryLines: string[] = [];

  for (const line of lines) {
    const upper = line.toUpperCase();
    if (upper.includes("PROFESSIONAL SUMMARY") || upper.includes("SUMMARY") || upper.includes("OBJECTIVE")) {
      currentSection = "summary"; continue;
    }
    if (upper.includes("EXPERIENCE") || upper.includes("WORK HISTORY")) {
      if (currentExp) result.experience.push(currentExp);
      currentExp = null;
      currentSection = "experience"; continue;
    }
    if (upper.includes("EDUCATION")) { currentSection = "education"; continue; }
    if (upper.includes("SKILL")) { currentSection = "skills"; continue; }
    if (upper.includes("CERTIFICATION")) { currentSection = "certs"; continue; }

    if (currentSection === "summary") { summaryLines.push(line); }
    else if (currentSection === "experience") {
      if (!line.startsWith("-") && !line.startsWith("•") && /\d{4}|present/i.test(line)) {
        if (currentExp) result.experience.push(currentExp);
        const parts = line.split("|").map(p => p.trim());
        const durationMatch = line.match(/(\d{4}[^|]*(?:present|current|\d{4}))/i);
        currentExp = {
          role: parts[0] || line,
          company: parts[1] || "",
          duration: durationMatch ? durationMatch[0] : "",
          bullets: [],
        };
      } else if ((line.startsWith("-") || line.startsWith("•")) && currentExp) {
        currentExp.bullets.push(line.replace(/^[-•]\s*/, ""));
      }
    }
    else if (currentSection === "education") {
      const yr = line.match(/\b(19|20)\d{2}\b/);
      result.education.push({ degree: line, school: "", year: yr ? yr[0] : "" });
    }
    else if (currentSection === "skills") {
      const skillLine = line.replace(/^[-•]\s*/, "");
      result.skills.push(...skillLine.split(/[,|·]/).map(s => s.trim()).filter(Boolean));
    }
    else if (currentSection === "certs") {
      result.certifications.push(line.replace(/^[-•]\s*/, ""));
    }
  }
  if (currentExp) result.experience.push(currentExp);
  result.summary = summaryLines.join(" ");
  return result;
};

const defaultForm = {
  name: "", email: "", phone: "", location: "", targetRole: "",
  experience: "", education: "", skills: "", certifications: "",
};

const ResumeTemplate = ({ data }: { data: ResumeData }) => (
  <div id="resume-template" className="bg-white text-gray-900 font-serif" style={{ width: "210mm", minHeight: "297mm", margin: "0 auto", padding: "20mm 18mm", boxSizing: "border-box", fontSize: "10pt", lineHeight: "1.4" }}>
    {/* Header */}
    <div style={{ borderBottom: "3px solid #1a1a2e", paddingBottom: "10px", marginBottom: "14px" }}>
      <h1 style={{ fontSize: "24pt", fontWeight: "700", color: "#1a1a2e", margin: 0, fontFamily: "Georgia, serif", letterSpacing: "-0.5px" }}>{data.name || "Your Name"}</h1>
      {data.targetRole && <p style={{ fontSize: "11pt", color: "#c8880a", fontWeight: "600", margin: "3px 0 6px" }}>{data.targetRole}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", fontSize: "9pt", color: "#555" }}>
        {data.email && <span>✉ {data.email}</span>}
        {data.phone && <span>📞 {data.phone}</span>}
        {data.location && <span>📍 {data.location}</span>}
      </div>
    </div>

    {/* Summary */}
    {data.summary && (
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "10pt", fontWeight: "700", color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ddd", paddingBottom: "3px", marginBottom: "6px" }}>Professional Summary</h2>
        <p style={{ color: "#333", lineHeight: "1.6" }}>{data.summary}</p>
      </div>
    )}

    {/* Experience */}
    {data.experience.length > 0 && (
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "10pt", fontWeight: "700", color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ddd", paddingBottom: "3px", marginBottom: "8px" }}>Work Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} style={{ marginBottom: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <p style={{ fontWeight: "700", color: "#1a1a2e", margin: 0, fontSize: "10.5pt" }}>{exp.role}</p>
                {exp.company && <p style={{ color: "#c8880a", fontWeight: "600", margin: "1px 0", fontSize: "9.5pt" }}>{exp.company}</p>}
              </div>
              {exp.duration && <span style={{ color: "#666", fontSize: "9pt", whiteSpace: "nowrap", marginLeft: "8px" }}>{exp.duration}</span>}
            </div>
            {exp.bullets.length > 0 && (
              <ul style={{ margin: "4px 0 0 16px", padding: 0 }}>
                {exp.bullets.map((b, j) => <li key={j} style={{ color: "#444", marginBottom: "2px", lineHeight: "1.5" }}>{b}</li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
    )}

    {/* Skills */}
    {data.skills.length > 0 && (
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "10pt", fontWeight: "700", color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ddd", paddingBottom: "3px", marginBottom: "8px" }}>Skills</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {data.skills.map((s, i) => (
            <span key={i} style={{ background: "#f0f4ff", border: "1px solid #c9d4f0", borderRadius: "4px", padding: "2px 8px", fontSize: "9pt", color: "#2a3a7a" }}>{s}</span>
          ))}
        </div>
      </div>
    )}

    {/* Education */}
    {data.education.length > 0 && (
      <div style={{ marginBottom: "14px" }}>
        <h2 style={{ fontSize: "10pt", fontWeight: "700", color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ddd", paddingBottom: "3px", marginBottom: "8px" }}>Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <p style={{ margin: 0, color: "#333", fontWeight: edu.school ? "600" : "400" }}>{edu.degree}</p>
            {edu.year && <span style={{ color: "#666", fontSize: "9pt" }}>{edu.year}</span>}
          </div>
        ))}
      </div>
    )}

    {/* Certifications */}
    {data.certifications.length > 0 && (
      <div>
        <h2 style={{ fontSize: "10pt", fontWeight: "700", color: "#1a1a2e", textTransform: "uppercase", letterSpacing: "1.5px", borderBottom: "1px solid #ddd", paddingBottom: "3px", marginBottom: "8px" }}>Certifications</h2>
        <ul style={{ margin: "0 0 0 16px", padding: 0 }}>
          {data.certifications.map((c, i) => <li key={i} style={{ color: "#444", marginBottom: "3px" }}>{c}</li>)}
        </ul>
      </div>
    )}
  </div>
);

const ResumeGeneratorPage = () => {
  const { toast } = useToast();
  const [form, setForm] = useState(defaultForm);
  const [resumeText, setResumeText] = useState("");
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const update = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleGenerate = async () => {
    if (!form.name.trim() || !form.experience.trim()) {
      toast({ title: "Missing fields", description: "Name and work experience are required.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setResumeText("");
    setResumeData(null);

    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-generator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(form),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Generation failed" }));
        throw new Error(err.error || "Generation failed");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) { fullText += content; setResumeText(fullText); }
          } catch { textBuffer = line + "\n" + textBuffer; break; }
        }
      }

      // Parse into structured data for template
      const parsed = parseResumeText(fullText, form);
      setResumeData(parsed);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById("resume-template");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${form.name} - Resume</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Georgia, 'Times New Roman', serif; }
        @page { size: A4; margin: 0; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head><body>
      ${printContent.outerHTML}
      </body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("resume-template");
    if (!element) return;
    const opt = {
      margin: 0,
      filename: `${form.name.replace(/\s+/g, "-").toLowerCase() || "resume"}-resume.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">AI Resume Generator</h1>
          <p className="text-muted-foreground mt-1">Fill in your details and get a print-ready, professional resume template.</p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Full Name *</Label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Target Role</Label>
                <Input value={form.targetRole} onChange={(e) => update("targetRole", e.target.value)} placeholder="Software Engineer" />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="New York, NY" />
            </div>
            <div className="space-y-1.5">
              <Label>Work Experience * <span className="text-xs text-muted-foreground">(roles & achievements)</span></Label>
              <Textarea value={form.experience} onChange={(e) => update("experience", e.target.value)} placeholder="e.g. Software Engineer at Google (2020-2023): Led team of 5 engineers, built scalable APIs serving 10M+ users, reduced latency by 40%..." className="min-h-[120px] resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Education</Label>
              <Textarea value={form.education} onChange={(e) => update("education", e.target.value)} placeholder="e.g. B.S. Computer Science, MIT, 2019" className="min-h-[60px] resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Skills</Label>
              <Textarea value={form.skills} onChange={(e) => update("skills", e.target.value)} placeholder="e.g. Python, React, Node.js, AWS, Docker" className="min-h-[60px] resize-none" />
            </div>
            <div className="space-y-1.5">
              <Label>Certifications</Label>
              <Input value={form.certifications} onChange={(e) => update("certifications", e.target.value)} placeholder="e.g. AWS Solutions Architect, PMP" />
            </div>
            <Button onClick={handleGenerate} disabled={isGenerating} className="w-full bg-gradient-gold text-primary-foreground font-semibold h-11">
              {isGenerating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="w-4 h-4 mr-2" />Generate Resume</>}
            </Button>

            {resumeData && (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handlePrint} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />Print
                </Button>
                <Button variant="outline" onClick={handleDownloadPDF} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  <FileDown className="w-4 h-4 mr-2" />Download PDF
                </Button>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="bg-muted/30 border border-border rounded-xl p-4 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-foreground">Resume Preview</h2>
              {resumeData && <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-1 rounded-full">Print-ready · A4</span>}
            </div>

            {isGenerating && !resumeData && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-primary" />
                  <p className="text-sm">AI is crafting your resume...</p>
                  {resumeText && <p className="text-xs mt-2 opacity-60 max-w-xs">{resumeText.slice(0, 100)}...</p>}
                </div>
              </div>
            )}

            {!resumeData && !isGenerating && (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <div className="text-center">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Your formatted resume will appear here</p>
                  <p className="text-xs mt-1 opacity-60">Ready to print or save as PDF</p>
                </div>
              </div>
            )}

            {resumeData && (
              <div ref={printRef} className="overflow-auto shadow-lg rounded-lg" style={{ background: "#f5f5f5", padding: "16px" }}>
                <ResumeTemplate data={resumeData} />
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ResumeGeneratorPage;
