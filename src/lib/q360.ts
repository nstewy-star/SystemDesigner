import { createClient } from '@supabase/supabase-js';
import { Q360_PREFERRED_BY_MASTERNO } from '../data/q360PreferredParts';

// Read-only client pointed at the RallyShare / Q360 Supabase (source of truth for parts).
// Separate from the app's own `supabase` client so this never touches SystemDesigner's tables.
// The anon key can read part identity (masterno, description, category) but NOT `cost` — cost is
// column-protected and lives downstream in QuickQuote's pricing engine, which is correct.
const q360 = createClient(
  import.meta.env.VITE_Q360_SUPABASE_URL || '',
  import.meta.env.VITE_Q360_SUPABASE_ANON_KEY || '',
  { auth: { persistSession: false } },
);

export type RaulandPart = {
  masterno: string;
  description: string;
  category: string;
  preferred: boolean;
  cost?: number; // baked from the curated preferred overlay only; anon cannot read live cost
  substituteOf?: string;
};

const PAGE = 1000; // Supabase REST caps a request at 1000 rows; page past it.

// Full Rauland catalog from Q360, with the curated preferred kit overlaid (star + device type).
export async function loadRaulandCatalog(): Promise<RaulandPart[]> {
  const out: RaulandPart[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await q360
      .from('Q360_master_parts')
      .select('masterno,description,av_category,family')
      .ilike('manufacturer', '%rauland%')
      .order('masterno')
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data as Array<Record<string, unknown>>) {
      const masterno = String(r.masterno);
      const pref = Q360_PREFERRED_BY_MASTERNO[masterno];
      out.push({
        masterno,
        description: String(r.description ?? ''),
        category: pref?.category || (r.av_category as string) || (r.family as string) || 'Other',
        preferred: !!pref,
        cost: pref?.cost,
        substituteOf: pref?.substituteOf,
      });
    }
    if (data.length < PAGE) break;
  }
  return out;
}

// Group by device type, preferred pinned to the top of each group, preferred-heavy types first.
export function groupByDeviceType(parts: RaulandPart[]): Array<[string, RaulandPart[]]> {
  const g: Record<string, RaulandPart[]> = {};
  for (const p of parts) (g[p.category] = g[p.category] || []).push(p);
  for (const k of Object.keys(g)) {
    g[k].sort(
      (a, b) => Number(b.preferred) - Number(a.preferred) || a.masterno.localeCompare(b.masterno),
    );
  }
  return Object.entries(g).sort(
    (a, b) =>
      b[1].filter((p) => p.preferred).length - a[1].filter((p) => p.preferred).length,
  );
}
