import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import DashboardLayout from "@/components/DashboardLayout";
import { Clock, Copy, Download, Trash2, Loader2, CheckCircle } from "lucide-react";

interface CoverLetter {
  id: string;
  job_title: string;
  company_name: string;
  tone: string;
  content: string;
  created_at: string;
}

const HistoryPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [letters, setLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLetters = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from("cover_letters")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else setLetters(data || []);
      setLoading(false);
    };
    fetchLetters();
  }, [user]);

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = (letter: CoverLetter) => {
    const blob = new Blob([letter.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cover-letter-${letter.company_name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("cover_letters").delete().eq("id", id);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else setLetters(letters.filter((l) => l.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">History</h1>
          <p className="text-muted-foreground mt-1">All your previously generated cover letters.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : letters.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No cover letters generated yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {letters.map((letter) => (
              <div key={letter.id} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedId(expandedId === letter.id ? null : letter.id)}
                  className="w-full p-5 flex items-center justify-between text-left"
                >
                  <div>
                    <h3 className="font-medium text-foreground">{letter.job_title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {letter.company_name} · {letter.tone} · {new Date(letter.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => handleCopy(letter.id, letter.content)}>
                      {copiedId === letter.id ? <CheckCircle className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDownload(letter)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(letter.id)} className="hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </button>

                {expandedId === letter.id && (
                  <div className="px-5 pb-5 border-t border-border pt-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{letter.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default HistoryPage;
