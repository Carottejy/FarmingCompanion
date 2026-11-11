# 🥕 FarmingCompanion

Application mobile (Android et iPhone) pour les jardiniers de **jardins partagés** qui cultivent des **planches** :
elle propose les légumes à semer ou planter, **classés du plus adapté au moins adapté**, en fonction :

- de la **zone géographique** (point GPS configuré dans les Paramètres) ;
- de la **période** (aujourd'hui ou n'importe quelle quinzaine de l'année) ;
- de la **culture précédente** de la planche et de son historique (délais de retour par famille).

Construite avec **Expo / React Native** (un seul code pour Android et iOS). Les données restent sur le téléphone.

## Onglets

| Onglet | Contenu |
|---|---|
| 🌱 **Conseils** | Classement des cultures possibles avec un score sur 100, un verdict (Excellent / Bon / Possible / Déconseillé) et le détail des raisons (+ / −), astuces, bons et mauvais voisins. |
| 🧺 **Planches** | Création des planches et historique de ce qui y a poussé (mois / année). |
| ⚙️ **Paramètres** | Position GPS (automatique ou saisie manuelle, altitude incluse), zone climatique détectée ou forcée, ajustement du calendrier (microclimat), semis sous abri oui/non. |
| ℹ️ **À propos** | Version installée, recherche de mise à jour (GitHub Releases), téléchargement de l'APK, notes de version. |

## Les règles agronomiques utilisées

Détail complet : [`docs/REGLES_AGRONOMIQUES.md`](docs/REGLES_AGRONOMIQUES.md). En résumé, chaque culture part de 50 points puis :

1. **Saison** : la date doit tomber dans une fenêtre de semis sous abri, semis ou plantation. Les calendriers sont
   donnés pour Paris puis **décalés selon la loi de Hopkins** (≈ 4 jours de retard par degré de latitude vers le nord,
   par 5° de longitude vers l'est et par 122 m d'altitude), corrigée par la zone (méditerranéen, océanique,
   semi-océanique, continental, montagnard).
2. **Rotation** : même famille botanique que le précédent → fort malus ; famille revenue avant son délai de retour
   (ex. Alliacées 5 ans, Solanacées / Brassicacées / Apiacées 4 ans, pois 5 ans) → malus dégressif.
3. **Succession des exigences** : gourmand (choux, courges, tomates, poireaux) → moyen (racines, salades) → frugal
   (ail, oignon, radis, mâche) → améliorant (légumineuses, engrais verts) ; deux gourmands de suite sont pénalisés,
   un gourmand après une légumineuse est favorisé.
4. **Alternance** des organes (fruit / racine / feuille / bulbe / graine) et des profondeurs d'enracinement.
5. **Précédents particuliers** : choux après légumineuse, pomme de terre après choux (gale), taupins après prairie
   ou céréale, pas de racines ni d'Alliacées sur fumure fraîche.
6. **Climat** : besoin de chaleur de la culture vs. chaleur de la zone ; temps de culture compatible avec les
   premières gelées estimées ; alerte gelées tardives.

## Développer

```bash
npm install
npm start            # puis scanner le QR code avec l'app Expo Go (Android ou iPhone)
npm test             # tests du moteur de recommandation
npm run typecheck
```

Le code métier (indépendant de l'interface) est dans `src/lib/` : `crops.ts` (base de 41 cultures),
`climate.ts` (zones et décalage), `engine.ts` (scoring). Les écrans sont dans `src/app/` (Expo Router).

## Publier une nouvelle version (APK Android)

1. Incrémenter `version` dans `app.json` et `package.json` (et `android.versionCode` / `ios.buildNumber`).
2. Ajouter une entrée en tête de `src/releaseNotes.ts`.
3. `git tag v1.1.0 && git push origin main --tags`

Le workflow **Android release** construit l'APK et crée la release GitHub. L'onglet *À propos* des téléphones
déjà installés détecte alors la nouvelle version et propose le téléchargement.

> **Le dépôt doit être public** pour que l'application puisse lire les releases sans authentification.

### Clé de signature

Android n'accepte une mise à jour que si elle est signée avec la même clé. Le workflow utilise le secret
`ANDROID_KEYSTORE_BASE64` (keystore avec alias `androiddebugkey`, mots de passe `android`). Sans ce secret, chaque
build reçoit une clé temporaire et il faut désinstaller avant de mettre à jour. Pour (re)créer la clé :

```bash
keytool -genkeypair -v -keystore farmingcompanion.keystore -alias androiddebugkey \
  -keyalg RSA -keysize 2048 -validity 10000 -storepass android -keypass android \
  -dname "CN=FarmingCompanion"
base64 -w0 farmingcompanion.keystore | gh secret set ANDROID_KEYSTORE_BASE64
```

Pour une diffusion sur le Play Store, utiliser plutôt `npx eas-cli build -p android --profile production`.

## iPhone

Apple n'autorise pas l'installation d'APK (format Android). Trois options :

- **Expo Go** (gratuit) : `npm start` puis scanner le QR code avec l'appareil photo — idéal pour tester.
- **TestFlight / App Store** : nécessite un compte Apple Developer (99 €/an) puis
  `npx eas-cli build -p ios --profile production` et `npx eas-cli submit -p ios`.
- La recherche de mise à jour de l'onglet *À propos* fonctionne aussi sur iPhone : elle ouvre la page de la release.

## Avertissement

Les calendriers et règles sont des repères issus de la littérature maraîchère française ; la météo de l'année,
le sol et le microclimat de votre parcelle priment. Les retours d'expérience des jardiniers sont les bienvenus
(issues GitHub).
