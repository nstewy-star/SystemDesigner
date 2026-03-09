import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Plus, Trash2, Layers,
  Wand2, Zap, AlertCircle, X, Star, Settings,
  ArrowLeft, Link2,
} from "lucide-react";
import { DeviceIcon } from "../components/DeviceIcon";
import { DeviceSVG } from "../components/DeviceSVG";
import { CreateKitModal } from "../components/CreateKitModal";
import { BOMModal } from "../components/BOMModal";
import { CompatibleDevicesModal } from "../components/CompatibleDevicesModal";
import { SchematicEditorModal } from "../components/SchematicEditorModal";
import { ValidationPanel } from "../components/ValidationPanel";
import { CanvasBackground } from "../components/CanvasBackground";
import { DesignerBottomBar } from "../components/DesignerBottomBar";
import { PowerSummaryWidget } from "../components/power/PowerSummaryWidget";
import { PowerCalculator } from "./PowerCalculator";
import { QuotePanel } from "./QuotePanel";
import { supabase } from "../lib/db/client";
import { useProject } from "../contexts/ProjectContext";
import { DEVICE_DEFS, DEVICE_LIBRARY, TYPE_COLOR } from "../data/devices";
import { getCompatibleDevices, validateConnection, isDuplicateConnection } from "../lib/connectionRules";
import { routeConnection, getConnectionEndpoints, getPortPosition } from "../lib/connectionRouting";
import { useCanvasViewport } from "../lib/useCanvasViewport";
import type {
  Device, Connection, PortType, PortDef, DrawElement, DeviceDef,
  DeviceLibraryItem, DeviceKit, ProjectType, FloorPlan,
} from "../types";

interface DesignerProps {
  onBack: () => void;
}

export function Designer({ onBack }: DesignerProps) {
  const {
    currentProject, setDevices, setConnections, setWalls, updateProject, clearProject,
  } = useProject();

  const devices = currentProject?.devices || [];
  const connections = currentProject?.connections || [];
  const walls = currentProject?.walls || [];
  const floorPlans = currentProject?.floor_plans || [];
  const activeFloorPlanId = currentProject?.active_floor_plan_id || null;
  const activeFloorPlan = floorPlans.find((fp) => fp.id === activeFloorPlanId);
  const bgDataUrl = activeFloorPlan?.imageUrl || currentProject?.background_image_url || null;
  const bgOpacity = activeFloorPlan?.opacity ?? currentProject?.background_opacity ?? 60;
  const visibleDevices = useMemo(() => {
    if (!activeFloorPlanId || floorPlans.length <= 1) return devices;
    return devices.filter((d) => !d.floorPlanId || d.floorPlanId === activeFloorPlanId);
  }, [devices, activeFloorPlanId, floorPlans.length]);
  const visibleDeviceIds = useMemo(() => new Set(visibleDevices.map((d) => d.id)), [visibleDevices]);
  const visibleConnections = useMemo(() => {
    if (!activeFloorPlanId || floorPlans.length <= 1) return connections;
    return connections.filter((c) => visibleDeviceIds.has(c.fromId) && visibleDeviceIds.has(c.toId));
  }, [connections, visibleDeviceIds, activeFloorPlanId, floorPlans.length]);
  const deviceScale = currentProject?.device_scale ?? 100;
  const deviceOpacity = currentProject?.device_opacity ?? 100;
  const wallsOpacity = currentProject?.walls_opacity ?? 90;
  const showDeviceNames = currentProject?.show_device_names ?? true;
  const showPorts = currentProject?.show_ports ?? true;
  const floorplanScale = currentProject?.floorplan_scale ?? null;
  const projectType = (currentProject?.project_type || "new-r5k") as ProjectType;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedPalettePart, setSelectedPalettePart] = useState<string | null>(null);
  const [selectedPaletteParts, setSelectedPaletteParts] = useState<Set<string>>(new Set());
  const [tool, setTool] = useState<"select" | "connect" | "wall">("select");
  const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);
  const [connectionContextMenu, setConnectionContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);
  const [portContextMenu, setPortContextMenu] = useState<{ x: number; y: number; deviceId: string; portId: string; portType: PortType; devicePart: string } | null>(null);
  const [alignmentMenu, setAlignmentMenu] = useState<{ x: number; y: number } | null>(null);
  const [showEnvironmentPanel, setShowEnvironmentPanel] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [showDeviceModels, setShowDeviceModels] = useState(false);
  const [drawingWall, setDrawingWall] = useState<{ x: number; y: number } | null>(null);
  const [wallPreviewEnd, setWallPreviewEnd] = useState<{ x: number; y: number } | null>(null);
  const [editingPaletteDevice, setEditingPaletteDevice] = useState(false);
  const [showAddDeviceForm, setShowAddDeviceForm] = useState(false);
  const [customDevices, setCustomDevices] = useState<DeviceLibraryItem[]>([]);
  const [kits, setKits] = useState<DeviceKit[]>([]);
  const [showKitModal, setShowKitModal] = useState(false);
  const [showBomModal, setShowBomModal] = useState(false);
  const [paletteTab, setPaletteTab] = useState("all");
  const [copiedDevice, setCopiedDevice] = useState<Device | null>(null);
  const [showCompatibleModal, setShowCompatibleModal] = useState(false);
  const [compatibleDevices, setCompatibleDevices] = useState<{ sourceDeviceId: string; sourcePortId: string; devicePart: string; portType: PortType; compatibleParts: string[] }>({ sourceDeviceId: "", sourcePortId: "", devicePart: "", portType: "ETH", compatibleParts: [] });
  const [showSchematicEditor, setShowSchematicEditor] = useState(false);
  const [customSchematics, setCustomSchematics] = useState<Record<string, { ports: PortDef[]; image?: string; drawElements?: DrawElement[] }>>({});
  const [draggingConnection, setDraggingConnection] = useState<{ fromId: string; fromPort: string; mouseX: number; mouseY: number } | null>(null);
  const [showQuotePanel, setShowQuotePanel] = useState(false);
  const [showPowerCalc, setShowPowerCalc] = useState(false);
  const [paletteSelectionBox, setPaletteSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [canvasSelectionBox, setCanvasSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const [spacebarPressed, setSpacebarPressed] = useState(false);
  const [highlightedDeviceIds, setHighlightedDeviceIds] = useState<Set<string>>(new Set());
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const {
    viewState, containerRef: canvasRef, screenToWorld, worldToScreen,
    handleWheel: viewportWheel, startPan, updatePan, endPan,
    setZoomLevel, resetView, isPanning,
  } = useCanvasViewport();
  const zoom = viewState.zoom;
  // undo history buffer (devices+connections)
  const historyRef = useRef<{devices: Device[]; connections: Connection[]}[]>([]);
  const skipHistoryRef = useRef(false);
  const hasNormalized = useRef(false);
  const doubleClickTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastClickIdRef = useRef<string | null>(null);
  const paletteWrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paletteCardsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const canvasDevicesRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const toolBeforePortClick = useRef<"select" | "connect" | "wall" | null>(null);

  const canvasToWorld = (clientX: number, clientY: number) => {
    return screenToWorld(clientX, clientY);
  };

  // Signal flow hierarchy - lower number = upstream (source)
  const getDeviceHierarchy = (part: string): number => {
    // Consoles - highest level
    if (part === "R5KCONS") return 10;
    // MSC - head end
    if (part === "R5KMSC") return 20;
    // Switches
    if (part === "R5K8PRT" || part === "351010" || part === "351006") return 25;
    // L2K Adapter
    if (part === "R5KL2KA") return 30;
    // Termination Boards
    if (part === "R5KMTRM") return 40;
    // Power supplies
    if (part === "R5KMPR15" || part === "R5KMPR36") return 45;
    // Corridor Lights & Domeless Controllers
    if (part.includes("CL") || part.includes("DC")) return 50;
    // Field devices (stations, etc.)
    return 60;
  };

  // Ensure connection flows in correct direction (from upstream to downstream)
  const normalizeConnection = (fromId: string, toId: string, fromPort: string, toPort: string, type: PortType): Connection => {
    const fromDev = devices.find(d => d.id === fromId);
    const toDev = devices.find(d => d.id === toId);
    
    if (!fromDev || !toDev) {
      return { id: crypto.randomUUID(), fromId, toId, fromPort, toPort, type };
    }

    const fromLevel = getDeviceHierarchy(fromDev.part);
    const toLevel = getDeviceHierarchy(toDev.part);

    // If connection is backward, swap it
    if (fromLevel > toLevel) {
      return { id: crypto.randomUUID(), fromId: toId, toId: fromId, fromPort: toPort, toPort: fromPort, type };
    }

    return { id: crypto.randomUUID(), fromId, toId, fromPort, toPort, type };
  };

  // Find entire signal chain upstream from clicked device to the source (console)
  const getUpstreamDevices = (startId: string): Set<string> => {
    const chain = new Set<string>();
    const queue = [startId];
    chain.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      // Find what's sending TO this device (connections where this is toId)
      // and trace backward to source
      connections.forEach((conn) => {
        if (conn.toId === current && !chain.has(conn.fromId)) {
          chain.add(conn.fromId);
          queue.push(conn.fromId);
        }
      });
    }
    return chain;
  };

  // Normalize all existing connections to ensure correct signal flow direction
  const normalizeAllConnections = useCallback(() => {
    const normalized = connections.map(conn => {
      const fromDev = devices.find(d => d.id === conn.fromId);
      const toDev = devices.find(d => d.id === conn.toId);
      
      if (!fromDev || !toDev) return conn;

      const fromLevel = getDeviceHierarchy(fromDev.part);
      const toLevel = getDeviceHierarchy(toDev.part);

      // If connection is backward, swap it
      if (fromLevel > toLevel) {
        return { 
          ...conn, 
          fromId: conn.toId, 
          toId: conn.fromId, 
          fromPort: conn.toPort, 
          toPort: conn.fromPort 
        };
      }

      return conn;
    });

    // Only update if something changed
    const hasChanges = normalized.some((conn, idx) => 
      conn.fromId !== connections[idx].fromId || conn.toId !== connections[idx].toId
    );

    if (hasChanges) {
      setConnections(normalized);
    }
  }, [connections, devices, setConnections]);

  // Auto-normalize connections when project is first loaded
  useEffect(() => {
    if (devices.length > 0 && connections.length > 0 && !hasNormalized.current) {
      normalizeAllConnections();
      hasNormalized.current = true;
    }
  }, [devices.length, connections.length, normalizeAllConnections]);

  // Reset normalization flag when project changes
  useEffect(() => {
    hasNormalized.current = false;
  }, [currentProject?.id]);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    obs.observe(el);
    setCanvasSize({ width: el.clientWidth, height: el.clientHeight });
    return () => obs.disconnect();
  }, [canvasRef]);

  const pushHistory = () => {
    historyRef.current.unshift({ devices: [...devices], connections: [...connections] });
    if (historyRef.current.length > 5) historyRef.current.pop();
  };

  // capture initial state so undo has something to revert
  useEffect(() => {
    pushHistory();
  }, []);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    pushHistory();
  }, [devices, connections]);

  const undo = () => {
    if (historyRef.current.length === 0) return;
    const prev = historyRef.current.shift();
    if (prev) {
      skipHistoryRef.current = true;
      setDevices(prev.devices);
      setConnections(prev.connections);
    }
  };


  // ==============================
  // Marshall alignment helpers
  // ==============================

  const getScaledSize = (d: Device) => {
    const def = DEVICE_DEFS[d.part];
    const baseW = def?.w ?? 140;
    const baseH = def?.h ?? 80;
    const scale = (currentProject?.device_scale ?? 100) / 800;
    return { w: baseW * scale, h: baseH * scale };
  };

  const getBounds = (d: Device) => {
    const { w, h } = getScaledSize(d);
    return {
      left: d.x - w / 2,
      right: d.x + w / 2,
      top: d.y - h / 2,
      bottom: d.y + h / 2,
      w,
      h,
    };
  };

  const detectColumnCount = (sorted: Device[]) => {
    const xs = sorted.map((d) => d.x).sort((a, b) => a - b);
    if (xs.length < 3) return xs.length;

    const diffs = xs.slice(1).map((x, i) => x - xs[i]);
    const median = [...diffs].sort((a, b) => a - b)[Math.floor(diffs.length / 2)] || 0;
    const bigGaps = diffs.filter((d) => d > Math.max(60, median * 1.8)).length;
    return Math.min(6, Math.max(2, bigGaps + 1));
  };

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    el.addEventListener("wheel", viewportWheel, { passive: false });
    return () => el.removeEventListener("wheel", viewportWheel);
  }, [viewportWheel]);

  const allDevices = useMemo(() => [...DEVICE_LIBRARY, ...customDevices], [customDevices]);

  const filteredDevices = allDevices.filter((device) => {
    if (projectType === "new-r5k") return device.generation !== "R4K";
    if (projectType === "new-r4k") return device.generation !== "R5K";
    return true;
  });

  const onPaletteDragStart = (e: React.DragEvent, part: string) => {
    e.dataTransfer.setData("application/x-rauland-part", part);
  };

  const onKitDragStart = (e: React.DragEvent, kitId: string) => {
    e.dataTransfer.setData("application/x-rauland-kit", kitId);
  };

  const updatePaletteDevice = (part: string, updates: Partial<DeviceLibraryItem>) => {
    const idx = customDevices.findIndex((d) => d.part === part);
    if (idx >= 0) {
      const updated = [...customDevices];
      updated[idx] = { ...updated[idx], ...updates };
      setCustomDevices(updated);
    } else {
      const builtIn = DEVICE_LIBRARY.find((d) => d.part === part);
      if (builtIn) setCustomDevices([...customDevices, { ...builtIn, ...updates }]);
    }
  };

  const handleSaveSchematic = async (ports: Array<{id: string; label: string; type: string; x: number; y: number; limit?: number}>, schematicImage: string | undefined, drawElements: DrawElement[]) => {
    if (!selectedPalettePart) return;
    const typedPorts = ports as PortDef[];
    setCustomSchematics((prev) => ({
      ...prev,
      [selectedPalettePart]: { ports: typedPorts, image: schematicImage, drawElements },
    }));
    const existingDef = DEVICE_DEFS[selectedPalettePart];
    if (existingDef) {
      DEVICE_DEFS[selectedPalettePart] = { ...existingDef, ports: typedPorts, customSchematic: schematicImage, drawElements };
    }
    setDevices(devices.map((d) => (d.part === selectedPalettePart ? { ...d } : d)));
  };

  const addCustomDevice = (device: DeviceLibraryItem) => {
    setCustomDevices([...customDevices, device]);
    setShowAddDeviceForm(false);
  };

  const createKitFromSelection = async (kitName: string) => {
    if (selectedPaletteParts.size === 0) return;
    const parts = Array.from(selectedPaletteParts);
    const { data, error } = await supabase
      .from("kits")
      .insert({ name: kitName, devices: parts })
      .select()
      .maybeSingle();
    if (error || !data) return;
    setKits([...kits, { id: data.id, name: data.name, parts: data.devices || data.parts || [] }]);
    setSelectedPaletteParts(new Set());
  };

  useEffect(() => {
    const loadKits = async () => {
      const { data } = await supabase.from("kits").select("*").order("created_at", { ascending: false });
      if (data) {
        setKits(data.map((kit: Record<string, unknown>) => ({
          id: kit.id as string,
          name: kit.name as string,
          parts: (kit.devices || kit.parts || []) as string[],
          connections: (kit.connections || []) as DeviceKit["connections"],
        })));
      }
    };
    loadKits();
  }, []);


  const onPaletteItemClick = (e: React.MouseEvent, part: string) => {
    if (e.ctrlKey || e.metaKey) {
      const sel = new Set(selectedPaletteParts);
      if (selectedPalettePart && !sel.has(selectedPalettePart)) sel.add(selectedPalettePart);
      if (sel.has(part)) sel.delete(part); else sel.add(part);
      setSelectedPaletteParts(sel);
      setSelectedPalettePart(part);
    } else {
      setSelectedPalettePart(part);
      setSelectedPaletteParts(new Set());
    }
  };

  const onCanvasDragOver = (e: React.DragEvent) => e.preventDefault();

  const onCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const { x, y } = canvasToWorld(e.clientX, e.clientY);
    const kitId = e.dataTransfer.getData("application/x-rauland-kit");
    const part = e.dataTransfer.getData("application/x-rauland-part");

    if (kitId) {
      const kit = kits.find((k) => k.id === kitId);
      if (!kit) return;
      const newKitId = crypto.randomUUID();
      const newDevs: Device[] = [];
      let offsetX = 0;
      kit.parts.forEach((p) => {
        newDevs.push({
          id: crypto.randomUUID(), part: p, name: `${p}-${devices.length + newDevs.length + 1}`,
          x: x + offsetX, y, kitId: newKitId, floorPlanId: activeFloorPlanId || undefined,
        });
        offsetX += 140;
      });
      setDevices([...devices, ...newDevs]);
      setSelectedId(newDevs[0]?.id || null);
      if (kit.connections && kit.connections.length > 0) {
        const newConns: Connection[] = [];
        kit.connections.forEach((kc) => {
          const fromDevs = newDevs.filter((d) => d.part === kc.from);
          const toDevs = newDevs.filter((d) => d.part === kc.to);
          if (fromDevs.length > 0 && toDevs.length > 0) {
            fromDevs.forEach((fd, idx) => {
              const td = toDevs[idx] || toDevs[0];
              const conn = normalizeConnection(fd.id, td.id, "", "", kc.type as PortType);
              newConns.push(conn);
            });
          }
        });
        if (newConns.length > 0) setConnections([...connections, ...newConns]);
      }
    } else if (part) {
      const lib = allDevices.find((d) => d.part === part);
      if (!lib) return;
      const id = crypto.randomUUID();
      const newDev: Device = { id, part, name: `${part}-${devices.length + 1}`, x, y, floorPlanId: activeFloorPlanId || undefined };
      let targetDevice: Device | null = null;
      let targetPort: PortDef | null = null;
      let nearestDist = 20;
      for (const device of devices) {
        const def = DEVICE_DEFS[device.part];
        if (!def) continue;
        const ports = customSchematics[device.part]?.ports || def.ports;
        for (const port of ports) {
          const px = device.x - def.w / 2 + 6 + port.x * (def.w - 12);
          const py = device.y - def.h / 2 + 6 + port.y * (def.h - 12);
          const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
          if (dist < nearestDist) { nearestDist = dist; targetDevice = device; targetPort = port; }
        }
      }
      setDevices([...devices, newDev]);
      setSelectedId(id);
      setSelectedPalettePart(null);
      if (targetDevice && targetPort) {
        const newDef = DEVICE_DEFS[part];
        const newPorts = customSchematics[part]?.ports || newDef?.ports || [];
        const matchingPort = newPorts.find((p) => p.type === targetPort!.type);
        if (matchingPort) {
          const targetUsage = connections.filter((c) =>
            (c.fromId === targetDevice!.id && c.fromPort === targetPort!.id) ||
            (c.toId === targetDevice!.id && c.toPort === targetPort!.id)
          ).length;
          if (!targetPort.limit || targetUsage < targetPort.limit) {
            const conn = normalizeConnection(
              targetDevice.id, id,
              targetPort.id, matchingPort.id,
              targetPort.type
            );
            setConnections([...connections, conn]);
          }
        }
      }
    }
  };

  const onDeviceMouseDown = (e: React.MouseEvent, id: string) => {
    // ignore right-click so we don't clear selection
    if (e.button !== 0) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    e.preventDefault();

    // Detect double-click for signal path highlighting
    if (lastClickIdRef.current === id) {
      // Double-click detected
      if (doubleClickTimerRef.current) clearTimeout(doubleClickTimerRef.current);
      lastClickIdRef.current = null;
      const upstream = getUpstreamDevices(id);
      setHighlightedDeviceIds(upstream);
      return;
    }

    // Single-click: clear double-click timer and set up new one
    if (doubleClickTimerRef.current) clearTimeout(doubleClickTimerRef.current);
    lastClickIdRef.current = id;
    doubleClickTimerRef.current = setTimeout(() => {
      lastClickIdRef.current = null;
    }, 300);

    if (tool === "select") {
      if (e.ctrlKey || e.metaKey) {
        const sel = new Set(selectedIds);
        sel.has(id) ? sel.delete(id) : sel.add(id);
        setSelectedIds(sel);
        setSelectedId(id);
        return;
      }
      setSelectedId(id);
      setSelectedIds(new Set());
      const startWorld = canvasToWorld(e.clientX, e.clientY);
      const dev = devices.find((d) => d.id === id);
      if (!dev) return;
      const origX = dev.x;
      const origY = dev.y;
      const move = (me: MouseEvent) => {
        const cur = canvasToWorld(me.clientX, me.clientY);
        setDevices(devices.map((d) => d.id === id ? { ...d, x: origX + (cur.x - startWorld.x), y: origY + (cur.y - startWorld.y) } : d));
      };
      const up = () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    } else if (tool === "connect") {
      const devDef = DEVICE_DEFS[devices.find((d) => d.id === id)?.part || ""];
      if (devDef && devDef.ports.length > 0) return;
      if (!connectFrom) { setConnectFrom(id); setSelectedId(id); }
      else if (connectFrom !== id) {
        const conn = normalizeConnection(connectFrom, id, "", "", inferConnType(connectFrom, id));
        setConnections([...connections, conn]);
        setConnectFrom(null);
      }
    }
  };

  const inferConnType = (fromId: string, toId: string): PortType => {
    const a = devices.find((d) => d.id === fromId);
    const b = devices.find((d) => d.id === toId);
    if (!a || !b) return "POWER";
    const parts = [a.part, b.part].join("-");
    if (/CONSV3|MSC/.test(parts) && (/CONSV3/.test(a.part) || /CONSV3/.test(b.part))) return "ETH";
    if (/MSC/.test(parts) && /(PS1EA|CL546)/.test(parts)) return "LNET";
    return "POWER";
  };

  const selectedDevice = devices.find((d) => d.id === selectedId);
  const updateSelectedDevice = (patch: Partial<Device>) => {
    if (!selectedDevice) return;
    setDevices(devices.map((d) => d.id === selectedId ? { ...d, ...patch } : d));
  };
  const deleteSelected = () => {
    if (!selectedId) return;
    setDevices(devices.filter((d) => d.id !== selectedId));
    setConnections(connections.filter((c) => c.fromId !== selectedId && c.toId !== selectedId));
    setSelectedId(null);
  };

  // Alignment functions for multiple selected devices (enhanced visual version)
  const alignDevices = (direction: "top" | "bottom" | "left" | "right" | "grid") => {
    if (selectedIds.size < 2) return;

    const sel = Array.from(selectedIds)
      .map((id) => devices.find((d) => d.id === id))
      .filter((d): d is Device => !!d);

    if (sel.length < 2) return;

    const boundsById = new Map(sel.map((d) => [d.id, getBounds(d)]));

    if (direction === "top") {
      const minTop = Math.min(...sel.map((d) => boundsById.get(d.id)!.top));
      setDevices(
        devices.map((d) => {
          if (!selectedIds.has(d.id)) return d;
          const b = boundsById.get(d.id)!;
          return { ...d, y: minTop + b.h / 2 };
        })
      );
      setAlignmentMenu(null);
      return;
    }

    if (direction === "bottom") {
      const maxBottom = Math.max(...sel.map((d) => boundsById.get(d.id)!.bottom));
      setDevices(
        devices.map((d) => {
          if (!selectedIds.has(d.id)) return d;
          const b = boundsById.get(d.id)!;
          return { ...d, y: maxBottom - b.h / 2 };
        })
      );
      setAlignmentMenu(null);
      return;
    }

    if (direction === "left") {
      const minLeft = Math.min(...sel.map((d) => boundsById.get(d.id)!.left));
      setDevices(
        devices.map((d) => {
          if (!selectedIds.has(d.id)) return d;
          const b = boundsById.get(d.id)!;
          return { ...d, x: minLeft + b.w / 2 };
        })
      );
      setAlignmentMenu(null);
      return;
    }

    if (direction === "right") {
      const maxRight = Math.max(...sel.map((d) => boundsById.get(d.id)!.right));
      setDevices(
        devices.map((d) => {
          if (!selectedIds.has(d.id)) return d;
          const b = boundsById.get(d.id)!;
          return { ...d, x: maxRight - b.w / 2 };
        })
      );
      setAlignmentMenu(null);
      return;
    }

    if (direction === "grid") {
      const sorted = [...sel].sort((a, b) => {
        const ba = boundsById.get(a.id)!;
        const bb = boundsById.get(b.id)!;
        return ba.top !== bb.top ? ba.top - bb.top : ba.left - bb.left;
      });

      const groupLeft = Math.min(...sorted.map((d) => boundsById.get(d.id)!.left));
      const groupTop = Math.min(...sorted.map((d) => boundsById.get(d.id)!.top));

      const cols = detectColumnCount(sorted);

      const rows: Device[][] = [];
      for (let i = 0; i < sorted.length; i += cols) rows.push(sorted.slice(i, i + cols));

      const colMaxW = Array(cols).fill(0);
      rows.forEach((r) => {
        r.forEach((d, c) => {
          colMaxW[c] = Math.max(colMaxW[c], boundsById.get(d.id)!.w);
        });
      });

      const rowMaxH = rows.map((r) => Math.max(...r.map((d) => boundsById.get(d.id)!.h)));
      const gutterX = 60;
      const gutterY = 70;

      const colLefts: number[] = [];
      let xCursor = groupLeft;
      for (let c = 0; c < cols; c++) {
        colLefts[c] = xCursor;
        xCursor += colMaxW[c] + gutterX;
      }

      const rowTops: number[] = [];
      let yCursor = groupTop;
      for (let r = 0; r < rows.length; r++) {
        rowTops[r] = yCursor;
        yCursor += rowMaxH[r] + gutterY;
      }

      const updated = devices.map((d) => {
        if (!selectedIds.has(d.id)) return d;

        const idx = sorted.findIndex((sd) => sd.id === d.id);
        if (idx < 0) return d;

        const r = Math.floor(idx / cols);
        const c = idx % cols;

        const b = boundsById.get(d.id)!;
        const left = colLefts[c];
        const top = rowTops[r];

        return {
          ...d,
          x: left + b.w / 2,
          y: top + b.h / 2,
        };
      });

      setDevices(updated);
      setAlignmentMenu(null);
      return;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => updateProject({ background_image_url: ev.target?.result as string });
    reader.readAsDataURL(file);
  };

  const addFloorPlan = (name: string, imageUrl: string, naturalWidth?: number, naturalHeight?: number) => {
    const id = crypto.randomUUID();
    const newPlan: FloorPlan = { id, name, imageUrl, opacity: 60, naturalWidth, naturalHeight };
    const updated = [...floorPlans, newPlan];
    updateProject({ floor_plans: updated, active_floor_plan_id: id });
  };

  const removeFloorPlan = (id: string) => {
    const updated = floorPlans.filter((fp) => fp.id !== id);
    const newActive = activeFloorPlanId === id
      ? (updated.length > 0 ? updated[0].id : null)
      : activeFloorPlanId;
    updateProject({ floor_plans: updated, active_floor_plan_id: newActive });
  };

  const renameFloorPlan = (id: string, name: string) => {
    updateProject({
      floor_plans: floorPlans.map((fp) => (fp.id === id ? { ...fp, name } : fp)),
    });
  };

  const setFloorPlanOpacity = (id: string, opacity: number) => {
    updateProject({
      floor_plans: floorPlans.map((fp) => (fp.id === id ? { ...fp, opacity } : fp)),
    });
  };

  const migrateLegacyFloorPlan = () => {
    if (!currentProject?.background_image_url) return;
    const id = crypto.randomUUID();
    const newPlan: FloorPlan = {
      id,
      name: "Floor Plan 1",
      imageUrl: currentProject.background_image_url,
      opacity: currentProject.background_opacity ?? 60,
    };
    updateProject({
      floor_plans: [...floorPlans, newPlan],
      active_floor_plan_id: id,
      background_image_url: null,
    });
  };

  const removeLegacyFloorPlan = () => {
    updateProject({ background_image_url: null });
  };

  const exportDesign = () => {
    const blob = new Blob([JSON.stringify({ devices, connections }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rauland-design.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDesign = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.devices) setDevices(data.devices);
        if (data.connections) setConnections(data.connections);
      } catch {}
    };
    reader.readAsText(file);
  };

  const schematicsForRouting = useMemo(() => {
    const result: Record<string, { ports: PortDef[] }> = {};
    for (const [part, s] of Object.entries(customSchematics)) {
      if (s.ports) result[part] = { ports: s.ports };
    }
    return result;
  }, [customSchematics]);

  const getLineCoords = (conn: Connection) => {
    return getConnectionEndpoints(conn, devices, DEVICE_DEFS, schematicsForRouting, deviceScale);
  };

  const getRoutedPath = useCallback((conn: Connection) => {
    return routeConnection(conn, devices, DEVICE_DEFS, schematicsForRouting, deviceScale);
  }, [devices, schematicsForRouting, deviceScale]);

  const getStraightPath = (x1: number, y1: number, x2: number, y2: number) => `M ${x1} ${y1} L ${x2} ${y2}`;
  const getLineColor = (type: PortType) => TYPE_COLOR[type] || "#6b7280";

  const calculateCableLength = (x1: number, y1: number, x2: number, y2: number) => {
    const pixels = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    return { pixels, feet: floorplanScale ? pixels * floorplanScale : null };
  };

  // Check if device is a head-end device (all housed in same wall box)
  const isHeadEndDevice = (part: string): boolean => {
    return ["R5KMSC", "R5KL2KA", "R5KMTRM", "R5KMPR15", "R5KMPR36", "R5K8PRT", "351010", "351006"].includes(part);
  };

  const totalCableLength = useMemo(() => {
    if (!floorplanScale) return null;
    
    let total = 0;
    visibleConnections.forEach((conn) => {
      const from = devices.find((d) => d.id === conn.fromId);
      const to = devices.find((d) => d.id === conn.toId);
      if (from && to) {
        // Head-end devices are all within 2 feet of each other
        if (isHeadEndDevice(from.part) && isHeadEndDevice(to.part)) {
          total += 2;
        } else {
          const len = calculateCableLength(from.x, from.y, to.x, to.y);
          if (len.feet) total += len.feet;
        }
      }
    });
    
    return total;
  }, [visibleConnections, devices, floorplanScale]);

  const cableBreakdown = useMemo(() => {
    if (!floorplanScale) return null;
    
    const breakdown = {
      LNET: 0,
      KB: 0,
      ETH: 0,
      POWER: 0,
      AC: 0,
      total: 0
    };
    
    visibleConnections.forEach((conn) => {
      const from = devices.find((d) => d.id === conn.fromId);
      const to = devices.find((d) => d.id === conn.toId);
      if (from && to) {
        let length: number;
        // Head-end devices are all within 2 feet of each other
        if (isHeadEndDevice(from.part) && isHeadEndDevice(to.part)) {
          length = 2;
        } else {
          const len = calculateCableLength(from.x, from.y, to.x, to.y);
          length = len.feet || 0;
        }
        
        if (length > 0) {
          breakdown[conn.type] += length;
          breakdown.total += length;
        }
      }
    });
    
    return breakdown;
  }, [visibleConnections, devices, floorplanScale]);

  const totalDevices = devices.length;

  const autoAssignLNet = () => {
    const lnetDevices = devices.filter((d) => d.part === "R5KPS1EA" || d.part === "R5KCL546");
    setDevices(devices.map((dev) => {
      if (dev.part === "R5KPS1EA" || dev.part === "R5KCL546") {
        const idx = lnetDevices.indexOf(dev);
        return { ...dev, lnet: `LNET-${Math.floor(idx / 22) + 1}` };
      }
      return dev;
    }));
  };

  const lnetSegments: Record<string, number> = {};
  devices.forEach((dev) => {
    if ((dev.part === "R5KPS1EA" || dev.part === "R5KCL546") && dev.lnet)
      lnetSegments[dev.lnet] = (lnetSegments[dev.lnet] || 0) + 1;
  });

  const psuUtilization = devices
    .filter((d) => d.part === "R5KMPR36" || d.part === "R5KMPR15")
    .map((psuDev) => {
      const maxPower_mA = psuDev.part === "R5KMPR36" ? 10000 : 6000;
      const voltage = psuDev.part === "R5KMPR36" ? "36V" : "15V";
      const connected = connections
        .filter((c) => c.type === "POWER" && (c.fromId === psuDev.id || c.toId === psuDev.id))
        .map((c) => (c.fromId === psuDev.id ? c.toId : c.fromId))
        .map((id) => devices.find((d) => d.id === id))
        .filter(Boolean);
      const usedPower = connected.reduce((sum, d) => sum + (allDevices.find((l) => l.part === d!.part)?.power_mA || 0), 0);
      return { psu: { id: psuDev.id, name: psuDev.name, maxPower_mA, voltage }, usedPower, utilization: (usedPower / maxPower_mA) * 100 };
    });

  const getPort = (devId: string, portId: string): (PortDef & { device: DeviceDef }) | null => {
    const d = devices.find((x) => x.id === devId);
    if (!d) return null;
    const def = DEVICE_DEFS[d.part];
    if (!def) return null;
    const ports = customSchematics[d.part]?.ports || def.ports;
    const p = ports.find((pp) => pp.id === portId);
    if (!p) return null;
    return { ...p, device: def };
  };

  const portUsage = (devId: string, portId: string) =>
    connections.filter((c) =>
      (c.fromId === devId && c.fromPort === portId) || (c.toId === devId && c.toPort === portId)
    ).length;

  const restoreToolAfterConnect = () => {
    if (toolBeforePortClick.current !== null) {
      setTool(toolBeforePortClick.current);
      toolBeforePortClick.current = null;
    }
  };

  const onPortClick = (e: React.MouseEvent, devId: string, portId: string) => {
    e.stopPropagation();
    if (e.button === 2) return;
    const device = devices.find((d) => d.id === devId);
    const port = getPort(devId, portId);
    if (!device || !port) return;
    const compatible = getCompatibleDevices(device.part, port.type, true);

    if (e.altKey || e.shiftKey) {
      setCompatibleDevices({ sourceDeviceId: devId, sourcePortId: portId, devicePart: device.part, portType: port.type, compatibleParts: compatible });
      setShowCompatibleModal(true);
      setConnectFrom(`${devId}:${portId}`);
      setSelectedId(devId);
      if (tool !== "connect") {
        toolBeforePortClick.current = tool;
        setTool("connect");
      }
      if (canvasRef.current) {
        const wc = canvasToWorld(e.clientX, e.clientY);
        setDraggingConnection({ fromId: devId, fromPort: portId, mouseX: wc.x, mouseY: wc.y });
      }
      return;
    }

    if (!connectFrom) {
      if (tool !== "connect") {
        toolBeforePortClick.current = tool;
        setTool("connect");
      }
      setConnectFrom(`${devId}:${portId}`);
      setSelectedId(devId);
      if (canvasRef.current) {
        const wc = canvasToWorld(e.clientX, e.clientY);
        setDraggingConnection({ fromId: devId, fromPort: portId, mouseX: wc.x, mouseY: wc.y });
      }
      return;
    }

    const [fromDevId, fromPortId] = connectFrom.split(":");
    if (fromDevId === devId && fromPortId === portId) {
      setConnectFrom(null);
      setDraggingConnection(null);
      restoreToolAfterConnect();
      return;
    }
    const a = getPort(fromDevId, fromPortId);
    const b = getPort(devId, portId);
    if (!a || !b) return;
    if (a.type !== b.type) {
      alert(`Cannot connect ${a.type} port to ${b.type} port`);
      setConnectFrom(null);
      setDraggingConnection(null);
      restoreToolAfterConnect();
      return;
    }
    const usageA = portUsage(fromDevId, fromPortId);
    const usageB = portUsage(devId, portId);
    if (a.limit && usageA >= a.limit) { alert(`Port ${a.label} is at capacity`); setConnectFrom(null); setDraggingConnection(null); restoreToolAfterConnect(); return; }
    if (b.limit && usageB >= b.limit) { alert(`Port ${b.label} is at capacity`); setConnectFrom(null); setDraggingConnection(null); restoreToolAfterConnect(); return; }
    const fromDev = devices.find(d => d.id === fromDevId);
    const toDev = devices.find(d => d.id === devId);
    if (fromDev && toDev) {
      const result = validateConnection(fromDev, a.type, toDev, b.type, connections);
      if (!result.valid) { alert(result.reason || "Invalid connection"); setConnectFrom(null); setDraggingConnection(null); restoreToolAfterConnect(); return; }
    }
    const conn = normalizeConnection(fromDevId, devId, fromPortId, portId, a.type);
    setConnections([...connections, conn]);
    setConnectFrom(null);
    setDraggingConnection(null);
    setShowCompatibleModal(false);
    restoreToolAfterConnect();
  };

  const getDevicePorts = useCallback((devicePart: string) => {
    if (customSchematics[devicePart]?.ports) return customSchematics[devicePart].ports;
    const def = DEVICE_DEFS[devicePart];
    return def ? def.ports : [];
  }, [customSchematics]);

  const handleAddCompatibleDevice = useCallback((part: string) => {
    const newId = crypto.randomUUID();
    const newDev: Device = { id: newId, part, name: allDevices.find((d) => d.part === part)?.label || part, x: 100 + devices.length * 20, y: 100 + devices.length * 20, floorPlanId: activeFloorPlanId || undefined };
    setDevices([...devices, newDev]);
    if (compatibleDevices.sourceDeviceId && compatibleDevices.sourcePortId) {
      const ports = getDevicePorts(part);
      const cp = ports.filter((p) => p.type === compatibleDevices.portType);
      if (cp.length >= 1) {
        const conn = normalizeConnection(compatibleDevices.sourceDeviceId, newId, compatibleDevices.sourcePortId, cp[0].id, compatibleDevices.portType);
        setConnections([...connections, conn]);
        setConnectFrom(null);
        setShowCompatibleModal(false);
        setDraggingConnection(null);
      }
    }
  }, [allDevices, devices, connections, compatibleDevices, getDevicePorts, setDevices, setConnections, activeFloorPlanId]);

  const handleConnectToDevice = useCallback((targetDeviceId: string, targetPortId: string) => {
    if (!compatibleDevices.sourceDeviceId || !compatibleDevices.sourcePortId) return;
    const conn = normalizeConnection(
      compatibleDevices.sourceDeviceId, targetDeviceId,
      compatibleDevices.sourcePortId, targetPortId,
      compatibleDevices.portType
    );
    setConnections([...connections, conn]);
    setConnectFrom(null);
    setShowCompatibleModal(false);
    setDraggingConnection(null);
  }, [compatibleDevices, connections, setConnections]);

  const getDeviceSchematic = useCallback((devicePart: string) => {
    if (customSchematics[devicePart]?.image) return customSchematics[devicePart].image;
    return DEVICE_DEFS[devicePart]?.customSchematic;
  }, [customSchematics]);

  const lnetUtilization = useMemo(() => {
    const map: Record<string, number> = {};
    connections.forEach((c) => {
      if (c.type !== "LNET") return;
      const from = devices.find((d) => d.id === c.fromId);
      const to = devices.find((d) => d.id === c.toId);
      if (from && DEVICE_DEFS[from.part]?.part === "R5KMSC") map[`${c.fromId}:${c.fromPort}`] = (map[`${c.fromId}:${c.fromPort}`] ?? 0) + 1;
      else if (to && DEVICE_DEFS[to.part]?.part === "R5KMSC") map[`${c.toId}:${c.toPort}`] = (map[`${c.toId}:${c.toPort}`] ?? 0) + 1;
    });
    return map;
  }, [connections, devices]);

  const deleteKit = async (kitId: string) => {
    await supabase.from("kits").delete().eq("id", kitId);
    setKits(kits.filter((k) => k.id !== kitId));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setDraggingConnection(null); setConnectFrom(null); setShowCompatibleModal(false); restoreToolAfterConnect(); setHighlightedDeviceIds(new Set()); return; }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
        return;
      }
      if (e.key === "Delete" && !e.ctrlKey && !e.metaKey) {
        const el = document.activeElement;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
        if (selectedId) { e.preventDefault(); deleteSelected(); }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, devices, connections]);

  useEffect(() => {
    let prevTool: typeof tool | null = null;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "g") {
        e.preventDefault();
        // Check canvas device selection first
        if (selectedIds.size > 0) {
          const selectedParts = new Set<string>();
          devices.forEach((d) => {
            if (selectedIds.has(d.id)) {
              selectedParts.add(d.part);
            }
          });
          if (selectedParts.size > 0) {
            setSelectedPaletteParts(selectedParts);
            setShowKitModal(true);
          }
          return;
        }
        // Fall back to palette selection
        if (selectedPaletteParts.size === 0) return;
        setShowKitModal(true);
        return;
      }
      if ((e.key === "c" || e.key === "C") && !e.ctrlKey && !e.metaKey) {
        if (e.repeat) return;
        const el = document.activeElement;
        if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) return;
        if (tool !== "connect") { prevTool = tool; setTool("connect"); }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "c" || e.key === "C") { if (prevTool !== null) { setTool(prevTool); prevTool = null; } setConnectFrom(null); }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, [selectedPaletteParts, selectedIds, devices, tool]);

  // Cleanup double-click timer on unmount
  useEffect(() => {
    return () => {
      if (doubleClickTimerRef.current) clearTimeout(doubleClickTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        if (!spacebarPressed) {
          setSpacebarPressed(true);
        }
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        e.stopPropagation();
        setSpacebarPressed(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("keyup", handleKeyUp, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("keyup", handleKeyUp, true);
    };
  }, [spacebarPressed]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!spacebarPressed) return;
      startPan(e.clientX, e.clientY);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning.current) return;
      updatePan(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      endPan();
    };

    canvasRef.current.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener("mousedown", handleMouseDown);
      }
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [spacebarPressed, startPan, updatePan, endPan, isPanning]);

  useEffect(() => {
    const handlePaletteMouseDown = (e: MouseEvent) => {
      if (!paletteWrapperRef.current) return;
      const rect = paletteWrapperRef.current.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      
      const target = e.target as HTMLElement;
      if (target.closest('[data-palette-card]') || target.closest('button') || target.closest('[role="button"]')) return;
      setPaletteSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
    };

    const handlePaletteMouseMove = (e: MouseEvent) => {
      setPaletteSelectionBox((prev) => prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null);
    };

    const handlePaletteMouseUp = () => {
      setPaletteSelectionBox((prev) => {
        if (!prev) return null;
        const { startX, startY, endX, endY } = prev;
        if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
          setPaletteSelectionBox(null);
          return null;
        }
        
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        const selected = new Set<string>();
        paletteCardsRef.current.forEach((el, part) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > minX && rect.left < maxX && rect.bottom > minY && rect.top < maxY) {
            selected.add(part);
          }
        });
        
        if (selected.size > 0) {
          setSelectedPaletteParts(selected);
        }
        setPaletteSelectionBox(null);
        return null;
      });
    };

    if (paletteSelectionBox) {
      document.addEventListener("mousemove", handlePaletteMouseMove);
      document.addEventListener("mouseup", handlePaletteMouseUp);
      return () => {
        document.removeEventListener("mousemove", handlePaletteMouseMove);
        document.removeEventListener("mouseup", handlePaletteMouseUp);
      };
    } else {
      document.addEventListener("mousedown", handlePaletteMouseDown);
      return () => {
        document.removeEventListener("mousedown", handlePaletteMouseDown);
      };
    }
  }, [paletteSelectionBox]);

  useEffect(() => {
    const handleCanvasMouseDown = (e: MouseEvent) => {
      // Skip if spacebar is pressed (we're panning instead)
      if (spacebarPressed) return;
      
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      
      const target = e.target as HTMLElement;
      // Skip if clicking on a device or interactive element
      if (target.closest('[data-device-id]') || target.closest('button') || target.closest('[role="button"]') || target.closest('svg')) return;
      
      setCanvasSelectionBox({ startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY });
    };

    const handleCanvasMouseMove = (e: MouseEvent) => {
      setCanvasSelectionBox((prev) => prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null);
    };

    const handleCanvasMouseUp = () => {
      setCanvasSelectionBox((prev) => {
        if (!prev) return null;
        const { startX, startY, endX, endY } = prev;
        if (Math.abs(endX - startX) < 5 && Math.abs(endY - startY) < 5) {
          setCanvasSelectionBox(null);
          return null;
        }
        
        const minX = Math.min(startX, endX);
        const maxX = Math.max(startX, endX);
        const minY = Math.min(startY, endY);
        const maxY = Math.max(startY, endY);
        
        const selected = new Set<string>();
        canvasDevicesRef.current.forEach((el, deviceId) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > minX && rect.left < maxX && rect.bottom > minY && rect.top < maxY) {
            selected.add(deviceId);
          }
        });
        
        if (selected.size > 0) {
          setSelectedIds(selected);
        }
        setCanvasSelectionBox(null);
        return null;
      });
    };

    if (canvasSelectionBox) {
      document.addEventListener("mousemove", handleCanvasMouseMove);
      document.addEventListener("mouseup", handleCanvasMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleCanvasMouseMove);
        document.removeEventListener("mouseup", handleCanvasMouseUp);
      };
    } else {
      document.addEventListener("mousedown", handleCanvasMouseDown);
      return () => {
        document.removeEventListener("mousedown", handleCanvasMouseDown);
      };
    }
  }, [canvasSelectionBox, spacebarPressed]);

  const renderPaletteCard = (item: DeviceLibraryItem) => (
    <div
      key={item.part}
      ref={(el) => { if (el) paletteCardsRef.current.set(item.part, el); else paletteCardsRef.current.delete(item.part); }}
      data-palette-card
    >
      <Card
        draggable
        onDragStart={(e) => onPaletteDragStart(e, item.part)}
        onClick={(e) => onPaletteItemClick(e, item.part)}
        className={`cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
          selectedPalettePart === item.part ? "ring-2 ring-blue-400" : ""
        } ${selectedPaletteParts.has(item.part) ? "ring-2 ring-green-400" : ""}`}
      >
        <CardContent className="p-3">
          <div className="flex items-center justify-center mb-2">
            {DEVICE_DEFS[item.part] ? (
              getDeviceSchematic(item.part) ? (
                <img src={getDeviceSchematic(item.part)} alt={item.part} className="w-16 h-16 object-contain" />
              ) : (
                <DeviceSVG part={item.part} width={64} height={64} />
              )
            ) : (
              <DeviceIcon part={item.part} className="w-16 h-16 flex-shrink-0" />
            )}
          </div>
          <div className="text-center">
            <div className="text-xs font-semibold text-gray-800 truncate flex items-center justify-center gap-1">
              {item.part}
              {item.preferred && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
            </div>
            <div className="text-xs text-gray-500">{item.power_mA}mA</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPort = (device: Device, _def: DeviceDef, p: PortDef, index: number, total: number, position: "power" | "top" | "bottom" | "right") => {
    const color = TYPE_COLOR[p.type];
    const usage = portUsage(device.id, p.id);
    const overCapacity = !!(p.limit && usage >= p.limit);
    const isUsed = usage > 0;
    const size = 12;
    let posStyle: React.CSSProperties = {};
    if (position === "power") posStyle = { position: "absolute", left: -size / 2, top: `${(index + 1) * (100 / (total + 1))}%`, transform: "translateY(-50%)" };
    else if (position === "top") posStyle = { position: "absolute", top: -size / 2, left: `${(index + 1) * (100 / (total + 1))}%`, transform: "translateX(-50%)" };
    else if (position === "bottom") posStyle = { position: "absolute", bottom: -size / 2, left: `${(index + 1) * (100 / (total + 1))}%`, transform: "translateX(-50%)" };
    else posStyle = { position: "absolute", right: -size / 2, top: `${(index + 1) * (100 / (total + 1))}%`, transform: "translateY(-50%)" };

    return (
      <div key={p.id} className="group cursor-crosshair" onMouseDown={(e) => onPortClick(e, device.id, p.id)}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setPortContextMenu({ x: e.clientX, y: e.clientY, deviceId: device.id, portId: p.id, portType: p.type as PortType, devicePart: device.part }); }}
        style={{ ...posStyle, pointerEvents: "auto", zIndex: 20 }}>
        <div className="rounded-full flex items-center justify-center transition-all hover:scale-150"
          style={{ width: size, height: size, backgroundColor: isUsed ? color : "white", border: `1px solid ${color}`, boxShadow: overCapacity ? "0 0 0 1px #fecaca" : "0 1px 2px rgba(0,0,0,0.15)" }}
          title={`${p.label} (${p.type})${isUsed ? ` - ${usage} connection${usage > 1 ? "s" : ""}` : ""}`}>
          {isUsed && <span className="text-[8px] font-bold text-white">{usage > 1 ? usage : ""}</span>}
        </div>
      </div>
    );
  };

  const handleBack = () => { clearProject(); onBack(); };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={handleBack} className="mr-1 text-gray-300 hover:text-white hover:bg-gray-800">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-sm font-bold text-white">System Designer</h1>
        {currentProject && (
          <div className="text-xs text-gray-400">
            <span className="font-semibold text-gray-300">{currentProject.customer_name}</span>
            {" / "}
            <span>{currentProject.site_name}</span>
          </div>
        )}
        <select value={projectType} onChange={(e) => updateProject({ project_type: e.target.value as ProjectType })}
          className="h-7 rounded border border-gray-600 bg-gray-800 px-2 text-xs text-gray-300">
          <option value="new-r5k">New R5K System</option>
          <option value="upgrade-r4k-to-r5k">Upgrade R4K → R5K</option>
          <option value="new-r4k">New R4K System</option>
          <option value="mixed">Mixed/Custom</option>
        </select>
        <div className="flex-1" />
        <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileUpload} />
        <input type="file" accept="application/json" className="hidden" id="import-input" onChange={importDesign} />
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PALETTE */}
        <div className="w-72 bg-white border-r shadow-lg flex flex-col" ref={paletteWrapperRef}>
          <div className="p-3 border-b flex items-center justify-between">
            <h2 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">Device Palette</h2>
            <Button size="sm" variant="outline" onClick={() => setShowAddDeviceForm(true)} className="h-6 px-2 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          {showAddDeviceForm && <AddDeviceForm onAdd={addCustomDevice} onCancel={() => setShowAddDeviceForm(false)} />}
          <Tabs value={paletteTab} onValueChange={setPaletteTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="mx-3 mt-2 flex-shrink-0">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="head-end" className="text-xs">Head End</TabsTrigger>
              <TabsTrigger value="room" className="text-xs">Room</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="flex-1 overflow-hidden mt-2">
              <div className="relative h-full">
                <ScrollArea className="h-full p-3">
                  {selectedPaletteParts.size > 0 && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                      <div className="text-xs text-green-700 font-medium">
                        {selectedPaletteParts.size} selected - <kbd className="px-1 py-0.5 bg-white border border-green-300 rounded text-xs">Ctrl+G</kbd> to create kit
                      </div>
                    </div>
                  )}
                  <div className="mb-4">
                    <div className="text-xs font-bold text-gray-600 mb-2 px-1">Kits</div>
                    {kits.length === 0 ? (
                      <div className="p-3 text-xs text-gray-500 text-center bg-gray-50 border border-gray-200 rounded-md">Drag to select, Ctrl+Click, or Ctrl+G to create kit</div>
                    ) : (
                    <div className="space-y-2">
                      {kits.map((kit) => (
                        <Card key={kit.id} draggable onDragStart={(e) => onKitDragStart(e, kit.id)} className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-2 border-green-200">
                          <CardContent className="p-2 flex items-center gap-2">
                            <Layers className="w-5 h-5 flex-shrink-0 text-green-600" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{kit.name}</div>
                              <div className="text-xs text-gray-500">{kit.parts.length} devices</div>
                            </div>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${kit.name}"?`)) deleteKit(kit.id); }} className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
                {["Head End", "Console", "Corridor Light", "Domeless", "Room Station", "High Security", "Pushbutton", "Custom"].map((category) => {
                  const items = filteredDevices.filter((d) => d.category === category);
                  if (items.length === 0) return null;
                  return (
                    <div key={category} className="mb-4">
                      <div className="text-xs font-bold text-gray-600 mb-2 px-1">{category}</div>
                      <div className="grid grid-cols-2 gap-2">{items.map(renderPaletteCard)}</div>
                    </div>
                  );
                })}
              </ScrollArea>
                {paletteSelectionBox && (
                  <div
                    className="absolute bg-blue-200 border-2 border-blue-400 opacity-50 pointer-events-none"
                    style={{
                      left: Math.min(paletteSelectionBox.startX, paletteSelectionBox.endX),
                      top: Math.min(paletteSelectionBox.startY, paletteSelectionBox.endY),
                      width: Math.abs(paletteSelectionBox.endX - paletteSelectionBox.startX),
                      height: Math.abs(paletteSelectionBox.endY - paletteSelectionBox.startY),
                    }}
                  />
                )}
              </div>
            </TabsContent>
            <TabsContent value="head-end" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full p-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredDevices.filter((d) => d.category === "Head End" || d.category === "Console").map(renderPaletteCard)}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="room" className="flex-1 overflow-hidden mt-2">
              <ScrollArea className="h-full p-3">
                <div className="grid grid-cols-2 gap-2">
                  {filteredDevices.filter((d) => d.category.includes("Room") || d.category.includes("Corridor") || d.category.includes("Domeless") || d.category.includes("Pushbutton")).map(renderPaletteCard)}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
          {selectedPalettePart && (() => {
            const deviceInfo = allDevices.find((d) => d.part === selectedPalettePart);
            if (!deviceInfo) return null;
            if (editingPaletteDevice) {
              return (
                <div className="border-t p-3 bg-blue-50 flex-shrink-0 max-h-96 overflow-y-auto">
                  <h3 className="font-bold text-sm mb-3">Edit Device</h3>
                  <div className="space-y-2">
                    <div><Label className="text-xs">Part Number</Label><Input value={deviceInfo.part} disabled className="mt-1 text-xs" /></div>
                    <div><Label className="text-xs">Description</Label><Input value={deviceInfo.label} onChange={(e) => updatePaletteDevice(deviceInfo.part, { label: e.target.value })} className="mt-1 text-xs" /></div>
                    <div><Label className="text-xs">Category</Label><Input value={deviceInfo.category} onChange={(e) => updatePaletteDevice(deviceInfo.part, { category: e.target.value })} className="mt-1 text-xs" /></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label className="text-xs">Power (mA)</Label><Input type="number" value={deviceInfo.power_mA} onChange={(e) => updatePaletteDevice(deviceInfo.part, { power_mA: Number(e.target.value) })} className="mt-1 text-xs" /></div>
                      <div><Label className="text-xs">Power (A)</Label><Input type="number" step="0.001" value={deviceInfo.power_A || 0} onChange={(e) => updatePaletteDevice(deviceInfo.part, { power_A: Number(e.target.value) })} className="mt-1 text-xs" /></div>
                    </div>
                    <div><Label className="text-xs">Install Time (min)</Label><Input type="number" value={deviceInfo.laborMinutes || 0} onChange={(e) => updatePaletteDevice(deviceInfo.part, { laborMinutes: Number(e.target.value) })} className="mt-1 text-xs" /></div>
                    <Button size="sm" variant="outline" onClick={() => setShowSchematicEditor(true)} className="w-full text-xs"><Settings className="w-3 h-3 mr-1" /> Edit Schematic</Button>
                    <Button size="sm" onClick={() => setEditingPaletteDevice(false)} className="w-full text-xs">Done Editing</Button>
                  </div>
                </div>
              );
            }
            return (
              <div className="border-t p-3 bg-blue-50 flex-shrink-0">
                <div className="flex items-start gap-3">
                  <DeviceIcon part={deviceInfo.part} className="w-8 h-8 flex-shrink-0 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <h3 className="font-bold text-sm text-gray-900">{deviceInfo.part}</h3>
                      <Button size="sm" variant="ghost" onClick={() => setEditingPaletteDevice(true)} className="h-6 px-2 text-xs">Edit</Button>
                    </div>
                    <p className="text-xs text-gray-700 mt-1">{deviceInfo.label}</p>
                    <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                      <div><span className="text-gray-600">Category:</span><div className="font-semibold">{deviceInfo.category}</div></div>
                      <div><span className="text-gray-600">Power:</span><div className="font-semibold">{deviceInfo.power_A ? `${deviceInfo.power_A}A` : `${deviceInfo.power_mA}mA`}</div></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 italic">Drag to canvas to add</p>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* CENTER CANVAS */}
        <div
          className={`flex-1 relative bg-gray-800 select-none overflow-hidden ${spacebarPressed ? "cursor-grab active:cursor-grabbing" : ""} ${tool === "connect" || tool === "wall" ? "cursor-crosshair" : ""}`}
          ref={canvasRef} onDragOver={onCanvasDragOver} onDrop={onCanvasDrop}
          onContextMenu={(e) => {
            e.preventDefault();
            if (selectedIds.size > 1) {
              setAlignmentMenu({ x: e.clientX, y: e.clientY });
            }
          }}
          onDoubleClick={(e) => { if (!copiedDevice || !canvasRef.current) return; const { x, y } = canvasToWorld(e.clientX, e.clientY); setDevices([...devices, { ...copiedDevice, id: crypto.randomUUID(), name: `${copiedDevice.part}-${devices.length + 1}`, x, y, floorPlanId: activeFloorPlanId || undefined }]); }}
          onClick={(e) => {
            if (highlightedDeviceIds.size > 0 && e.target === canvasRef.current) {
              setHighlightedDeviceIds(new Set());
              return;
            }
            if (tool === "wall" && canvasRef.current) {
              const { x, y } = canvasToWorld(e.clientX, e.clientY);
              if (!drawingWall) setDrawingWall({ x, y });
              else { setWalls([...walls, { id: crypto.randomUUID(), x1: drawingWall.x, y1: drawingWall.y, x2: x, y2: y }]); setDrawingWall(null); }
            }
          }}
          onMouseMove={(e) => {
            if (spacebarPressed || !canvasRef.current) return;
            const { x, y } = canvasToWorld(e.clientX, e.clientY);
            if (tool === "wall" && drawingWall) setWallPreviewEnd({ x, y });
            if (draggingConnection) setDraggingConnection((prev) => prev ? { ...prev, mouseX: x, mouseY: y } : null);
          }}
        >
          <CanvasBackground
            viewState={viewState}
            imageUrl={bgDataUrl}
            opacity={bgOpacity}
            containerWidth={canvasSize.width}
            containerHeight={canvasSize.height}
          />

          <div className="absolute inset-0 pointer-events-none" style={{ overflow: "hidden" }}>
            <div style={{ position: "absolute", left: 0, top: 0, transformOrigin: "0 0", transform: `translate(${viewState.offsetX}px, ${viewState.offsetY}px) scale(${zoom})`, pointerEvents: "auto" }}>
              <svg className="absolute pointer-events-none z-0" style={{ width: 10000, height: 10000, left: -5000, top: -5000, overflow: "visible" }}>
                {walls.map((wall) => <line key={wall.id} x1={wall.x1} y1={wall.y1} x2={wall.x2} y2={wall.y2} stroke="#1e293b" strokeWidth={4} opacity={wallsOpacity / 100} />)}
                {drawingWall && wallPreviewEnd && <line x1={drawingWall.x} y1={drawingWall.y} x2={wallPreviewEnd.x} y2={wallPreviewEnd.y} stroke="#3b82f6" strokeWidth={4} strokeDasharray="8 4" opacity={0.6} />}
                {(() => {
                  const groups = new Map<string, Connection[]>();
                  visibleConnections.forEach((c) => {
                    const pair = [c.fromId + ":" + c.fromPort, c.toId + ":" + c.toPort].sort().join("|");
                    if (!groups.has(pair)) groups.set(pair, []);
                    groups.get(pair)!.push(c);
                  });
                  return Array.from(groups.entries()).map(([groupKey, groupConns]) => {
                    const first = groupConns[0];
                    const coords = getLineCoords(first);
                    if (!coords) return null;
                    const pathData = getRoutedPath(first);
                    if (!pathData) return null;
                    const midX = (coords.x1 + coords.x2) / 2;
                    const midY = (coords.y1 + coords.y2) / 2;
                    const isHovered = groupConns.some((c) => c.id === hoveredConnection);
                    const isInHighlight = highlightedDeviceIds.size > 0 && groupConns.some((c) =>
                      highlightedDeviceIds.has(c.fromId) && highlightedDeviceIds.has(c.toId)
                    );
                    const connOpacity = highlightedDeviceIds.size > 0 ? (isInHighlight ? 1 : 0.15) : 1;
                    return (
                      <g key={groupKey} style={{ opacity: connOpacity }}>
                        <path d={pathData} stroke={getLineColor(first.type)} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" fill="none" className="pointer-events-auto cursor-pointer opacity-0 hover:opacity-30 transition-opacity"
                          onMouseEnter={() => setHoveredConnection(first.id)} onMouseLeave={() => setHoveredConnection(null)}
                          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setConnectionContextMenu({ x: e.clientX, y: e.clientY, connectionId: first.id }); }} />
                        <path d={pathData} stroke={getLineColor(first.type)} strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" fill="none" className="pointer-events-none" />
                        {groupConns.length > 1 && (
                          <g>
                            <circle cx={midX} cy={midY} r={12} fill="#3b82f6" stroke="white" strokeWidth={2} />
                            <text x={midX} y={midY} fontSize={12} fontWeight="700" fill="white" textAnchor="middle" dominantBaseline="middle">{groupConns.length}</text>
                          </g>
                        )}
                        {isHovered && (
                          <g>
                            {groupConns.map((conn, idx) => {
                              const from = devices.find((d) => d.id === conn.fromId);
                              const to = devices.find((d) => d.id === conn.toId);
                              return <text key={conn.id} x={midX} y={midY - 25 - idx * 18} fontSize={13} fontWeight="600" fill="#1f2937" textAnchor="middle" style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 4 }}>{from && to ? `${from.name} (${conn.fromPort}) → ${to.name} (${conn.toPort})` : ""}</text>;
                            })}
                            {(() => { const len = calculateCableLength(coords.x1, coords.y1, coords.x2, coords.y2); return len.feet ? <text x={midX} y={midY + 25} fontSize={12} fontWeight="500" fill="#059669" textAnchor="middle" style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 3 }}>{len.feet.toFixed(1)}ft</text> : null; })()}
                          </g>
                        )}
                      </g>
                    );
                  });
                })()}
                {draggingConnection && (() => {
                  const fromDev = devices.find((d) => d.id === draggingConnection.fromId);
                  if (!fromDev) return null;
                  const def = DEVICE_DEFS[fromDev.part];
                  if (!def) return null;
                  const ports = customSchematics[fromDev.part]?.ports || def.ports;
                  const port = ports.find((p) => p.id === draggingConnection.fromPort);
                  if (!port) return null;
                  const pos = getPortPosition(fromDev, draggingConnection.fromPort, def, ports, deviceScale);
                  const color = TYPE_COLOR[port.type] || "#6b7280";
                  return <path d={getStraightPath(pos.x, pos.y, draggingConnection.mouseX, draggingConnection.mouseY)} stroke={color} strokeWidth={2} strokeDasharray="8 4" strokeLinecap="round" fill="none" opacity={0.7} />;
                })()}
              </svg>

              {visibleDevices.map((device) => {
                const def = DEVICE_DEFS[device.part];
                const isSelected = device.id === selectedId;
                const isInMulti = selectedIds.has(device.id);
                if (!def) {
                  return (
                    <Card key={device.id} className={`absolute cursor-move transition-shadow ${isSelected ? "ring-2 ring-blue-500 shadow-lg" : isInMulti ? "ring-2 ring-green-400 shadow-lg" : "shadow"}`}
                      style={{ left: device.x, top: device.y, width: 140 }}
                      onMouseDown={(e) => onDeviceMouseDown(e, device.id)} onContextMenu={(e) => { e.preventDefault(); setCopiedDevice(device); }}>
                      <CardContent className="p-2 flex items-center gap-2">
                        <DeviceIcon part={device.part} className="w-6 h-6 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-semibold text-gray-800 truncate">{device.part}</div>
                          <div className="text-xs text-gray-500 truncate">{device.name}</div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                }
                const sw = def.w * (deviceScale / 100);
                const sh = def.h * (deviceScale / 100);
                const ports = customSchematics[device.part]?.ports || def.ports || [];
                const portsByType = { power: [] as PortDef[], top: [] as PortDef[], bottom: [] as PortDef[], right: [] as PortDef[] };
                ports.forEach((p) => {
                  if (p.type === "AC" || p.type === "POWER") portsByType.power.push(p);
                  else if (p.type === "LNET") portsByType.top.push(p);
                  else if (p.type === "KB") portsByType.bottom.push(p);
                  else if (p.type === "ETH") portsByType.right.push(p);
                });
                return (
                  <div key={device.id} data-device-id={device.id}
                    ref={(el) => { if (el) canvasDevicesRef.current.set(device.id, el); else canvasDevicesRef.current.delete(device.id); }}
                    className={`absolute z-10 ${isSelected ? "ring-2 ring-blue-500" : isInMulti ? "ring-2 ring-green-400" : ""}`}
                    style={{
                      left: device.x,
                      top: device.y,
                      transform: "translate(-50%, -50%)",
                      opacity: highlightedDeviceIds.size > 0
                        ? (highlightedDeviceIds.has(device.id) ? 1 : 0.5)
                        : (deviceOpacity / 100)
                    }}
                    onMouseDown={(e) => onDeviceMouseDown(e, device.id)} onContextMenu={(e) => { e.preventDefault(); setCopiedDevice(device); }}>
                    <div className="relative">
                      <div className="shadow-lg" style={{ opacity: deviceOpacity / 100 }}>
                        {getDeviceSchematic(device.part) ? (
                          <img src={getDeviceSchematic(device.part)} alt={device.part} style={{ width: sw, height: sh }} className="object-contain" />
                        ) : (
                          <DeviceSVG part={device.part} width={sw} height={sh} />
                        )}
                      </div>
                      {showDeviceNames && <div className="absolute left-1/2 -translate-x-1/2 mt-1 text-center"><div className="text-sm font-semibold text-white whitespace-nowrap" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)" }}>{device.name}</div></div>}
                      {showDeviceModels && <div className="absolute left-1/2 -translate-x-1/2 text-center" style={{ top: showDeviceNames ? "calc(100% + 22px)" : "calc(100% + 2px)" }}><div className="text-xs text-gray-300 whitespace-nowrap" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)" }}>{device.part}</div></div>}
                      {showPorts && (
                        <>
                          {portsByType.power.map((p, i) => renderPort(device, def, p, i, portsByType.power.length, "power"))}
                          {portsByType.top.map((p, i) => renderPort(device, def, p, i, portsByType.top.length, "top"))}
                          {portsByType.bottom.map((p, i) => renderPort(device, def, p, i, portsByType.bottom.length, "bottom"))}
                          {portsByType.right.map((p, i) => renderPort(device, def, p, i, portsByType.right.length, "right"))}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {canvasSelectionBox && canvasRef.current && (() => {
            const rect = canvasRef.current.getBoundingClientRect();
            return (
              <div style={{
                position: "absolute",
                left: Math.min(canvasSelectionBox.startX, canvasSelectionBox.endX) - rect.left,
                top: Math.min(canvasSelectionBox.startY, canvasSelectionBox.endY) - rect.top,
                width: Math.abs(canvasSelectionBox.endX - canvasSelectionBox.startX),
                height: Math.abs(canvasSelectionBox.endY - canvasSelectionBox.startY),
                border: "2px solid #3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                pointerEvents: "none",
                zIndex: 1000,
              }} />
            );
          })()}

          <DesignerBottomBar
            tool={tool}
            onToolChange={(t) => { setTool(t); if (t !== "connect") setConnectFrom(null); }}
            zoom={zoom}
            onZoomChange={setZoomLevel}
            onResetView={resetView}
            onToggleEnvironment={() => setShowEnvironmentPanel(!showEnvironmentPanel)}
            showEnvironmentPanel={showEnvironmentPanel}
            onImport={() => document.getElementById("import-input")?.click()}
            onExport={exportDesign}
            onBom={() => setShowBomModal(true)}
            onQuote={() => setShowQuotePanel(true)}
            onPower={() => setShowPowerCalc(true)}
            onAutoLNet={autoAssignLNet}
            floorPlans={floorPlans}
            activeFloorPlanId={activeFloorPlanId}
            legacyImageUrl={currentProject?.background_image_url || null}
            legacyOpacity={currentProject?.background_opacity ?? 60}
            onAddFloorPlan={addFloorPlan}
            onRemoveFloorPlan={removeFloorPlan}
            onSetActiveFloorPlan={(id) => updateProject({ active_floor_plan_id: id })}
            onRenameFloorPlan={renameFloorPlan}
            onSetFloorPlanOpacity={setFloorPlanOpacity}
            onMigrateLegacy={migrateLegacyFloorPlan}
            onRemoveLegacy={removeLegacyFloorPlan}
          />
        </div>

        {/* ENVIRONMENT PANEL */}
        {showEnvironmentPanel && (
          <div className="w-72 bg-white border-l shadow-lg overflow-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-sm text-gray-700">Environment</h2>
                <button onClick={() => setShowEnvironmentPanel(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-5">
                <div className="space-y-2">
                  {[{ id: "showDeviceNames", label: "Device Name", checked: showDeviceNames, onChange: (v: boolean) => updateProject({ show_device_names: v }) },
                    { id: "showDeviceModels", label: "Device Model", checked: showDeviceModels, onChange: setShowDeviceModels },
                    { id: "showPorts", label: "Ports", checked: showPorts, onChange: (v: boolean) => updateProject({ show_ports: v }) },
                  ].map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <input type="checkbox" id={item.id} checked={item.checked} onChange={(e) => item.onChange(e.target.checked)} className="rounded" />
                      <Label htmlFor={item.id} className="text-sm">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Device Visibility ({deviceOpacity}%)</Label>
                  <input type="range" min="0" max="100" value={deviceOpacity} onChange={(e) => updateProject({ device_opacity: parseInt(e.target.value) })} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Device Size ({deviceScale}%)</Label>
                  <input type="range" min="50" max="200" value={deviceScale} onChange={(e) => updateProject({ device_scale: parseInt(e.target.value) })} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Floorplan Scale</Label>
                  <div className="flex items-center gap-2">
                    <Input type="number" step="0.1" min="0" value={floorplanScale || ""} onChange={(e) => updateProject({ floorplan_scale: e.target.value ? parseFloat(e.target.value) : null })} placeholder="Not set" className="text-xs" />
                    <span className="text-xs text-gray-500 whitespace-nowrap">ft/100px</span>
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Drawing Opacity ({bgOpacity}%)</Label>
                  <input type="range" min="0" max="100" value={bgOpacity} onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (activeFloorPlan) setFloorPlanOpacity(activeFloorPlan.id, val);
                    else updateProject({ background_opacity: val });
                  }} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <div>
                  <Label className="text-sm text-gray-600 mb-2 block">Walls Opacity ({wallsOpacity}%)</Label>
                  <input type="range" min="0" max="100" value={wallsOpacity} onChange={(e) => updateProject({ walls_opacity: parseInt(e.target.value) })} className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                </div>
                <Button variant="outline" size="sm" className="w-full text-blue-600" onClick={() => updateProject({ background_opacity: 60, device_opacity: 100, device_scale: 100, walls_opacity: 90, show_device_names: true, show_ports: true })}>Restore Default</Button>
              </div>
            </div>
          </div>
        )}

        {/* RIGHT PROPERTIES */}
        <div className="w-72 bg-white border-l shadow-lg overflow-auto">
          <div className="p-4">
            <h2 className="font-semibold text-xs text-gray-700 uppercase tracking-wider mb-4">Properties</h2>
            {selectedDevice ? (
              <div className="space-y-4">
                <div><Label className="text-xs">Device Name</Label><Input value={selectedDevice.name} onChange={(e) => updateSelectedDevice({ name: e.target.value })} className="mt-1" /></div>
                <div><Label className="text-xs">Part Number</Label><Input value={selectedDevice.part} disabled className="mt-1" /></div>
                <div><Label className="text-xs">Serial Number</Label><Input value={selectedDevice.serialNumber || ""} onChange={(e) => updateSelectedDevice({ serialNumber: e.target.value })} placeholder="e.g., SN-12345" className="mt-1" /></div>
                
                <hr className="my-2" />
                <p className="text-xs font-semibold text-gray-600 uppercase">Marshall Standard Labels</p>
                
                <div><Label className="text-xs">Room Number</Label><Input value={selectedDevice.roomNumber || ""} onChange={(e) => updateSelectedDevice({ roomNumber: e.target.value })} placeholder="e.g., RM214" className="mt-1" /></div>
                <div><Label className="text-xs">Floor / Building</Label><div className="grid grid-cols-2 gap-2 mt-1"><Input value={selectedDevice.floor || ""} onChange={(e) => updateSelectedDevice({ floor: e.target.value })} placeholder="Floor" /><Input value={selectedDevice.building || ""} onChange={(e) => updateSelectedDevice({ building: e.target.value })} placeholder="Building" /></div></div>
                <div><Label className="text-xs">Bus Type</Label><Input value={selectedDevice.busType || ""} onChange={(e) => updateSelectedDevice({ busType: e.target.value })} placeholder="e.g., KB-A, LN-1, ETH" className="mt-1" /></div>
                <div><Label className="text-xs">Connection Type</Label><Input value={selectedDevice.connectionType || ""} onChange={(e) => updateSelectedDevice({ connectionType: e.target.value })} placeholder="e.g., PoE, 15VDC, 120VAC" className="mt-1" /></div>
                <div><Label className="text-xs">VLAN (if networked)</Label><Input type="number" value={selectedDevice.vlan || ""} onChange={(e) => updateSelectedDevice({ vlan: e.target.value ? parseInt(e.target.value) : undefined })} placeholder="e.g., 100" className="mt-1" /></div>
                <div><Label className="text-xs">Switch Port</Label><Input value={selectedDevice.switchPort || ""} onChange={(e) => updateSelectedDevice({ switchPort: e.target.value })} placeholder="e.g., SW-1 Port 12" className="mt-1" /></div>
                
                <hr className="my-2" />
                <div><Label className="text-xs">L-Net Segment</Label><Input value={selectedDevice.lnet || ""} onChange={(e) => updateSelectedDevice({ lnet: e.target.value })} placeholder="e.g., LNET-1" className="mt-1" /></div>
                <div><Label className="text-xs">Zone / Coverage</Label><Input value={selectedDevice.zone || ""} onChange={(e) => updateSelectedDevice({ zone: e.target.value })} placeholder="e.g., Zone A" className="mt-1" /></div>
                {floorPlans.length > 0 && (
                  <div>
                    <Label className="text-xs">Floor Plan</Label>
                    <select
                      value={selectedDevice.floorPlanId || ""}
                      onChange={(e) => updateSelectedDevice({ floorPlanId: e.target.value || undefined })}
                      className="mt-1 w-full h-9 rounded-md border border-gray-300 bg-white px-3 text-sm shadow-sm"
                    >
                      <option value="">All Plans</option>
                      {floorPlans.map((fp) => (
                        <option key={fp.id} value={fp.id}>{fp.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <Button variant="destructive" size="sm" onClick={deleteSelected} className="w-full"><Trash2 className="w-4 h-4 mr-2" /> Delete Device</Button>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Select a device to edit properties</p>
            )}

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wider mb-3">Summary</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-gray-600">Devices:</span><span className="font-semibold">{totalDevices}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Connections:</span><span className="font-semibold">{visibleConnections.length}</span></div>
                {cableBreakdown !== null && (
                  <>
                    <div className="flex justify-between"><span className="text-gray-600">Total Cable:</span><span className="font-semibold">{cableBreakdown.total.toFixed(1)} ft</span></div>
                    {cableBreakdown.LNET > 0 && (
                      <div className="flex justify-between pl-4"><span className="text-gray-500 text-[10px]">L-Net:</span><span className="text-gray-600">{cableBreakdown.LNET.toFixed(1)} ft</span></div>
                    )}
                    {cableBreakdown.KB > 0 && (
                      <div className="flex justify-between pl-4"><span className="text-gray-500 text-[10px]">K-Bus:</span><span className="text-gray-600">{cableBreakdown.KB.toFixed(1)} ft</span></div>
                    )}
                    {cableBreakdown.ETH > 0 && (
                      <div className="flex justify-between pl-4"><span className="text-gray-500 text-[10px]">Ethernet:</span><span className="text-gray-600">{cableBreakdown.ETH.toFixed(1)} ft</span></div>
                    )}
                    {cableBreakdown.POWER > 0 && (
                      <div className="flex justify-between pl-4"><span className="text-gray-500 text-[10px]">DC Power:</span><span className="text-gray-600">{cableBreakdown.POWER.toFixed(1)} ft</span></div>
                    )}
                    {cableBreakdown.AC > 0 && (
                      <div className="flex justify-between pl-4"><span className="text-gray-500 text-[10px]">AC Power:</span><span className="text-gray-600">{cableBreakdown.AC.toFixed(1)} ft</span></div>
                    )}
                  </>
                )}
                <div className="flex justify-between"><span className="text-gray-600">Power:</span><span className="font-semibold">{devices.reduce((s, d) => s + (allDevices.find((l) => l.part === d.part)?.power_A || 0), 0).toFixed(2)}A</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Install Labor:</span>
                  <span className="font-semibold">{(() => {
                    const m = devices.reduce((s, d) => s + (allDevices.find((l) => l.part === d.part)?.laborMinutes || 0), 0);
                    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}m`;
                    return `${m}m`;
                  })()}</span>
                </div>
              </div>
            </div>

            {Object.entries(lnetUtilization).length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-semibold text-xs text-gray-700 mb-2">L-Net Capacity</h3>
                <div className="space-y-1">
                  {Object.entries(lnetUtilization).map(([key, count]) => {
                    const [devId, portId] = key.split(":");
                    const dev = devices.find((d) => d.id === devId);
                    const lnetClass = count >= 22 ? "text-red-600 font-semibold" : count >= 18 ? "text-orange-600" : "text-gray-700";
                    return (
                      <div key={key} className={`flex items-center gap-2 text-xs ${lnetClass}`}>
                        <AlertCircle className="w-3 h-3" />{dev?.name || "Unknown"} {portId}: {count}/22
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {psuUtilization.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="font-semibold text-xs text-gray-700 mb-2 flex items-center gap-1"><Zap className="w-3 h-3" /> PSU Power</div>
                <div className="space-y-3">
                  {psuUtilization.map(({ psu, usedPower, utilization }) => {
                    const utilColor = utilization > 80 ? "text-red-600" : utilization > 60 ? "text-amber-600" : "text-green-600";
                    const barColor = utilization > 80 ? "bg-red-500" : utilization > 60 ? "bg-amber-500" : "bg-green-500";
                    return (
                      <div key={psu.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-medium">{psu.name}</span>
                          <span className={`font-semibold ${utilColor}`}>{utilization.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
                        </div>
                        <div className="text-xs text-gray-500">{usedPower}mA / {psu.maxPower_mA}mA</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <PowerSummaryWidget
              devices={devices}
              connections={connections}
              floorplanScale={floorplanScale}
              onOpenFullCalc={() => setShowPowerCalc(true)}
            />

// alignment menu helper component defined below


            <ValidationPanel
              devices={devices}
              connections={connections}
              onHighlightDevices={(ids) => {
                setSelectedIds(new Set(ids));
                if (ids.length > 0) setSelectedId(ids[0]);
              }}
            />

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wider mb-3">Marshall Standard Reference</h3>
              <div className="space-y-2 text-2xs text-gray-600 bg-gray-50 p-2 rounded">
                <div><span className="font-semibold">Headend:</span> MSC-1, L2K-1, TB-1, PWR-1, SW-1, CON-1</div>
                <div><span className="font-semibold">Rooms:</span> RM###-RS-#, RM###-PS-#, RM###-CL-#</div>
                <div><span className="font-semibold">Buses:</span> KB-A/B/C, LN-1/2/3, ETH, PoE</div>
                <div><span className="font-semibold">Power:</span> 15VDC, 120VAC (use PWR not PS)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateKitModal open={showKitModal} onOpenChange={setShowKitModal} selectedParts={Array.from(selectedPaletteParts)} onCreateKit={createKitFromSelection} />
      <BOMModal open={showBomModal} onOpenChange={setShowBomModal} devices={devices} connections={connections} deviceLibrary={allDevices} />
      <CompatibleDevicesModal open={showCompatibleModal} onOpenChange={(open) => { setShowCompatibleModal(open); if (!open) setConnectFrom(null); }}
        sourceDeviceId={compatibleDevices.sourceDeviceId} sourcePortId={compatibleDevices.sourcePortId} devicePart={compatibleDevices.devicePart}
        portType={compatibleDevices.portType} compatibleParts={compatibleDevices.compatibleParts} devices={allDevices} canvasDevices={devices}
        connections={connections} onSelectDevice={handleAddCompatibleDevice} onConnectToDevice={handleConnectToDevice} getPortUsage={portUsage} getDevicePorts={getDevicePorts} />
      {selectedPalettePart && <SchematicEditorModal isOpen={showSchematicEditor} onClose={() => setShowSchematicEditor(false)} onSave={handleSaveSchematic}
        devicePart={selectedPalettePart} initialPorts={getDevicePorts(selectedPalettePart)} initialSchematic={customSchematics[selectedPalettePart]?.image || DEVICE_DEFS[selectedPalettePart]?.customSchematic} initialDrawElements={customSchematics[selectedPalettePart]?.drawElements || []} />}
      
      {alignmentMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAlignmentMenu(null)} />
          <div
            className="fixed z-50 bg-white rounded-lg shadow-2xl border border-gray-300 p-3"
            style={{ left: alignmentMenu.x, top: alignmentMenu.y }}
          >
            <AlignmentSquareMenu
              count={selectedIds.size}
              onAlign={(dir) => alignDevices(dir)}
            />
          </div>
        </>
      )}
      
      {connectionContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setConnectionContextMenu(null)} />
          <div className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[140px]" style={{ left: connectionContextMenu.x, top: connectionContextMenu.y }}>
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
              onClick={() => { setConnections(connections.filter((c) => c.id !== connectionContextMenu.connectionId)); setConnectionContextMenu(null); }}>
              <Trash2 className="w-4 h-4" /> Delete Connection
            </button>
          </div>
        </>
      )}
      {portContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setPortContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setPortContextMenu(null); }} />
          <div className="fixed z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[240px] max-h-[400px] overflow-y-auto" style={{ left: portContextMenu.x, top: portContextMenu.y }}>
            {(() => {
              const portConns = connections.filter((c) =>
                (c.fromId === portContextMenu.deviceId && c.fromPort === portContextMenu.portId) ||
                (c.toId === portContextMenu.deviceId && c.toPort === portContextMenu.portId)
              );
              const connectedDeviceIds = new Set(portConns.map(c =>
                c.fromId === portContextMenu.deviceId ? c.toId : c.fromId
              ));
              const compatible = getCompatibleDevices(portContextMenu.devicePart, portContextMenu.portType, true);
              const compatibleParts = new Set(compatible.filter((part) => {
                const ports = getDevicePorts(part);
                return ports.some(p => p.type === portContextMenu.portType);
              }));
              const compatibleItems = [...compatibleParts]
                .map((part) => ({ part, label: allDevices.find((d) => d.part === part)?.label || part }));
              const port = getPort(portContextMenu.deviceId, portContextMenu.portId);
              const usage = portUsage(portContextMenu.deviceId, portContextMenu.portId);
              const isFull = !!(port?.limit && usage >= port.limit);
              const sourceDev = devices.find((d) => d.id === portContextMenu.deviceId);
              const existingCandidates = !isFull ? devices.filter((d) => {
                if (d.id === portContextMenu.deviceId) return false;
                if (connectedDeviceIds.has(d.id)) return false;
                if (!compatibleParts.has(d.part)) return false;
                const targetPorts = getDevicePorts(d.part).filter(p => p.type === portContextMenu.portType);
                const hasAvailablePort = targetPorts.some(tp => {
                  const tpUsage = portUsage(d.id, tp.id);
                  const tpFull = !!(tp.limit && tpUsage >= tp.limit);
                  if (tpFull) return false;
                  return !isDuplicateConnection(portContextMenu.deviceId, portContextMenu.portId, d.id, tp.id, connections);
                });
                return hasAvailablePort;
              }) : [];
              return (
                <>
                  <div className="px-3 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {port?.label || portContextMenu.portId} ({portContextMenu.portType})
                  </div>
                  {existingCandidates.length > 0 && !isFull && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-t border-gray-100 mt-0.5">Connect Existing</div>
                      {existingCandidates.map((candidate) => {
                        const targetPorts = getDevicePorts(candidate.part).filter(p => p.type === portContextMenu.portType);
                        const availablePort = targetPorts.find(tp => {
                          const tpUsage = portUsage(candidate.id, tp.id);
                          return !(tp.limit && tpUsage >= tp.limit) && !isDuplicateConnection(portContextMenu.deviceId, portContextMenu.portId, candidate.id, tp.id, connections);
                        });
                        return (
                          <button key={candidate.id} className="w-full px-3 py-1.5 text-left text-sm hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-2 transition-colors"
                            onClick={() => {
                              if (availablePort) {
                                const conn = normalizeConnection(
                                  portContextMenu.deviceId, candidate.id,
                                  portContextMenu.portId, availablePort.id,
                                  portContextMenu.portType
                                );
                                setConnections([...connections, conn]);
                              }
                              setPortContextMenu(null);
                            }}>
                            <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="truncate">{candidate.name}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                  {compatibleItems.length > 0 && !isFull && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-t border-gray-100 mt-0.5">Quick Add</div>
                      {compatibleItems.map((item) => (
                        <button key={item.part} className="w-full px-3 py-1.5 text-left text-sm hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
                          onClick={() => {
                            const newId = crypto.randomUUID();
                            const newDev: Device = {
                              id: newId, part: item.part, name: allDevices.find((d) => d.part === item.part)?.label || item.part,
                              x: (sourceDev?.x || 200) + 180, y: (sourceDev?.y || 200) + 40,
                              floorPlanId: activeFloorPlanId || undefined,
                            };
                            const targetPorts = getDevicePorts(item.part);
                            const targetPort = targetPorts.find(p => p.type === portContextMenu.portType);
                            setDevices([...devices, newDev]);
                            if (targetPort) {
                              const conn = normalizeConnection(
                                portContextMenu.deviceId, newId,
                                portContextMenu.portId, targetPort.id,
                                portContextMenu.portType
                              );
                              setConnections([...connections, conn]);
                            }
                            setPortContextMenu(null);
                          }}>
                          <Plus className="w-3.5 h-3.5 text-blue-500" />
                          <span className="truncate">{item.part}</span>
                        </button>
                      ))}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        </>
      )}
      <QuotePanel 
        open={showQuotePanel} 
        onClose={() => setShowQuotePanel(false)}
        cableBreakdown={cableBreakdown}
      />
      <PowerCalculator open={showPowerCalc} onClose={() => setShowPowerCalc(false)} />
    </div>
  );
}

// alignment menu helper component
function AlignmentSquareMenu({
  onAlign,
  count,
}: {
  onAlign: (dir: "top" | "right" | "bottom" | "left" | "grid") => void;
  count: number;
}) {
  return (
    <div className="select-none">
      <div className="text-xs font-semibold text-gray-700 mb-2 text-center">
        Align {count} devices
      </div>

      <div className="relative w-28 h-28">
        <div className="absolute inset-0 rounded-md border-2 border-gray-400 bg-white shadow-sm" />

        <svg className="absolute inset-0" viewBox="0 0 100 100" aria-hidden="true">
          <line x1="0" y1="0" x2="32" y2="32" stroke="#9ca3af" strokeWidth="2" />
          <line x1="100" y1="0" x2="68" y2="32" stroke="#9ca3af" strokeWidth="2" />
          <line x1="0" y1="100" x2="32" y2="68" stroke="#9ca3af" strokeWidth="2" />
          <line x1="100" y1="100" x2="68" y2="68" stroke="#9ca3af" strokeWidth="2" />
        </svg>

        <button
          onClick={() => onAlign("top")}
          title="Align Top (to topmost edge)"
          className="absolute left-2 right-2 top-2 h-7 rounded-md border border-transparent hover:border-blue-400 hover:bg-blue-50 transition"
        />
        <button
          onClick={() => onAlign("right")}
          title="Align Right (to rightmost edge)"
          className="absolute right-2 top-2 bottom-2 w-7 rounded-md border border-transparent hover:border-blue-400 hover:bg-blue-50 transition"
        />
        <button
          onClick={() => onAlign("bottom")}
          title="Align Bottom (to bottommost edge)"
          className="absolute left-2 right-2 bottom-2 h-7 rounded-md border border-transparent hover:border-blue-400 hover:bg-blue-50 transition"
        />
        <button
          onClick={() => onAlign("left")}
          title="Align Left (to leftmost edge)"
          className="absolute left-2 top-2 bottom-2 w-7 rounded-md border border-transparent hover:border-blue-400 hover:bg-blue-50 transition"
        />

        <div className="absolute left-1/2 top-1/2 w-12 h-12 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute inset-0 rounded-md border-2 border-gray-400 bg-white" />
          <button
            onClick={() => onAlign("grid")}
            title='Grid Align ("Dress Right Dress")'
            className="absolute inset-1 rounded-md border-2 border-blue-500 bg-blue-50 hover:bg-blue-100 transition"
          />
        </div>
      </div>

      <div className="text-[11px] text-gray-500 mt-2 text-center">
        Center = Grid (clean rows/columns)
      </div>
    </div>
  );
}

function AddDeviceForm({ onAdd, onCancel }: { onAdd: (device: DeviceLibraryItem) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState<DeviceLibraryItem>({ part: "", label: "", category: "Custom", power_mA: 0, power_A: 0, laborMinutes: 30 });
  return (
    <div className="border-b p-3 bg-yellow-50 flex-shrink-0 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-sm mb-3">Add Custom Device</h3>
      <div className="space-y-2">
        <div><Label className="text-xs">Part Number *</Label><Input value={formData.part} onChange={(e) => setFormData({ ...formData, part: e.target.value })} placeholder="e.g., CUSTOM-001" className="mt-1 text-xs" /></div>
        <div><Label className="text-xs">Description *</Label><Input value={formData.label} onChange={(e) => setFormData({ ...formData, label: e.target.value })} placeholder="Description" className="mt-1 text-xs" /></div>
        <div>
          <Label className="text-xs">Category</Label>
          <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="mt-1 flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-sm">
            {["Custom", "Head End", "Console", "Corridor Light", "Domeless", "Room Station", "High Security", "Pushbutton"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-xs">Power (mA)</Label><Input type="number" value={formData.power_mA} onChange={(e) => setFormData({ ...formData, power_mA: Number(e.target.value) })} className="mt-1 text-xs" /></div>
          <div><Label className="text-xs">Power (A)</Label><Input type="number" step="0.001" value={formData.power_A || 0} onChange={(e) => setFormData({ ...formData, power_A: Number(e.target.value) })} className="mt-1 text-xs" /></div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => { if (formData.part && formData.label) onAdd(formData); }} className="flex-1 text-xs">Add Device</Button>
          <Button size="sm" variant="outline" onClick={onCancel} className="flex-1 text-xs">Cancel</Button>
        </div>
      </div>
    </div>
  );
}
