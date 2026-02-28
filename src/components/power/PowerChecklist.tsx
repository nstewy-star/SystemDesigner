import { CheckCircle2, XCircle, Shield } from "lucide-react";
import type { HeadendCheckItem } from "../../types";

interface PowerChecklistProps {
  items: HeadendCheckItem[];
}

export function PowerChecklist({ items }: PowerChecklistProps) {
  const passCount = items.filter(c => c.passed).length;
  const allPass = passCount === items.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-slate-50 to-white border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Section 6: Headend Power Checklist</h3>
            <p className="text-xs text-gray-500">Before release for construction</p>
          </div>
        </div>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          allPass ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
        }`}>
          {passCount}/{items.length}
        </span>
      </div>

      <div className="divide-y divide-gray-100">
        {items.map((item, i) => (
          <div key={i} className={`flex items-start gap-3 px-5 py-3 ${item.passed ? "" : "bg-red-50/30"}`}>
            {item.passed ? (
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 mt-0.5 flex-shrink-0" />
            ) : (
              <XCircle className="w-4.5 h-4.5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className={`text-sm font-medium ${item.passed ? "text-gray-800" : "text-red-800"}`}>
                {item.label}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{item.detail}</div>
            </div>
            <span className="text-xs text-gray-400 font-mono flex-shrink-0">Rule {item.rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
