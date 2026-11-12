import { cropById } from './crops';

/*
 * Dates « calendaires » au format YYYY-MM-DD, manipulées en heure locale
 * (pas de décalage de fuseau : un semis du 12 novembre reste le 12 novembre).
 */

const pad = (n: number) => String(n).padStart(2, '0');

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1, 12); // midi : à l'abri des changements d'heure
}

export function todayIso(): string {
  return toIso(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = fromIso(iso);
  d.setDate(d.getDate() + days);
  return toIso(d);
}

export function daysBetween(fromIsoDate: string, toIsoDate: string): number {
  return Math.round((fromIso(toIsoDate).getTime() - fromIso(fromIsoDate).getTime()) / 86400000);
}

export function formatDate(iso: string, withYear = true): string {
  return fromIso(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

/** Récolte prévisionnelle = date de semis/plantation + durée de culture de la base. */
export function estimateHarvest(cropId: string, sownIso: string): string {
  const crop = cropById(cropId);
  return addDays(sownIso, crop?.cycleDays ?? 90);
}

export interface Progress {
  /** 0 → 1 entre la mise en place et la récolte prévue. */
  ratio: number;
  /** Jours restants avant la récolte prévue (négatif si dépassée). */
  daysLeft: number;
  label: string;
}

export function cropProgress(sownIso: string, harvestIso: string, today = todayIso()): Progress {
  const total = Math.max(1, daysBetween(sownIso, harvestIso));
  const elapsed = daysBetween(sownIso, today);
  const daysLeft = daysBetween(today, harvestIso);
  const ratio = Math.min(1, Math.max(0, elapsed / total));
  let label: string;
  if (elapsed < 0) label = `Mise en place dans ${-elapsed} j`;
  else if (daysLeft > 0) label = `Récolte dans ${daysLeft} j`;
  else if (daysLeft === 0) label = 'Récolte prévue aujourd\'hui';
  else label = `Récolte prévue dépassée de ${-daysLeft} j`;
  return { ratio, daysLeft, label };
}
