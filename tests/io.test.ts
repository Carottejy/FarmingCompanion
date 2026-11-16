import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalFamily, entryFamilyLabel, matchCrop } from '../src/lib/crops';
import { recommend } from '../src/lib/engine';
import { buildClimateProfile } from '../src/lib/climate';
import { applyImport, exportRows, HEADER, parseDateCell, parseImport, SHEET_NAME, COLUMN_WIDTHS } from '../src/lib/planchesIO';
import { readCsv, readTable, readXlsx, writeXlsx } from '../src/lib/sheet';
import type { Planche } from '../src/lib/types';

const SAMPLE = [
  HEADER,
  [1, 'Pomme de terre', '04/2024', 'Solanacées'],
  [1, 'Poireaux', '08/2024', 'Amaryllidacées'],
  [1, 'Petits pois', '11/2025', 'Fabacées'],
  [2, 'Gazon', '03/2024', 'Poacées'],
  [2, 'Thym', '05/2025', 'Lamiacées'],
  ['Terrain Sud-Ouest', 'Choux', '09/2025', 'Brassicacées'],
  ['Terrain Sud-Ouest', 'Choux', '09/2025', 'Brassicacées'],
];

let n = 0;
const newId = () => `id${++n}`;

test('noms de légumes du fichier → cultures de la base', () => {
  const cases: [string, string | undefined][] = [
    ['Petits pois', 'pois'], ['Poireaux', 'poireau'], ['Choux', 'chou-pomme'], ['Tomates', 'tomate'],
    ['Pomme de terre', 'pomme-de-terre'], ['Patates douces', 'patate-douce'], ['Radis', 'radis'],
    ['Panais', 'panais'], ['Échalotes', 'echalote'], ['Fèves', 'feve'], ['Salades', 'laitue'],
    ['Potimarrons', 'courge'], ['Mâche', 'mache'], ['Épinards', 'epinard'], ['Gazon', undefined], ['Thym', undefined],
  ];
  for (const [name, id] of cases) assert.equal(matchCrop(name)?.id, id, name);
});

test('familles : synonymes et libellés', () => {
  assert.equal(canonicalFamily('Amaryllidacées'), 'Alliacées');
  assert.equal(canonicalFamily('Caprifoliacées (Valérianacées)'), 'Valérianacées');
  assert.equal(canonicalFamily('Lamiacées'), 'Lamiacées');
  assert.equal(entryFamilyLabel({ cropId: 'pois' }), 'Fabacées');
  assert.equal(entryFamilyLabel({ cropId: 'ail' }), 'Amaryllidacées');
});

test('dates acceptées', () => {
  assert.equal(parseDateCell('04/2024'), '2024-04-01');
  assert.equal(parseDateCell('4/2024'), '2024-04-01');
  assert.equal(parseDateCell('15/04/2024'), '2024-04-15');
  assert.equal(parseDateCell('2024-04'), '2024-04-01');
  assert.equal(parseDateCell(45383), '2024-04-01'); // n° de série Excel
  assert.equal(parseDateCell('avril'), null);
});

test('xlsx : écriture puis relecture à l\'identique', () => {
  const bytes = writeXlsx({ name: SHEET_NAME, header: HEADER, rows: SAMPLE.slice(1), widths: COLUMN_WIDTHS, textColumns: [2] });
  const back = readTable(bytes);
  assert.deepEqual(back, SAMPLE);
});

test('import : création puis mise à jour des planches', () => {
  const parsed = parseImport(SAMPLE);
  assert.equal(parsed.rowCount, 7);
  assert.deepEqual(parsed.unknownNames, ['Gazon', 'Thym']);

  const existing: Planche[] = [
    { id: 'p1', name: 'Planche 1', history: [{ cropId: 'tomate', date: '2020-05-01' }], current: { cropId: 'ail', sownDate: '2026-11-01', harvestDate: '2027-07-01' } },
    { id: 'px', name: 'Hors fichier', history: [{ cropId: 'carotte', date: '2025-04-01' }] },
  ];
  const r = applyImport(existing, parsed, newId);
  assert.deepEqual(r.updated, ['Planche 1']); // « 1 » du fichier ↔ « Planche 1 »
  assert.deepEqual(r.created, ['2', 'Terrain Sud-Ouest']);
  const p1 = r.planches.find((p) => p.id === 'p1')!;
  assert.equal(p1.history.length, 3); // remplacé par le fichier
  assert.equal(p1.history[0].label, 'Petits pois');
  assert.equal(p1.current?.cropId, 'ail'); // culture en cours conservée
  assert.equal(r.planches.find((p) => p.id === 'px')!.history.length, 1); // planche hors fichier intacte
});

test('export au même format, et ré-import idempotent', () => {
  const r = applyImport([], parseImport(SAMPLE), newId);
  const rows = exportRows(r.planches);
  assert.deepEqual([HEADER, ...rows], SAMPLE);
  const again = applyImport(r.planches, parseImport([HEADER, ...rows]), newId);
  assert.deepEqual(again.created, []);
  assert.deepEqual(exportRows(again.planches), rows);
});

test('« Planche 3 » s\'exporte « 3 » comme dans le fichier', () => {
  assert.deepEqual(exportRows([{ id: 'x', name: 'Planche 3', history: [{ cropId: 'ail', date: '2025-10-01' }] }]), [[3, 'Ail', '10/2025', 'Amaryllidacées']]);
});

test('la culture en cours est exportée et non dupliquée au ré-import', () => {
  const p: Planche[] = [{ id: 'a', name: '3', history: [{ cropId: 'pois', date: '2025-03-01' }], current: { cropId: 'tomate', sownDate: '2026-05-10', harvestDate: '2026-08-10' } }];
  const rows = exportRows(p);
  assert.deepEqual(rows, [[3, 'Pois', '03/2025', 'Fabacées'], [3, 'Tomate', '05/2026', 'Solanacées']]);
  const back = applyImport(p, parseImport([HEADER, ...rows]), newId);
  assert.equal(back.planches[0].history.length, 1);
});

test('les familles importées comptent pour la rotation (gazon → taupins, Lamiacées libre)', () => {
  const climate = buildClimateProfile({ latitude: 48.85, longitude: 2.35, altitude: 35 });
  const res = recommend({
    date: new Date(2026, 3, 15),
    climate,
    history: [{ cropId: 'custom', label: 'Gazon', family: 'Poacées', date: '2025-06-01' }],
  });
  const pdt = res.find((x) => x.crop.id === 'pomme-de-terre')!;
  assert.ok(pdt.reasons.some((x) => x.text.includes('taupins')));
  const res2 = recommend({
    date: new Date(2026, 3, 15),
    climate,
    history: [{ cropId: 'custom', label: 'Ciboulette', family: 'Amaryllidacées', date: '2025-06-01' }],
  });
  const oignon = res2.find((x) => x.crop.id === 'oignon');
  if (oignon) assert.ok(oignon.reasons.some((x) => x.text.includes('Même famille')));
});

test('csv : séparateur point-virgule et guillemets', () => {
  const rows = readCsv('Planche;Légume;Date;Famille\n1;"Pomme de terre";04/2024;Solanacées\r\n');
  assert.deepEqual(rows[1], ['1', 'Pomme de terre', '04/2024', 'Solanacées']);
  assert.equal(parseImport(rows).rowCount, 1);
});

test('xlsx avec chaînes partagées (format Excel « classique »)', async () => {
  const { zipSync, strToU8 } = await import('fflate');
  const z = zipSync({
    'xl/workbook.xml': strToU8('<workbook><sheets><sheet name="S" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/sharedStrings.xml': strToU8('<sst><si><t>Planche</t></si><si><r><t>Pomme </t></r><r><t>de terre</t></r></si></sst>'),
    'xl/worksheets/sheet1.xml': strToU8('<worksheet><sheetData><row r="1"><c r="A1" t="s"><v>0</v></c></row><row r="2"><c r="A2"><v>1</v></c><c r="B2" t="s"><v>1</v></c></row></sheetData></worksheet>'),
  });
  assert.deepEqual(readXlsx(z), [['Planche'], [1, 'Pomme de terre']]);
});
