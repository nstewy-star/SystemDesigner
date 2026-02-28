import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { X } from "lucide-react";

interface CreateKitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedParts: string[];
  onCreateKit: (name: string) => void;
}

export function CreateKitModal({
  open,
  onOpenChange,
  selectedParts,
  onCreateKit,
}: CreateKitModalProps) {
  const [kitName, setKitName] = useState("");

  if (!open) return null;

  const handleCreate = () => {
    if (kitName.trim()) {
      onCreateKit(kitName.trim());
      setKitName("");
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[400px]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Create Kit</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Kit Name</Label>
            <Input
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              placeholder="Enter kit name"
              className="mt-1"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div>
            <Label>Devices ({selectedParts.length})</Label>
            <div className="mt-1 p-2 border border-gray-200 rounded-md max-h-32 overflow-auto">
              <div className="text-sm text-gray-600 space-y-1">
                {selectedParts.map((part, idx) => (
                  <div key={idx}>{part}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!kitName.trim()}>
            Create Kit
          </Button>
        </div>
      </div>
    </div>
  );
}
