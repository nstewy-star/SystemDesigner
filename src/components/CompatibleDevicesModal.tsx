import { Button } from "./ui/button";
import { X } from "lucide-react";

interface Device {
  id: string;
  part: string;
  name: string;
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
}

interface PortDef {
  id: string;
  label: string;
  type: string;
  limit?: number;
}

interface CompatibleDevicesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceDeviceId: string;
  sourcePortId: string;
  devicePart: string;
  portType: string;
  compatibleParts: string[];
  devices: DeviceLibraryItem[];
  canvasDevices: Device[];
  connections: Connection[];
  onSelectDevice: (part: string) => void;
  onConnectToDevice: (deviceId: string, portId: string) => void;
  getPortUsage?: (devId: string, portId: string) => number;
  getDevicePorts?: (devicePart: string) => PortDef[];
}

export function CompatibleDevicesModal({
  open,
  onOpenChange,
  sourceDeviceId,
  portType,
  compatibleParts,
  devices,
  canvasDevices,
  onSelectDevice,
  onConnectToDevice,
  getPortUsage,
  getDevicePorts,
}: CompatibleDevicesModalProps) {
  if (!open) return null;

  const compatibleExisting = canvasDevices.filter(d =>
    d.id !== sourceDeviceId && compatibleParts.includes(d.part)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-4 w-[500px] max-h-[70vh] overflow-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Connect Port</h2>
          <button onClick={() => onOpenChange(false)} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {compatibleExisting.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-2 text-gray-700">Connect to Existing Device</h3>
            <div className="space-y-2">
              {compatibleExisting.map((device) => {
                const ports = getDevicePorts ? getDevicePorts(device.part) : [];
                const compatiblePorts = ports.filter(p => p.type === portType);

                return (
                  <div key={device.id} className="border border-gray-300 rounded p-2 hover:border-gray-400 transition-colors">
                    <div className="font-medium text-sm mb-2">{device.name}</div>
                    {compatiblePorts.length > 0 ? (
                      <div className="space-y-1 ml-1">
                        {compatiblePorts.map((port) => {
                          const usage = getPortUsage ? getPortUsage(device.id, port.id) : 0;
                          const isFull = !!(port.limit && usage >= port.limit);

                          return (
                            <button
                              key={port.id}
                              onClick={() => {
                                onConnectToDevice(device.id, port.id);
                                onOpenChange(false);
                              }}
                              disabled={isFull}
                              className={`w-full text-left px-2 py-1 rounded text-xs flex justify-between items-center ${
                                isFull
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-gray-50 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              <span>{port.label}</span>
                              {port.limit && (
                                <span className="text-xs">
                                  {usage}/{port.limit}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 ml-1">No compatible ports available</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Add Compatible Device</h3>
          <div className="space-y-2">
            {(() => {
              const filteredParts = compatibleParts.filter((part) => {
                if (!getDevicePorts) return true;
                const ports = getDevicePorts(part);
                return ports.some(p => p.type === portType);
              });

              if (filteredParts.length === 0) {
                return (
                  <div className="text-xs text-gray-500 p-2 border border-gray-200 rounded bg-gray-50">
                    No compatible devices available
                  </div>
                );
              }

              return filteredParts.map((part) => {
                const deviceInfo = devices.find(d => d.part === part);
                return (
                  <div key={part} className="flex justify-between items-center p-2 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400 transition-colors">
                    <span className="text-sm">{deviceInfo?.label || part}</span>
                    <Button
                      size="sm"
                      onClick={() => {
                        onSelectDevice(part);
                        onOpenChange(false);
                      }}
                    >
                      Add & Connect
                    </Button>
                  </div>
                );
              });
            })()}
          </div>
        </div>

        <div className="flex justify-end mt-4 pt-3 border-t border-gray-200">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
