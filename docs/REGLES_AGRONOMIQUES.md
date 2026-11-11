# Règles agronomiques de FarmingCompanion

Ce document décrit les connaissances utilisées par le moteur (`src/lib/`). Elles proviennent de la littérature
maraîchère française et francophone : fiches *Rotation des cultures en maraîchage* (Agrobio Bretagne / FNAB),
FiBL (fumure et protection en maraîchage bio), Bruxelles Environnement, FREDON, Académie d'agriculture de France
(délais de retour), grilles DRAAF de classement des précédents culturaux (« pauvres / moyens / riches »),
fiches INRAE / Ctifl sur les plantes assainissantes, et calendriers de semis usuels.

## 1. Pourquoi la rotation ?

- Le sol est un **réservoir de ravageurs et de maladies spécifiques** d'une famille (nématodes, hernie du chou,
  pourriture blanche de l'oignon, Aphanomyces du pois, mildiou/doryphore des Solanacées…). Sans plante-hôte
  pendant plusieurs années, leurs populations diminuent.
- Chaque famille prélève les éléments nutritifs différemment et explore le sol à une profondeur différente.
- Règle de base : **ne jamais remettre la même famille sur la même planche d'une année sur l'autre**, et
  respecter un délai de retour (souvent ≥ 4 ans, 5 à 6 pour les Alliacées et le pois).

## 2. Délais de retour et caractéristiques par culture

| Famille | Délai de retour |
|---|---|
| Solanacées | 4 an(s) |
| Cucurbitacées | 3 an(s) |
| Brassicacées | 4 an(s) |
| Alliacées | 5 an(s) |
| Apiacées | 4 an(s) |
| Astéracées | 2 an(s) |
| Amaranthacées | 3 an(s) |
| Fabacées | 4 an(s) |
| Valérianacées | 2 an(s) |
| Poacées | 2 an(s) |
| Convolvulacées | 3 an(s) |
| Rosacées | 4 an(s) |
| Hydrophyllacées | 1 an(s) |

| Culture | Famille | Organe | Exigence | Racines | Chaleur | Calendrier (référence Paris) |
|---|---|---|---|---|---|---|
| Tomate | Solanacées | fruit | exigeant | profond | ☀☀ | Abri : début mars → mi-avr.<br>Plantation : mi-mai → fin juin |
| Aubergine | Solanacées | fruit | exigeant | profond | ☀☀☀ | Abri : mi-févr. → fin mars<br>Plantation : mi-mai → mi-juin |
| Poivron / piment | Solanacées | fruit | exigeant | moyen | ☀☀☀ | Abri : mi-févr. → fin mars<br>Plantation : mi-mai → mi-juin |
| Pomme de terre | Solanacées | racine | exigeant | moyen | ☀☀ | Plantation : début avr. → mi-mai |
| Courgette | Cucurbitacées | fruit | exigeant | moyen | ☀☀ | Abri : début avr. → mi-mai<br>Semis : mi-mai → mi-juin<br>Plantation : mi-mai → fin juin |
| Courge / potiron | Cucurbitacées | fruit | exigeant | moyen | ☀☀ | Abri : mi-avr. → mi-mai<br>Semis : mi-mai → mi-juin<br>Plantation : mi-mai → mi-juin |
| Concombre / cornichon | Cucurbitacées | fruit | exigeant | superficiel | ☀☀ | Abri : début avr. → mi-mai<br>Semis : mi-mai → mi-juin<br>Plantation : mi-mai → fin juin |
| Melon | Cucurbitacées | fruit | exigeant | moyen | ☀☀☀ | Abri : début avr. → fin avr.<br>Plantation : mi-mai → mi-juin |
| Chou pommé (été / automne) | Brassicacées | feuille | exigeant | moyen | ☀ | Abri : début mars → fin mars<br>Semis : début avr. → fin mai<br>Plantation : début mai → mi-juil. |
| Chou d'hiver (Milan, Bruxelles, kale) | Brassicacées | feuille | exigeant | moyen | ☀ | Semis : début mai → mi-juin<br>Plantation : mi-juin → fin juil. |
| Chou-fleur | Brassicacées | feuille | exigeant | moyen | ☀ | Abri : début mars → fin mars<br>Semis : début avr. → fin mai<br>Plantation : début mai → mi-juil. |
| Brocoli | Brassicacées | feuille | exigeant | moyen | ☀ | Semis : début avr. → fin juin<br>Plantation : début mai → mi-août |
| Chou-rave | Brassicacées | bulbe | moyen | superficiel | ☀ | Semis : mi-mars → fin juil.<br>Plantation : mi-avr. → mi-août |
| Radis rose | Brassicacées | racine | faible | superficiel | ☀ | Semis : début mars → mi-sept. |
| Radis d'hiver (noir, daikon) | Brassicacées | racine | faible | profond | ☀ | Semis : début juil. → fin août |
| Navet | Brassicacées | racine | moyen | moyen | ☀ | Semis : mi-mars → fin avr.<br>Semis : mi-juil. → mi-sept. |
| Roquette | Brassicacées | feuille | faible | superficiel | ☀ | Semis : mi-mars → fin sept. |
| Ail | Alliacées | bulbe | faible | superficiel | ☀☀ | Plantation : mi-oct. → fin févr. |
| Oignon (bulbilles ou semis) | Alliacées | bulbe | faible | superficiel | ☀☀ | Semis : mi-févr. → fin mars<br>Plantation : début mars → mi-avr.<br>Semis : mi-août → mi-sept. |
| Échalote | Alliacées | bulbe | faible | superficiel | ☀☀ | Plantation : début févr. → fin mars |
| Poireau | Alliacées | feuille | exigeant | superficiel | ☀ | Abri : mi-févr. → fin mars<br>Semis : début mars → mi-mai<br>Plantation : début juin → fin juil. |
| Carotte | Apiacées | racine | moyen | profond | ☀☀ | Semis : mi-mars → fin juil. |
| Panais | Apiacées | racine | moyen | profond | ☀ | Semis : mi-mars → fin mai |
| Céleri (rave ou branche) | Apiacées | feuille | exigeant | superficiel | ☀☀ | Abri : début mars → mi-avr.<br>Plantation : mi-mai → fin juin |
| Persil | Apiacées | feuille | faible | moyen | ☀☀ | Semis : début mars → mi-août |
| Fenouil bulbe | Apiacées | bulbe | moyen | moyen | ☀☀ | Semis : début juin → fin juil.<br>Plantation : début juil. → mi-août |
| Laitue | Astéracées | feuille | moyen | superficiel | ☀ | Abri : début févr. → fin mars<br>Semis : mi-mars → fin août<br>Plantation : mi-mars → mi-sept. |
| Chicorée (frisée, scarole) | Astéracées | feuille | moyen | moyen | ☀ | Semis : début juin → fin juil.<br>Plantation : début juil. → fin août |
| Artichaut (vivace) | Astéracées | fruit | exigeant | profond | ☀☀ | Plantation : début avr. → mi-mai |
| Betterave | Amaranthacées | racine | moyen | profond | ☀☀ | Semis : mi-avr. → mi-juil. |
| Blette (poirée) | Amaranthacées | feuille | moyen | profond | ☀☀ | Semis : mi-avr. → mi-juil. |
| Épinard | Amaranthacées | feuille | moyen | superficiel | ☀ | Semis : début mars → fin avr.<br>Semis : mi-août → mi-oct. |
| Haricot | Fabacées | graine | améliorant | moyen | ☀☀ | Semis : mi-mai → fin juil. |
| Pois | Fabacées | graine | améliorant | moyen | ☀ | Semis : début févr. → fin avr. |
| Fève | Fabacées | graine | améliorant | profond | ☀ | Semis : début févr. → mi-mars<br>Semis : début nov. → fin nov. |
| Mâche | Valérianacées | feuille | faible | superficiel | ☀ | Semis : début août → fin sept. |
| Maïs doux | Poacées | graine | exigeant | profond | ☀☀ | Abri : début mai → mi-mai<br>Semis : mi-mai → mi-juin |
| Patate douce | Convolvulacées | racine | moyen | moyen | ☀☀☀ | Plantation : mi-mai → mi-juin |
| Fraisier | Rosacées | fruit | moyen | superficiel | ☀☀ | Plantation : mi-août → mi-oct.<br>Plantation : mi-mars → mi-avr. |
| Engrais vert : phacélie | Hydrophyllacées | engrais vert | améliorant | moyen | ☀☀ | Semis : mi-mars → mi-sept. |
| Engrais vert : seigle + vesce | Fabacées | engrais vert | améliorant | profond | ☀ | Semis : mi-sept. → mi-nov. |

*Exigence* : **exigeant** = tête de rotation, après un apport de compost ou de fumier ; **moyen** ; **faible** =
légumes frugaux, sans fumure ; **améliorant** = légumineuses et engrais verts (fixent l'azote, couvrent le sol).

## 3. Succession type (planche par planche)

```
Engrais vert / légumineuse ─► Légume gourmand (choux, courges, tomates, poireaux)
        ▲                                   │
        │                                   ▼
Légume frugal (ail, oignon, radis) ◄── Légume moyen (carotte, betterave, salade)
```

Alternances complémentaires :
- **organes** : fruit → racine → feuille → graine (légumineuse) ;
- **enracinement** : superficiel (laitue, oignon, poireau, épinard) ↔ profond (carotte, tomate, betterave, fève).

## 4. Barème du score (sur 100)

| Critère | Effet |
|---|---|
| Base | 50 |
| Date au cœur / au bord de la fenêtre | +12 / +4 |
| Semis sous abri seulement (planche libre en attendant) | −4 |
| Même famille que le précédent | −45 (−10 de plus si même légume) |
| Famille présente dans l'historique avant son délai de retour | −5 à −35 (dégressif) |
| Gourmand après gourmand | −12 |
| Moyen / frugal / améliorant après gourmand | +6 / +8 / +10 |
| Gourmand après légumineuse ou engrais vert | +14 |
| Gourmand sur planche fraîchement amendée | +14 ; racines ou Alliacées : −12 |
| Organe différent / identique | +6 / −6 |
| Profondeur racinaire différente | +4 |
| Choux après légumineuse | +4 |
| Pomme de terre après choux (biofumigation, gale commune) | +5 |
| Pomme de terre ou carotte après prairie / céréale (taupins) | −10 |
| Culture très frileuse en climat frais | −10 à −25 |
| Culture de fraîcheur en été méditerranéen | −8 |
| Récolte après les premières gelées estimées | −30 (juste avant : −8) |
| Mise en place frileuse proche des dernières gelées | −6 |

Verdict : **Excellent ≥ 75**, **Bon ≥ 60**, **Possible ≥ 45**, sinon **Déconseillé** (masqué par défaut).

## 5. Climat et calendrier

- Calendriers de référence : Centre / Île-de-France, en quinzaines.
- **Loi bioclimatique de Hopkins** : le printemps est retardé d'environ 4 jours par degré de latitude vers le
  nord, par 5° de longitude vers l'est et par 122 m (400 pieds) d'altitude.
- Correction de zone : méditerranéen −8 j, océanique −5 j, continental et montagnard +5 j.
- Climat plus froid : la saison raccourcit des deux côtés (printemps plus tard, semis d'automne plus tôt).
  Climat plus doux : la saison s'allonge (on commence plus tôt et on finit plus tard).
- Gelées moyennes de référence : dernières ~10 avril, premières ~5 novembre, décalées de la même valeur.
- Tout est ajustable dans les Paramètres (zone forcée, décalage ±7 jours) pour tenir compte d'un microclimat.
