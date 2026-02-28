import { useMemo } from "react";
import { Zap, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { DEVICE_LIBRARY } from "../../data/devices";
import { calculatePower, POWER_CONSTANTS } from "../../lib/powerCalculation";
import type { Device, Connection } from "../../types";

interface PowerSummaryWidgetProps {
  devices: Device[];
  connections: Connection[];
  floorplanScale: number | null;
  onOpenFullCalc: () => void;
}

export function PowerSummaryWidget({ devices, connections, floorplanScale, onOpenFullCalc }: PowerSummaryWidgetProps) {
  const result = useMemo(
    () => calculatePower(devices, connections, DEVICE_LIBRARY, floorplanScale),
    [devices, connections, floorplanScale]
  );

  const { summary, issues, redFlags } = result;
  const errorCount = issues.filter(i => i.severity === "error" || i.severity === "critical").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;

  if (devices.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">Power Calc</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-600 hover:text-amber-700" onClick={onOpenFullCalc}>
          Full Report
        </Button>
      </div>

      {redFlags.length > 0 && (
        <div className="mb-2.5 px-2.5 py-2 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-red-700">
            <AlertCircle className="w-3.5 h-3.5" />
            {redFlags.length} Red Flag{redFlags.length > 1 ? "s" : ""} -- Redesign Required
          </div>
        </div>
      )}

      <div className="space-y-3">
        <MiniGauge
          label="L-Net (24V)"
          current={summary.totalLNetCurrent_A}
          capacity={POWER_CONSTANTS.LNET_SUPPLY_CAPACITY_A}
          designLimitPercent={POWER_CONSTANTS.LNET_DESIGN_LIMIT_PERCENT}
        />
        <MiniGauge
          label="K-Bus (15.5V)"
          current={summary.totalKBusCurrent_A}
          capacity={POWER_CONSTANTS.KBUS_SUPPLY_CAPACITY_A}
          designLimitPercent={POWER_CONSTANTS.KBUS_DESIGN_LIMIT_PERCENT}
        />
      </div>

      <div className="mt-2.5 flex items-center gap-2 text-xs">
        {errorCount > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-semibold">
            <AlertCircle className="w-3 h-3" />
            {errorCount}
          </span>
        )}
        {warningCount > 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            {warningCount}
          </span>
        )}
        {errorCount === 0 && warningCount === 0 && redFlags.length === 0 && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            All rules pass
          </span>
        )}
      </div>
    </div>
  );
}

function MiniGauge({ label, current, capacity, designLimitPercent }: {
  label: string;
  current: number;
  capacity: number;
  designLimitPercent: number;
}) {
  const utilization = capacity > 0 ? (current / capacity) * 100 : 0;
  const overDesign = utilization > designLimitPercent;
  const overCapacity = utilization > 100;
  const barColor = overCapacity ? "bg-red-600" : overDesign ? "bg-orange-500" : utilization > designLimitPercent * 0.9 ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div>
      <div className="flex justify-between items-center text-xs mb-1">
        <span className="text-gray-600 font-medium">{label}</span>
        <span className={`font-semibold ${overDesign ? "text-red-600" : "text-gray-700"}`}>
          {current.toFixed(3)}A / {capacity}A
        </span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-300 ${barColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
        <div className="absolute top-0 h-full w-px bg-gray-500/40" style={{ left: `${designLimitPercent}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
        <span>{utilization.toFixed(1)}%</span>
        <span>{designLimitPercent}% limit</span>
      </div>
    </div>
  );
}
