// Génère le texte de la release GitHub à partir de src/releaseNotes.ts.
// Usage : npx tsx scripts/release-body.ts 1.2.0
import { RELEASE_NOTES } from '../src/releaseNotes';

const version = (process.argv[2] ?? '').replace(/^v/, '');
const entry = RELEASE_NOTES.find((n) => n.version === version);
if (entry) {
  console.log(entry.notes.map((n) => `- ${n}`).join('\n'));
  console.log('\n**Android** : téléchargez le fichier `.apk` ci-dessous et ouvrez-le sur le téléphone.');
} else {
  console.error(`Aucune note pour la version ${version} dans src/releaseNotes.ts`);
  process.exitCode = 1;
}
