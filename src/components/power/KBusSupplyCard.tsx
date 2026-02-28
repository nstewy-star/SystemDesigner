import { useState } from "react";
import { ChevronDown, ChevronRight, Cable, AlertTriangle } from "lucide-react";
import type { KBusSupplyCalc } from "../../types";

const STATUS_STYLES = {
  pass: { bar: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "OK" },
  warning: { bar: "bg-amber-500", badge: "bg-amber-50 text-amber-700 border-amber-200", label: "WARNING" },
  error: { bar: "bg-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200", label: "ERROR" },
  critical: { bar: "bg-red-600", badge: "bg-red-50 text-red-700 border-red-200", label: "CRITICAL" },
};

interface KBusSupplyCardProps {
  supply: KBusSupplyCalc;
}

export function KBusSupplyCard({ supply }: KBusSupplyCardProps) {
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
        <Cable className="w-5 h-5 text-orange-500" />
        <div className="flex-1 text-left">
          <div className="font-semibold text-gray-900 text-sm">{supply.termBoardName}</div>
          <div className="text-xs text-gray-500">
            PSU: {supply.psuName || "None"} ({supply.psuPart || "missing"}) --
            {supply.deviceBreakdown.length} K-Bus devices across {supply.legBreakdown.filter(l => l.deviceCount > 0).length} legs
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
        <div className="border-t">
          <div className="px-5 py-4 bg-orange-50/30">
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">K-Bus Legs</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {supply.legBreakdown.map(leg => (
                <div
                  key={leg.portId}
                  className={`rounded-lg border p-3 ${
                    leg.voltageDropConcern
                      ? "border-amber-300 bg-amber-50"
                      : leg.deviceCount > 12
                        ? "border-orange-200 bg-orange-50/50"
                        : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-800">{leg.portLabel}</span>
                    <span className="text-xs text-gray-500">{leg.deviceCount} devices</span>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Current:</span>
                      <span className="font-mono font-semibold">{leg.totalCurrent_A.toFixed(3)}A</span>
                    </div>
                    {leg.estimatedCableLength_ft !== null && (
                      <div className="flex justify-between">
                        <span>Est. Cable:</span>
                        <span className="font-mono">{leg.estimatedCableLength_ft.toFixed(0)}ft</span>
                      </div>
                    )}
                  </div>
                  {leg.voltageDropConcern && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-amber-700">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Voltage drop concern</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {supply.deviceBreakdown.length > 0 && (
            <div className="px-5 py-4 border-t bg-slate-50/50">
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Device Breakdown</h4>
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Device</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Part</th>
                      <th className="text-left px-3 py-2 font-semibold text-gray-600">Category</th>
                      <th className="text-right px-3 py-2 font-semibold text-gray-600">Current</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {supply.deviceBreakdown.map(dev => (
                      <tr key={dev.deviceId} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium text-gray-800">{dev.deviceName}</td>
                        <td className="px-3 py-2 text-gray-600">{dev.part}</td>
                        <td className="px-3 py-2 text-gray-600">{dev.category}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-700">{dev.current_A.toFixed(3)}A</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 font-semibold">
                      <td colSpan={3} className="px-3 py-2 text-gray-700">Total K-Bus Load</td>
                      <td className="px-3 py-2 text-right font-mono text-gray-900">
                        {supply.totalLoad_A.toFixed(3)}A
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
