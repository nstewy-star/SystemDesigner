import { useRef, useState } from "react";
import { Upload, Trash2, Eye, EyeOff, ChevronDown, Pencil, Check, Image, Layers, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { isPdfDataUrl, pdfToImageDataUrl } from "../lib/pdfToImage";
import type { FloorPlan } from "../types";

interface FloorPlanManagerProps {
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

export function FloorPlanManager({
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
}: FloorPlanManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasLegacy = !!legacyImageUrl && floorPlans.length === 0;
  const activePlan = floorPlans.find((fp) => fp.id === activeFloorPlanId);
  const displayLabel = activePlan
    ? activePlan.name
    : hasLegacy
      ? "Uploaded Plan"
      : "No Floor Plan";

  const loadImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.src = dataUrl;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (hasLegacy) {
      onMigrateLegacy();
    }

    const name = file.name.replace(/\.[^/.]+$/, "").slice(0, 40) || "Floor Plan";
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      const rawDataUrl = await new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });

      let imageUrl = rawDataUrl;
      if (isPdfDataUrl(rawDataUrl)) {
        imageUrl = await pdfToImageDataUrl(rawDataUrl);
      }

      const dims = await loadImageDimensions(imageUrl);
      onAddFloorPlan(name, imageUrl, dims.width, dims.height);
    } finally {
      setIsProcessing(false);
    }

    e.target.value = "";
  };

  const startRename = (fp: FloorPlan) => {
    setEditingId(fp.id);
    setEditName(fp.name);
  };

  const commitRename = () => {
    if (editingId && editName.trim()) {
      onRenameFloorPlan(editingId, editName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 text-xs font-medium"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="max-w-[120px] truncate">{displayLabel}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => fileInputRef.current?.click()}
          title="Upload floor plan"
          disabled={isProcessing}
        >
          {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        </Button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 w-72 overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Floor Plans</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700"
                onClick={() => {
                  fileInputRef.current?.click();
                  setIsOpen(false);
                }}
              >
                <Upload className="w-3 h-3 mr-1" />
                Add
              </Button>
            </div>

            <div className="max-h-[300px] overflow-y-auto">
              {hasLegacy && (
                <div className="px-3 py-2 border-b border-gray-100 bg-amber-50">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Image className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-800 truncate">
                        Uploaded Plan (legacy)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-amber-600 hover:text-amber-700"
                        onClick={() => {
                          onMigrateLegacy();
                          setIsOpen(false);
                        }}
                        title="Convert to floor plan"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-600"
                        onClick={() => {
                          onRemoveLegacy();
                          setIsOpen(false);
                        }}
                        title="Remove"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-500">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={legacyOpacity}
                      className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      readOnly
                    />
                    <span className="text-[10px] text-gray-500 w-7 text-right">{legacyOpacity}%</span>
                  </div>
                </div>
              )}

              {floorPlans.length === 0 && !hasLegacy && (
                <div className="px-4 py-6 text-center">
                  <Image className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No floor plans uploaded</p>
                  <p className="text-xs text-gray-400 mt-1">Upload an image to get started</p>
                </div>
              )}

              {floorPlans.map((fp) => {
                const isActive = fp.id === activeFloorPlanId;
                return (
                  <div
                    key={fp.id}
                    className={`px-3 py-2 border-b border-gray-50 transition-colors ${
                      isActive ? "bg-blue-50" : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                        onClick={() => {
                          if (editingId === fp.id) return;
                          onSetActiveFloorPlan(isActive ? null : fp.id);
                        }}
                      >
                        {isActive ? (
                          <Eye className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        )}
                        {editingId === fp.id ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onBlur={(e) => {
                              e.stopPropagation();
                              commitRename();
                            }}
                            onKeyDown={(e) => {
                              e.stopPropagation();
                              if (e.key === "Enter") {
                                e.preventDefault();
                                commitRename();
                              }
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setEditingId(null);
                              }
                            }}
                            onKeyUp={(e) => e.stopPropagation()}
                            onKeyPress={(e) => e.stopPropagation()}
                            className="h-5 text-xs px-1 py-0"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                            onContextMenu={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onMouseUp={(e) => e.stopPropagation()}
                            onDoubleClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className="text-xs font-medium text-gray-800 truncate">
                            {fp.name}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        {editingId === fp.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-green-600"
                            onClick={commitRename}
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                        ) : (
                          <Pencil
                            className="w-4 h-4 text-gray-600 hover:text-blue-600 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(fp);
                            }}
                            title="Rename"
                          />
                        )}
                        <Trash2
                          className="w-4 h-4 text-red-500 hover:text-red-700 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Remove "${fp.name}"?`)) {
                              onRemoveFloorPlan(fp.id);
                            }
                          }}
                          title="Delete"
                        />
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-2 ml-5">
                        <span className="text-[10px] text-gray-500">Opacity</span>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={fp.opacity}
                          onChange={(e) => onSetFloorPlanOpacity(fp.id, parseInt(e.target.value))}
                          className="flex-1 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] text-gray-500 w-7 text-right">{fp.opacity}%</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {floorPlans.length > 1 && (
              <div className="px-3 py-2 border-t border-gray-100 bg-gray-50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-7 text-xs text-gray-500"
                  onClick={() => {
                    onSetActiveFloorPlan(null);
                    setIsOpen(false);
                  }}
                >
                  Hide All Plans
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
