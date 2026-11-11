import type { Crop, Demand, Family } from './types';

/*
 * Base de données des cultures potagères.
 *
 * Calendriers exprimés en QUINZAINES pour la zone de référence (Centre / Île-de-France) :
 *   1-2 janv. | 3-4 févr. | 5-6 mars | 7-8 avr. | 9-10 mai | 11-12 juin
 *   13-14 juil. | 15-16 août | 17-18 sept. | 19-20 oct. | 21-22 nov. | 23-24 déc.
 * Le moteur décale ces fenêtres selon la position GPS (voir climate.ts).
 *
 * Sources principales : fiches rotation et fumure Agrobio Bretagne / FNAB, ITAB, FiBL,
 * Bruxelles Environnement, FREDON, Académie d'agriculture (délais de retour), DRAAF
 * (classement des précédents « pauvres / moyens / riches »), calendriers de semis usuels.
 * Ce sont des ordres de grandeur : la météo de l'année et le microclimat priment.
 */

/** Délai de retour conseillé par famille (années). */
export const FAMILY_RETURN_YEARS: Record<Family, number> = {
  Solanacées: 4,
  Cucurbitacées: 3,
  Brassicacées: 4,
  Alliacées: 5,
  Apiacées: 4,
  Astéracées: 2,
  Amaranthacées: 3,
  Fabacées: 4,
  Valérianacées: 2,
  Poacées: 2,
  Convolvulacées: 3,
  Rosacées: 4,
  Hydrophyllacées: 1,
};

export const CROPS: Crop[] = [
  // ───────── Solanacées ─────────
  {
    id: 'tomate', name: 'Tomate', family: 'Solanacées', organ: 'fruit', demand: 'exigeant', root: 'profond',
    heat: 2, frostSensitive: true, cycleDays: 90, returnYears: 4,
    windows: [{ kind: 'abri', start: 5, end: 7 }, { kind: 'plantation', start: 10, end: 12 }],
    goodNeighbours: ['basilic', 'œillet d\'Inde', 'carotte', 'persil', 'poireau'],
    badNeighbours: ['pomme de terre', 'fenouil', 'concombre'],
    tip: 'Planter après les Saints de glace, tuteurer, arroser au pied (mildiou).',
  },
  {
    id: 'aubergine', name: 'Aubergine', family: 'Solanacées', organ: 'fruit', demand: 'exigeant', root: 'profond',
    heat: 3, frostSensitive: true, cycleDays: 100, returnYears: 4,
    windows: [{ kind: 'abri', start: 4, end: 6 }, { kind: 'plantation', start: 10, end: 11 }],
    goodNeighbours: ['haricot', 'œillet d\'Inde'], badNeighbours: ['pomme de terre'],
    tip: 'Très frileuse : emplacement le plus chaud et abrité de la planche.',
  },
  {
    id: 'poivron', name: 'Poivron / piment', family: 'Solanacées', organ: 'fruit', demand: 'exigeant', root: 'moyen',
    heat: 3, frostSensitive: true, cycleDays: 100, returnYears: 4,
    windows: [{ kind: 'abri', start: 4, end: 6 }, { kind: 'plantation', start: 10, end: 11 }],
    goodNeighbours: ['basilic', 'carotte'], badNeighbours: ['fenouil', 'haricot'],
  },
  {
    id: 'pomme-de-terre', name: 'Pomme de terre', family: 'Solanacées', organ: 'racine', demand: 'exigeant', root: 'moyen',
    heat: 2, frostSensitive: true, cycleDays: 100, returnYears: 4,
    windows: [{ kind: 'plantation', start: 7, end: 9 }],
    goodNeighbours: ['haricot', 'fève', 'chou', 'capucine'], badNeighbours: ['tomate', 'courge', 'concombre'],
    tip: 'Butter régulièrement ; ameublit le sol pour la culture suivante.',
  },

  // ───────── Cucurbitacées ─────────
  {
    id: 'courgette', name: 'Courgette', family: 'Cucurbitacées', organ: 'fruit', demand: 'exigeant', root: 'moyen',
    heat: 2, frostSensitive: true, cycleDays: 55, returnYears: 3,
    windows: [{ kind: 'abri', start: 7, end: 9 }, { kind: 'semis', start: 10, end: 11 }, { kind: 'plantation', start: 10, end: 12 }],
    goodNeighbours: ['haricot', 'maïs', 'capucine'], badNeighbours: ['pomme de terre'],
    tip: 'Un pied occupe ~1 m² ; pailler et apporter du compost.',
  },
  {
    id: 'courge', name: 'Courge / potiron', family: 'Cucurbitacées', organ: 'fruit', demand: 'exigeant', root: 'moyen',
    heat: 2, frostSensitive: true, cycleDays: 120, returnYears: 3,
    windows: [{ kind: 'abri', start: 8, end: 9 }, { kind: 'semis', start: 10, end: 11 }, { kind: 'plantation', start: 10, end: 11 }],
    goodNeighbours: ['maïs', 'haricot'], badNeighbours: ['pomme de terre'],
    tip: 'Peut pousser sur un tas de compost ; récolter avant les gelées.',
  },
  {
    id: 'concombre', name: 'Concombre / cornichon', family: 'Cucurbitacées', organ: 'fruit', demand: 'exigeant', root: 'superficiel',
    heat: 2, frostSensitive: true, cycleDays: 65, returnYears: 3,
    windows: [{ kind: 'abri', start: 7, end: 9 }, { kind: 'semis', start: 10, end: 11 }, { kind: 'plantation', start: 10, end: 12 }],
    goodNeighbours: ['haricot', 'laitue', 'aneth'], badNeighbours: ['tomate', 'pomme de terre'],
  },
  {
    id: 'melon', name: 'Melon', family: 'Cucurbitacées', organ: 'fruit', demand: 'exigeant', root: 'moyen',
    heat: 3, frostSensitive: true, cycleDays: 90, returnYears: 3,
    windows: [{ kind: 'abri', start: 7, end: 8 }, { kind: 'plantation', start: 10, end: 11 }],
    tip: 'Au nord de la Loire, préférer un tunnel ou un voile.',
  },

  // ───────── Brassicacées ─────────
  {
    id: 'chou-pomme', name: 'Chou pommé (été / automne)', family: 'Brassicacées', organ: 'feuille', demand: 'exigeant', root: 'moyen',
    heat: 1, frostSensitive: false, cycleDays: 100, returnYears: 4,
    windows: [{ kind: 'abri', start: 5, end: 6 }, { kind: 'semis', start: 7, end: 10 }, { kind: 'plantation', start: 9, end: 13 }],
    goodNeighbours: ['céleri', 'laitue', 'betterave', 'tomate (répulsif piéride)'], badNeighbours: ['fraisier'],
    tip: 'Filet anti-insectes contre piéride et altise. Excellent après une Fabacée.',
  },
  {
    id: 'chou-hiver', name: 'Chou d\'hiver (Milan, Bruxelles, kale)', family: 'Brassicacées', organ: 'feuille', demand: 'exigeant', root: 'moyen',
    heat: 1, frostSensitive: false, cycleDays: 150, returnYears: 4,
    windows: [{ kind: 'semis', start: 9, end: 11 }, { kind: 'plantation', start: 12, end: 14 }],
    goodNeighbours: ['céleri', 'laitue'], tip: 'Se récolte tout l\'hiver ; le gel améliore le goût.',
  },
  {
    id: 'chou-fleur', name: 'Chou-fleur', family: 'Brassicacées', organ: 'feuille', demand: 'exigeant', root: 'moyen',
    heat: 1, frostSensitive: false, cycleDays: 100, returnYears: 4,
    windows: [{ kind: 'abri', start: 5, end: 6 }, { kind: 'semis', start: 7, end: 10 }, { kind: 'plantation', start: 9, end: 13 }],
    goodNeighbours: ['céleri', 'laitue'], tip: 'Arrosages réguliers indispensables pour une belle pomme.',
  },
  {
    id: 'brocoli', name: 'Brocoli', family: 'Brassicacées', organ: 'feuille', demand: 'exigeant', root: 'moyen',
    heat: 1, frostSensitive: false, cycleDays: 80, returnYears: 4,
    windows: [{ kind: 'semis', start: 7, end: 12 }, { kind: 'plantation', start: 9, end: 15 }],
  },
  {
    id: 'chou-rave', name: 'Chou-rave', family: 'Brassicacées', organ: 'bulbe', demand: 'moyen', root: 'superficiel',
    heat: 1, frostSensitive: false, cycleDays: 60, returnYears: 4,
    windows: [{ kind: 'semis', start: 6, end: 14 }, { kind: 'plantation', start: 8, end: 15 }],
  },
  {
    id: 'radis', name: 'Radis rose', family: 'Brassicacées', organ: 'racine', demand: 'faible', root: 'superficiel',
    heat: 1, frostSensitive: false, cycleDays: 30, returnYears: 4,
    windows: [{ kind: 'semis', start: 5, end: 17 }],
    goodNeighbours: ['carotte', 'laitue', 'pois'], tip: 'Culture « bouche-trou » idéale entre deux cultures.',
  },
  {
    id: 'radis-noir', name: 'Radis d\'hiver (noir, daikon)', family: 'Brassicacées', organ: 'racine', demand: 'faible', root: 'profond',
    heat: 1, frostSensitive: false, cycleDays: 80, returnYears: 4,
    windows: [{ kind: 'semis', start: 13, end: 16 }],
  },
  {
    id: 'navet', name: 'Navet', family: 'Brassicacées', organ: 'racine', demand: 'moyen', root: 'moyen',
    heat: 1, frostSensitive: false, cycleDays: 60, returnYears: 4,
    windows: [{ kind: 'semis', start: 6, end: 8 }, { kind: 'semis', start: 14, end: 17 }],
    tip: 'Le semis d\'été (juillet-août) est le plus facile.',
  },
  {
    id: 'roquette', name: 'Roquette', family: 'Brassicacées', organ: 'feuille', demand: 'faible', root: 'superficiel',
    heat: 1, frostSensitive: false, cycleDays: 40, returnYears: 4,
    windows: [{ kind: 'semis', start: 6, end: 18 }],
  },

  // ───────── Alliacées ─────────
  {
    id: 'ail', name: 'Ail', family: 'Alliacées', organ: 'bulbe', demand: 'faible', root: 'superficiel',
    heat: 2, frostSensitive: false, cycleDays: 240, returnYears: 5,
    windows: [{ kind: 'plantation', start: 20, end: 4 }],
    goodNeighbours: ['carotte', 'fraisier', 'tomate', 'betterave'], badNeighbours: ['pois', 'haricot', 'fève'],
    tip: 'Pas de fumier frais. Ail violet/blanc à l\'automne, ail rose au printemps.',
  },
  {
    id: 'oignon', name: 'Oignon (bulbilles ou semis)', family: 'Alliacées', organ: 'bulbe', demand: 'faible', root: 'superficiel',
    heat: 2, frostSensitive: false, cycleDays: 140, returnYears: 5,
    windows: [{ kind: 'semis', start: 4, end: 6 }, { kind: 'plantation', start: 5, end: 7 }, { kind: 'semis', start: 16, end: 17 }],
    goodNeighbours: ['carotte', 'betterave', 'laitue', 'fraisier'], badNeighbours: ['pois', 'haricot', 'fève'],
  },
  {
    id: 'echalote', name: 'Échalote', family: 'Alliacées', organ: 'bulbe', demand: 'faible', root: 'superficiel',
    heat: 2, frostSensitive: false, cycleDays: 150, returnYears: 5,
    windows: [{ kind: 'plantation', start: 3, end: 6 }],
    goodNeighbours: ['carotte', 'betterave'], badNeighbours: ['pois', 'haricot'],
  },
  {
    id: 'poireau', name: 'Poireau', family: 'Alliacées', organ: 'feuille', demand: 'exigeant', root: 'superficiel',
    heat: 1, frostSensitive: false, cycleDays: 150, returnYears: 5,
    windows: [{ kind: 'abri', start: 4, end: 6 }, { kind: 'semis', start: 5, end: 9 }, { kind: 'plantation', start: 11, end: 14 }],
    goodNeighbours: ['carotte (répulsion croisée des mouches)', 'céleri', 'tomate'], badNeighbours: ['pois', 'haricot'],
    tip: 'Repiquer habillé (racines et feuilles raccourcies) dans des trous de 15 cm.',
  },

  // ───────── Apiacées ─────────
  {
    id: 'carotte', name: 'Carotte', family: 'Apiacées', organ: 'racine', demand: 'moyen', root: 'profond',
    heat: 2, frostSensitive: false, cycleDays: 100, returnYears: 4,
    windows: [{ kind: 'semis', start: 6, end: 14 }],
    goodNeighbours: ['poireau', 'oignon', 'radis', 'laitue'], badNeighbours: ['betterave'],
    tip: 'Sol meuble, sans cailloux ni fumier frais (racines fourchues).',
  },
  {
    id: 'panais', name: 'Panais', family: 'Apiacées', organ: 'racine', demand: 'moyen', root: 'profond',
    heat: 1, frostSensitive: false, cycleDays: 180, returnYears: 4,
    windows: [{ kind: 'semis', start: 6, end: 10 }], tip: 'Graines peu durables : utiliser des semences de l\'année.',
  },
  {
    id: 'celeri', name: 'Céleri (rave ou branche)', family: 'Apiacées', organ: 'feuille', demand: 'exigeant', root: 'superficiel',
    heat: 2, frostSensitive: true, cycleDays: 140, returnYears: 4,
    windows: [{ kind: 'abri', start: 5, end: 7 }, { kind: 'plantation', start: 10, end: 12 }],
    goodNeighbours: ['poireau', 'chou', 'tomate'], tip: 'Très gourmand en eau.',
  },
  {
    id: 'persil', name: 'Persil', family: 'Apiacées', organ: 'feuille', demand: 'faible', root: 'moyen',
    heat: 2, frostSensitive: false, cycleDays: 75, returnYears: 4,
    windows: [{ kind: 'semis', start: 5, end: 15 }], goodNeighbours: ['tomate', 'asperge'],
  },
  {
    id: 'fenouil', name: 'Fenouil bulbe', family: 'Apiacées', organ: 'bulbe', demand: 'moyen', root: 'moyen',
    heat: 2, frostSensitive: true, cycleDays: 90, returnYears: 4,
    windows: [{ kind: 'semis', start: 11, end: 14 }, { kind: 'plantation', start: 13, end: 15 }],
    badNeighbours: ['tomate', 'haricot'], tip: 'Semé avant juin, il monte en graine.',
  },

  // ───────── Astéracées ─────────
  {
    id: 'laitue', name: 'Laitue', family: 'Astéracées', organ: 'feuille', demand: 'moyen', root: 'superficiel',
    heat: 1, frostSensitive: true, cycleDays: 60, returnYears: 2,
    windows: [{ kind: 'abri', start: 3, end: 6 }, { kind: 'semis', start: 6, end: 16 }, { kind: 'plantation', start: 6, end: 17 }],
    goodNeighbours: ['carotte', 'radis', 'chou', 'concombre', 'poireau'],
    tip: 'Semis échelonnés toutes les 3 semaines ; variétés d\'été résistantes à la montaison.',
  },
  {
    id: 'chicoree', name: 'Chicorée (frisée, scarole)', family: 'Astéracées', organ: 'feuille', demand: 'moyen', root: 'moyen',
    heat: 1, frostSensitive: true, cycleDays: 90, returnYears: 2,
    windows: [{ kind: 'semis', start: 11, end: 14 }, { kind: 'plantation', start: 13, end: 16 }],
  },
  {
    id: 'artichaut', name: 'Artichaut (vivace)', family: 'Astéracées', organ: 'fruit', demand: 'exigeant', root: 'profond',
    heat: 2, frostSensitive: false, cycleDays: 365, returnYears: 3,
    windows: [{ kind: 'plantation', start: 7, end: 9 }],
    tip: 'Occupe la planche 3-4 ans. Protéger la souche en hiver hors climat doux.',
  },

  // ───────── Amaranthacées (ex-Chénopodiacées) ─────────
  {
    id: 'betterave', name: 'Betterave', family: 'Amaranthacées', organ: 'racine', demand: 'moyen', root: 'profond',
    heat: 2, frostSensitive: false, cycleDays: 90, returnYears: 3,
    windows: [{ kind: 'semis', start: 8, end: 13 }],
    goodNeighbours: ['oignon', 'laitue', 'chou'], badNeighbours: ['carotte', 'épinard'],
  },
  {
    id: 'blette', name: 'Blette (poirée)', family: 'Amaranthacées', organ: 'feuille', demand: 'moyen', root: 'profond',
    heat: 2, frostSensitive: false, cycleDays: 70, returnYears: 3,
    windows: [{ kind: 'semis', start: 8, end: 13 }],
  },
  {
    id: 'epinard', name: 'Épinard', family: 'Amaranthacées', organ: 'feuille', demand: 'moyen', root: 'superficiel',
    heat: 1, frostSensitive: false, cycleDays: 50, returnYears: 3,
    windows: [{ kind: 'semis', start: 5, end: 8 }, { kind: 'semis', start: 16, end: 19 }],
    tip: 'Monte en graine avec la chaleur et les jours longs : semer au printemps ou en fin d\'été.',
  },

  // ───────── Fabacées (légumineuses) ─────────
  {
    id: 'haricot', name: 'Haricot', family: 'Fabacées', organ: 'graine', demand: 'améliorant', root: 'moyen',
    heat: 2, frostSensitive: true, cycleDays: 70, returnYears: 3,
    windows: [{ kind: 'semis', start: 10, end: 14 }],
    goodNeighbours: ['pomme de terre', 'courgette', 'maïs', 'carotte'], badNeighbours: ['ail', 'oignon', 'poireau', 'fenouil'],
    tip: 'Semer quand le sol dépasse 12 °C. Laisser les racines en terre après récolte (azote).',
  },
  {
    id: 'pois', name: 'Pois', family: 'Fabacées', organ: 'graine', demand: 'améliorant', root: 'moyen',
    heat: 1, frostSensitive: false, cycleDays: 90, returnYears: 5,
    windows: [{ kind: 'semis', start: 3, end: 8 }],
    goodNeighbours: ['carotte', 'radis', 'navet', 'laitue'], badNeighbours: ['ail', 'oignon', 'échalote'],
    tip: 'Retour espacé (≥ 5 ans) à cause de la pourriture racinaire (Aphanomyces).',
  },
  {
    id: 'feve', name: 'Fève', family: 'Fabacées', organ: 'graine', demand: 'améliorant', root: 'profond',
    heat: 1, frostSensitive: false, cycleDays: 120, returnYears: 4,
    windows: [{ kind: 'semis', start: 3, end: 5 }, { kind: 'semis', start: 21, end: 22 }],
    badNeighbours: ['ail', 'oignon'], tip: 'Semis d\'automne réservé aux hivers doux ; pincer les têtes contre les pucerons.',
  },

  // ───────── Autres familles ─────────
  {
    id: 'mache', name: 'Mâche', family: 'Valérianacées', organ: 'feuille', demand: 'faible', root: 'superficiel',
    heat: 1, frostSensitive: false, cycleDays: 70, returnYears: 2,
    windows: [{ kind: 'semis', start: 15, end: 18 }], tip: 'Semer sur sol tassé, sans le retourner après la culture précédente.',
  },
  {
    id: 'mais', name: 'Maïs doux', family: 'Poacées', organ: 'graine', demand: 'exigeant', root: 'profond',
    heat: 2, frostSensitive: true, cycleDays: 100, returnYears: 2,
    windows: [{ kind: 'abri', start: 9, end: 9 }, { kind: 'semis', start: 10, end: 11 }],
    goodNeighbours: ['haricot', 'courge (les « trois sœurs »)'], tip: 'Planter en carré (≥ 4 rangs) pour la pollinisation.',
  },
  {
    id: 'patate-douce', name: 'Patate douce', family: 'Convolvulacées', organ: 'racine', demand: 'moyen', root: 'moyen',
    heat: 3, frostSensitive: true, cycleDays: 140, returnYears: 3,
    windows: [{ kind: 'plantation', start: 10, end: 11 }], tip: 'Exige un été chaud ; paillage noir conseillé au nord.',
  },
  {
    id: 'fraisier', name: 'Fraisier', family: 'Rosacées', organ: 'fruit', demand: 'moyen', root: 'superficiel',
    heat: 2, frostSensitive: false, cycleDays: 270, returnYears: 4,
    windows: [{ kind: 'plantation', start: 16, end: 19 }, { kind: 'plantation', start: 6, end: 7 }],
    goodNeighbours: ['ail', 'oignon', 'épinard'], badNeighbours: ['chou'],
    tip: 'Reste 3 ans en place ; un engrais vert ensuite régénère la planche.',
  },

  // ───────── Engrais verts ─────────
  {
    id: 'phacelie', name: 'Engrais vert : phacélie', family: 'Hydrophyllacées', organ: 'engrais vert', demand: 'améliorant', root: 'moyen',
    heat: 2, frostSensitive: false, cycleDays: 60, returnYears: 1,
    windows: [{ kind: 'semis', start: 6, end: 17 }],
    tip: 'Aucune famille légumière : neutre pour la rotation. Couvre le sol, attire les pollinisateurs.',
  },
  {
    id: 'seigle-vesce', name: 'Engrais vert : seigle + vesce', family: 'Fabacées', organ: 'engrais vert', demand: 'améliorant', root: 'profond',
    heat: 1, frostSensitive: false, cycleDays: 180, returnYears: 2,
    windows: [{ kind: 'semis', start: 18, end: 21 }],
    tip: 'Couvert d\'hiver : protège le sol, la vesce fixe l\'azote pour une culture exigeante au printemps.',
  },
];

/** Précédents « non-légumes » qu'on peut renseigner dans l'historique d'une planche. */
export interface SpecialPrecedent {
  id: string;
  name: string;
  family?: Family;
  demand: Demand;
}

export const SPECIAL_PRECEDENTS: SpecialPrecedent[] = [
  { id: 'sol-nu', name: 'Sol nu / jachère courte', demand: 'faible' },
  { id: 'prairie', name: 'Prairie / gazon retourné', family: 'Poacées', demand: 'faible' },
  { id: 'engrais-vert-legumineuse', name: 'Engrais vert légumineux (trèfle, vesce…)', family: 'Fabacées', demand: 'améliorant' },
  { id: 'engrais-vert', name: 'Engrais vert non légumineux (phacélie, sarrasin…)', demand: 'améliorant' },
  { id: 'compost', name: 'Planche fraîchement amendée (compost / fumier)', demand: 'améliorant' },
];

export const cropById = (id: string): Crop | undefined => CROPS.find((c) => c.id === id);

export const precedentInfo = (
  id: string,
): { name: string; family?: Family; demand: Demand; crop?: Crop } | undefined => {
  const crop = cropById(id);
  if (crop) return { name: crop.name, family: crop.family, demand: crop.demand, crop };
  const s = SPECIAL_PRECEDENTS.find((p) => p.id === id);
  return s ? { name: s.name, family: s.family, demand: s.demand } : undefined;
};
