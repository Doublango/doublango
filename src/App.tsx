import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import Learn from "./pages/Learn";
import Lesson from "./pages/Lesson";
import Review from "./pages/Review";
import TimedChallenge from "./pages/TimedChallenge";
import PlacementTest from "./pages/PlacementTest";
import Languages from "./pages/Languages";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/home" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/lesson/:lessonId" element={<Lesson />} />
            <Route path="/review" element={<Review />} />
            <Route path="/review/:mode" element={<Review />} />
            <Route path="/timed-challenge" element={<TimedChallenge />} />
            <Route path="/placement-test" element={<PlacementTest />} />
            <Route path="/languages" element={<Languages />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
