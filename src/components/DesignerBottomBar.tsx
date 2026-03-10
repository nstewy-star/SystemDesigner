import {
  MousePointer2, Link2, Square, Settings, Maximize, Upload,
  Download, Plus, FileSpreadsheet, DollarSign, Calculator, Wand2,
} from "lucide-react";
import { FloorPlanManager } from "./FloorPlanManager";
import type { FloorPlan } from "../types";

interface DesignerBottomBarProps {
  tool: "select" | "connect" | "wall";
  onToolChange: (tool: "select" | "connect" | "wall") => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onResetView: () => void;
  onToggleEnvironment: () => void;
  showEnvironmentPanel: boolean;
  onImport: () => void;
  onExport: () => void;
  onBom: () => void;
  onQuote: () => void;
  onPower: () => void;
  onAutoLNet: () => void;
  floorPlans: FloorPlan[];
  activeFloorPlanId: string | null;
  legacyImageUrl: string | null;
  legacyOpacity: number;
  onAddFloorPlan: (name: string, imageUrl: string, naturalWidth?: number, naturalHeight?: number) => void;
  onRemoveFloorPlan: (id: string) => void;
  onSetActiveFloorPlan: (id: string | null) => void;
  onRenameFloorPlan: (id: string, name: string) => void;
  onSetFloorPlanOpacity: (id: string, opacity: number) => void;
  onMigrateLegacy: () => void;
  onRemoveLegacy: () => void;
}

export function DesignerBottomBar({
  tool,
  onToolChange,
  zoom,
  onZoomChange,
  onResetView,
  onToggleEnvironment,
  showEnvironmentPanel,
  onImport,
  onExport,
  onBom,
  onQuote,
  onPower,
  onAutoLNet,
  floorPlans,
  activeFloorPlanId,
  legacyImageUrl,
  legacyOpacity,
  onAddFloorPlan,
  onRemoveFloorPlan,
  onSetActiveFloorPlan,
  onRenameFloorPlan,
  onSetFloorPlanOpacity,
  onMigrateLegacy,
  onRemoveLegacy,
}: DesignerBottomBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl px-3 py-2 flex items-center gap-2">
        <FloorPlanManager
          floorPlans={floorPlans}
          activeFloorPlanId={activeFloorPlanId}
          legacyImageUrl={legacyImageUrl}
          legacyOpacity={legacyOpacity}
          onAddFloorPlan={onAddFloorPlan}
          onRemoveFloorPlan={onRemoveFloorPlan}
          onSetActiveFloorPlan={onSetActiveFloorPlan}
          onRenameFloorPlan={onRenameFloorPlan}
          onSetFloorPlanOpacity={onSetFloorPlanOpacity}
          onMigrateLegacy={onMigrateLegacy}
          onRemoveLegacy={onRemoveLegacy}
        />

        <div className="w-px h-5 bg-gray-700" />

        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Tools</div>

        <ToolButton
          active={tool === "select"}
          onClick={() => onToolChange("select")}
          title="Select/Move"
        >
          <MousePointer2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={tool === "connect"}
          onClick={() => onToolChange("connect")}
          title="Connect"
        >
          <Link2 className="w-4 h-4" />
        </ToolButton>
        <ToolButton
          active={tool === "wall"}
          onClick={() => onToolChange("wall")}
          title="Draw Wall"
        >
          <Square className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-700" />

        <ToolButton
          active={showEnvironmentPanel}
          onClick={onToggleEnvironment}
          title="Environment Settings"
        >
          <Settings className="w-4 h-4" />
        </ToolButton>

        <div className="w-px h-5 bg-gray-700" />

        <div className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Actions</div>

        <ToolButton onClick={onImport} title="Import Design">
          <Plus className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={onExport} title="Export Design">
          <Download className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={onBom} title="BOM">
          <FileSpreadsheet className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={onQuote} title="Quote">
          <DollarSign className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={onPower} title="Power Calculator">
          <Calculator className="w-4 h-4" />
        </ToolButton>
        <ToolButton onClick={onAutoLNet} title="Auto L-Net Assignment">
          <Wand2 className="w-4 h-4" />
        </ToolButton>
      </div>

      <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-lg shadow-2xl px-3 py-2 flex items-center gap-2">
        <span className="text-[10px] text-gray-400 font-medium">Zoom</span>
        <input
          type="range"
          min="10"
          max="500"
          value={Math.round(zoom * 100)}
          onChange={(e) => onZoomChange(parseInt(e.target.value) / 100)}
          className="w-24 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <button
          onClick={() => onZoomChange(1)}
          className="text-xs font-medium text-gray-300 hover:text-white min-w-[42px] text-center tabular-nums transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          onClick={onResetView}
          className="p-1.5 rounded transition-colors bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
          title="Fit All (devices, walls, floor plan)"
        >
          <Maximize className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
      }`}
      title={title}
    >
      {children}
    </button>
  );
}
