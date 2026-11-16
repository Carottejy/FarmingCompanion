import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/*
 * Lecture / écriture minimaliste de fichiers .xlsx (premier onglet, valeurs uniquement)
 * et .csv, sans dépendance native : fonctionne sur Android, iOS et dans la web app.
 */

export type Cell = string | number | null;

// ───────────────────────── Lecture ─────────────────────────

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function decodeXml(s: string): string {
  return s.replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e: string) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

/** Texte d'un nœud <si> / <is> : concatène les <t> (texte enrichi compris), ignore les <rPh> (phonétique). */
function richText(xml: string): string {
  const clean = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  for (const m of clean.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g)) out += decodeXml(m[1] ?? '');
  return out;
}

function colIndex(ref: string): number {
  const letters = ref.match(/^[A-Z]+/)?.[0] ?? 'A';
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

const attr = (tag: string, name: string) => tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1];

/** Lit le premier onglet d'un classeur .xlsx en tableau de lignes. */
export function readXlsx(data: Uint8Array): Cell[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(data);
  } catch {
    throw new Error('Fichier illisible : ce n\'est pas un classeur Excel (.xlsx) valide.');
  }
  const text = (path: string) => (files[path] ? strFromU8(files[path]) : undefined);

  // Premier onglet déclaré dans workbook.xml → son fichier via les relations.
  let sheetPath = 'xl/worksheets/sheet1.xml';
  const wb = text('xl/workbook.xml');
  const rels = text('xl/_rels/workbook.xml.rels');
  const firstSheet = wb?.match(/<sheet\b[^>]*>/)?.[0];
  const rid = firstSheet && (attr(firstSheet, 'r:id') ?? attr(firstSheet, 'id'));
  if (rid && rels) {
    const rel = [...rels.matchAll(/<Relationship\b[^>]*>/g)].map((m) => m[0]).find((r) => attr(r, 'Id') === rid);
    const target = rel && attr(rel, 'Target');
    if (target) sheetPath = target.startsWith('/') ? target.slice(1) : `xl/${target.replace(/^\.\//, '')}`;
  }
  if (!files[sheetPath]) {
    const any = Object.keys(files).find((f) => /^xl\/worksheets\/[^/]+\.xml$/.test(f));
    if (!any) throw new Error('Aucun onglet trouvé dans le classeur.');
    sheetPath = any;
  }

  const shared = [...(text('xl/sharedStrings.xml') ?? '').matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((m) => richText(m[1]));
  const sheet = text(sheetPath) ?? '';

  const rows: Cell[][] = [];
  for (const rm of sheet.matchAll(/<row\b([^>]*)>([\s\S]*?)<\/row>|<row\b([^>]*)\/>/g)) {
    const rowNum = Number(attr(rm[1] ?? rm[3] ?? '', 'r')) || rows.length + 1;
    const row: Cell[] = [];
    for (const cm of (rm[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const a = cm[1];
      const body = cm[2] ?? '';
      const ref = attr(a, 'r');
      const idx = ref ? colIndex(ref) : row.length;
      const t = attr(a, 't');
      const v = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      let value: Cell = null;
      if (t === 's') value = v !== undefined ? (shared[Number(v)] ?? '') : '';
      else if (t === 'inlineStr') value = richText(body.match(/<is>([\s\S]*?)<\/is>/)?.[1] ?? '');
      else if (t === 'str' || t === 'e') value = v !== undefined ? decodeXml(v) : '';
      else if (t === 'b') value = v === '1' ? 'VRAI' : 'FAUX';
      else if (v !== undefined) value = Number(v);
      row[idx] = value;
    }
    rows[rowNum - 1] = Array.from(row, (c) => (c === undefined ? null : c));
  }
  return Array.from(rows, (r) => r ?? []);
}

/** Lit un CSV (séparateur « ; » ou « , », guillemets gérés). */
export function readCsv(textIn: string): Cell[][] {
  const text = textIn.replace(/^﻿/, '');
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const sep = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';
  const rows: Cell[][] = [];
  let row: Cell[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cur); rows.push(row); row = []; cur = '';
    } else cur += ch;
  }
  if (cur !== '' || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

/** Choisit le lecteur selon le contenu (signature ZIP « PK » = xlsx). */
export function readTable(data: Uint8Array): Cell[][] {
  if (data[0] === 0x50 && data[1] === 0x4b) return readXlsx(data);
  return readCsv(strFromU8(data));
}

// ───────────────────────── Écriture ─────────────────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const colLetter = (i: number) => {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

export interface SheetSpec {
  name: string;
  header: string[];
  rows: Cell[][];
  /** Largeur des colonnes (caractères). */
  widths?: number[];
  /** Colonnes (index) au format texte « @ » (ex. dates « 04/2024 »). */
  textColumns?: number[];
}

/**
 * Écrit un classeur .xlsx d'un onglet : en-tête gras blanc sur fond vert, première ligne figée,
 * filtre automatique, largeurs de colonnes — même présentation que la synthèse des planches.
 */
export function writeXlsx(spec: SheetSpec): Uint8Array {
  const { header, rows, widths = [], textColumns = [] } = spec;
  const nCols = header.length;
  const lastRef = `${colLetter(nCols - 1)}${rows.length + 1}`;

  const cellXml = (value: Cell, ref: string, style: number) => {
    const s = style ? ` s="${style}"` : '';
    if (value === null || value === '') return `<c r="${ref}"${s}/>`;
    if (typeof value === 'number') return `<c r="${ref}"${s} t="n"><v>${value}</v></c>`;
    return `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">${esc(value)}</t></is></c>`;
  };

  const sheetRows = [
    `<row r="1">${header.map((h, i) => cellXml(h, `${colLetter(i)}1`, 1)).join('')}</row>`,
    ...rows.map((r, ri) => {
      const n = ri + 2;
      return `<row r="${n}">${Array.from({ length: nCols }, (_, ci) => {
        const v = r[ci] ?? null;
        const style = textColumns.includes(ci) ? 3 : typeof v === 'number' ? 2 : 0;
        return cellXml(v, `${colLetter(ci)}${n}`, style);
      }).join('')}</row>`;
    }),
  ].join('');

  const cols = widths.length
    ? `<cols>${widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';

  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${lastRef}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft" activeCell="A2" sqref="A2"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>${cols}<sheetData>${sheetRows}</sheetData><autoFilter ref="A1:${lastRef}"/></worksheet>`;

  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="0"/><fonts count="2"><font><sz val="11"/><name val="Calibri"/><family val="2"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/><family val="2"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2E7D32"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="left"/></xf><xf numFmtId="49" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(spec.name)}" sheetId="1" r:id="rId1"/></sheets><definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${esc(spec.name).replace(/'/g, "''")}'!$A$1:$${colLetter(nCols - 1)}$${rows.length + 1}</definedName></definedNames></workbook>`;

  const files: Record<string, Uint8Array> = {
    '[Content_Types].xml': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    '_rels/.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    'xl/workbook.xml': strToU8(workbook),
    'xl/_rels/workbook.xml.rels': strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    'xl/worksheets/sheet1.xml': strToU8(sheet),
    'xl/styles.xml': strToU8(styles),
  };
  return zipSync(files, { level: 6 });
}
