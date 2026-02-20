import { Link, useLocation } from "react-router-dom";
import { Sparkles, FileText, PenTool, Clock, LogOut, User, ShieldCheck, Mic, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/dashboard", label: "Cover Letter", icon: PenTool },
  { to: "/dashboard/resumes", label: "Resumes", icon: FileText },
  { to: "/dashboard/ats-checker", label: "ATS Checker", icon: ShieldCheck },
  { to: "/dashboard/resume-generator", label: "Resume Generator", icon: FileText },
  { to: "/dashboard/skill-gap", label: "Skill Gap", icon: TrendingUp },
  { to: "/dashboard/mock-interview", label: "Mock Interview", icon: Mic },
  { to: "/dashboard/history", label: "History", icon: Clock },
];

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
        <div className="flex items-center gap-2 px-6 h-16 border-b border-border">
          <Sparkles className="w-5 h-5 text-primary" />
          <span className="font-display text-lg font-bold text-foreground">CoverCraft AI</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
              </p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-muted-foreground">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between h-14 px-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-display text-base font-bold text-foreground">CoverCraft</span>
          </div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`p-2 rounded-lg transition-colors ${
                    isActive ? "bg-secondary text-foreground" : "text-muted-foreground"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                </Link>
              );
            })}
            <button onClick={signOut} className="p-2 text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
