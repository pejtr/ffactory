import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Studio from "./pages/Studio";
import ProjectView from "./pages/ProjectView";
import Characters from "./pages/Characters";
import SharedVideo from "./pages/SharedVideo";
import StoryStudio from "./pages/StoryStudio";
import NotebookDetail from "./pages/NotebookDetail";
import Credits from "./pages/Credits";
import GenerateHub from "./pages/GenerateHub";
import ScriptTemplates from "./pages/ScriptTemplates";
import GamificationDashboard from "./pages/GamificationDashboard";
import Referral from "./pages/Referral";
import DailyBonusChecker from "./components/DailyBonusChecker";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/studio" component={Studio} />
      <Route path="/project/:id" component={ProjectView} />
      <Route path="/characters" component={Characters} />
      <Route path="/share/:token" component={SharedVideo} />
      <Route path="/story" component={StoryStudio} />
      <Route path="/story/:id" component={NotebookDetail} />
      <Route path="/credits" component={Credits} />
      <Route path="/generate" component={GenerateHub} />
      <Route path="/templates" component={ScriptTemplates} />
      <Route path="/achievements" component={GamificationDashboard} />
      <Route path="/referral" component={Referral} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            theme="dark"
            toastOptions={{
              style: {
                background: "oklch(0.12 0.02 240)",
                border: "1px solid oklch(0.22 0.03 230)",
                color: "oklch(0.92 0.02 210)",
              },
            }}
          />
          <div className="scan-line" />
          <DailyBonusChecker />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
