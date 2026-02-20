import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/hooks/useAuth";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import GeneratePage from "./pages/Generate";
import ResumesPage from "./pages/Resumes";
import HistoryPage from "./pages/History";
import ATSCheckerPage from "./pages/ATSChecker";
import ResumeGeneratorPage from "./pages/ResumeGenerator";
import SkillGapPage from "./pages/SkillGap";
import MockInterviewPage from "./pages/MockInterview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<ProtectedRoute><GeneratePage /></ProtectedRoute>} />
          <Route path="/dashboard/resumes" element={<ProtectedRoute><ResumesPage /></ProtectedRoute>} />
          <Route path="/dashboard/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/dashboard/ats-checker" element={<ProtectedRoute><ATSCheckerPage /></ProtectedRoute>} />
          <Route path="/dashboard/resume-generator" element={<ProtectedRoute><ResumeGeneratorPage /></ProtectedRoute>} />
          <Route path="/dashboard/skill-gap" element={<ProtectedRoute><SkillGapPage /></ProtectedRoute>} />
          <Route path="/dashboard/mock-interview" element={<ProtectedRoute><MockInterviewPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
