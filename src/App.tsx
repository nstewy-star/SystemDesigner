import { useState } from "react";
import { ProjectProvider, useProject } from "./contexts/ProjectContext";
import { Dashboard } from "./pages/Dashboard";
import { Designer } from "./pages/Designer";

function AppRouter() {
  const { loadProject, clearProject } = useProject();
  const [view, setView] = useState<"dashboard" | "designer">("dashboard");

  const handleOpenProject = async (projectId: string) => {
    await loadProject(projectId);
    setView("designer");
  };

  const handleBackToDashboard = () => {
    clearProject();
    setView("dashboard");
  };

  if (view === "designer") {
    return <Designer onBack={handleBackToDashboard} />;
  }

  return <Dashboard onOpenProject={handleOpenProject} />;
}

function App() {
  return (
    <ProjectProvider>
      <AppRouter />
    </ProjectProvider>
  );
}

export default App;
