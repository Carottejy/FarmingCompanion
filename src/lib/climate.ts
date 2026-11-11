import type { ClimateProfile, ClimateZone, Heat, Location } from './types';

/*
 * Estimation du climat à partir d'un point GPS.
 *
 * 1) Décalage phénologique par la loi bioclimatique de Hopkins : à latitude, longitude et
 *    altitude croissantes, les stades du printemps arrivent plus tard d'environ 4 jours
 *    par degré de latitude (vers le nord), par 5° de longitude (vers l'est) et par 122 m
 *    (400 pieds) d'altitude. Référence : Paris (48,85 N ; 2,35 E ; 35 m), qui sert de base
 *    aux calendriers de crops.ts.
 * 2) Zone climatique française (heuristique géographique) pour corriger l'effet de la
 *    mer et du relief, que Hopkins ne voit pas.
 * L'utilisateur peut forcer la zone et le décalage dans les Paramètres.
 */

const REF = { latitude: 48.85, longitude: 2.35, altitude: 35 };
/** Dernières / premières gelées moyennes à la référence (jours de l'année). */
const REF_LAST_FROST_DOY = 100; // ~10 avril
const REF_FIRST_FROST_DOY = 309; // ~5 novembre

export const ZONES: ClimateZone[] = ['méditerranéen', 'océanique', 'semi-océanique', 'continental', 'montagnard'];

export function hopkinsOffsetDays(loc: Location): number {
  const alt = loc.altitude ?? REF.altitude;
  return (
    4 * (loc.latitude - REF.latitude) +
    4 * ((loc.longitude - REF.longitude) / 5) +
    4 * ((alt - REF.altitude) / 122)
  );
}

export function detectZone(loc: Location): ClimateZone {
  const { latitude: lat, longitude: lon } = loc;
  const alt = loc.altitude ?? 0;
  if (alt >= 800) return 'montagnard';
  const corse = lat < 43.1 && lon > 8.5;
  const littoralMed = (lat < 44.3 && lon > 3.0 && lon < 7.8) || (lat < 43.2 && lon > 2.0 && lon <= 3.0);
  if ((corse || littoralMed) && alt < 500) return 'méditerranéen';
  if (lon < -0.5 || (lat > 49.4 && lon < 2.0)) return 'océanique';
  if (lon > 4.5) return 'continental';
  return 'semi-océanique';
}

/** Correction (jours) propre à la zone, en plus de Hopkins. */
const ZONE_CORRECTION: Record<ClimateZone, number> = {
  méditerranéen: -8, // hivers doux, printemps précoce au-delà de ce que prédit la latitude
  océanique: -5, // influence de la mer : peu de gelées
  'semi-océanique': 0,
  continental: 5, // hivers froids, gelées tardives
  montagnard: 5,
};

export function zoneWarmth(zone: ClimateZone, loc?: Location): Heat {
  if (zone === 'méditerranéen') return 3;
  if (zone === 'montagnard') return 1;
  if ((loc?.altitude ?? 0) > 500) return 1;
  // Littoral breton / normand : étés frais
  if (zone === 'océanique' && loc && loc.latitude > 47) return 1;
  // Sud-Ouest / vallée du Rhône hors littoral : étés chauds
  if (loc && loc.latitude < 45) return 3;
  return 2;
}

export function buildClimateProfile(
  loc: Location,
  overrides?: { zone?: ClimateZone | null; offsetDays?: number | null },
): ClimateProfile {
  const zone = overrides?.zone ?? detectZone(loc);
  const computed = hopkinsOffsetDays(loc) + ZONE_CORRECTION[zone];
  const offsetDays = Math.round(
    overrides?.offsetDays ?? Math.max(-45, Math.min(60, computed)),
  );
  return {
    zone,
    offsetDays,
    lastFrostDoy: REF_LAST_FROST_DOY + offsetDays,
    firstFrostDoy: REF_FIRST_FROST_DOY - offsetDays,
    warmth: zoneWarmth(zone, loc),
  };
}

/** Profil par défaut (référence Paris) tant qu'aucun point GPS n'est configuré. */
export const DEFAULT_LOCATION: Location = { ...REF };

export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  const now = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((now - start) / 86400000) + 1;
}

export function doyToLabel(doy: number): string {
  const d = new Date(Date.UTC(2025, 0, 1) + (Math.round(doy) - 1) * 86400000);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}
