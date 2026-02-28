import { useState, useRef, useEffect } from "react";
import { Stage, Layer, Rect, Circle, Line, Text, Image as KonvaImage } from "react-konva";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X, Square, Circle as CircleIcon, Minus, Upload, Download, Trash2, Move } from "lucide-react";
import type { DrawElement } from "../types";

interface PortDef {
  id: string;
  label: string;
  type: string;
  x: number;
  y: number;
  limit?: number;
}

interface SchematicEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (ports: PortDef[], schematicImage: string | undefined, drawElements: DrawElement[]) => void;
  devicePart: string;
  initialPorts: PortDef[];
  initialSchematic?: string;
  initialDrawElements?: DrawElement[];
}

type Tool = 'select' | 'rectangle' | 'circle' | 'line' | 'text' | 'port';

const PORT_TYPES = ['KB', 'LNET', 'POWER', 'ETHERNET', 'AC', 'AUDIO'];
const PORT_COLORS: Record<string, string> = {
  KB: '#10b981',
  LNET: '#3b82f6',
  POWER: '#f97316',
  ETHERNET: '#8b5cf6',
  AC: '#ef4444',
  AUDIO: '#eab308'
};

export function SchematicEditorModal({
  isOpen,
  onClose,
  onSave,
  devicePart,
  initialPorts,
  initialSchematic,
  initialDrawElements = [],
}: SchematicEditorModalProps) {
  const [ports, setPorts] = useState<PortDef[]>(initialPorts);
  const [drawElements, setDrawElements] = useState<DrawElement[]>(initialDrawElements);
  const [tool, setTool] = useState<Tool>('select');
  const [color, setColor] = useState('#374151');
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentShape, setCurrentShape] = useState<any>(null);
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [backgroundImage, setBackgroundImage] = useState<HTMLImageElement | null>(null);
  const [, setSchematicDataUrl] = useState<string | undefined>(initialSchematic);
  const stageRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canvasWidth = 600;
  const canvasHeight = 400;

  useEffect(() => {
    if (initialSchematic) {
      const img = new window.Image();
      img.src = initialSchematic;
      img.onload = () => {
        setBackgroundImage(img);
      };
    }
  }, [initialSchematic]);

  if (!isOpen) return null;

  const handleMouseDown = (e: any) => {
    if (tool === 'select') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    if (tool === 'port') {
      const newPort: PortDef = {
        id: `PORT${ports.length + 1}`,
        label: `Port ${ports.length + 1}`,
        type: 'KB',
        x: pos.x / canvasWidth,
        y: pos.y / canvasHeight,
        limit: 1
      };
      setPorts([...ports, newPort]);
      setSelectedPort(newPort.id);
      return;
    }

    setIsDrawing(true);
    setCurrentShape({
      type: tool,
      x1: pos.x,
      y1: pos.y,
      x2: pos.x,
      y2: pos.y,
      color,
      strokeWidth
    });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || tool === 'select' || tool === 'port') return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();

    setCurrentShape({
      ...currentShape,
      x2: pos.x,
      y2: pos.y
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    if (currentShape) {
      setDrawElements([...drawElements, currentShape]);
      setCurrentShape(null);
    }
  };

  const handlePortDragEnd = (portId: string, e: any) => {
    const newPorts = ports.map(p => {
      if (p.id === portId) {
        return {
          ...p,
          x: e.target.x() / canvasWidth,
          y: e.target.y() / canvasHeight
        };
      }
      return p;
    });
    setPorts(newPorts);
  };

  const updateSelectedPort = (field: keyof PortDef, value: any) => {
    if (!selectedPort) return;

    setPorts(ports.map(p =>
      p.id === selectedPort ? { ...p, [field]: value } : p
    ));
  };

  const deleteSelectedPort = () => {
    if (!selectedPort) return;
    setPorts(ports.filter(p => p.id !== selectedPort));
    setSelectedPort(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        setBackgroundImage(img);
        setSchematicDataUrl(event.target?.result as string);
      };
    };
    reader.readAsDataURL(file);
  };

  const handleExportImage = () => {
    if (!stageRef.current) return;

    const uri = stageRef.current.toDataURL();
    const link = document.createElement('a');
    link.download = `${devicePart}-schematic.png`;
    link.href = uri;
    link.click();
  };

  const handleSave = () => {
    const uri = stageRef.current?.toDataURL();
    onSave(ports, uri, drawElements);
    onClose();
  };

  const clearCanvas = () => {
    if (confirm('Clear all drawings? Ports will be preserved.')) {
      setDrawElements([]);
      setBackgroundImage(null);
      setSchematicDataUrl(undefined);
    }
  };

  const selectedPortData = ports.find(p => p.id === selectedPort);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-[95vw] h-[95vh] max-w-7xl flex flex-col">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Edit Schematic: {devicePart}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 flex gap-4 overflow-hidden">
          <div className="w-48 flex flex-col gap-3 overflow-y-auto">
            <div>
              <Label className="text-xs font-semibold mb-2 block">Tools</Label>
              <div className="grid grid-cols-2 gap-1">
                <Button
                  size="sm"
                  variant={tool === 'select' ? 'default' : 'outline'}
                  onClick={() => setTool('select')}
                  className="w-full"
                >
                  <Move className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'port' ? 'default' : 'outline'}
                  onClick={() => setTool('port')}
                  className="w-full"
                >
                  <CircleIcon className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'rectangle' ? 'default' : 'outline'}
                  onClick={() => setTool('rectangle')}
                  className="w-full"
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={tool === 'line' ? 'default' : 'outline'}
                  onClick={() => setTool('line')}
                  className="w-full"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-xs">Color</Label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-8 rounded border border-gray-300 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Stroke Width</Label>
              <Input
                type="number"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
                min={1}
                max={10}
                className="mt-1"
              />
            </div>

            <div className="border-t border-gray-200 pt-3">
              <Label className="text-xs font-semibold mb-2 block">Actions</Label>
              <div className="space-y-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full justify-start"
                >
                  <Upload className="w-3 h-3 mr-2" />
                  Upload Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportImage}
                  className="w-full justify-start"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Export
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearCanvas}
                  className="w-full justify-start text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Clear
                </Button>
              </div>
            </div>

            {selectedPortData && (
              <div className="border-t border-gray-200 pt-3">
                <Label className="text-xs font-semibold mb-2 block">Port Settings</Label>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">ID</Label>
                    <Input
                      value={selectedPortData.id}
                      onChange={(e) => updateSelectedPort('id', e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Label</Label>
                    <Input
                      value={selectedPortData.label}
                      onChange={(e) => updateSelectedPort('label', e.target.value)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Type</Label>
                    <select
                      value={selectedPortData.type}
                      onChange={(e) => updateSelectedPort('type', e.target.value)}
                      className="w-full mt-1 text-xs h-8 rounded border border-gray-300 px-2"
                    >
                      {PORT_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Limit</Label>
                    <Input
                      type="number"
                      value={selectedPortData.limit || ''}
                      onChange={(e) => updateSelectedPort('limit', e.target.value ? Number(e.target.value) : undefined)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={deleteSelectedPort}
                    className="w-full"
                  >
                    Delete Port
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
            <Stage
              ref={stageRef}
              width={canvasWidth}
              height={canvasHeight}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              className="bg-white"
            >
              <Layer>
                {backgroundImage && (
                  <KonvaImage
                    image={backgroundImage}
                    width={canvasWidth}
                    height={canvasHeight}
                  />
                )}

                <Rect
                  x={0}
                  y={0}
                  width={canvasWidth}
                  height={canvasHeight}
                  stroke="#e5e7eb"
                  strokeWidth={1}
                />

                {drawElements.map((element, i) => {
                  if (element.type === 'rectangle') {
                    return (
                      <Rect
                        key={i}
                        x={Math.min(element.x1, element.x2 || element.x1)}
                        y={Math.min(element.y1, element.y2 || element.y1)}
                        width={Math.abs((element.x2 || element.x1) - element.x1)}
                        height={Math.abs((element.y2 || element.y1) - element.y1)}
                        stroke={element.color}
                        strokeWidth={element.strokeWidth}
                      />
                    );
                  } else if (element.type === 'line') {
                    return (
                      <Line
                        key={i}
                        points={[element.x1, element.y1, element.x2 || element.x1, element.y2 || element.y1]}
                        stroke={element.color}
                        strokeWidth={element.strokeWidth}
                      />
                    );
                  }
                  return null;
                })}

                {currentShape && currentShape.type === 'rectangle' && (
                  <Rect
                    x={Math.min(currentShape.x1, currentShape.x2)}
                    y={Math.min(currentShape.y1, currentShape.y2)}
                    width={Math.abs(currentShape.x2 - currentShape.x1)}
                    height={Math.abs(currentShape.y2 - currentShape.y1)}
                    stroke={currentShape.color}
                    strokeWidth={currentShape.strokeWidth}
                  />
                )}

                {currentShape && currentShape.type === 'line' && (
                  <Line
                    points={[currentShape.x1, currentShape.y1, currentShape.x2, currentShape.y2]}
                    stroke={currentShape.color}
                    strokeWidth={currentShape.strokeWidth}
                  />
                )}

                {ports.map((port) => (
                  <Circle
                    key={port.id}
                    x={port.x * canvasWidth}
                    y={port.y * canvasHeight}
                    radius={8}
                    fill={PORT_COLORS[port.type] || '#6b7280'}
                    stroke={selectedPort === port.id ? '#1e40af' : '#fff'}
                    strokeWidth={selectedPort === port.id ? 3 : 2}
                    draggable
                    onDragEnd={(e) => handlePortDragEnd(port.id, e)}
                    onClick={() => setSelectedPort(port.id)}
                  />
                ))}

                {ports.map((port) => (
                  <Text
                    key={`${port.id}-label`}
                    x={port.x * canvasWidth + 12}
                    y={port.y * canvasHeight - 6}
                    text={port.label}
                    fontSize={10}
                    fill="#374151"
                    listening={false}
                  />
                ))}
              </Layer>
            </Stage>
          </div>

          <div className="w-48 overflow-y-auto">
            <Label className="text-xs font-semibold mb-2 block">Ports ({ports.length})</Label>
            <div className="space-y-1">
              {ports.map((port) => (
                <button
                  key={port.id}
                  onClick={() => setSelectedPort(port.id)}
                  className={`w-full text-left p-2 rounded text-xs border transition-colors ${
                    selectedPort === port.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: PORT_COLORS[port.type] || '#6b7280' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{port.label}</div>
                      <div className="text-gray-500">{port.type}</div>
                    </div>
                  </div>
                </button>
              ))}
              {ports.length === 0 && (
                <div className="text-xs text-gray-500 p-2 text-center">
                  Click the port tool and then click on the canvas to add ports
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Schematic
          </Button>
        </div>
      </div>
    </div>
  );
}
