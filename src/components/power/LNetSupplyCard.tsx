import { useState } from "react";
import { ChevronDown, ChevronRight, CircuitBoard } from "lucide-react";
import type { LNetSupplyCalc, RoomLoadClassification } from "../../types";

const STATUS_STYLES = {
  pass: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "OK" },
  warning: { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "WARNING" },
  error: { bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200", label: "ERROR" },
  critical: { bar: "bg-red-600", badge: "bg-red-50 text-red-700 border-red-200", label: "CRITICAL" },
};

const ROOM_CLASS_STYLES: Record<RoomLoadClassification, { bg: string; text: string; label: string }> = {
  light: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Light" },
  medium: { bg: "bg-amber-100", text: "text-amber-700", label: "Medium" },
  heavy: { bg: "bg-red-100", text: "text-red-700", label: "Heavy" },
};

interface LNetSupplyCardProps {
  supply: LNetSupplyCalc;
}

export function LNetSupplyCard({ supply }: LNetSupplyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const style = STATUS_STYLES[supply.status];
  const utilization = supply.utilization;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors"
      >
        {expanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
        <CircuitBoard className="w-5 h-5 text-blue-500" />
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900 text-sm">{supply.mscName}</div>
          <div className="text-xs text-gray-500">
            {supply.l2kaCount}/{supply.maxL2KA} L2KAs connected -- {supply.roomBreakdown.length} room devices
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900">{supply.totalLoad_A.toFixed(3)}A</div>
            <div className="text-xs text-gray-500">of {supply.designLimit_A.toFixed(2)}A limit</div>
          </div>
          <div className="w-24">
            <div className="relative w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${style.bar}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
              <div className="absolute top-0 h-full w-0.5 bg-gray-400/60" style={{ left: `${supply.designLimitPercent}%` }} />
            </div>
            <div className="text-xs text-gray-400 text-right mt-0.5">{utilization.toFixed(1)}%</div>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${style.badge}`}>
            {style.label}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t px-5 py-4 bg-slate-50/50">
          <div className="mb-4">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Room Load Classification</h4>
            <div className="text-xs text-gray-500 mb-3">
              Light: Zone light or up to 3 non-audio | Medium: 1 audio + up to 3 non-audio | Heavy: 2 audio or 1 audio + 4-16 non-audio
            </div>
          </div>

          {supply.roomBreakdown.length === 0 ? (
            <p className="text-sm text-gray-500">No room devices connected to this MSC</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Device</th>
                    <th className="text-left px-3 py-2 font-semibold text-gray-600">Part</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600">Classification</th>
                    <th className="text-center px-3 py-2 font-semibold text-gray-600">Audio</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600">Est. Current</th>
                    <th className="text-right px-3 py-2 font-semibold text-gray-600">Connected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {supply.roomBreakdown.map(room => {
                    const cls = ROOM_CLASS_STYLES[room.classification];
                    return (
                      <tr key={room.deviceId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{room.deviceName}</td>
                        <td className="px-3 py-2 text-gray-600">{room.part}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls.bg} ${cls.text}`}>
                            {cls.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          {room.hasAudio ? (
                            <span className="text-blue-600 font-semibold">Yes</span>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">{room.estimatedCurrent_A.toFixed(3)}A</td>
                        <td className="px-3 py-2 text-right text-gray-600">{room.connectedDeviceCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-semibold">
                    <td colSpan={4} className="px-3 py-2 text-gray-700">Total Room Load</td>
                    <td className="px-3 py-2 text-right font-mono text-gray-900">
                      {supply.roomBreakdown.reduce((s, r) => s + r.estimatedCurrent_A, 0).toFixed(3)}A
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">{supply.roomBreakdown.length}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
