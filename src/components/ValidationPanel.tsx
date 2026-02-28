import { useMemo, useState } from "react";
import { AlertTriangle, AlertCircle, Info, ChevronDown, ChevronRight, Shield, CheckCircle2 } from "lucide-react";
import type { Device, Connection } from "../types";
import { validateDesign, type DesignIssue, type Severity } from "../lib/designRules";

interface ValidationPanelProps {
  devices: Device[];
  connections: Connection[];
  onHighlightDevices?: (ids: string[]) => void;
}

const SEVERITY_CONFIG: Record<Severity, { icon: typeof AlertCircle; color: string; bg: string; border: string; label: string }> = {
  error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", border: "border-red-200", label: "Error" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", label: "Warning" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200", label: "Info" },
};

export function ValidationPanel({ devices, connections, onHighlightDevices }: ValidationPanelProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["error"]));

  const issues = useMemo(
    () => validateDesign(devices, connections),
    [devices, connections]
  );

  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const infoCount = issues.filter(i => i.severity === "info").length;

  const groupedBySeverity = useMemo(() => {
    const groups: Record<Severity, DesignIssue[]> = { error: [], warning: [], info: [] };
    issues.forEach(issue => groups[issue.severity].push(issue));
    return groups;
  }, [issues]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  if (devices.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-3.5 h-3.5 text-gray-600" />
        <h3 className="font-semibold text-xs text-gray-700 uppercase tracking-wider">Design Rules</h3>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="text-xs text-emerald-700 font-medium">All design rules pass</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2.5 text-xs">
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
            {infoCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-semibold">
                <Info className="w-3 h-3" />
                {infoCount}
              </span>
            )}
          </div>

          <div className="space-y-2">
            {(["error", "warning", "info"] as Severity[]).map(severity => {
              const group = groupedBySeverity[severity];
              if (group.length === 0) return null;
              const config = SEVERITY_CONFIG[severity];
              const Icon = config.icon;
              const isExpanded = expandedCategories.has(severity);

              return (
                <div key={severity} className={`rounded-lg border ${config.border} overflow-hidden`}>
                  <button
                    onClick={() => toggleCategory(severity)}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 ${config.bg} hover:opacity-90 transition-opacity`}
                  >
                    {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    <span className={`text-xs font-semibold ${config.color}`}>
                      {group.length} {config.label}{group.length > 1 ? "s" : ""}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="divide-y divide-gray-100">
                      {group.map(issue => (
                        <div
                          key={issue.id}
                          className="px-3 py-2 hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => issue.deviceIds && onHighlightDevices?.(issue.deviceIds)}
                        >
                          <div className="text-xs font-semibold text-gray-800">{issue.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{issue.detail}</div>
                          {issue.category && (
                            <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-medium">
                              {issue.category}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
