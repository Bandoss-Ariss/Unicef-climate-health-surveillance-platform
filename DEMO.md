# Guide de démonstration — Présentation UNICEF

> Durée cible : **7 à 9 minutes** de démo + questions. Tout fonctionne hors ligne sauf le fond de carte (OpenStreetMap) qui a besoin d'Internet.

## Avant la présentation (5 min)

1. Brancher le PC, désactiver la mise en veille.
2. Lancer `start-demo.bat` (ou `npm run demo`). Deux fenêtres s'ouvrent : le backend (minimisé) et le navigateur sur http://localhost:3000.
   Se connecter avec **rnakoiri@unicef.org** / **12345678** (la session reste ouverte tant que l'onglet n'est pas fermé ; menu en haut à droite pour se déconnecter).
3. Vérifier dans l'en-tête : **« API connectée · xx ms »** (vert). Si « Mode autonome » s'affiche, ce n'est pas bloquant : toute l'interface fonctionne sans le backend.
4. Ouvrir la page **Carte** une fois pour mettre les tuiles en cache.
5. Mettre le navigateur en plein écran (F11), zoom 100 %. Langue : FR.
6. Laisser la plateforme tourner 2 minutes avant de commencer : les courbes temps réel se remplissent et des événements apparaissent dans la cloche.

> Astuce : l'heure affichée est l'heure réelle de Ouagadougou. Toutes les données sont relatives à aujourd'hui — pas de date figée.

## Fil conducteur (le « pourquoi »)

> « Au Burkina Faso, des enfants meurent non pas parce que les traitements n'existent pas, mais parce que le centre de santé a perdu l'électricité, que les vaccins ont chauffé, ou que l'alerte est arrivée trop tard. Cette plateforme relie **énergie solaire, données climatiques et surveillance sanitaire** pour agir 48 à 72 h avant la crise. »

## Parcours de démo

### 1. Tableau de bord (1 min) — *la situation en un coup d'œil*
- Bandeau rouge : **alerte canicule critique à Djibo**, 52 000 enfants exposés, anticipation 62 h, 12 545 SMS déjà envoyés, acquittée par le médecin-chef de district.
- KPI : 6/10 centres opérationnels, 84 780 enfants couverts, chaîne du froid 9/10, **continuité de service 94,6 % vs 68 % avant**.
- Montrer que les chiffres bougent (flux capteurs actif) et le fil « Activité de la plateforme ».
- Cliquer sur **CSPS de Nouna** (hors ligne) dans « Centres nécessitant une attention ».

### 2. Fiche centre — Nouna (1 min) — *le jumeau numérique*
- Batterie 5 %, frigo à 12,5 °C, vaccins transférés au CMA : **la plateforme l'a vu 41 h plus tôt** (historique des événements en bas).
- Courbe chaîne du froid 24 h avec la plage OMS 2-8 °C.
- Cliquer **« Créer un ticket maintenance »** → notification + événement dans le journal.

### 3. Temps réel IoT (45 s) — *la preuve que c'est vivant*
- Tableau des 10 centres qui se rafraîchit toutes les 3 s, liaison LoRaWAN/GSM, buffer 72 h hors ligne.
- Mentionner les API ouvertes (Swagger sur http://localhost:8000/docs) : interopérable DHIS2 / FHIR.

### 4. Carte (45 s)
- Zones d'alerte proportionnelles à la population, foyers épidémiologiques, cliquer sur un centre → indicateurs live.

### 5. Alertes climat (1 min) — *de l'alerte à l'action*
- Chaque alerte a sa **source** (ANAM, ECMWF, CHIRPS), sa **confiance** et son **délai d'anticipation**.
- Sur l'alerte **Tempête de sable Gorom-Gorom** : cliquer **Acquitter**, puis **Diffuser aux communautés** → choisir *Fulfuldé* → OK. Montrer le compteur et la notification.

### 6. Prédictions IA (1 min 30) — *anticiper 14 jours à l'avance*
- 4 modèles en production avec leurs métriques.
- Prévision paludisme Boromo : dépassement du seuil épidémique, probabilité 98 %, facteurs explicatifs (SHAP).
- Matrice de risque climatique 7 jours ; probabilité de défaillance énergétique par centre (Nouna 99 %, Sapouy 56 %).
- Insister : **aucune donnée nominale**, agrégats par district, conformité protection des données.

### 7. Simulation (1 min 30) — *le « et si ? » pour les décideurs*
- Vague de chaleur · Élevée · 7 jours · Djibo + Dori + Gorom-Gorom → **Lancer**.
- Lire l'effet cascade : stress climatique → énergie −70 % → rupture chaîne du froid → doses à risque → ~1 000 enfants à risque, avec intervalle P10-P90 et **coût évité par anticipation**.
- Plan d'action daté (J-3 → J+1). Bouton *Exporter le plan (PDF)*.
- Lien direct pour aller vite : http://localhost:3000/simulation?run=1

### 8. Conclusion (1 min)
- Revenir sur le **Tableau de bord** : continuité de service 94,6 % vs 68 % avant, 0 dose perdue, 62 h d'anticipation, 84 780 enfants couverts.
- Message de clôture : « Anticiper le risque, garantir la continuité des soins, renforcer la résilience — pour chaque enfant. »

## Questions probables et réponses courtes

| Question | Réponse |
|---|---|
| Les données sont-elles réelles ? | Prototype : capteurs simulés physiquement (courbe solaire réelle de Ouagadougou, cycles frigo, liaison intermittente). Les 10 sites, les sources (ANAM, DHIS2, CHIRPS) et les modèles sont ceux prévus pour le pilote. L'API d'ingestion est déjà opérationnelle (`POST /api/v1/sensors/batch`). |
| Que se passe-t-il sans réseau ? | Buffer local 72 h dans la passerelle, LoRaWAN longue portée, synchronisation au retour du GSM. |
| Et la protection des données ? | Aucune donnée patient : agrégats hebdomadaires par district. Hébergement UNICEF, chiffrement TLS 1.3, loi 001-2021/AN. |
| Pourquoi open source ? | Bien public numérique (licence MIT) : réplicable au Mali, Niger, Tchad ; pas de dépendance à un fournisseur ; transfert au ministère de la Santé. |
| Maintenance des systèmes solaires ? | Techniciens de district formés, prédiction de défaillance 72 h, tickets automatiques, stock de pièces régional. |

## Si quelque chose ne marche pas

- **Page blanche** : rafraîchir (F5). Le moteur redémarre en 1 s.
- **Carte grise** : pas d'Internet → les marqueurs et alertes restent visibles, seul le fond manque. Dire « fond de carte OpenStreetMap ».
- **« Mode autonome »** : backend arrêté → aucune fonctionnalité perdue à l'écran.
- **Port 3000 occupé** : `npx vite --port 3001 --open`.
- Version anglaise disponible en un clic (EN) pour des interlocuteurs anglophones.
