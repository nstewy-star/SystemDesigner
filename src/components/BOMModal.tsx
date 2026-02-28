import { Button } from "./ui/button";
import { X } from "lucide-react";

interface Device {
  id: string;
  part: string;
  name: string;
  x: number;
  y: number;
  lnet?: string;
  zone?: string;
}

interface Connection {
  id: string;
  fromId: string;
  fromPort: string;
  toId: string;
  toPort: string;
  type: string;
}

interface DeviceLibraryItem {
  part: string;
  label: string;
  category: string;
  power_mA: number;
  power_A?: number;
  laborMinutes?: number;
}

interface BOMModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: Device[];
  connections: Connection[];
  deviceLibrary: DeviceLibraryItem[];
}

export function BOMModal({
  open,
  onOpenChange,
  devices,
  deviceLibrary,
}: BOMModalProps) {
  if (!open) return null;

  const bomMap = new Map<string, { part: string; lnet: string; zone: string; count: number; powerA: number; laborMin: number }>();

  devices.forEach(dev => {
    const lib = deviceLibrary.find(d => d.part === dev.part);
    const key = `${dev.part}|${dev.lnet || ''}|${dev.zone || ''}`;
    if (bomMap.has(key)) {
      const item = bomMap.get(key)!;
      item.count++;
      item.powerA += lib?.power_A || 0;
      item.laborMin += lib?.laborMinutes || 0;
    } else {
      bomMap.set(key, {
        part: dev.part,
        lnet: dev.lnet || '',
        zone: dev.zone || '',
        count: 1,
        powerA: lib?.power_A || 0,
        laborMin: lib?.laborMinutes || 0
      });
    }
  });

  const handleExport = () => {
    const csvRows = [
      ['Part', 'Qty', 'Power Draw (A)', 'Install Time (min)', 'L-Net', 'Zone', 'Description'],
      ...Array.from(bomMap.values()).map(item => {
        const lib = deviceLibrary.find(d => d.part === item.part);
        return [
          item.part,
          item.count.toString(),
          item.powerA.toFixed(2),
          item.laborMin.toString(),
          item.lnet,
          item.zone,
          lib?.label || ''
        ];
      })
    ];

    const csv = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bom.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Bill of Materials</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-2">Part</th>
                <th className="text-left p-2">Qty</th>
                <th className="text-left p-2">Power (A)</th>
                <th className="text-left p-2">Labor (min)</th>
                <th className="text-left p-2">L-Net</th>
                <th className="text-left p-2">Zone</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(bomMap.values()).map((item, idx) => (
                <tr key={idx} className="border-b border-gray-100">
                  <td className="p-2 font-medium">{item.part}</td>
                  <td className="p-2">{item.count}</td>
                  <td className="p-2">{item.powerA.toFixed(2)}</td>
                  <td className="p-2">{item.laborMin}</td>
                  <td className="p-2">{item.lnet || '-'}</td>
                  <td className="p-2">{item.zone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleExport}>
            Export CSV
          </Button>
        </div>
      </div>
    </div>
  );
}
