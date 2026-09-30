import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = "C:/Users/karlp/Documents/ChatGPT/StarPilot";
const UA_DIR = path.join(PROJECT_ROOT, ".ua");
const BATCHES_PATH = path.join(UA_DIR, "intermediate", "batches.json");
const BATCH_INDICES = [5, 6, 7, 8];

const info = (summary, tags, role, languageNotes) => ({summary, tags, role, languageNotes});

const FILE_INFO = {
  "starpilot/system/the_galaxy/tests/test_longitudinal_mode.py": info(
    "Teste l’adaptateur de mode longitudinal, notamment la priorité des lectures, les transitions autorisées et les échecs de lecture ou d’écriture.",
    ["test", "mode-longitudinal", "garde-fous", "régression"],
    "la validation des transitions du mode longitudinal",
  ),
  "starpilot/system/the_galaxy/tests/test_longitudinal_mode_api.py": info(
    "Valide l’API Galaxy du mode longitudinal, ses réponses HTTP, ses garde-fous véhicule et sa compatibilité avec les paramètres historiques.",
    ["test", "api", "galaxy", "mode-longitudinal"],
    "la validation de l’API du mode longitudinal",
  ),
  "starpilot/system/the_galaxy/tests/test_mode_transition_guards.py": info(
    "Couvre les régressions liées aux garde-fous réévalués pendant une transition et aux écritures multiclés sans état intermédiaire dangereux.",
    ["test", "garde-fous", "atomicité", "régression"],
    "la validation des garde-fous de transition",
  ),

  "README.md": info(
    "Présente StarPilot, son héritage openpilot/FrogPilot, ses fonctions d’assistance à la conduite, le portail Galaxy et les crédits des adaptations tierces.",
    ["documentation", "présentation", "fonctionnalités", "galaxy"],
    "la documentation générale de StarPilot",
  ),
  "common/params_keys.h": info(
    "Déclare le registre central des clés Params avec leurs types, valeurs par défaut, règles de persistance, niveaux de réglage et politiques d’effacement.",
    ["paramètres", "configuration", "registre", "persistance"],
    "le registre des paramètres persistants",
    "En-tête C++ fondé sur une table inline de métadonnées ParamKeyAttributes.",
  ),
  "pyproject.toml": info(
    "Configure le paquet Python openpilot, ses dépendances, la construction Hatch ainsi que pytest, mypy, Ruff et codespell.",
    ["configuration", "python", "build-system", "qualité-code"],
    "la configuration de l’outillage Python",
    "Configuration TOML centralisant dépendances, build et règles d’analyse statique.",
  ),
  "selfdrive/car/card.py": info(
    "Orchestre l’interface véhicule : acquisition de l’état, publication des commandes, callbacks CAN/OBD et intégration des actions StarPilot comme les favoris et Redneck Cruise.",
    ["véhicule", "can", "contrôle", "service"],
    "la boucle d’interface véhicule",
  ),
  "selfdrive/car/redneck_cruise.py": info(
    "Implémente la sélection de vitesse cible et la machine à états de Redneck Cruise, avec temporisations de boutons, marge de roue libre et réaction au départ du véhicule de tête.",
    ["régulateur-vitesse", "machine-à-états", "véhicule", "contrôle"],
    "la logique Redneck Cruise",
  ),
  "selfdrive/controls/controlsd.py": info(
    "Exécute le contrôleur principal de conduite et combine planification, limites de courbure, commandes latérales et longitudinales, état d’engagement et publication des sorties.",
    ["contrôle", "planification", "sécurité", "entry-point"],
    "le contrôleur principal de conduite",
  ),
  "selfdrive/controls/lib/lane_centering.py": info(
    "Calcule une correction de centrage dans la voie à partir des trajectoires et expose aussi la direction visuelle de cette correction.",
    ["contrôle-latéral", "centrage-voie", "trajectoire", "contrôleur"],
    "le centrage dynamique dans la voie",
  ),
  "selfdrive/controls/lib/longcontrol.py": info(
    "Gère la commande longitudinale, ses transitions d’état, le PID, les arrêts et la compatibilité avec l’ancien mode longitudinal.",
    ["contrôle-longitudinal", "pid", "machine-à-états", "sécurité"],
    "la commande longitudinale",
  ),
  "selfdrive/modeld/camera_offset.py": info(
    "Maintient et applique un décalage de caméra lissé selon le dispositif et la cible demandée au pipeline modèle.",
    ["caméra", "calibration", "filtrage", "modèle"],
    "le décalage dynamique de caméra",
  ),
  "selfdrive/modeld/modeld.py": info(
    "Pilote l’inférence du modèle de conduite, les entrées caméra, l’état récurrent, les artefacts tinygrad et les variantes Model Lab ou GPU externe.",
    ["inférence", "modèle-conduite", "tinygrad", "entry-point"],
    "le service d’inférence du modèle de conduite",
  ),
  "selfdrive/selfdrived/events.py": info(
    "Définit le catalogue d’événements et construit les alertes conducteur, leurs priorités, textes, sons et conditions de désengagement.",
    ["événements", "alertes", "sécurité", "conducteur"],
    "la génération des alertes conducteur",
  ),
  "selfdrive/selfdrived/selfdrived.py": info(
    "Coordonne l’état d’auto-conduite, les événements de sécurité, les alertes, les transitions d’engagement et la publication de selfdriveState.",
    ["supervision", "événements", "sécurité", "entry-point"],
    "la supervision de l’auto-conduite",
  ),
  "selfdrive/ui/layouts/settings/developer.py": info(
    "Affiche les réglages développeur généraux et commande les options de débogage UI, ADB, SSH, joystick et longitudinal expérimental.",
    ["interface-utilisateur", "réglages", "développement", "sécurité"],
    "l’écran des réglages développeur",
  ),
  "selfdrive/ui/layouts/settings/starpilot/__init__.py": info(
    "Marque le répertoire des écrans de réglages StarPilot comme paquet Python.",
    ["package", "réglages", "starpilot"],
    "le paquet des réglages StarPilot",
    "Module d’initialisation Python volontairement vide.",
  ),
  "selfdrive/ui/layouts/settings/starpilot/aethergrid.py": info(
    "Fournit le système de composants AetherGrid pour les réglages StarPilot : panneaux, tuiles, listes, sliders, dialogues, dessin et gestion des interactions.",
    ["interface-utilisateur", "design-system", "composants", "rendu"],
    "le design system AetherGrid",
    "Implémentation Python de widgets à rendu immédiat avec géométrie, animation et gestion explicite des événements pointeur.",
  ),
  "selfdrive/ui/layouts/settings/starpilot/appearance.py": info(
    "Construit les écrans d’apparence StarPilot pour les thèmes, couleurs, métriques, caméra, chemins, alertes de démarrage et éléments du HUD.",
    ["interface-utilisateur", "apparence", "thèmes", "réglages"],
    "les réglages d’apparence StarPilot",
  ),
  "selfdrive/ui/layouts/settings/starpilot/asset_loader.py": info(
    "Charge les textures StarPilot depuis les ressources et fournit un repli sûr lorsqu’un asset est absent.",
    ["assets", "textures", "chargement", "interface-utilisateur"],
    "le chargement des textures StarPilot",
  ),
  "selfdrive/ui/layouts/settings/starpilot/driving_model.py": info(
    "Gère le catalogue des modèles de conduite : découverte, tri, téléchargement, sélection, suppression, favoris et état Model Lab.",
    ["interface-utilisateur", "modèles", "téléchargement", "catalogue"],
    "la gestion des modèles de conduite",
  ),
  "selfdrive/ui/layouts/settings/starpilot/lateral.py": info(
    "Assemble les réglages de direction et de contrôle latéral, dont les délais, le lissage de changement de voie et les options nécessitant un redémarrage.",
    ["interface-utilisateur", "contrôle-latéral", "réglages", "direction"],
    "les réglages de contrôle latéral",
  ),
  "selfdrive/ui/layouts/settings/starpilot/longitudinal.py": info(
    "Assemble les réglages longitudinaux StarPilot : profils d’accélération, mode conditionnel, arrêts, offsets SLC, météo et personnalités de conduite.",
    ["interface-utilisateur", "contrôle-longitudinal", "réglages", "profils"],
    "les réglages de contrôle longitudinal",
  ),
  "selfdrive/ui/layouts/settings/starpilot/main_panel.py": info(
    "Gère la navigation hiérarchique du panneau StarPilot, le hub de catégories, les sous-panneaux et leur cycle d’affichage.",
    ["interface-utilisateur", "navigation", "réglages", "panneau"],
    "la navigation principale des réglages StarPilot",
  ),
  "selfdrive/ui/layouts/settings/starpilot/maps.py": info(
    "Pilote l’écran de cartes hors ligne : sélection de régions, état du stockage, progression, planification, annulation et suppression des téléchargements.",
    ["interface-utilisateur", "cartes", "téléchargement", "stockage"],
    "la gestion des cartes hors ligne",
  ),
  "selfdrive/ui/layouts/settings/starpilot/navigation.py": info(
    "Fournit la recherche Mapbox, les destinations favorites et les commandes de démarrage ou d’annulation de navigation dans les réglages StarPilot.",
    ["interface-utilisateur", "navigation", "mapbox", "favoris"],
    "la configuration de la navigation",
  ),
  "selfdrive/ui/layouts/settings/starpilot/panel.py": info(
    "Définit les fondations des panneaux StarPilot, le cache Params par frame, les métadonnées de catégories et les helpers de sélection.",
    ["interface-utilisateur", "panneau", "paramètres", "infrastructure-ui"],
    "l’infrastructure des panneaux de réglages",
  ),
  "selfdrive/ui/layouts/settings/starpilot/scribble.py": info(
    "Dessine la bibliothèque d’icônes personnalisées StarPilot à partir de primitives géométriques.",
    ["interface-utilisateur", "icônes", "graphisme", "rendu"],
    "le rendu des icônes personnalisées",
  ),

  "selfdrive/ui/layouts/settings/starpilot/sectioned_panel.py": info(
    "Dispose des groupes de tuiles dans un panneau sectionné, avec calcul de hauteur, titres de sections et défilement.",
    ["interface-utilisateur", "mise-en-page", "tuiles", "réglages"],
    "la mise en page sectionnée des réglages",
  ),
  "selfdrive/ui/layouts/settings/starpilot/simple_download_manager.py": info(
    "Fournit un gestionnaire générique de ressources téléchargeables avec sélection, état réseau, progression, annulation et suppression locale.",
    ["interface-utilisateur", "téléchargement", "assets", "gestionnaire"],
    "la gestion simple des ressources téléchargeables",
  ),
  "selfdrive/ui/layouts/settings/starpilot/sounds.py": info(
    "Présente les réglages sonores StarPilot, leurs volumes, options et commandes de préécoute hors route.",
    ["interface-utilisateur", "audio", "réglages", "volume"],
    "les réglages et tests sonores",
  ),
  "selfdrive/ui/layouts/settings/starpilot/system_settings.py": info(
    "Regroupe les réglages système et les opérations de maintenance : affichage, connectivité, stockage, sauvegardes, profils Params, firmware et réinitialisation.",
    ["interface-utilisateur", "système", "maintenance", "sauvegardes"],
    "les réglages et la maintenance système",
  ),
  "selfdrive/ui/layouts/settings/starpilot/vehicle.py": info(
    "Configure l’identité du véhicule, les options de direction, les actions de boutons et les sélecteurs de marque, modèle ou temporisation des portes.",
    ["interface-utilisateur", "véhicule", "réglages", "commandes"],
    "les réglages propres au véhicule",
  ),
  "selfdrive/ui/lib/mode_banner.py": info(
    "Détermine la variante et les couleurs animées de la bannière de mode de conduite, puis dessine son dégradé dans l’interface.",
    ["interface-utilisateur", "mode-conduite", "couleurs", "rendu"],
    "la bannière du mode de conduite",
  ),
  "selfdrive/ui/lib/starpilot_state.py": info(
    "Centralise l’état StarPilot consommé par l’UI, applique les empreintes véhicule manuelles et synchronise les paramètres latéraux.",
    ["state-management", "interface-utilisateur", "véhicule", "paramètres"],
    "l’état partagé de l’interface StarPilot",
  ),
  "selfdrive/ui/mici/layouts/settings/developer.py": info(
    "Adapte les réglages développeur à l’interface mici et synchronise les options joystick et longitudinal expérimental.",
    ["interface-utilisateur", "mici", "développement", "réglages"],
    "les réglages développeur sur mici",
  ),
  "selfdrive/ui/mici/layouts/settings/settings.py": info(
    "Compose l’écran de réglages mici avec de grands boutons et une commande Force Drive State adaptée au petit écran.",
    ["interface-utilisateur", "mici", "réglages", "commandes"],
    "l’écran principal des réglages mici",
  ),
  "selfdrive/ui/mici/layouts/settings/visuals.py": info(
    "Propose sur mici les sélecteurs de vue caméra et d’affichage des informations ou indicateurs de véhicule de tête.",
    ["interface-utilisateur", "mici", "visuels", "réglages"],
    "les réglages visuels mici",
  ),
  "selfdrive/ui/mici/onroad/hud_renderer.py": info(
    "Rend le HUD routier de mici : vitesse, consigne, limite, volant, source modèle, intentions de virage et invites interactives.",
    ["interface-utilisateur", "mici", "hud", "rendu"],
    "le HUD routier mici",
  ),
  "selfdrive/ui/mici/onroad/sidebar_widgets.py": info(
    "Dessine les widgets latéraux mici pour la personnalité, le mode conditionnel, les arrêts, les courbes et les limites de vitesse.",
    ["interface-utilisateur", "mici", "widgets", "rendu"],
    "les widgets latéraux mici",
  ),
  "selfdrive/ui/onroad/model_renderer.py": info(
    "Projette et dessine les sorties du modèle sur la route : voies, trajectoire, véhicules de tête, pistes radar et chemins adjacents.",
    ["interface-utilisateur", "modèle", "projection", "rendu"],
    "le rendu routier des sorties du modèle",
  ),
  "selfdrive/ui/onroad/starpilot/__init__.py": info(
    "Marque le répertoire des composants routiers StarPilot comme paquet Python.",
    ["package", "interface-utilisateur", "onroad"],
    "le paquet des composants routiers StarPilot",
    "Module d’initialisation Python volontairement vide.",
  ),
  "selfdrive/ui/onroad/starpilot/aethergauge.py": info(
    "Agrège les sources d’anticipation routière et rend l’AetherGauge pour les arrêts forcés, feux, courbes, CEM et véhicules de tête.",
    ["interface-utilisateur", "jauge", "anticipation", "rendu"],
    "la jauge routière AetherGauge",
  ),
  "selfdrive/ui/onroad/starpilot/compass.py": info(
    "Convertit un cap en texte de boussole localisé et adapté au niveau de précision disponible.",
    ["interface-utilisateur", "boussole", "navigation", "formatage"],
    "l’affichage textuel du cap",
  ),
  "selfdrive/ui/onroad/starpilot/developer_sidebar.py": info(
    "Affiche la barre latérale développeur avec métriques de réglage, valeurs de couple et commandes rapides de paramètres.",
    ["interface-utilisateur", "développement", "télémétrie", "réglage"],
    "la barre latérale de diagnostic développeur",
  ),
  "selfdrive/ui/onroad/starpilot/favorite_radial_menu.py": info(
    "Implémente le menu radial des favoris routiers, son éditeur d’emplacements, la pagination, les gestes longs et le rendu des cartes d’options.",
    ["interface-utilisateur", "menu-radial", "favoris", "interaction"],
    "le menu radial des favoris",
  ),
  "selfdrive/ui/onroad/starpilot/navigation_card.py": info(
    "Rend la carte de navigation et ses variantes normale, réduite ou mici, avec manœuvre, distance, texte et commande d’annulation.",
    ["interface-utilisateur", "navigation", "carte", "rendu"],
    "la carte routière de navigation",
  ),
  "selfdrive/ui/onroad/starpilot/path.py": info(
    "Dessine les voies adjacentes et les bords de trajectoire avec dégradés, couleurs HSL et annotations visuelles.",
    ["interface-utilisateur", "trajectoire", "voies", "rendu"],
    "le rendu de la trajectoire et des voies",
  ),
  "selfdrive/ui/onroad/starpilot/pause_indicators.py": info(
    "Dessine les indicateurs de pause latérale et longitudinale sur la vue routière.",
    ["interface-utilisateur", "indicateur", "pause", "rendu"],
    "les indicateurs de pause de conduite",
  ),
  "selfdrive/ui/onroad/starpilot/pedal_icons.py": info(
    "Rend les icônes d’accélérateur et de frein selon l’état courant des commandes longitudinales.",
    ["interface-utilisateur", "pédales", "indicateur", "rendu"],
    "les indicateurs graphiques des pédales",
  ),
  "selfdrive/ui/onroad/starpilot/personality_button.py": info(
    "Fournit le bouton routier de personnalité de conduite et gère son état, ses interactions et son rendu.",
    ["interface-utilisateur", "personnalité", "bouton", "interaction"],
    "le bouton de personnalité de conduite",
  ),
  "selfdrive/ui/onroad/starpilot/pip_sidecam.py": info(
    "Acquiert les flux des caméras latérales et les affiche en incrustation avec recadrage, textures, disposition et sélection du côté actif.",
    ["interface-utilisateur", "caméra", "picture-in-picture", "rendu"],
    "l’incrustation des caméras latérales",
  ),
  "selfdrive/ui/onroad/starpilot/pulse_glide.py": info(
    "Calcule la couleur du mode Pulse and Glide et dessine son indicateur sur la bordure routière.",
    ["interface-utilisateur", "pulse-and-glide", "indicateur", "rendu"],
    "l’indicateur Pulse and Glide",
  ),

  "selfdrive/ui/onroad/starpilot/rainbow_path.py": info(
    "Anime un dégradé arc-en-ciel HSL pour la trajectoire routière et expose les couleurs mises à jour à chaque frame.",
    ["interface-utilisateur", "trajectoire", "animation", "couleurs"],
    "le dégradé animé de trajectoire",
  ),
  "selfdrive/ui/onroad/starpilot/rivian_lateral_mode.py": info(
    "Suit le mode latéral Rivian actif et calcule la teinte du volant utilisée par l’interface routière.",
    ["interface-utilisateur", "rivian", "contrôle-latéral", "indicateur"],
    "l’indication du mode latéral Rivian",
  ),
  "selfdrive/ui/onroad/starpilot/slc_speed_limit.py": info(
    "Rend la limite de vitesse du Speed Limit Controller, ses sources, offsets, animations de changement et panneaux US ou européens.",
    ["interface-utilisateur", "limite-vitesse", "slc", "rendu"],
    "l’affichage du Speed Limit Controller",
  ),
  "selfdrive/ui/onroad/starpilot/source_bubble_layout.py": info(
    "Calcule les libellés, dimensions, lignes visibles et valeurs abrégées de la bulle présentant les sources de limite de vitesse.",
    ["interface-utilisateur", "mise-en-page", "sources", "limite-vitesse"],
    "la mise en page de la bulle des sources",
  ),
  "selfdrive/ui/onroad/starpilot/starpilot_border.py": info(
    "Compose les effets de bordure routière StarPilot selon les états de contrôle, la circulation et les animations lumineuses.",
    ["interface-utilisateur", "bordure", "effets-visuels", "rendu"],
    "les effets visuels de la bordure routière",
  ),
  "selfdrive/ui/onroad/starpilot/starpilot_onroad_view.py": info(
    "Coordonne la vue routière StarPilot, ses bordures, overlays, widgets, limite de vitesse, barre de couple, favoris et métriques développeur.",
    ["interface-utilisateur", "onroad", "orchestration", "rendu"],
    "la vue routière principale StarPilot",
  ),
  "selfdrive/ui/onroad/starpilot/stopping_point.py": info(
    "Projette et dessine le point d’arrêt prévu ainsi que son contour sur la trajectoire routière.",
    ["interface-utilisateur", "arrêt", "projection", "rendu"],
    "l’indicateur du point d’arrêt",
  ),
  "selfdrive/ui/onroad/starpilot/torque_bar.py": info(
    "Calcule une géométrie d’arc mise en cache et rend la barre de couple de direction avec filtrage de l’état.",
    ["interface-utilisateur", "couple", "direction", "rendu"],
    "la barre de couple de direction",
  ),
  "selfdrive/ui/onroad/starpilot/weather_icon.py": info(
    "Dessine les pictogrammes météo routiers à partir de primitives graphiques et de l’état météorologique courant.",
    ["interface-utilisateur", "météo", "icône", "rendu"],
    "le rendu des icônes météo",
  ),
  "selfdrive/ui/onroad/starpilot/widget_layout_manager.py": info(
    "Enregistre, ordonne et positionne les widgets routiers dans les zones gauche, droite et basse avant leur rendu.",
    ["interface-utilisateur", "widgets", "mise-en-page", "orchestration"],
    "la disposition des widgets routiers",
  ),
  "selfdrive/ui/onroad/starpilot/widget_style.py": info(
    "Centralise le style commun des widgets routiers, notamment l’arrondi et le dessin des cartes de contrôle.",
    ["interface-utilisateur", "widgets", "style", "rendu"],
    "le style partagé des widgets",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/__init__.py": info(
    "Réexporte l’API publique des widgets routiers et rassemble les implémentations disponibles derrière un point d’entrée unique.",
    ["barrel", "entry-point", "widgets", "interface-utilisateur"],
    "le paquet public des widgets routiers",
    "Barrel Python déclarant explicitement ses réexports dans __all__.",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/aethergauge.py": info(
    "Adapte AetherGauge au contrat LayoutWidget pour l’intégrer au gestionnaire de disposition routière.",
    ["interface-utilisateur", "widget", "jauge", "adaptateur"],
    "le widget AetherGauge",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/base.py": info(
    "Définit l’interface abstraite commune des widgets routiers, avec visibilité, taille, priorité et gestion du pointeur.",
    ["interface-utilisateur", "widget", "abstraction", "type-definition"],
    "le contrat de base des widgets routiers",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/driver_monitor.py": info(
    "Adapte l’indicateur de surveillance du conducteur au système de widgets routiers.",
    ["interface-utilisateur", "widget", "surveillance-conducteur", "adaptateur"],
    "le widget de surveillance du conducteur",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/model_source.py": info(
    "Affiche l’état de la source du modèle de conduite et signale les échecs du grand modèle dans un widget interactif.",
    ["interface-utilisateur", "widget", "modèle", "état"],
    "le widget d’état de la source modèle",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/pedal_icons.py": info(
    "Adapte les icônes de pédales au système de widgets et contrôle leur visibilité et leur taille.",
    ["interface-utilisateur", "widget", "pédales", "adaptateur"],
    "le widget des icônes de pédales",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/personality_button.py": info(
    "Adapte le bouton de personnalité de conduite au système de widgets routiers.",
    ["interface-utilisateur", "widget", "personnalité", "adaptateur"],
    "le widget de personnalité de conduite",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/set_speed.py": info(
    "Affiche la vitesse de consigne comme widget routier, avec visibilité et dimensions adaptées au layout.",
    ["interface-utilisateur", "widget", "vitesse-consigne", "rendu"],
    "le widget de vitesse de consigne",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/speed_limit.py": info(
    "Affiche la limite de vitesse comme widget routier et gère l’interaction ouvrant les détails de ses sources.",
    ["interface-utilisateur", "widget", "limite-vitesse", "interaction"],
    "le widget de limite de vitesse",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/steering_wheel.py": info(
    "Adapte l’icône de volant au système de widgets routiers.",
    ["interface-utilisateur", "widget", "volant", "adaptateur"],
    "le widget d’état du volant",
  ),
  "selfdrive/ui/onroad/starpilot/widgets/stopped_timer.py": info(
    "Chronomètre les arrêts, formate leur durée et remplace au besoin la vitesse courante par un widget dédié.",
    ["interface-utilisateur", "widget", "chronomètre", "arrêt"],
    "le widget de durée d’arrêt",
  ),
  "selfdrive/ui/ui_state.py": info(
    "Maintient l’état global de l’interface et du dispositif, dont les transitions onroad/offroad, l’engagement, la luminosité, la veille et les callbacks UI.",
    ["state-management", "interface-utilisateur", "dispositif", "cycle-de-vie"],
    "l’état global de l’interface et du dispositif",
  ),
  "starpilot/common/accel_profile.py": info(
    "Définit, normalise, interpole et sérialise les profils personnalisés d’accélération et de décélération utilisés par le contrôle longitudinal.",
    ["contrôle-longitudinal", "profil-accélération", "interpolation", "validation"],
    "les profils d’accélération personnalisés",
  ),
  "starpilot/common/assets/device_settings_layout.json": info(
    "Décrit le catalogue des réglages Galaxy par catégories, avec clés Params, libellés, types UI, dépendances, bornes et niveaux simple ou avancé.",
    ["configuration", "galaxy", "réglages", "schema-definition"],
    "le catalogue déclaratif des réglages Galaxy",
    "Grand tableau JSON déclaratif servant de source de vérité à l’interface de réglages du dispositif.",
  ),
};

const SPECIAL_CLASS_SUMMARIES = {
  Params: "Simule le stockage Params dans les tests afin de contrôler lectures, écritures et défaillances.",
  Car: "Orchestre les échanges entre l’interface véhicule, les contrôleurs, les messages CAN et les extensions StarPilot.",
  RedneckCruise: "Maintient la machine à états de Redneck Cruise et produit les commandes de boutons nécessaires à la vitesse cible.",
  Controls: "Exécute la boucle centrale des contrôles, calcule les actionneurs et publie leur état sous les contraintes de sécurité.",
  LaneCenteringController: "Maintient le filtre et les critères géométriques qui produisent la correction de centrage dans la voie.",
  LongControl: "Maintient l’état du contrôle longitudinal et calcule les sorties d’accélération selon le mode MPC ou historique.",
  CameraOffset: "Lisse une cible de décalage caméra et l’applique aux entrées du modèle.",
  ChestnutState: "Gère l’alimentation et la communication USB de l’accélérateur Chestnut utilisé par le modèle externe.",
  FrameMeta: "Regroupe les métadonnées temporelles associées à une frame d’inférence.",
  ModelState: "Prépare les entrées du modèle, exécute l’inférence et maintient les états récurrents et files de calcul.",
  Events: "Collecte les événements actifs et les convertit en alertes ou messages sérialisés.",
  Alert: "Représente une alerte conducteur avec priorité, texte, son, durée et comportement d’engagement.",
  SelfdriveD: "Supervise la boucle selfdrived, agrège les événements et publie l’état de conduite assistée.",
  UIState: "Fournit le singleton d’état UI et diffuse les transitions de conduite, d’engagement et de périphériques.",
  Device: "Contrôle la veille, la luminosité et l’interactivité de l’écran selon l’état routier et les alertes.",
};

function fileNodeType(file) {
  if (file.fileCategory === "config") return "config";
  if (file.fileCategory === "docs") return "document";
  if (file.fileCategory === "infra") {
    if (/\.github\/workflows\/|\.gitlab-ci|Jenkinsfile|\.circleci\//i.test(file.path)) return "pipeline";
    if (/\.tf(vars)?$|CloudFormation|Vagrantfile/i.test(file.path)) return "resource";
    return "service";
  }
  if (file.fileCategory === "data") {
    if (/\.sql$/i.test(file.path)) return "table";
    if (/openapi|swagger/i.test(file.path)) return "endpoint";
    return "schema";
  }
  return "file";
}

function fileNodeId(file) {
  return `${fileNodeType(file)}:${file.path}`;
}

function complexityFromLines(lines) {
  if (lines < 50) return "simple";
  if (lines <= 200) return "moderate";
  return "complex";
}

function uniqueTags(tags) {
  return [...new Set(tags)].slice(0, 5);
}

function symbolTags(name, kind, fileTags) {
  const lower = name.toLowerCase();
  let action;
  if (lower.startsWith("test_")) action = "test";
  else if (/draw|render/.test(lower)) action = "rendu";
  else if (/parse|decode|normalize|coerce|format|clean/.test(lower)) action = "transformation";
  else if (/get|read|load|fetch|resolve|select/.test(lower)) action = "accès-données";
  else if (/update|sync|refresh|set|put|save/.test(lower)) action = "mise-à-jour";
  else if (/is_|has_|should_|valid|allowed|ready/.test(lower)) action = "validation";
  else if (/alert/.test(lower)) action = "alerte";
  else if (/build|create|make|init/.test(lower)) action = "construction";
  else action = kind === "class" ? "composant" : "logique-métier";

  const typeTag = kind === "class" ? "classe" : "fonction";
  return uniqueTags([typeTag, action, ...fileTags]);
}

function functionSummary(name, role) {
  const lower = name.toLowerCase();
  if (name === "main") return `Démarre et maintient la boucle principale de ${role}.`;
  if (lower.startsWith("test_")) return `Vérifie le scénario de régression \`${name}\` pour ${role}.`;
  if (/alert$|_alert$/.test(lower)) return `Construit l’alerte \`${name}\` et ses paramètres pour ${role}.`;
  if (/^(draw_|_draw_|render_|_render_)/.test(lower)) return `Dessine l’élément graphique géré par \`${name}\` dans ${role}.`;
  if (/^(get_|_get_|calc_|_calc_|compute_|_compute_)/.test(lower)) return `Calcule ou récupère la valeur \`${name}\` utilisée par ${role}.`;
  if (/^(is_|_is_|has_|_has_|should_|_should_|.*_valid$|.*_ready$|.*_allowed$)/.test(lower)) return `Évalue la condition \`${name}\` afin de sécuriser ${role}.`;
  if (/^(update_|_update_|sync_|_sync_|refresh_|_refresh_|set_|_set_)/.test(lower)) return `Met à jour l’état associé à \`${name}\` pour ${role}.`;
  if (/^(load_|_load_|read_|_read_|fetch_|_fetch_)/.test(lower)) return `Charge les données requises par \`${name}\` pour ${role}.`;
  if (/^(parse_|_parse_|decode_|_decode_|normalize_|_normalize_|coerce_|_coerce_|format_|_format_|clean_|_clean_)/.test(lower)) return `Transforme et normalise les données via \`${name}\` pour ${role}.`;
  if (/^(build_|_build_|create_|_create_|make_|_make_|init_|_init_)/.test(lower)) return `Construit l’élément produit par \`${name}\` pour ${role}.`;
  if (/^(select_|_select_|resolve_|_resolve_)/.test(lower)) return `Sélectionne ou résout la valeur de \`${name}\` pour ${role}.`;
  if (/^(apply_|_apply_|limit_|_limit_|clamp_|_clamp_|snap_|_snap)/.test(lower)) return `Applique les contraintes de \`${name}\` dans ${role}.`;
  if (/callback/.test(lower)) return `Fournit le callback \`${name}\` utilisé par ${role}.`;
  if (/^(wait_|_wait_)/.test(lower)) return `Attend la condition gérée par \`${name}\` avant de poursuivre ${role}.`;
  return `Implémente l’opération \`${name}\` nécessaire à ${role}.`;
}

function classSummary(name, role) {
  if (SPECIAL_CLASS_SUMMARIES[name]) return SPECIAL_CLASS_SUMMARIES[name];
  if (/Alert$/.test(name)) return `Spécialise les données et le comportement de l’alerte \`${name}\` pour ${role}.`;
  if (/Layout$/.test(name)) return `Compose l’écran \`${name}\` et orchestre ses vues, commandes et interactions pour ${role}.`;
  if (/Renderer$/.test(name)) return `Assure le rendu \`${name}\` et transforme l’état courant en éléments graphiques pour ${role}.`;
  if (/Widget$/.test(name)) return `Fournit le widget \`${name}\`, avec visibilité, dimensions et rendu adaptés à ${role}.`;
  if (/View$/.test(name)) return `Implémente la vue interactive \`${name}\` pour ${role}.`;
  if (/Dialog$/.test(name)) return `Présente la boîte de dialogue \`${name}\` et gère ses interactions pour ${role}.`;
  if (/Controller$/.test(name)) return `Encapsule la logique et l’état de \`${name}\` pour ${role}.`;
  if (/State$/.test(name)) return `Conserve et met à jour l’état \`${name}\` utilisé par ${role}.`;
  if (/Tile$/.test(name)) return `Représente la tuile interactive \`${name}\` dans ${role}.`;
  if (/Button$/.test(name)) return `Implémente le bouton \`${name}\` et ses interactions dans ${role}.`;
  if (/Manager/.test(name)) return `Coordonne les opérations de \`${name}\` pour ${role}.`;
  if (/Colors$|Metrics$|Points$|Data$|Entry$|Info$|Row$|Section$|Variant$|Type$|Layer$|Effect$|Sizes$/.test(name)) {
    return `Structure les valeurs de \`${name}\` partagées par ${role}.`;
  }
  return `Regroupe l’état et les opérations de \`${name}\` pour ${role}.`;
}

function createGraph(batch, extraction) {
  const nodes = [];
  const edges = [];
  const resultByPath = new Map(extraction.results.map(result => [result.path, result]));

  for (const file of batch.files) {
    const result = resultByPath.get(file.path);
    if (!result) throw new Error(`Résultat d’extraction absent pour ${file.path}`);
    const meta = FILE_INFO[file.path];
    if (!meta) throw new Error(`Métadonnées sémantiques absentes pour ${file.path}`);

    const parentId = fileNodeId(file);
    const fileNode = {
      id: parentId,
      type: fileNodeType(file),
      name: path.posix.basename(file.path),
      filePath: file.path,
      summary: meta.summary,
      tags: meta.tags,
      complexity: complexityFromLines(result.nonEmptyLines),
    };
    if (meta.languageNotes) fileNode.languageNotes = meta.languageNotes;
    nodes.push(fileNode);

    if (file.fileCategory !== "code") continue;

    const exported = new Set((result.exports ?? []).map(item => item.name));
    for (const fn of result.functions ?? []) {
      const lineCount = fn.endLine - fn.startLine + 1;
      if (lineCount < 10 && !exported.has(fn.name)) continue;
      const id = `function:${file.path}:${fn.name}`;
      nodes.push({
        id,
        type: "function",
        name: fn.name,
        filePath: file.path,
        lineRange: [fn.startLine, fn.endLine],
        summary: functionSummary(fn.name, meta.role),
        tags: symbolTags(fn.name, "function", meta.tags),
        complexity: complexityFromLines(lineCount),
      });
      edges.push({source: parentId, target: id, type: "contains", direction: "forward", weight: 1.0});
      if (exported.has(fn.name)) {
        edges.push({source: parentId, target: id, type: "exports", direction: "forward", weight: 0.8});
      }
    }

    for (const cls of result.classes ?? []) {
      const lineCount = cls.endLine - cls.startLine + 1;
      if (lineCount < 20 && (cls.methods ?? []).length < 2 && !exported.has(cls.name)) continue;
      const id = `class:${file.path}:${cls.name}`;
      nodes.push({
        id,
        type: "class",
        name: cls.name,
        filePath: file.path,
        lineRange: [cls.startLine, cls.endLine],
        summary: classSummary(cls.name, meta.role),
        tags: symbolTags(cls.name, "class", meta.tags),
        complexity: complexityFromLines(lineCount),
      });
      edges.push({source: parentId, target: id, type: "contains", direction: "forward", weight: 1.0});
      if (exported.has(cls.name)) {
        edges.push({source: parentId, target: id, type: "exports", direction: "forward", weight: 0.8});
      }
    }
  }

  for (const file of batch.files) {
    if (file.fileCategory !== "code") continue;
    for (const target of batch.batchImportData[file.path] ?? []) {
      edges.push({
        source: `file:${file.path}`,
        target: `file:${target}`,
        type: "imports",
        direction: "forward",
        weight: 0.7,
      });
    }
  }

  return {nodes, edges};
}

const VALID_TYPES = new Set(["file", "function", "class", "config", "document", "service", "table", "endpoint", "pipeline", "schema", "resource"]);
const EDGE_WEIGHTS = new Map([
  ["contains", 1.0], ["imports", 0.7], ["calls", 0.8], ["inherits", 0.9], ["implements", 0.9], ["exports", 0.8],
  ["depends_on", 0.6], ["tested_by", 0.5], ["configures", 0.6], ["documents", 0.5], ["deploys", 0.7],
  ["migrates", 0.7], ["triggers", 0.6], ["defines_schema", 0.8], ["serves", 0.7], ["provisions", 0.7],
  ["routes", 0.6], ["related", 0.5],
]);

function validateWholeGraph(batch, extraction, graph) {
  const nodeIds = new Set();
  for (const node of graph.nodes) {
    if (!node.id || !VALID_TYPES.has(node.type) || !node.name || !node.summary || !Array.isArray(node.tags) || node.tags.length < 3 || !["simple", "moderate", "complex"].includes(node.complexity)) {
      throw new Error(`Nœud invalide: ${JSON.stringify(node)}`);
    }
    if (nodeIds.has(node.id)) throw new Error(`Nœud dupliqué: ${node.id}`);
    nodeIds.add(node.id);
    if (["function", "class"].includes(node.type) && (!Array.isArray(node.lineRange) || node.lineRange.length !== 2)) {
      throw new Error(`lineRange absent: ${node.id}`);
    }
  }

  for (const file of batch.files) {
    const expected = fileNodeId(file);
    if (!nodeIds.has(expected)) throw new Error(`Nœud fichier absent: ${expected}`);
  }

  const expectedSymbolIds = new Set();
  for (const result of extraction.results) {
    const exported = new Set((result.exports ?? []).map(item => item.name));
    for (const fn of result.functions ?? []) {
      if (fn.endLine - fn.startLine + 1 >= 10 || exported.has(fn.name)) expectedSymbolIds.add(`function:${result.path}:${fn.name}`);
    }
    for (const cls of result.classes ?? []) {
      if (cls.endLine - cls.startLine + 1 >= 20 || (cls.methods ?? []).length >= 2 || exported.has(cls.name)) expectedSymbolIds.add(`class:${result.path}:${cls.name}`);
    }
  }
  for (const id of expectedSymbolIds) if (!nodeIds.has(id)) throw new Error(`Symbole significatif absent: ${id}`);

  const edgeKeys = new Set();
  for (const edge of graph.edges) {
    if (!edge.source || !edge.target || edge.source === edge.target || edge.direction !== "forward" || !EDGE_WEIGHTS.has(edge.type) || edge.weight !== EDGE_WEIGHTS.get(edge.type)) {
      throw new Error(`Arête invalide: ${JSON.stringify(edge)}`);
    }
    const key = JSON.stringify(edge);
    if (edgeKeys.has(key)) throw new Error(`Arête dupliquée: ${key}`);
    edgeKeys.add(key);
  }

  const actualImports = graph.edges.filter(edge => edge.type === "imports");
  const expectedImports = [];
  for (const file of batch.files) {
    if (file.fileCategory !== "code") continue;
    for (const target of batch.batchImportData[file.path] ?? []) {
      expectedImports.push(`file:${file.path}->file:${target}`);
    }
  }
  const actualKeys = actualImports.map(edge => `${edge.source}->${edge.target}`).sort();
  const expectedKeys = expectedImports.sort();
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) {
    throw new Error(`Imports non conformes pour le lot ${batch.batchIndex}: attendus ${JSON.stringify(expectedKeys)}, obtenus ${JSON.stringify(actualKeys)}`);
  }
}

function partitionGraph(batch, graph) {
  const partCount = Math.ceil(Math.max(graph.nodes.length / 60, graph.edges.length / 120));
  if (partCount <= 1) return [graph];
  const sortedPaths = batch.files.map(file => file.path).sort((a, b) => a.localeCompare(b));
  const chunkSize = Math.ceil(sortedPaths.length / partCount);
  const parts = [];
  for (let offset = 0; offset < sortedPaths.length; offset += chunkSize) {
    const filePaths = new Set(sortedPaths.slice(offset, offset + chunkSize));
    const nodes = graph.nodes.filter(node => filePaths.has(node.filePath));
    const sourceIds = new Set(nodes.map(node => node.id));
    const edges = graph.edges.filter(edge => sourceIds.has(edge.source));
    parts.push({nodes, edges});
  }
  return parts;
}

function validatePart(batch, part, partNumber) {
  const localIds = new Set(part.nodes.map(node => node.id));
  const importPaths = new Set(Object.values(batch.batchImportData).flat());
  const neighborFiles = new Set(Object.keys(batch.neighborMap ?? {}));
  const neighborSymbols = new Set();
  for (const [neighborPath, value] of Object.entries(batch.neighborMap ?? {})) {
    for (const symbol of value.symbols ?? []) {
      neighborSymbols.add(`function:${neighborPath}:${symbol}`);
      neighborSymbols.add(`class:${neighborPath}:${symbol}`);
    }
  }
  for (const edge of part.edges) {
    if (!localIds.has(edge.source)) throw new Error(`Partie ${partNumber}: source externe interdite ${edge.source}`);
    const targetAllowed = localIds.has(edge.target)
      || (edge.target.startsWith("file:") && (importPaths.has(edge.target.slice(5)) || neighborFiles.has(edge.target.slice(5))))
      || neighborSymbols.has(edge.target);
    if (!targetAllowed) throw new Error(`Partie ${partNumber}: cible non résolue ${edge.target}`);
  }
}

const batchesDoc = JSON.parse(fs.readFileSync(BATCHES_PATH, "utf8"));
const report = [];

for (const batchIndex of BATCH_INDICES) {
  const batch = batchesDoc.batches.find(item => item.batchIndex === batchIndex);
  if (!batch) throw new Error(`Lot ${batchIndex} absent de batches.json`);
  const extractionPath = path.join(UA_DIR, "tmp", `ua-file-extract-results-${batchIndex}.json`);
  const extraction = JSON.parse(fs.readFileSync(extractionPath, "utf8"));
  if (!extraction.scriptCompleted || extraction.filesUnreadable.length || extraction.results.length !== batch.files.length) {
    throw new Error(`Extraction incomplète pour le lot ${batchIndex}`);
  }

  const graph = createGraph(batch, extraction);
  validateWholeGraph(batch, extraction, graph);
  const parts = partitionGraph(batch, graph);

  const outputDir = path.join(UA_DIR, "intermediate");
  const stalePattern = new RegExp(`^batch-${batchIndex}(?:-part-\\d+)?\\.json$`);
  for (const name of fs.readdirSync(outputDir)) {
    if (stalePattern.test(name)) fs.unlinkSync(path.join(outputDir, name));
  }

  const written = [];
  for (let index = 0; index < parts.length; index += 1) {
    const part = parts[index];
    validatePart(batch, part, index + 1);
    const name = parts.length === 1 ? `batch-${batchIndex}.json` : `batch-${batchIndex}-part-${index + 1}.json`;
    const outputPath = path.join(outputDir, name);
    fs.writeFileSync(outputPath, JSON.stringify(part, null, 2) + "\n");
    const reread = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    if (!Array.isArray(reread.nodes) || !Array.isArray(reread.edges)) throw new Error(`JSON relu invalide: ${name}`);
    validatePart(batch, reread, index + 1);
    written.push(name);
  }

  const rereadNodeCount = written.reduce((count, name) => count + JSON.parse(fs.readFileSync(path.join(outputDir, name), "utf8")).nodes.length, 0);
  const rereadEdgeCount = written.reduce((count, name) => count + JSON.parse(fs.readFileSync(path.join(outputDir, name), "utf8")).edges.length, 0);
  if (rereadNodeCount !== graph.nodes.length || rereadEdgeCount !== graph.edges.length) {
    throw new Error(`Totaux relus incorrects pour le lot ${batchIndex}`);
  }

  report.push({
    batchIndex,
    parts: written,
    nodes: graph.nodes.length,
    edges: graph.edges.length,
    imports: graph.edges.filter(edge => edge.type === "imports").length,
    skipped: extraction.filesSkipped,
  });
}

console.log(JSON.stringify(report, null, 2));
