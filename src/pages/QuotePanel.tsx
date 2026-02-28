import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { ScrollArea } from "../components/ui/scroll-area";
import {
  DollarSign,
  FileText,
  Download,
  Plus,
  Trash2,
  Calculator,
  X,
  RefreshCw,
  CheckCircle2,
  XCircle,
  ClipboardCheck,
} from "lucide-react";
import { useProject } from "../contexts/ProjectContext";
import { supabase } from "../lib/db/client";
import { DEVICE_LIBRARY } from "../data/devices";
import {
  runQuoteChecklist,
  LABOR_CONTINGENCY_PERCENT,
  CABLE_LABOR_HOURS_PER_1000FT,
} from "../lib/designRules";
import type { Quote, QuoteLineItem, DevicePricing } from "../types";

interface QuotePanelProps {
  open: boolean;
  onClose: () => void;
}

export function QuotePanel({ open, onClose }: QuotePanelProps) {
  const { currentProject } = useProject();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([]);
  const [pricing, setPricing] = useState<DevicePricing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPricingEditor, setShowPricingEditor] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);
  const [scopeOfWork, setScopeOfWork] = useState("");
  const [cableFeet, setCableFeet] = useState(0);
  const [freightCost, setFreightCost] = useState(0);

  const loadOrCreateQuote = useCallback(async () => {
    if (!currentProject) return;
    setLoading(true);

    const { data: existingQuote } = await supabase
      .from("quotes")
      .select("*")
      .eq("project_id", currentProject.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingQuote) {
      setQuote(existingQuote as Quote);
      setScopeOfWork(existingQuote.scope_of_work || "");
      setCableFeet(existingQuote.cable_feet || 0);
      setFreightCost(existingQuote.freight_cost || 0);

      const { data: items } = await supabase
        .from("quote_line_items")
        .select("*")
        .eq("quote_id", existingQuote.id)
        .order("sort_order");

      if (items) setLineItems(items as QuoteLineItem[]);
    }

    const { data: pricingData } = await supabase
      .from("device_pricing")
      .select("*");

    if (pricingData) setPricing(pricingData as DevicePricing[]);
    setLoading(false);
  }, [currentProject]);

  useEffect(() => {
    if (open) loadOrCreateQuote();
  }, [open, loadOrCreateQuote]);

  const createQuote = async () => {
    if (!currentProject) return;

    const quoteNumber = `Q-${Date.now().toString(36).toUpperCase()}`;

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        project_id: currentProject.id,
        quote_number: quoteNumber,
        status: "draft",
        labor_rate_per_hour: 85,
        scope_of_work: "",
      })
      .select()
      .maybeSingle();

    if (!error && data) {
      setQuote(data as Quote);
      setScopeOfWork("");
    }
  };

  const generateLineItems = async () => {
    if (!currentProject || !quote) return;

    await supabase.from("quote_line_items").delete().eq("quote_id", quote.id);

    const deviceCounts = new Map<string, number>();
    currentProject.devices.forEach((d) => {
      deviceCounts.set(d.part, (deviceCounts.get(d.part) || 0) + 1);
    });

    const newItems: Omit<QuoteLineItem, "id">[] = [];
    let sortOrder = 0;

    deviceCounts.forEach((qty, partNumber) => {
      const lib = DEVICE_LIBRARY.find((d) => d.part === partNumber);
      const price = pricing.find((p) => p.part_number === partNumber);

      const unitCost = price?.unit_cost || 0;
      const unitPrice = price?.unit_price || 0;
      const laborMin = price?.labor_minutes || lib?.laborMinutes || 0;

      newItems.push({
        quote_id: quote.id,
        part_number: partNumber,
        description: lib?.label || partNumber,
        category: lib?.category || "General",
        quantity: qty,
        unit_cost: unitCost,
        unit_price: unitPrice,
        labor_minutes: laborMin * qty,
        cable_length_feet: 0,
        cable_cost: 0,
        line_total: unitPrice * qty,
        sort_order: sortOrder++,
      });
    });

    if (newItems.length > 0) {
      const { data } = await supabase
        .from("quote_line_items")
        .insert(newItems)
        .select();

      if (data) setLineItems(data as QuoteLineItem[]);
    }

    await updateQuoteTotals(newItems as QuoteLineItem[]);
  };

  const updateQuoteTotals = async (items: QuoteLineItem[]) => {
    if (!quote) return;

    const subtotalMaterials = items.reduce((sum, i) => sum + i.line_total, 0);
    const baseDeviceLaborMin = items.reduce((sum, i) => sum + i.labor_minutes, 0);
    const contingencyMin = Math.ceil(baseDeviceLaborMin * (LABOR_CONTINGENCY_PERCENT / 100));
    const cableLaborMin = Math.round((cableFeet / 1000) * CABLE_LABOR_HOURS_PER_1000FT * 60);
    const totalLaborMin = baseDeviceLaborMin + contingencyMin + cableLaborMin;
    const subtotalLabor = (totalLaborMin / 60) * quote.labor_rate_per_hour;
    const subtotalBeforeMarkup = subtotalMaterials + subtotalLabor + freightCost;
    const markup = subtotalBeforeMarkup * (quote.markup_percent / 100);
    const subtotalWithMarkup = subtotalBeforeMarkup + markup;
    const discount = subtotalWithMarkup * (quote.discount_percent / 100);
    const subtotalAfterDiscount = subtotalWithMarkup - discount;
    const tax = subtotalAfterDiscount * (quote.tax_percent / 100);
    const total = subtotalAfterDiscount + tax;

    const updates = {
      subtotal_materials: subtotalMaterials,
      subtotal_labor: subtotalLabor,
      total,
      scope_of_work: scopeOfWork,
      updated_at: new Date().toISOString(),
    };

    await supabase.from("quotes").update(updates).eq("id", quote.id);
    setQuote((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const updateQuoteField = async (field: string, value: number | string) => {
    if (!quote) return;
    await supabase.from("quotes").update({ [field]: value }).eq("id", quote.id);
    setQuote((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const updateLineItem = async (itemId: string, updates: Partial<QuoteLineItem>) => {
    const item = lineItems.find((i) => i.id === itemId);
    if (!item) return;

    const updated = { ...item, ...updates };
    if ("quantity" in updates || "unit_price" in updates) {
      updated.line_total = updated.quantity * updated.unit_price;
    }

    await supabase.from("quote_line_items").update(updated).eq("id", itemId);
    const newItems = lineItems.map((i) => (i.id === itemId ? updated : i));
    setLineItems(newItems);
    await updateQuoteTotals(newItems);
  };

  const deleteLineItem = async (itemId: string) => {
    await supabase.from("quote_line_items").delete().eq("id", itemId);
    const newItems = lineItems.filter((i) => i.id !== itemId);
    setLineItems(newItems);
    await updateQuoteTotals(newItems);
  };

  const savePricing = async (partNumber: string, unitCost: number, unitPrice: number) => {
    const existing = pricing.find((p) => p.part_number === partNumber);
    if (existing) {
      await supabase
        .from("device_pricing")
        .update({ unit_cost: unitCost, unit_price: unitPrice })
        .eq("id", existing.id);
      setPricing((prev) =>
        prev.map((p) => (p.id === existing.id ? { ...p, unit_cost: unitCost, unit_price: unitPrice } : p))
      );
    } else {
      const { data } = await supabase
        .from("device_pricing")
        .insert({ part_number: partNumber, unit_cost: unitCost, unit_price: unitPrice })
        .select()
        .maybeSingle();

      if (data) setPricing((prev) => [...prev, data as DevicePricing]);
    }
  };

  const exportQuoteCSV = () => {
    if (!quote || !currentProject) return;

    const baseDeviceLaborMin = lineItems.reduce((sum, i) => sum + i.labor_minutes, 0);
    const contingencyMin = Math.ceil(baseDeviceLaborMin * (LABOR_CONTINGENCY_PERCENT / 100));
    const cableLaborMin = Math.round((cableFeet / 1000) * CABLE_LABOR_HOURS_PER_1000FT * 60);

    const rows: (string | number)[][] = [
      ["Quote", quote.quote_number],
      ["Customer", currentProject.customer_name],
      ["Site", currentProject.site_name],
      ["Status", quote.status],
      ["Date", new Date().toLocaleDateString()],
      [],
      ["MATERIALS"],
      ["Category", "Part", "Description", "Qty", "Unit Price", "Line Total", "Labor (min)"],
      ...lineItems.map((item) => [
        item.category,
        item.part_number,
        item.description,
        item.quantity,
        item.unit_price.toFixed(2),
        item.line_total.toFixed(2),
        item.labor_minutes,
      ]),
      [],
      ["LABOR BREAKDOWN"],
      ["Device Installation", "", "", "", "", ((baseDeviceLaborMin / 60) * quote.labor_rate_per_hour).toFixed(2), `${baseDeviceLaborMin} min`],
      [`Contingency (${LABOR_CONTINGENCY_PERCENT}%)`, "", "", "", "", ((contingencyMin / 60) * quote.labor_rate_per_hour).toFixed(2), `${contingencyMin} min`],
      [`Cable Labor (${cableFeet} ft @ ${CABLE_LABOR_HOURS_PER_1000FT} hrs/1000ft)`, "", "", "", "", ((cableLaborMin / 60) * quote.labor_rate_per_hour).toFixed(2), `${cableLaborMin} min`],
      [],
      ["SUMMARY"],
      ["Materials Subtotal", "", "", "", "", quote.subtotal_materials.toFixed(2)],
      ["Labor Subtotal", "", "", "", "", quote.subtotal_labor.toFixed(2)],
      ["Freight", "", "", "", "", freightCost.toFixed(2)],
      ["Total", "", "", "", "", quote.total.toFixed(2)],
    ];

    if (scopeOfWork) {
      rows.push([], ["SCOPE OF WORK"], [scopeOfWork]);
    }

    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quote-${quote.quote_number}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const baseDeviceLaborMin = useMemo(
    () => lineItems.reduce((sum, i) => sum + i.labor_minutes, 0),
    [lineItems]
  );
  const contingencyMin = Math.ceil(baseDeviceLaborMin * (LABOR_CONTINGENCY_PERCENT / 100));
  const cableLaborMin = Math.round((cableFeet / 1000) * CABLE_LABOR_HOURS_PER_1000FT * 60);
  const totalLaborMin = baseDeviceLaborMin + contingencyMin + cableLaborMin;
  const totalLaborHours = Math.floor(totalLaborMin / 60);
  const totalLaborMins = totalLaborMin % 60;

  const groupedItems = useMemo(() => {
    const groups: Record<string, QuoteLineItem[]> = {};
    lineItems.forEach((item) => {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });
    return groups;
  }, [lineItems]);

  const checklist = useMemo(() => {
    if (!currentProject) return [];
    return runQuoteChecklist(currentProject.devices, currentProject.connections);
  }, [currentProject]);

  const checklistPassCount = checklist.filter(c => c.passed).length;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative ml-auto w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Quote Builder</h2>
            {quote && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {quote.quote_number}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !quote ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-4">No quote for this project yet</p>
                <Button onClick={createQuote} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Quote
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Labor Rate</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-gray-500">$</span>
                      <Input
                        type="number"
                        value={quote.labor_rate_per_hour}
                        onChange={(e) => updateQuoteField("labor_rate_per_hour", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <span className="text-xs text-gray-500 whitespace-nowrap">/ hr</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Markup</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={quote.markup_percent}
                        onChange={(e) => updateQuoteField("markup_percent", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Tax</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={quote.tax_percent}
                        onChange={(e) => updateQuoteField("tax_percent", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Discount</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <Input
                        type="number"
                        value={quote.discount_percent}
                        onChange={(e) => updateQuoteField("discount_percent", Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                      <span className="text-sm text-gray-500">%</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">Cable Run (total ft)</Label>
                    <Input
                      type="number"
                      value={cableFeet}
                      onChange={(e) => setCableFeet(Number(e.target.value))}
                      onBlur={() => updateQuoteTotals(lineItems)}
                      className="h-8 text-sm mt-1"
                      placeholder="e.g., 5000"
                    />
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      Labor: {CABLE_LABOR_HOURS_PER_1000FT} hrs / 1000 ft
                    </span>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Freight</Label>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm text-gray-500">$</span>
                      <Input
                        type="number"
                        value={freightCost}
                        onChange={(e) => setFreightCost(Number(e.target.value))}
                        onBlur={() => updateQuoteTotals(lineItems)}
                        className="h-8 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={generateLineItems}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                    Generate from Design
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowPricingEditor(!showPricingEditor)}
                  >
                    <Calculator className="w-3.5 h-3.5 mr-1.5" />
                    {showPricingEditor ? "Hide Pricing" : "Edit Pricing"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowChecklist(!showChecklist)}
                    className={checklistPassCount === checklist.length && checklist.length > 0 ? "border-emerald-300 text-emerald-700" : ""}
                  >
                    <ClipboardCheck className="w-3.5 h-3.5 mr-1.5" />
                    Checklist ({checklistPassCount}/{checklist.length})
                  </Button>
                </div>

                {showChecklist && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                        <ClipboardCheck className="w-3.5 h-3.5" />
                        Marshall Quoting Checklist
                      </h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {checklist.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 px-4 py-2.5">
                          {item.passed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className={`text-xs font-medium ${item.passed ? "text-gray-700" : "text-red-700"}`}>
                              {item.label}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">{item.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {showPricingEditor && (
                  <PricingEditor
                    pricing={pricing}
                    onSave={savePricing}
                  />
                )}

                {Object.entries(groupedItems).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      {category}
                    </h3>
                    <div className="space-y-1">
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-12 gap-2 items-center py-2 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm"
                        >
                          <div className="col-span-4">
                            <div className="font-medium text-gray-900 text-xs">{item.part_number}</div>
                            <div className="text-xs text-gray-500 truncate">{item.description}</div>
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateLineItem(item.id, { quantity: Number(e.target.value) })
                              }
                              className="h-7 text-xs text-center"
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateLineItem(item.id, { unit_price: Number(e.target.value) })
                              }
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="col-span-2 text-right">
                            <span className="text-xs font-medium text-gray-900">
                              ${item.line_total.toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-2 text-right">
                            <button
                              onClick={() => deleteLineItem(item.id)}
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <Label className="text-xs text-gray-500 mb-1.5 block">Scope of Work</Label>
                  <textarea
                    value={scopeOfWork}
                    onChange={(e) => setScopeOfWork(e.target.value)}
                    onBlur={() => updateQuoteField("scope_of_work", scopeOfWork)}
                    className="w-full h-32 rounded-lg border border-gray-200 p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe the scope of work, installation requirements, exclusions..."
                  />
                </div>

                <div className="bg-gray-50 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Summary</h4>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Materials</span>
                    <span className="font-medium">${quote.subtotal_materials.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-200 pt-2 mt-2 space-y-1.5">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Device Install ({Math.floor(baseDeviceLaborMin / 60)}h {baseDeviceLaborMin % 60}m)</span>
                      <span>${((baseDeviceLaborMin / 60) * quote.labor_rate_per_hour).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Contingency ({LABOR_CONTINGENCY_PERCENT}%): {Math.floor(contingencyMin / 60)}h {contingencyMin % 60}m</span>
                      <span>${((contingencyMin / 60) * quote.labor_rate_per_hour).toFixed(2)}</span>
                    </div>
                    {cableFeet > 0 && (
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Cable Labor ({cableFeet}ft): {Math.floor(cableLaborMin / 60)}h {cableLaborMin % 60}m</span>
                        <span>${((cableLaborMin / 60) * quote.labor_rate_per_hour).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium pt-1">
                      <span className="text-gray-600">
                        Total Labor ({totalLaborHours}h {totalLaborMins}m @ ${quote.labor_rate_per_hour}/hr)
                      </span>
                      <span>${quote.subtotal_labor.toFixed(2)}</span>
                    </div>
                  </div>

                  {freightCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Freight</span>
                      <span className="font-medium">${freightCost.toFixed(2)}</span>
                    </div>
                  )}

                  {quote.markup_percent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Markup ({quote.markup_percent}%)</span>
                      <span className="font-medium">
                        ${(
                          (quote.subtotal_materials + quote.subtotal_labor + freightCost) *
                          (quote.markup_percent / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {quote.discount_percent > 0 && (
                    <div className="flex justify-between text-sm text-emerald-700">
                      <span>Discount ({quote.discount_percent}%)</span>
                      <span className="font-medium">
                        -$
                        {(
                          (quote.subtotal_materials + quote.subtotal_labor + freightCost) *
                          (1 + quote.markup_percent / 100) *
                          (quote.discount_percent / 100)
                        ).toFixed(2)}
                      </span>
                    </div>
                  )}
                  {quote.tax_percent > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax ({quote.tax_percent}%)</span>
                      <span className="font-medium">
                        ${(quote.total - quote.total / (1 + quote.tax_percent / 100)).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base font-bold text-gray-900">
                      ${quote.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => updateQuoteTotals(lineItems)}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  Recalculate Totals
                </Button>
              </>
            )}
          </div>
        </ScrollArea>

        {quote && (
          <div className="px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
            <Button variant="outline" className="flex-1" onClick={exportQuoteCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function PricingEditor({
  pricing,
  onSave,
}: {
  pricing: DevicePricing[];
  onSave: (partNumber: string, unitCost: number, unitPrice: number) => void;
}) {
  const [editValues, setEditValues] = useState<Record<string, { cost: string; price: string }>>({});

  useEffect(() => {
    const values: Record<string, { cost: string; price: string }> = {};
    DEVICE_LIBRARY.forEach((d) => {
      const p = pricing.find((pr) => pr.part_number === d.part);
      values[d.part] = {
        cost: p ? p.unit_cost.toString() : "0",
        price: p ? p.unit_price.toString() : "0",
      };
    });
    setEditValues(values);
  }, [pricing]);

  const categories = [...new Set(DEVICE_LIBRARY.map((d) => d.category))];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500">
          <div className="col-span-5">Part</div>
          <div className="col-span-3">Cost</div>
          <div className="col-span-3">Sell Price</div>
          <div className="col-span-1" />
        </div>
      </div>
      <ScrollArea className="max-h-64">
        {categories.map((category) => (
          <div key={category}>
            <div className="px-4 py-1.5 bg-gray-50 text-xs font-semibold text-gray-600 border-b border-gray-100">
              {category}
            </div>
            {DEVICE_LIBRARY.filter((d) => d.category === category).map((device) => {
              const val = editValues[device.part] || { cost: "0", price: "0" };
              return (
                <div
                  key={device.part}
                  className="grid grid-cols-12 gap-2 items-center px-4 py-1.5 border-b border-gray-50 hover:bg-gray-50"
                >
                  <div className="col-span-5 text-xs text-gray-800 truncate">{device.part}</div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={val.cost}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [device.part]: { ...prev[device.part], cost: e.target.value },
                        }))
                      }
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      step="0.01"
                      value={val.price}
                      onChange={(e) =>
                        setEditValues((prev) => ({
                          ...prev,
                          [device.part]: { ...prev[device.part], price: e.target.value },
                        }))
                      }
                      className="h-6 text-xs"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      onClick={() =>
                        onSave(device.part, Number(val.cost), Number(val.price))
                      }
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Save
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
