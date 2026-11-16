import { entryFamilyLabel, entryName, matchCrop } from './crops';
import type { Cell } from './sheet';
import type { HistoryEntry, Planche } from './types';

/*
 * Import / export des historiques de planches au format « Synthèse des planches » :
 *
 *   Planche | Légume | Date (MM/AAAA) | Famille
 *   1       | Pomme de terre | 04/2024 | Solanacées
 *
 * - À l'import, chaque planche du fichier est créée si elle n'existe pas, sinon son historique
 *   est REMPLACÉ par celui du fichier (le fichier fait foi). Les planches absentes du fichier et
 *   les cultures en cours ne sont pas touchées.
 * - Les légumes absents de la base (Gazon, Thym…) sont gardés tels quels avec leur famille,
 *   qui sert quand même aux règles de rotation.
 */

export const HEADER = ['Planche', 'Légume', 'Date', 'Famille'];
export const COLUMN_WIDTHS = [14, 20, 12, 30];
export const SHEET_NAME = 'Synthèse';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Convertit une date de cellule en ISO (YYYY-MM-DD). Accepte 04/2024, 4/2024, 15/04/2024, 2024-04, n° de série Excel. */
export function parseDateCell(v: Cell): string | null {
  if (v === null || v === '') return null;
  if (typeof v === 'number') {
    if (v > 59 && v < 80000) {
      // Numéro de série Excel (jours depuis le 30/12/1899)
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
      return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
    }
    if (v >= 1900 && v <= 2200) return `${v}-01-01`;
    return null;
  }
  const s = v.trim();
  let m = s.match(/^(\d{1,2})[/.-](\d{4})$/); // MM/AAAA
  if (m && +m[1] >= 1 && +m[1] <= 12) return `${m[2]}-${pad2(+m[1])}-01`;
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/); // JJ/MM/AAAA
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[3]}-${pad2(+m[2])}-${pad2(Math.min(31, Math.max(1, +m[1])))}`;
  m = s.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/); // AAAA-MM(-JJ)
  if (m && +m[2] >= 1 && +m[2] <= 12) return `${m[1]}-${pad2(+m[2])}-${pad2(m[3] ? +m[3] : 1)}`;
  m = s.match(/^(\d{4})$/);
  if (m) return `${m[1]}-01-01`;
  return null;
}

/** ISO → « MM/AAAA » (format du fichier). */
export const formatDateCell = (iso: string) => `${iso.slice(5, 7)}/${iso.slice(0, 4)}`;

const cellText = (v: Cell | undefined) => (v === null || v === undefined ? '' : String(v).trim());

export interface ParsedImport {
  /** Planches dans l'ordre d'apparition du fichier. */
  groups: { name: string; entries: HistoryEntry[] }[];
  rowCount: number;
  /** Légumes non reconnus par la base (gardés tels quels). */
  unknownNames: string[];
  /** Lignes ignorées (n° de ligne Excel + raison). */
  skipped: { row: number; reason: string }[];
}

export function parseImport(rows: Cell[][]): ParsedImport {
  // Colonnes repérées par leur en-tête ; à défaut A=Planche, B=Légume, C=Date, D=Famille.
  let col = { planche: 0, legume: 1, date: 2, famille: 3 };
  let start = 0;
  const head = (rows[0] ?? []).map((c) => norm(cellText(c)));
  if (head.some((h) => h === 'planche' || h === 'legume' || h === 'date')) {
    const find = (names: string[], fallback: number) => {
      const i = head.findIndex((h) => names.includes(h));
      return i >= 0 ? i : fallback;
    };
    col = {
      planche: find(['planche', 'planches', 'parcelle', 'lot'], 0),
      legume: find(['legume', 'legumes', 'culture', 'cultures', 'plante'], 1),
      date: find(['date', 'mois', 'date de plantation', 'date de semis'], 2),
      famille: find(['famille', 'familles', 'famille botanique'], 3),
    };
    start = 1;
  }

  const groups = new Map<string, { name: string; entries: HistoryEntry[] }>();
  const unknown = new Set<string>();
  const skipped: ParsedImport['skipped'] = [];
  let rowCount = 0;

  for (let i = start; i < rows.length; i++) {
    const r = rows[i] ?? [];
    const plancheRaw = r[col.planche];
    const name = typeof plancheRaw === 'number' ? String(plancheRaw) : cellText(plancheRaw);
    const legume = cellText(r[col.legume]);
    if (!name && !legume) continue; // ligne vide
    if (!name) { skipped.push({ row: i + 1, reason: 'planche manquante' }); continue; }
    if (!legume) { skipped.push({ row: i + 1, reason: 'légume manquant' }); continue; }
    const date = parseDateCell(r[col.date] ?? null);
    if (!date) { skipped.push({ row: i + 1, reason: `date illisible « ${cellText(r[col.date])} »` }); continue; }
    const family = cellText(r[col.famille]) || undefined;

    const crop = matchCrop(legume);
    if (!crop) unknown.add(legume);
    const entry: HistoryEntry = { cropId: crop?.id ?? 'custom', date, label: legume, ...(family ? { family } : {}) };

    const key = norm(name);
    if (!groups.has(key)) groups.set(key, { name, entries: [] });
    groups.get(key)!.entries.push(entry);
    rowCount++;
  }

  return { groups: [...groups.values()], rowCount, unknownNames: [...unknown].sort((a, b) => a.localeCompare(b, 'fr')), skipped };
}

/** Plus récent d'abord ; à date égale, l'ordre du fichier est conservé à l'export. */
const sortDesc = (entries: HistoryEntry[]) => [...entries].reverse().sort((a, b) => b.date.localeCompare(a.date));

const plancheKey = (name: string) => norm(name).replace(/^planche\s+/, '');

export interface ImportResult {
  planches: Planche[];
  created: string[];
  updated: string[];
}

export function applyImport(existing: Planche[], parsed: ParsedImport, newId: () => string): ImportResult {
  const planches = existing.map((p) => ({ ...p }));
  const created: string[] = [];
  const updated: string[] = [];

  for (const g of parsed.groups) {
    const key = plancheKey(g.name);
    const target = planches.find((p) => plancheKey(p.name) === key);
    if (target) {
      // Ne pas dupliquer la culture en cours si elle figure dans le fichier (export précédent).
      const cur = target.current;
      const entries = cur
        ? g.entries.filter((e) => !(e.cropId === cur.cropId && e.cropId !== 'custom' && e.date.slice(0, 7) === cur.sownDate.slice(0, 7)))
        : g.entries;
      target.history = sortDesc(entries);
      updated.push(target.name);
    } else {
      planches.push({ id: newId(), name: g.name, history: sortDesc(g.entries) });
      created.push(g.name);
    }
  }
  return { planches, created, updated };
}

/** Lignes à exporter (sans l'en-tête) : historique + culture en cours, par planche puis date croissante. */
export function exportRows(planches: Planche[]): Cell[][] {
  const rows: Cell[][] = [];
  for (const p of planches) {
    // « 3 » et « Planche 3 » s'exportent comme le fichier d'origine : le nombre 3.
    const num = p.name.trim().match(/^(?:planche\s+)?(\d+)$/i);
    const name: Cell = num ? Number(num[1]) : p.name;
    const entries: HistoryEntry[] = [...p.history].reverse();
    if (p.current) entries.push({ cropId: p.current.cropId, date: p.current.sownDate });
    entries.sort((a, b) => a.date.localeCompare(b.date));
    for (const e of entries) rows.push([name, entryName(e), formatDateCell(e.date), entryFamilyLabel(e) ?? '']);
  }
  return rows;
}

export function exportFileName(d = new Date()): string {
  return `Synthese_Planches_${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}.xlsx`;
}
