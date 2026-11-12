// Types partagés du moteur agronomique (indépendants de React Native → testables en Node).

/** Familles botaniques utilisées pour la rotation. */
export type Family =
  | 'Solanacées'
  | 'Cucurbitacées'
  | 'Brassicacées'
  | 'Alliacées'
  | 'Apiacées'
  | 'Astéracées'
  | 'Amaranthacées'
  | 'Fabacées'
  | 'Valérianacées'
  | 'Poacées'
  | 'Convolvulacées'
  | 'Rosacées'
  | 'Hydrophyllacées';

/** Partie consommée — sert à l'alternance fruit / racine / feuille / graine. */
export type Organ = 'fruit' | 'racine' | 'feuille' | 'bulbe' | 'graine' | 'engrais vert';

/**
 * Exigence en fumure (classement des maraîchers bio) :
 * - exigeant : « tête de rotation », vient après un apport de compost/fumier (choux, courges, tomates, poireaux…)
 * - moyen    : racines et feuilles (carotte, betterave, salade…)
 * - faible   : légumes frugaux (ail, oignon, radis, mâche…)
 * - améliorant : fixe l'azote ou régénère le sol (Fabacées, engrais verts)
 */
export type Demand = 'exigeant' | 'moyen' | 'faible' | 'améliorant';

export type RootDepth = 'superficiel' | 'moyen' | 'profond';

/** Besoin de chaleur : 1 = aime la fraîcheur, 2 = tempéré, 3 = très frileux / exige de la chaleur. */
export type Heat = 1 | 2 | 3;

/** Type d'opération dans le calendrier. */
export type ActionKind = 'abri' | 'semis' | 'plantation';

/**
 * Fenêtre du calendrier en quinzaines (1 = 1–15 janvier, 2 = 16–31 janvier, …, 24 = 16–31 décembre).
 * Si start > end, la fenêtre chevauche le 1er janvier (ex. ail : 20 → 4).
 * Les fenêtres sont données pour la zone de référence (Centre / Île-de-France, climat semi-océanique).
 */
export interface Window {
  kind: ActionKind;
  start: number;
  end: number;
}

export interface Crop {
  id: string;
  name: string;
  family: Family;
  organ: Organ;
  demand: Demand;
  root: RootDepth;
  heat: Heat;
  /** Sensible au gel : la culture doit être récoltée avant les premières gelées. */
  frostSensitive: boolean;
  /** Jours entre semis en place / plantation et début de récolte (ordre de grandeur). */
  cycleDays: number;
  /** Délai minimal (années) avant de revenir avec la même famille sur la même planche. */
  returnYears: number;
  windows: Window[];
  goodNeighbours?: string[];
  badNeighbours?: string[];
  tip?: string;
}

export type ClimateZone = 'méditerranéen' | 'océanique' | 'semi-océanique' | 'continental' | 'montagnard';

export interface Location {
  latitude: number;
  longitude: number;
  /** Altitude en mètres (optionnelle). */
  altitude?: number;
}

export interface ClimateProfile {
  zone: ClimateZone;
  /** Décalage (jours) du printemps par rapport à la référence. Positif = plus tardif. */
  offsetDays: number;
  /** Date moyenne estimée des dernières gelées (jour de l'année). */
  lastFrostDoy: number;
  /** Date moyenne estimée des premières gelées (jour de l'année). */
  firstFrostDoy: number;
  /** Chaleur estivale disponible (1 à 3). */
  warmth: Heat;
}

/** Entrée d'historique d'une planche. */
export interface HistoryEntry {
  /** Identifiant de culture (voir crops.ts) ou d'un précédent spécial (voir SPECIAL_PRECEDENTS). */
  cropId: string;
  /** Date de mise en place, ISO (YYYY-MM-DD). */
  date: string;
}

/** Culture actuellement en place sur une planche. */
export interface CurrentCrop {
  cropId: string;
  /** Date de semis ou de plantation sur la planche (YYYY-MM-DD). */
  sownDate: string;
  /** Date de récolte prévisionnelle (YYYY-MM-DD), estimée puis ajustable. */
  harvestDate: string;
}

export interface Planche {
  id: string;
  name: string;
  history: HistoryEntry[];
  current?: CurrentCrop | null;
  notes?: string;
}

export type Verdict = 'Excellent' | 'Bon' | 'Possible' | 'Déconseillé';

export interface Reason {
  delta: number;
  text: string;
}

export interface Recommendation {
  crop: Crop;
  score: number;
  verdict: Verdict;
  action: ActionKind;
  reasons: Reason[];
}
