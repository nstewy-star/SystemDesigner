import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Project, Device, Connection, Wall, ProjectType, FloorPlan } from "../types";
import { supabase } from "../lib/db/client";

type ProjectContextType = {
  currentProject: Project | null;
  projects: Project[];
  loading: boolean;
  loadProjects: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (customerName: string, siteName: string, projectType: ProjectType) => Promise<Project | null>;
  deleteProject: (id: string) => Promise<void>;
  updateProject: (updates: Partial<Project>) => void;
  setDevices: (devices: Device[]) => void;
  setConnections: (connections: Connection[]) => void;
  setWalls: (walls: Wall[]) => void;
  clearProject: () => void;
};

const ProjectContext = createContext<ProjectContextType | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setProjects(
        data.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          customer_name: p.customer_name as string,
          site_name: p.site_name as string,
          project_name: (p.project_name as string) || undefined,
          status: (p.status as Project["status"]) || "draft",
          project_type: (p.project_type as ProjectType) || "new-r5k",
          devices: parseJson(p.devices as string | unknown[], []),
          connections: parseJson(p.connections as string | unknown[], []),
          walls: parseJson(p.walls as string | unknown[], []),
          background_image_url: p.background_image_url as string | null,
          background_opacity: (p.background_opacity as number) ?? 60,
          floor_plans: parseJson(p.floor_plans as string | unknown[], []) as FloorPlan[],
          active_floor_plan_id: (p.active_floor_plan_id as string) || null,
          device_scale: (p.device_scale as number) ?? 50,
          device_opacity: (p.device_opacity as number) ?? 100,
          walls_opacity: (p.walls_opacity as number) ?? 90,
          floorplan_scale: p.floorplan_scale as number | null,
          show_device_names: (p.show_device_names as boolean) ?? true,
          show_ports: (p.show_ports as boolean) ?? true,
          created_at: p.created_at as string,
          updated_at: p.updated_at as string,
        }))
      );
    }
    setLoading(false);
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (!error && data) {
      const project: Project = {
        id: data.id,
        customer_name: data.customer_name,
        site_name: data.site_name,
        project_name: data.project_name || undefined,
        status: data.status || "draft",
        project_type: data.project_type || "new-r5k",
        devices: parseJson(data.devices, []),
        connections: parseJson(data.connections, []),
        walls: parseJson(data.walls, []),
        background_image_url: data.background_image_url,
        background_opacity: data.background_opacity ?? 60,
        floor_plans: parseJson(data.floor_plans, []) as FloorPlan[],
        active_floor_plan_id: data.active_floor_plan_id || null,
        device_scale: data.device_scale ?? 50,
        device_opacity: data.device_opacity ?? 100,
        walls_opacity: data.walls_opacity ?? 90,
        floorplan_scale: data.floorplan_scale,
        show_device_names: data.show_device_names ?? true,
        show_ports: data.show_ports ?? true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setCurrentProject(project);
    }
    setLoading(false);
  }, []);

  const createProject = useCallback(
    async (customerName: string, siteName: string, projectType: ProjectType) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({
          customer_name: customerName,
          site_name: siteName,
          project_type: projectType,
          devices: [],
          connections: [],
          walls: [],
        })
        .select()
        .maybeSingle();

      if (error || !data) return null;

      const project: Project = {
        id: data.id,
        customer_name: data.customer_name,
        site_name: data.site_name,
        project_name: data.project_name || undefined,
        status: data.status || "draft",
        project_type: data.project_type || projectType,
        devices: [],
        connections: [],
        walls: [],
        background_image_url: null,
        background_opacity: 60,
        floor_plans: [],
        active_floor_plan_id: null,
        device_scale: 50,
        device_opacity: 100,
        walls_opacity: 90,
        floorplan_scale: null,
        show_device_names: true,
        show_ports: true,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };
      setCurrentProject(project);
      setProjects((prev) => [project, ...prev]);
      return project;
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    await supabase.from("quotes").delete().eq("project_id", id);
    await supabase.from("projects").delete().eq("id", id);
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (currentProject?.id === id) setCurrentProject(null);
  }, [currentProject]);

  const updateProject = useCallback(
    (updates: Partial<Project>) => {
      setCurrentProject((prev) => (prev ? { ...prev, ...updates } : null));
    },
    []
  );

  const setDevices = useCallback((devices: Device[]) => {
    setCurrentProject((prev) => (prev ? { ...prev, devices } : null));
  }, []);

  const setConnections = useCallback((connections: Connection[]) => {
    setCurrentProject((prev) => (prev ? { ...prev, connections } : null));
  }, []);

  const setWalls = useCallback((walls: Wall[]) => {
    setCurrentProject((prev) => (prev ? { ...prev, walls } : null));
  }, []);

  const clearProject = useCallback(() => {
    setCurrentProject(null);
  }, []);

  useEffect(() => {
    if (!currentProject) return;

    const timer = setTimeout(async () => {
      await supabase
        .from("projects")
        .update({
          devices: JSON.stringify(currentProject.devices),
          connections: JSON.stringify(currentProject.connections),
          walls: JSON.stringify(currentProject.walls),
          background_image_url: currentProject.background_image_url,
          background_opacity: currentProject.background_opacity,
          floor_plans: JSON.stringify(currentProject.floor_plans),
          active_floor_plan_id: currentProject.active_floor_plan_id,
          device_scale: currentProject.device_scale,
          device_opacity: currentProject.device_opacity,
          walls_opacity: currentProject.walls_opacity,
          floorplan_scale: currentProject.floorplan_scale,
          show_device_names: currentProject.show_device_names,
          show_ports: currentProject.show_ports,
          project_type: currentProject.project_type,
          status: currentProject.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentProject.id);
    }, 2000);

    return () => clearTimeout(timer);
  }, [currentProject]);

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        loading,
        loadProjects,
        loadProject,
        createProject,
        deleteProject,
        updateProject,
        setDevices,
        setConnections,
        setWalls,
        clearProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

function parseJson<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value)) return value as T;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return fallback;
}
