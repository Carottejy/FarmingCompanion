import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildClimateProfile, detectZone } from '../src/lib/climate';
import { recommend, windowFit } from '../src/lib/engine';
import { CROPS } from '../src/lib/crops';

const paris = buildClimateProfile({ latitude: 48.85, longitude: 2.35, altitude: 35 });
const marseille = buildClimateProfile({ latitude: 43.3, longitude: 5.37, altitude: 20 });
const montagne = buildClimateProfile({ latitude: 45.9, longitude: 6.9, altitude: 1050 });

test('zones climatiques', () => {
  assert.equal(detectZone({ latitude: 43.3, longitude: 5.37 }), 'méditerranéen');
  assert.equal(detectZone({ latitude: 48.39, longitude: -4.49 }), 'océanique'); // Brest
  assert.equal(detectZone({ latitude: 48.58, longitude: 7.75 }), 'continental'); // Strasbourg
  assert.equal(detectZone({ latitude: 47.9, longitude: 1.9 }), 'semi-océanique'); // Orléans
  assert.equal(detectZone({ latitude: 45.9, longitude: 6.9, altitude: 1050 }), 'montagnard');
  assert.ok(marseille.offsetDays < -15, `Marseille en avance : ${marseille.offsetDays}`);
  assert.ok(montagne.offsetDays > 25, `Montagne en retard : ${montagne.offsetDays}`);
});

test('fenêtre qui chevauche le 1er janvier (ail 20 → 4)', () => {
  const w = { kind: 'plantation' as const, start: 20, end: 4 };
  assert.notEqual(windowFit(w, 23, 0), null); // décembre
  assert.notEqual(windowFit(w, 1.5, 0), null); // janvier
  assert.equal(windowFit(w, 10, 0), null); // mai
});

test('toutes les fenêtres sont valides', () => {
  for (const c of CROPS)
    for (const w of c.windows) {
      assert.ok(w.start >= 1 && w.start <= 24 && w.end >= 1 && w.end <= 24, c.id);
    }
});

test('mi-mai à Paris : tomates proposées, ail non', () => {
  const r = recommend({ date: new Date(2026, 4, 20), climate: paris, history: [] });
  const ids = r.map((x) => x.crop.id);
  assert.ok(ids.includes('tomate'));
  assert.ok(!ids.includes('ail'));
});

test('après pomme de terre, la tomate est déconseillée', () => {
  const r = recommend({
    date: new Date(2026, 4, 20),
    climate: paris,
    history: [{ cropId: 'pomme-de-terre', date: '2025-04-10' }],
  });
  const tomate = r.find((x) => x.crop.id === 'tomate')!;
  assert.equal(tomate.verdict, 'Déconseillé');
  const haricot = r.find((x) => x.crop.id === 'haricot')!;
  assert.ok(haricot.score > tomate.score + 30);
});

test('après une légumineuse, les choux sont en tête', () => {
  const r = recommend({
    date: new Date(2026, 5, 10),
    climate: paris,
    history: [{ cropId: 'pois', date: '2026-03-01' }],
    includeAbri: false,
  });
  const top5 = r.slice(0, 5).map((x) => x.crop.family);
  assert.ok(top5.includes('Brassicacées'), JSON.stringify(r.slice(0, 5).map((x) => [x.crop.id, x.score])));
  const pois = r.find((x) => x.crop.id === 'haricot');
  if (pois) assert.equal(pois.verdict, 'Déconseillé');
});

test('historique : Alliacées revenues trop tôt', () => {
  const r = recommend({
    date: new Date(2026, 9, 20),
    climate: paris,
    history: [
      { cropId: 'laitue', date: '2026-06-01' },
      { cropId: 'oignon', date: '2024-03-15' },
    ],
  });
  const ail = r.find((x) => x.crop.id === 'ail')!;
  assert.ok(ail.reasons.some((x) => x.text.includes('attendre 5 ans')));
});

test('aubergine pénalisée en montagne, favorisée en Méditerranée', () => {
  const d = new Date(2026, 4, 25);
  const m = recommend({ date: d, climate: marseille, history: [] }).find((x) => x.crop.id === 'aubergine');
  const mt = recommend({ date: new Date(2026, 5, 15), climate: montagne, history: [] }).find((x) => x.crop.id === 'aubergine');
  assert.ok(m, 'aubergine présente à Marseille');
  if (mt) assert.ok(mt.score < m!.score - 20);
});

test('le Sud sème le printemps plus tôt : laitue en place dès début mars à Marseille', () => {
  const d = new Date(2026, 2, 2);
  const m = recommend({ date: d, climate: marseille, history: [], includeAbri: false });
  const p = recommend({ date: d, climate: paris, history: [], includeAbri: false });
  assert.ok(m.some((x) => x.crop.id === 'laitue'));
  assert.ok(!p.some((x) => x.crop.id === 'laitue'));
});

test('tri décroissant', () => {
  const r = recommend({ date: new Date(2026, 3, 15), climate: paris, history: [{ cropId: 'chou-pomme', date: '2025-06-01' }] });
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].score >= r[i].score);
});
