import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Plus,
  FolderOpen,
  Trash2,
  Clock,
  Cpu,
  Search,
  X,
  ChevronRight,
  Building2,
  MapPin,
} from "lucide-react";
import { useProject } from "../contexts/ProjectContext";
import type { ProjectType } from "../types";

interface DashboardProps {
  onOpenProject: (projectId: string) => void;
}

export function Dashboard({ onOpenProject }: DashboardProps) {
  const { projects, loading, loadProjects, createProject, deleteProject } = useProject();
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [siteName, setSiteName] = useState("");
  const [projectType, setProjectType] = useState<ProjectType>("new-r5k");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreate = async () => {
    if (!customerName.trim() || !siteName.trim()) return;
    setCreating(true);
    const project = await createProject(customerName.trim(), siteName.trim(), projectType);
    setCreating(false);
    if (project) {
      setShowNewModal(false);
      setCustomerName("");
      setSiteName("");
      onOpenProject(project.id);
    }
  };

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.customer_name.toLowerCase().includes(q) ||
      p.site_name.toLowerCase().includes(q) ||
      p.project_name?.toLowerCase().includes(q)
    );
  });

  const statusColors: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    in_progress: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    archived: "bg-stone-100 text-stone-600",
  };

  const typeLabels: Record<string, string> = {
    "new-r5k": "New R5K",
    "upgrade-r4k-to-r5k": "R4K to R5K",
    "new-r4k": "New R4K",
    mixed: "Mixed",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Rauland System Designer
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              NurseCall system design and quoting
            </p>
          </div>
          <Button
            onClick={() => setShowNewModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="pl-10 bg-white"
            />
          </div>
          <div className="text-sm text-gray-500">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {searchQuery ? "No matching projects" : "No projects yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Create your first NurseCall system design project"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowNewModal(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => {
              const deviceCount = project.devices?.length || 0;
              const updatedAt = new Date(project.updated_at);
              const isToday = new Date().toDateString() === updatedAt.toDateString();
              const timeStr = isToday
                ? updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : updatedAt.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });

              return (
                <Card
                  key={project.id}
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-blue-300 bg-white"
                  onClick={() => onOpenProject(project.id)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Building2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 truncate text-sm">
                            {project.customer_name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-sm text-gray-600 truncate">
                            {project.site_name}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors flex-shrink-0 mt-0.5" />
                    </div>

                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          statusColors[project.status] || statusColors.draft
                        }`}
                      >
                        {project.status.replace("_", " ")}
                      </span>
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                        {typeLabels[project.project_type] || project.project_type}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Cpu className="w-3.5 h-3.5" />
                          {deviceCount} device{deviceCount !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeStr}
                      </span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Delete "${project.customer_name} / ${project.site_name}"?`)) {
                            deleteProject(project.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">New Project</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Customer Name</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g., Memorial Hospital"
                  className="mt-1.5"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">Site Name</Label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  placeholder="e.g., 3rd Floor ICU"
                  className="mt-1.5"
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700">System Type</Label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="mt-1.5 flex h-9 w-full rounded-md border border-gray-200 bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="new-r5k">New R5K System</option>
                  <option value="upgrade-r4k-to-r5k">Upgrade R4K to R5K</option>
                  <option value="new-r4k">New R4K System</option>
                  <option value="mixed">Mixed / Custom</option>
                </select>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNewModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!customerName.trim() || !siteName.trim() || creating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {creating ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
