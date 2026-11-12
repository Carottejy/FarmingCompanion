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
| 🧺 **Planches** | Création des planches, **culture en cours** (date de semis / plantation, récolte prévisionnelle, progression) et historique de ce qui y a poussé. Bouton « Que planter après … ? » qui ouvre les conseils à la date de récolte. |
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
3. Pousser sur `main` (`git push`).

Le workflow **Android release** voit que la release `v1.1.0` n'existe pas encore : il construit l'APK, crée le tag et la release GitHub. L'onglet *À propos* des téléphones
déjà installés détecte alors la nouvelle version et propose le téléchargement.

> **Le dépôt doit être public** pour que l'application puisse lire les releases sans authentification.

### Clé de signature

Android n'accepte une mise à jour que si elle est signée avec la même clé. Le workflow utilise le secret
`ANDROID_KEYSTORE_BASE64` (keystore avec alias `androiddebugkey`, mots de passe `android`). Sans ce secret, chaque
build reçoit une clé temporaire et il faut désinstaller avant de mettre à jour. Pour (re)créer la clé :

```bash
# Clé EC compacte (≈ 700 caractères en base64, facile à coller dans un secret GitHub)
keytool -genkeypair -keystore farmingcompanion.jks -storetype JKS -alias androiddebugkey \
  -keyalg EC -groupname secp256r1 -validity 10000 -storepass android -keypass android -dname "CN=FC"
base64 -w0 farmingcompanion.jks | gh secret set ANDROID_KEYSTORE_BASE64
```

L'APK est construit pour **arm64-v8a** uniquement (tous les téléphones Android récents), ce qui le rend environ 3 fois plus léger.

Pour une diffusion sur le Play Store, utiliser plutôt `npx eas-cli build -p android --profile production`.

## iPhone : web app hors ligne

Apple n'autorise pas l'installation d'APK. Sur iPhone, FarmingCompanion s'utilise comme **web app installable**,
qui fonctionne ensuite **sans réseau** :

1. Ouvrir **https://carottejy.github.io/FarmingCompanion/** dans **Safari** (avec du réseau, une seule fois).
2. Bouton **Partager** → **Sur l'écran d'accueil** → **Ajouter**.
3. Lancer l'app depuis l'icône carotte : tout est mis en cache, elle marche en mode avion.
   Les planches sont enregistrées sur le téléphone.

Mises à jour : à chaque push sur `main`, le workflow **Web app (GitHub Pages)** republie le site ; l'iPhone récupère
la nouvelle version la prochaine fois que l'app est ouverte avec du réseau (fermer puis rouvrir l'app).

Autres options : **Expo Go** (`npm start` + QR code, nécessite l'ordinateur) ou une vraie app via **TestFlight /
App Store** (compte Apple Developer, 99 €/an, `npx eas-cli build -p ios`).

La version web est générée par `npm run build:web` (export Expo + `scripts/make-pwa.mjs` qui ajoute le manifeste,
les icônes et le service worker hors ligne).

## Avertissement

Les calendriers et règles sont des repères issus de la littérature maraîchère française ; la météo de l'année,
le sol et le microclimat de votre parcelle priment. Les retours d'expérience des jardiniers sont les bienvenus
(issues GitHub).
