import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Trash2, FileText, Loader2 } from "lucide-react";

interface Resume {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

const ResumesPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchResumes = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("resumes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResumes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResumes();
  }, [user]);

  const handleSave = async () => {
    if (!content.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("resumes").insert({
      user_id: user.id,
      title: title.trim() || "Untitled Resume",
      content: content.trim(),
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Resume saved!" });
      setTitle("");
      setContent("");
      setShowForm(false);
      fetchResumes();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setResumes(resumes.filter((r) => r.id !== id));
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Resumes</h1>
            <p className="text-muted-foreground mt-1">Manage your saved resumes for quick generation.</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-gradient-gold text-primary-foreground font-semibold">
            <Plus className="w-4 h-4 mr-2" />
            Add Resume
          </Button>
        </div>

        {showForm && (
          <div className="bg-card border border-border rounded-xl p-6 mb-6 space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Software Engineer Resume" />
            </div>
            <div className="space-y-2">
              <Label>Resume Content</Label>
              <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Paste your resume text..." className="min-h-[200px]" />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving} className="bg-gradient-gold text-primary-foreground font-semibold">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Resume
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No resumes saved yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {resumes.map((resume) => (
              <div key={resume.id} className="bg-card border border-border rounded-xl p-5 flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{resume.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{resume.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(resume.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(resume.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ResumesPage;
