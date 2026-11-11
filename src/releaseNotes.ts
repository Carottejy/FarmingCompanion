/**
 * Notes de version embarquées dans l'application (affichées hors connexion).
 * À chaque nouvelle version : ajouter une entrée en tête ET mettre à jour "version" dans app.json
 * et package.json, puis pousser un tag vX.Y.Z (le workflow GitHub publie l'APK).
 */
export interface ReleaseNote {
  version: string;
  date: string;
  notes: string[];
}

export const RELEASE_NOTES: ReleaseNote[] = [
  {
    version: '1.2.0',
    date: '2026-11-11',
    notes: [
      'Planches : bouton « Conseils après … » qui ouvre l\'onglet Conseils avec la planche et sa dernière culture déjà sélectionnées.',
    ],
  },
  {
    version: '1.1.1',
    date: '2026-11-11',
    notes: [
      'Correctif : le réglage propre à la web app n\'est plus appliqué aux applications Android et iOS (emplacement des images).',
    ],
  },
  {
    version: '1.1.0',
    date: '2026-11-11',
    notes: [
      'iPhone : web app installable sur l\'écran d\'accueil, qui fonctionne entièrement hors ligne (carottejy.github.io/FarmingCompanion).',
      'Nouvelle icône carotte.',
      'Message clair quand la recherche de mise à jour est impossible faute de réseau.',
      'Suppression d\'une planche possible dans la version web.',
    ],
  },
  {
    version: '1.0.1',
    date: '2026-11-11',
    notes: [
      'APK Android environ 3 fois plus léger (téléphones arm64 uniquement).',
      'Clé de signature définitive : les prochaines mises à jour s\'installeront par-dessus sans désinstaller.',
      'iPhone : application vérifiée sur iOS, clavier des coordonnées GPS avec signe moins.',
    ],
  },
  {
    version: '1.0.0',
    date: '2026-11-11',
    notes: [
      'Première version de FarmingCompanion.',
      'Onglet Conseils : cultures classées de la meilleure à la moins adaptée selon la zone GPS, la date et le précédent de la planche.',
      'Onglet Planches : gestion des planches et de leur historique de cultures (contrôle des délais de retour par famille).',
      'Onglet Paramètres : position GPS (automatique ou manuelle), zone climatique et décalage du calendrier.',
      'Onglet À propos : version, recherche de mise à jour et notes de version.',
    ],
  },
];
