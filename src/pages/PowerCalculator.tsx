import { useMemo, useState } from "react";
import {
  Zap, AlertTriangle, AlertCircle, CheckCircle2,
  Activity, Gauge, Shield, Battery, CircuitBoard, Cable, X,
} from "lucide-react";
import { useProject } from "../contexts/ProjectContext";
import { DEVICE_LIBRARY } from "../data/devices";
import { calculatePower, POWER_CONSTANTS } from "../lib/powerCalculation";
import { LNetSupplyCard } from "../components/power/LNetSupplyCard";
import { KBusSupplyCard } from "../components/power/KBusSupplyCard";
import { PowerChecklist } from "../components/power/PowerChecklist";
import { PowerIssuesList } from "../components/power/PowerIssuesList";
import type { PowerCalculationResult } from "../types";

interface PowerCalculatorProps {
  open: boolean;
  onClose: () => void;
}

export function PowerCalculator({ open, onClose }: PowerCalculatorProps) {
  const { currentProject } = useProject();
  const [activeTab, setActiveTab] = useState<"overview" | "lnet" | "kbus" | "checklist">("overview");

  const devices = currentProject?.devices || [];
  const connections = currentProject?.connections || [];
  const floorplanScale = currentProject?.floorplan_scale ?? null;

  const result: PowerCalculationResult = useMemo(
    () => calculatePower(devices, connections, DEVICE_LIBRARY, floorplanScale),
    [devices, connections, floorplanScale]
  );

  if (!open) return null;

  const { summary, issues, redFlags, lnetSupplies, kbusSupplies, headendChecklist } = result;
  const errorCount = issues.filter(i => i.severity === "error" || i.severity === "critical").length;
  const passCount = headendChecklist.filter(c => c.passed).length;

  const tabs = [
    { id: "overview" as const, label: "Overview", icon: Activity },
    { id: "lnet" as const, label: "L-Net (24V)", icon: CircuitBoard },
    { id: "kbus" as const, label: "K-Bus (15.5V)", icon: Cable },
    { id: "checklist" as const, label: "Checklist", icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-[95vw] max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-200/50">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Power Calculation Workbook</h2>
              <p className="text-xs text-gray-500">Marshall Industries -- Rauland R5K Power Design Rules v1.0</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {redFlags.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700">{redFlags.length} Red Flag{redFlags.length > 1 ? "s" : ""}</span>
              </div>
            )}
            {errorCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-semibold text-orange-700">{errorCount} Error{errorCount > 1 ? "s" : ""}</span>
              </div>
            )}
            {errorCount === 0 && redFlags.length === 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-semibold text-emerald-700">Design Passes</span>
              </div>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <div className="flex border-b bg-gray-50/50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                  isActive
                    ? "border-amber-500 text-amber-700 bg-white"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.id === "lnet" && lnetSupplies.some(l => l.status !== "pass") && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
                {tab.id === "kbus" && kbusSupplies.some(k => k.status !== "pass") && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
                {tab.id === "checklist" && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    passCount === headendChecklist.length ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>{passCount}/{headendChecklist.length}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && (
            <OverviewTab summary={summary} result={result} />
          )}
          {activeTab === "lnet" && (
            <LNetTab lnetSupplies={lnetSupplies} issues={issues.filter(i => i.domain === "lnet")} />
          )}
          {activeTab === "kbus" && (
            <KBusTab kbusSupplies={kbusSupplies} issues={issues.filter(i => i.domain === "kbus")} />
          )}
          {activeTab === "checklist" && (
            <ChecklistTab headendChecklist={headendChecklist} redFlags={redFlags} />
          )}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ summary, result }: { summary: PowerCalculationResult["summary"]; result: PowerCalculationResult }) {
  const lnetStatus = result.lnetSupplies.every(l => l.status === "pass") ? "pass" :
    result.lnetSupplies.some(l => l.status === "critical") ? "critical" :
    result.lnetSupplies.some(l => l.status === "error") ? "error" : "warning";
  const kbusStatus = result.kbusSupplies.every(k => k.status === "pass") ? "pass" :
    result.kbusSupplies.some(k => k.status === "critical") ? "critical" :
    result.kbusSupplies.some(k => k.status === "error") ? "error" : "warning";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Devices" value={summary.totalDevices} icon={CircuitBoard} />
        <StatCard label="K-Bus Devices" value={summary.totalKBusDevices} icon={Cable} />
        <StatCard label="MSC Controllers" value={summary.mscCount} icon={Activity} />
        <StatCard label="L2KA Adapters" value={summary.l2kaCount} icon={CircuitBoard} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PowerDomainCard
          title="L-Net / 24V Power Domain"
          subtitle="Headend / Digital Side"
          totalCurrent={summary.totalLNetCurrent_A}
          capacity={POWER_CONSTANTS.LNET_SUPPLY_CAPACITY_A}
          designLimit={POWER_CONSTANTS.LNET_DESIGN_LIMIT_A}
          designLimitPercent={POWER_CONSTANTS.LNET_DESIGN_LIMIT_PERCENT}
          status={lnetStatus}
          items={[
            `${summary.mscCount} MSC controller${summary.mscCount !== 1 ? "s" : ""}`,
            `${summary.l2kaCount} L2KA adapter${summary.l2kaCount !== 1 ? "s" : ""}`,
            `Powers consoles, L2KAs, headend devices`,
          ]}
        />
        <PowerDomainCard
          title="K-Bus / 15.5V Power Domain"
          subtitle="Field / Analog Side"
          totalCurrent={summary.totalKBusCurrent_A}
          capacity={POWER_CONSTANTS.KBUS_SUPPLY_CAPACITY_A}
          designLimit={POWER_CONSTANTS.KBUS_DESIGN_LIMIT_A}
          designLimitPercent={POWER_CONSTANTS.KBUS_DESIGN_LIMIT_PERCENT}
          status={kbusStatus}
          items={[
            `${summary.corridorLightCount} corridor light${summary.corridorLightCount !== 1 ? "s" : ""}`,
            `${summary.patientStationCount} patient station${summary.patientStationCount !== 1 ? "s" : ""}`,
            `${summary.termBoardCount} term board${summary.termBoardCount !== 1 ? "s" : ""}, ${summary.psuCount} PSU${summary.psuCount !== 1 ? "s" : ""}`,
          ]}
        />
      </div>

      {result.redFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-800">Red Flag Conditions -- Mandatory Redesign</h3>
          </div>
          <div className="space-y-2">
            {result.redFlags.map(flag => (
              <div key={flag.id} className="flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold">{flag.title}</span>
                  <span className="text-red-600 ml-1">-- {flag.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.issues.length > 0 && (
        <PowerIssuesList issues={result.issues} />
      )}
    </div>
  );
}

function LNetTab({ lnetSupplies, issues }: { lnetSupplies: PowerCalculationResult["lnetSupplies"]; issues: PowerCalculationResult["issues"] }) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 text-sm mb-2">L-Net (24V) Power Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-blue-800">
          <div className="flex items-start gap-2">
            <Gauge className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div><span className="font-semibold">Supply:</span> {POWER_CONSTANTS.LNET_SUPPLY_CAPACITY_A}A capacity, {POWER_CONSTANTS.LNET_DESIGN_LIMIT_PERCENT}% design limit = {POWER_CONSTANTS.LNET_DESIGN_LIMIT_A.toFixed(2)}A max</div>
          </div>
          <div className="flex items-start gap-2">
            <CircuitBoard className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div><span className="font-semibold">MSC to L2KA:</span> Max {POWER_CONSTANTS.MAX_L2KA_PER_MSC} L2KA per MSC</div>
          </div>
          <div className="flex items-start gap-2">
            <Cable className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div><span className="font-semibold">Wiring:</span> Home runs only, no daisy chaining, CAT5/6 minimum</div>
          </div>
        </div>
      </div>

      {lnetSupplies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CircuitBoard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No MSC found in design</p>
          <p className="text-sm mt-1">Add an R5KMSC to see L-Net power calculations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {lnetSupplies.map(supply => (
            <LNetSupplyCard key={supply.mscId} supply={supply} />
          ))}
        </div>
      )}

      {issues.length > 0 && <PowerIssuesList issues={issues} />}
    </div>
  );
}

function KBusTab({ kbusSupplies, issues }: { kbusSupplies: PowerCalculationResult["kbusSupplies"]; issues: PowerCalculationResult["issues"] }) {
  return (
    <div className="space-y-6">
      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
        <h3 className="font-semibold text-orange-900 text-sm mb-2">K-Bus (15.5V) Power Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-orange-800">
          <div className="flex items-start gap-2">
            <Gauge className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div><span className="font-semibold">Supply:</span> {POWER_CONSTANTS.KBUS_SUPPLY_CAPACITY_A}A capacity, {POWER_CONSTANTS.KBUS_DESIGN_LIMIT_PERCENT}% design limit = {POWER_CONSTANTS.KBUS_DESIGN_LIMIT_A.toFixed(2)}A max</div>
          </div>
          <div className="flex items-start gap-2">
            <Battery className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div><span className="font-semibold">Per Board:</span> 1 K-Bus PSU per termination board standard</div>
          </div>
          <div className="flex items-start gap-2">
            <Cable className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div><span className="font-semibold">Voltage Drop:</span> Evaluate when cable run exceeds {POWER_CONSTANTS.VOLTAGE_DROP_CABLE_THRESHOLD_FT}ft</div>
          </div>
        </div>
      </div>

      {kbusSupplies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Cable className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No termination boards found in design</p>
          <p className="text-sm mt-1">Add an R5KMTRM to see K-Bus power calculations</p>
        </div>
      ) : (
        <div className="space-y-4">
          {kbusSupplies.map(supply => (
            <KBusSupplyCard key={supply.termBoardId} supply={supply} />
          ))}
        </div>
      )}

      {issues.length > 0 && <PowerIssuesList issues={issues} />}
    </div>
  );
}

function ChecklistTab({ headendChecklist, redFlags }: {
  headendChecklist: PowerCalculationResult["headendChecklist"];
  redFlags: PowerCalculationResult["redFlags"];
}) {
  return (
    <div className="space-y-6">
      <PowerChecklist items={headendChecklist} />

      {redFlags.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-bold text-red-800">Section 8: Red Flag Conditions</h3>
          </div>
          <p className="text-sm text-red-700 mb-3">
            If any of the following occur, redesign is mandatory. No field "we'll deal with it later" decisions allowed.
          </p>
          <div className="space-y-2">
            {redFlags.map(flag => (
              <div key={flag.id} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-semibold text-red-800">{flag.title}</span>
                  <span className="text-red-600 ml-1">-- {flag.detail}</span>
                  <span className="text-red-400 ml-1 text-xs">(Rule {flag.rule})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h3 className="font-semibold text-slate-800 text-sm mb-3">Section 9: Marshall Design Philosophy</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700">
          {[
            "Hospitals operate 24/7 -- reliability is paramount",
            "Troubleshooting is disruptive to patient care",
            "System instability damages credibility",
            "Expansion is common -- leave headroom",
            "Conservative margins for life-safety adjacent systems",
            "Not minimum cost design -- prioritize service flexibility",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Activity }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-gray-400" />
        <span className="text-xs text-gray-500 font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
    </div>
  );
}

function PowerDomainCard({ title, subtitle, totalCurrent, capacity, designLimit, designLimitPercent, status, items }: {
  title: string;
  subtitle: string;
  totalCurrent: number;
  capacity: number;
  designLimit: number;
  designLimitPercent: number;
  status: string;
  items: string[];
}) {
  const utilization = capacity > 0 ? (totalCurrent / capacity) * 100 : 0;
  const barColor = status === "pass" ? "bg-emerald-500" :
    status === "warning" ? "bg-amber-500" :
    status === "error" ? "bg-orange-500" : "bg-red-600";
  const statusColor = status === "pass" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
    status === "warning" ? "text-amber-700 bg-amber-50 border-amber-200" :
    "text-red-700 bg-red-50 border-red-200";

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
          {status === "pass" ? "OK" : status.toUpperCase()}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-gray-600">Total Load</span>
          <span className="font-bold text-gray-900">{totalCurrent.toFixed(3)}A / {capacity}A</span>
        </div>
        <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(utilization, 100)}%` }} />
          <div className="absolute top-0 h-full w-0.5 bg-gray-400/60" style={{ left: `${designLimitPercent}%` }} title={`${designLimitPercent}% design limit`} />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-gray-400">{utilization.toFixed(1)}% utilized</span>
          <span className="text-gray-400">Design limit: {designLimitPercent}% ({designLimit.toFixed(2)}A)</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
