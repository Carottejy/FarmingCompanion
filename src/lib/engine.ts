import { CROPS, precedentInfo } from './crops';
import { dayOfYear, doyToLabel } from './climate';
import type {
  ActionKind,
  ClimateProfile,
  Crop,
  HistoryEntry,
  Reason,
  Recommendation,
  Verdict,
  Window,
} from './types';

/*
 * Moteur de recommandation.
 *
 * Pour une date et une planche, chaque culture reçoit un score (0–100) :
 *   base 50
 *   + saison : la date tombe-t-elle dans une fenêtre de semis/plantation (décalée selon le climat) ?
 *   + rotation : même famille que le précédent (fort malus) ou revenue trop tôt dans l'historique
 *   + succession des exigences : gourmand → moyen → frugal → améliorant (légumineuse / engrais vert)
 *   + alternance des organes (fruit / racine / feuille / graine) et des profondeurs racinaires
 *   + règles spécifiques (choux après légumineuse, taupins après prairie, fumier frais et carottes…)
 *   + adaptation climatique (besoin de chaleur) et temps de culture avant les premières gelées
 * Seules les cultures dont une fenêtre est ouverte à la date choisie sont proposées.
 */

const HALF_MONTH_DAYS = 365.25 / 24;

/** Position continue dans l'année en quinzaines : 0 ≤ p < 24. La quinzaine i couvre [i-1, i). */
export function halfMonthPosition(doy: number): number {
  return ((doy - 1) / 365.25) * 24;
}

const mod24 = (x: number) => ((x % 24) + 24) % 24;

/**
 * Décalage (en quinzaines) du début et de la fin d'une fenêtre selon le climat.
 * - Climat plus froid (offset > 0) : la saison raccourcit des deux côtés
 *   (printemps plus tardif, automne plus précoce).
 * - Climat plus doux (offset < 0) : la saison s'allonge — on commence plus tôt au printemps
 *   et on finit plus tard à l'automne, l'autre borne ne bougeant que légèrement.
 */
export function windowShifts(w: Window, offsetDays: number): { start: number; end: number } {
  const autumn = w.start > w.end || w.start >= 15;
  const h = offsetDays / HALF_MONTH_DAYS;
  if (!autumn) return { start: h, end: h > 0 ? h : h * 0.3 };
  return { start: h > 0 ? -h : -h * 0.3, end: -h };
}

/**
 * Renvoie la « centralité » (0 = au bord, 1 = au centre) si la date est dans la fenêtre, sinon null.
 */
export function windowFit(w: Window, pos: number, offsetDays: number): number | null {
  const s = windowShifts(w, offsetDays);
  const start = w.start - 1 + s.start;
  const end = w.end + s.end;
  const len = mod24(end - start) || 24; // longueur en quinzaines (gère le passage du 1er janvier)
  if (end - start <= 0 && w.start <= w.end) return null; // fenêtre « écrasée » par un climat très froid
  const into = mod24(pos - start);
  if (into >= len) return null;
  const half = len / 2;
  return 1 - Math.abs(into - half) / half;
}

/** Début (jour de l'année) de la prochaine fenêtre de plantation/semis en place après la date. */
function nextFieldWindowLabel(crop: Crop, pos: number, offsetDays: number): string | null {
  let best: number | null = null;
  for (const w of crop.windows) {
    if (w.kind === 'abri') continue;
    const s = mod24(w.start - 1 + windowShifts(w, offsetDays).start);
    const ahead = mod24(s - pos);
    if (best === null || ahead < best) best = ahead;
  }
  if (best === null) return null;
  const doy = ((pos + best) / 24) * 365.25 + 1;
  return doyToLabel(doy > 365 ? doy - 365 : doy);
}

export interface RecommendInput {
  date: Date;
  climate: ClimateProfile;
  /** Historique de la planche (ordre quelconque). */
  history: HistoryEntry[];
  /** Inclure les semis sous abri (qui n'occupent pas encore la planche). */
  includeAbri?: boolean;
  crops?: Crop[];
}

const ACTION_PRIORITY: Record<ActionKind, number> = { plantation: 2, semis: 2, abri: 0 };

export function verdictFor(score: number): Verdict {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Bon';
  if (score >= 45) return 'Possible';
  return 'Déconseillé';
}

export function recommend(input: RecommendInput): Recommendation[] {
  const { date, climate, includeAbri = true } = input;
  const crops = input.crops ?? CROPS;
  const doy = dayOfYear(date);
  const pos = halfMonthPosition(doy);
  const history = [...input.history].sort((a, b) => b.date.localeCompare(a.date));
  const previous = history[0];
  const prevInfo = previous ? precedentInfo(previous.cropId) : undefined;

  const results: Recommendation[] = [];

  for (const crop of crops) {
    // 1) Saison
    let bestAction: ActionKind | null = null;
    let bestFit = -1;
    for (const w of crop.windows) {
      if (w.kind === 'abri' && !includeAbri) continue;
      const fit = windowFit(w, pos, climate.offsetDays);
      if (fit === null) continue;
      const better =
        bestAction === null ||
        ACTION_PRIORITY[w.kind] > ACTION_PRIORITY[bestAction] ||
        (ACTION_PRIORITY[w.kind] === ACTION_PRIORITY[bestAction] && fit > bestFit);
      if (better) {
        bestAction = w.kind;
        bestFit = fit;
      }
    }
    if (bestAction === null) continue;

    const reasons: Reason[] = [];
    let score = 50;
    const add = (delta: number, text: string) => {
      score += delta;
      reasons.push({ delta, text });
    };

    if (bestAction === 'abri') {
      const when = nextFieldWindowLabel(crop, pos, climate.offsetDays);
      add(-4, `Semis sous abri / en godets maintenant${when ? `, mise en place vers le ${when}` : ''} : la planche reste libre d'ici là.`);
    } else {
      const s = Math.round(4 + 8 * bestFit);
      add(s, bestFit > 0.5 ? 'En plein dans la période idéale pour votre zone.' : 'Dans la période possible (début ou fin de saison).');
    }

    // 2) Rotation — familles
    if (previous && prevInfo) {
      if (prevInfo.family && prevInfo.family === crop.family) {
        add(-45, `Même famille (${crop.family}) que la culture précédente : maladies et ravageurs du sol s'accumulent.`);
        if (previous.cropId === crop.id) add(-10, 'Même légume deux fois de suite.');
      }
    }
    for (const h of history.slice(previous ? 1 : 0)) {
      const info = precedentInfo(h.cropId);
      if (!info?.family || info.family !== crop.family) continue;
      const years = (date.getTime() - new Date(h.date).getTime()) / (365.25 * 86400000);
      if (years < crop.returnYears) {
        const p = Math.round(30 * (1 - years / crop.returnYears)) + 5;
        add(-p, `${info.name} (${crop.family}) cultivé il y a ${years < 1 ? 'moins d\'un an' : `${Math.floor(years)} an(s)`} : attendre ${crop.returnYears} ans pour cette famille.`);
        break; // un seul malus d'historique (le plus récent)
      }
    }

    if (previous && prevInfo) {
      // 3) Succession des exigences
      const pd = prevInfo.demand;
      const cd = crop.demand;
      if (pd === 'exigeant') {
        if (cd === 'exigeant') add(-12, `Deux cultures gourmandes à la suite (${prevInfo.name} → ${crop.name}) : le sol s'épuise, il faudrait un gros apport de compost.`);
        if (cd === 'moyen') add(6, 'Moyennement exigeant après une culture gourmande : bonne succession.');
        if (cd === 'faible') add(8, 'Légume frugal après une culture gourmande : il valorise les reliquats sans fumure.');
        if (cd === 'améliorant') add(10, 'Légumineuse / engrais vert après une gourmande : régénère la planche.');
      } else if (pd === 'moyen') {
        if (cd === 'faible') add(5, 'Légume frugal après une culture moyennement exigeante : succession classique.');
        if (cd === 'améliorant') add(6, 'Légumineuse / engrais vert : prépare la planche pour une culture gourmande.');
        if (cd === 'exigeant') add(-3, 'Culture gourmande : prévoir un apport de compost mûr avant la mise en place.');
      } else if (pd === 'faible') {
        if (cd === 'améliorant') add(6, 'Fin de cycle de rotation : légumineuse ou engrais vert pour recharger le sol.');
        if (cd === 'exigeant') add(2, 'Culture gourmande possible avec un bon apport de compost (début d\'un nouveau cycle).');
      } else if (pd === 'améliorant') {
        if (previous.cropId === 'compost') {
          if (cd === 'exigeant') add(14, 'Planche fraîchement amendée : idéale pour une tête de rotation gourmande.');
          if (crop.organ === 'racine' || crop.family === 'Alliacées')
            add(-12, 'Matière organique fraîche : racines fourchues, et les Alliacées la supportent mal.');
        } else {
          if (cd === 'exigeant') add(14, `Profite de l'azote laissé par ${prevInfo.name}.`);
          if (cd === 'moyen') add(6, `Bénéficie de la structure et de l'azote laissés par ${prevInfo.name}.`);
        }
      }

      // 4) Alternance des organes et des profondeurs
      const pc = prevInfo.crop;
      if (pc && pc.organ !== 'engrais vert' && crop.organ !== 'engrais vert') {
        if (pc.organ !== crop.organ) add(6, `Alternance ${pc.organ} → ${crop.organ}.`);
        else add(-6, `Même type de légume (${crop.organ}) que la culture précédente.`);
        if (pc.root !== crop.root) add(4, `Enracinement ${crop.root} après ${pc.root} : le sol est exploré à une autre profondeur.`);
      }

      // 5) Règles spécifiques de précédents
      if (prevInfo.family === 'Fabacées' && crop.family === 'Brassicacées' && crop.demand === 'exigeant')
        add(4, 'Classique des maraîchers : les choux après une légumineuse.');
      if (prevInfo.family === 'Brassicacées' && crop.id === 'pomme-de-terre')
        add(5, 'Les résidus de choux (glucosinolates) limitent la gale commune de la pomme de terre.');
      if ((previous.cropId === 'prairie' || prevInfo.family === 'Poacées') && (crop.id === 'pomme-de-terre' || crop.id === 'carotte'))
        add(-10, 'Après prairie ou céréale : risque élevé de taupins (larves) dans les racines et tubercules.');
    }

    // 6) Climat
    const diff = crop.heat - climate.warmth;
    if (diff >= 2) add(-25, 'Exige beaucoup de chaleur : peu adapté à votre climat, sauf sous tunnel.');
    else if (diff === 1) add(crop.heat === 3 ? -10 : -5, crop.heat === 3 ? 'Frileux : réservez-lui l\'endroit le plus chaud, voile ou tunnel conseillé.' : 'Été un peu frais pour cette culture : choisir des variétés précoces.');
    else if (crop.heat === 3 && climate.warmth === 3) add(5, 'Votre climat chaud lui convient parfaitement.');
    if (crop.heat === 1 && climate.warmth === 3 && pos >= 9 && pos < 16)
      add(-8, 'Craint la chaleur estivale de votre zone : mi-ombre et arrosage, ou attendre la fin de l\'été.');

    // 7) Gelées
    if (crop.frostSensitive) {
      const start = bestAction === 'abri' ? doy + 45 : doy;
      const harvest = start + crop.cycleDays;
      if (harvest > climate.firstFrostDoy) add(-30, `Récolte prévue après les premières gelées estimées (~${doyToLabel(climate.firstFrostDoy)}).`);
      else if (harvest > climate.firstFrostDoy - 20) add(-8, 'Récolte juste avant les premières gelées : choisir une variété rapide.');
      if (bestAction !== 'abri' && doy < climate.lastFrostDoy + 20)
        add(-6, `Gelées tardives encore possibles (moyenne ~${doyToLabel(climate.lastFrostDoy)}) : garder un voile d'hivernage à portée.`);
    }

    if (!previous) reasons.push({ delta: 0, text: 'Renseignez la culture précédente de la planche pour affiner la recommandation.' });

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    results.push({ crop, score: finalScore, verdict: verdictFor(finalScore), action: bestAction, reasons });
  }

  return results.sort(
    (a, b) => b.score - a.score || ACTION_PRIORITY[b.action] - ACTION_PRIORITY[a.action] || a.crop.name.localeCompare(b.crop.name, 'fr'),
  );
}

export const ACTION_LABEL: Record<ActionKind, string> = {
  abri: 'Semis sous abri',
  semis: 'Semis en place',
  plantation: 'Plantation',
};
