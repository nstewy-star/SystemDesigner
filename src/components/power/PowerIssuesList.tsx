import { useState } from "react";
import { AlertCircle, AlertTriangle, ChevronDown, ChevronRight, Info } from "lucide-react";
import type { PowerIssue, PowerIssueSeverity } from "../../types";

const SEVERITY_CONFIG: Record<PowerIssueSeverity, {
  icon: typeof AlertCircle;
  color: string;
  bg: string;
  border: string;
  label: string;
}> = {
  critical: { icon: AlertCircle, color: "text-red-700", bg: "bg-red-50", border: "border-red-200", label: "Critical" },
  error: { icon: AlertCircle, color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", label: "Error" },
  warning: { icon: AlertTriangle, color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", label: "Warning" },
  pass: { icon: Info, color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", label: "Pass" },
};

interface PowerIssuesListProps {
  issues: PowerIssue[];
}

export function PowerIssuesList({ issues }: PowerIssuesListProps) {
  const [expandedSeverities, setExpandedSeverities] = useState<Set<string>>(new Set(["critical", "error"]));

  const grouped = {
    critical: issues.filter(i => i.severity === "critical"),
    error: issues.filter(i => i.severity === "error"),
    warning: issues.filter(i => i.severity === "warning"),
  };

  const toggleSeverity = (sev: string) => {
    setExpandedSeverities(prev => {
      const next = new Set(prev);
      next.has(sev) ? next.delete(sev) : next.add(sev);
      return next;
    });
  };

  if (issues.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-700 text-sm">Issues Found</h3>
      {(["critical", "error", "warning"] as const).map(severity => {
        const group = grouped[severity];
        if (group.length === 0) return null;
        const config = SEVERITY_CONFIG[severity];
        const Icon = config.icon;
        const isExpanded = expandedSeverities.has(severity);

        return (
          <div key={severity} className={`rounded-xl border ${config.border} overflow-hidden`}>
            <button
              onClick={() => toggleSeverity(severity)}
              className={`w-full flex items-center gap-2 px-4 py-3 ${config.bg} hover:opacity-90 transition-opacity`}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
              <Icon className={`w-4 h-4 ${config.color}`} />
              <span className={`text-sm font-semibold ${config.color}`}>
                {group.length} {config.label}{group.length > 1 ? "s" : ""}
              </span>
            </button>
            {isExpanded && (
              <div className="divide-y divide-gray-100 bg-white">
                {group.map(issue => (
                  <div key={issue.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start gap-2">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-800">{issue.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{issue.detail}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          issue.domain === "lnet" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                        }`}>
                          {issue.domain === "lnet" ? "L-Net" : "K-Bus"}
                        </span>
                        <span className="text-xs text-gray-400 font-mono">Rule {issue.rule}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
