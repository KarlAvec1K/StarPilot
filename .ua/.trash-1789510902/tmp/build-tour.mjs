import fs from "node:fs";
import path from "node:path";

const uaDir = "C:/Users/karlp/Documents/ChatGPT/StarPilot/.ua";
const resultsPath = path.join(uaDir, "tmp", "ua-tour-results.json");
const outputPath = path.join(uaDir, "intermediate", "tour.json");
const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"));

const tour = [
  {
    order: 1,
    title: "Contexte StarPilot",
    description: "Commencez par situer StarPilot comme un fork personnalisé d’openpilot construit sur FrogPilot, puis distinguez le système d’aide à la conduite du portail Web Galaxy. Les deux README présentent le périmètre général et l’architecture Flask/Arrow.js de Galaxy. Pour un Subaru Ascent 2021 équipé d’un Comma 4, ce cadre donne le vocabulaire nécessaire avant d’interpréter les options avancées.",
    nodeIds: [
      "document:README.md",
      "document:starpilot/system/the_galaxy/README.md",
    ],
  },
  {
    order: 2,
    title: "Contrat des réglages",
    description: "Le catalogue JSON décrit les sections Galaxy, les clés Params, les contrôles UI, les dépendances et les niveaux simple ou avancé. Le registre central fixe ensuite les types, valeurs par défaut et règles de persistance de ces clés, tandis que l’outil d’audit rapproche le registre des références UI. Cette étape établit la source de vérité à consulter avant de juger si une option devrait être proposée sur le véhicule.",
    nodeIds: [
      "config:starpilot/common/assets/device_settings_layout.json",
      "file:common/params_keys.h",
      "file:tools/StarPilot/derive_feasible_params.py",
    ],
    languageLesson: "Le JSON sert ici de schéma déclaratif : le frontend interprète des métadonnées plutôt que de coder chaque réglage en dur, tandis que le registre C++ garantit l’existence et le type des Params.",
  },
  {
    order: 3,
    title: "Filtrage avancé Galaxy",
    description: "À partir du contrat précédent, les modules de paramètres décident quels réglages sont structurellement valides, compatibles avec le constructeur et autorisés par le mode développeur. Les fonctions de visibilité combinent notamment capacités, marque du véhicule et niveau avancé, puis distinguent une option réellement incompatible d’une option simplement masquée. Pour l’Ascent, c’est le point clé pour comprendre pourquoi le menu Galaxy varie selon le contexte détecté.",
    nodeIds: [
      "file:starpilot/system/the_galaxy/assets/components/tools/device_settings.js",
      "file:starpilot/system/the_galaxy/assets/mobile/js/params.js",
      "function:starpilot/system/the_galaxy/assets/mobile/js/params.js:isSettingVisible",
      "function:starpilot/system/the_galaxy/assets/mobile/js/params.js:isVehicleSettingVisible",
      "function:starpilot/system/the_galaxy/assets/mobile/js/params.js:isAdvancedHiddenByDeveloperMode",
    ],
    languageLesson: "Les ES modules isolent ici les règles pures de filtrage du rendu : une même décision de visibilité peut ainsi être réutilisée par plusieurs interfaces Galaxy.",
  },
  {
    order: 4,
    title: "Flux du frontend Galaxy",
    description: "Une fois les réglages filtrés, la vue Settings charge le catalogue et les valeurs, ParamSections organise les catégories et SettingTree rend la hiérarchie. Le client api.js concentre les appels HTTP et possède le fan-in le plus élevé du graphe, ce qui en fait le passage commun entre les écrans et le serveur. Suivre ces quatre nœuds montre le trajet d’un choix utilisateur depuis le menu avancé jusqu’à la requête réseau.",
    nodeIds: [
      "file:starpilot/system/the_galaxy/assets/mobile/js/views/Settings.js",
      "file:starpilot/system/the_galaxy/assets/mobile/js/components/ParamSections.js",
      "file:starpilot/system/the_galaxy/assets/mobile/js/components/SettingTree.js",
      "file:starpilot/system/the_galaxy/assets/mobile/js/api.js",
    ],
  },
  {
    order: 5,
    title: "API et persistance Galaxy",
    description: "the_galaxy.py est le point d’entrée Flask qui expose les réglages, modèles, diagnostics et opérations de l’appareil. ParamsCompat unifie les lectures et écritures, tandis que les helpers de métadonnées, coercition et snapshot protègent le passage entre JSON, types Params et état runtime. Cette couche explique comment une modification du portail devient une valeur persistée sans contourner les contraintes du catalogue.",
    nodeIds: [
      "file:starpilot/system/the_galaxy/the_galaxy.py",
      "class:starpilot/system/the_galaxy/the_galaxy.py:ParamsCompat",
      "function:starpilot/system/the_galaxy/the_galaxy.py:_get_layout_param_metadata",
      "function:starpilot/system/the_galaxy/the_galaxy.py:_coerce_param_value",
      "function:starpilot/system/the_galaxy/the_galaxy.py:_get_starpilot_toggles_snapshot",
    ],
    languageLesson: "L’adapter ParamsCompat masque les différences de représentation et offre au serveur Flask une frontière typée pour lire, convertir et écrire les valeurs du dispositif.",
  },
  {
    order: 6,
    title: "Chargement du runtime",
    description: "Après l’écriture, StarPilotVariables centralise les capacités et construit l’objet de réglages consommé par les processus de conduite. get_starpilot_toggles fournit le snapshot, les migrations rendent les anciennes valeurs compatibles et manager orchestre leur chargement au démarrage. C’est la charnière où une option Galaxy cesse d’être seulement une préférence UI et devient un comportement actif du runtime.",
    nodeIds: [
      "file:starpilot/common/starpilot_variables.py",
      "class:starpilot/common/starpilot_variables.py:StarPilotVariables",
      "function:starpilot/common/starpilot_variables.py:get_starpilot_toggles",
      "file:system/manager/launch_param_migrations.py",
      "file:system/manager/manager.py",
    ],
    languageLesson: "Le pattern Params sépare stockage persistant, migrations et snapshots en mémoire afin que les boucles temps réel lisent un état cohérent plutôt que l’interface directement.",
  },
  {
    order: 7,
    title: "Chaîne de contrôle latéral",
    description: "La chaîne latérale commence par modeld, qui produit la trajectoire, puis controlsd transforme cette intention en commande de conduite. Le centrage de voie, le feedforward neuronal et le contrôleur de vitesse en courbe ajoutent des corrections spécialisées avant l’action véhicule. Cette lecture permet de relier les options avancées de direction aux modules qui influencent réellement la trajectoire sur l’Ascent.",
    nodeIds: [
      "file:selfdrive/modeld/modeld.py",
      "file:selfdrive/controls/controlsd.py",
      "file:selfdrive/controls/lib/lane_centering.py",
      "file:starpilot/controls/lib/neural_network_feedforward.py",
      "file:starpilot/controls/lib/curve_speed_controller.py",
    ],
  },
  {
    order: 8,
    title: "Chaîne de contrôle longitudinal",
    description: "En parallèle, StarPilotPlanner coordonne les cibles longitudinales et longcontrol gère les transitions, le PID et les arrêts. Le contrôleur de limite de vitesse fusionne les sources cartographiques et visuelles, tandis que les modes Conditional Experimental et Conditional Chill sélectionnent le comportement selon la scène. Cette étape montre où aboutissent les réglages Galaxy qui modifient vitesse, suivi et choix de mode.",
    nodeIds: [
      "file:starpilot/controls/starpilot_planner.py",
      "file:selfdrive/controls/lib/longcontrol.py",
      "file:starpilot/controls/lib/speed_limit_controller.py",
      "file:starpilot/controls/lib/conditional_experimental_mode.py",
      "file:starpilot/controls/lib/conditional_chill_mode.py",
    ],
  },
  {
    order: 9,
    title: "Intégration Subaru Ascent",
    description: "Les choix génériques sont ensuite spécialisés par la couche Subaru : values décrit les plateformes et limites, puis interface sélectionne le tuning et les capacités de sécurité. carstate décode les bus CAN, carcontroller produit les commandes et subarucan construit les trames attendues par EyeSight et les actionneurs. Pour un Ascent 2021, cette frontière est celle qui décide si une option avancée est techniquement applicable au véhicule, indépendamment du fait qu’elle soit visible dans Galaxy.",
    nodeIds: [
      "file:opendbc_repo/opendbc/car/subaru/values.py",
      "file:opendbc_repo/opendbc/car/subaru/interface.py",
      "file:opendbc_repo/opendbc/car/subaru/carstate.py",
      "file:opendbc_repo/opendbc/car/subaru/carcontroller.py",
      "file:opendbc_repo/opendbc/car/subaru/subarucan.py",
    ],
    languageLesson: "L’architecture opendbc sépare la description statique de plateforme, le décodage d’état et l’émission CAN ; cette séparation rend explicites les frontières de compatibilité et de sécurité.",
  },
  {
    order: 10,
    title: "Interface embarquée Comma 4",
    description: "Les réglages développeur existent aussi dans l’interface embarquée, avec une variante mici et les composants AetherGrid propres à StarPilot. ui_state maintient le contexte onroad ou offroad, tandis qu’AetherGauge rend sur la route certains effets des contrôleurs précédents. Comparer cette surface au portail Galaxy évite de confondre un réglage absent de l’écran Comma 4 avec un réglage absent du runtime.",
    nodeIds: [
      "file:selfdrive/ui/layouts/settings/developer.py",
      "file:selfdrive/ui/mici/layouts/settings/developer.py",
      "file:selfdrive/ui/layouts/settings/starpilot/aethergrid.py",
      "file:selfdrive/ui/ui_state.py",
      "file:selfdrive/ui/onroad/starpilot/aethergauge.py",
    ],
  },
  {
    order: 11,
    title: "Tests des réglages avancés",
    description: "Terminez par les tests qui recoupent le catalogue avec le registre, vérifient le filtrage avancé et protègent les contrats du frontend mobile. La suite du mode longitudinal contrôle séparément les transitions et les échecs de lecture ou d’écriture, tandis que le test des niveaux simple et avancé fixe l’intention du menu. Ces validations couvrent le contrat logiciel de Galaxy, sans remplacer une vérification véhicule prudente sur l’Ascent.",
    nodeIds: [
      "file:starpilot/system/the_galaxy/tests/test_device_settings_layout.py",
      "file:starpilot/system/the_galaxy/tests/test_device_settings_frontend.py",
      "file:starpilot/system/the_galaxy/tests/test_ui_vue_frontend.py",
      "file:starpilot/system/the_galaxy/tests/test_longitudinal_mode.py",
      "function:starpilot/system/the_galaxy/tests/test_device_settings_layout.py:test_requested_simple_and_advanced_settings_tiers",
    ],
  },
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(results.scriptCompleted === true, "L’analyse topologique n’est pas complète");
assert(tour.length >= 5 && tour.length <= 15, `Nombre d’étapes invalide: ${tour.length}`);
const seenNodeIds = new Set();
for (let index = 0; index < tour.length; index += 1) {
  const step = tour[index];
  assert(step.order === index + 1, `Ordre invalide à l’étape ${index + 1}`);
  const titleWords = step.title.trim().split(/\s+/).length;
  assert(titleWords >= 2 && titleWords <= 5, `Titre hors limites: ${step.title}`);
  assert(typeof step.description === "string" && step.description.trim().length > 0, `Description vide à l’étape ${step.order}`);
  const sentences = (step.description.match(/[.!?](?:\s|$)/g) || []).length;
  assert(sentences >= 2 && sentences <= 4, `Description de l’étape ${step.order}: ${sentences} phrases`);
  assert(Array.isArray(step.nodeIds) && step.nodeIds.length >= 1 && step.nodeIds.length <= 5, `nodeIds invalides à l’étape ${step.order}`);
  for (const nodeId of step.nodeIds) {
    assert(Object.hasOwn(results.nodeSummaryIndex, nodeId), `ID absent du graphe: ${nodeId}`);
    assert(!seenNodeIds.has(nodeId), `ID répété dans le tour: ${nodeId}`);
    seenNodeIds.add(nodeId);
  }
  if (step.languageLesson !== undefined) assert(typeof step.languageLesson === "string" && step.languageLesson.trim().length > 0, `languageLesson vide à l’étape ${step.order}`);
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(tour, null, 2)}\n`, "utf8");

const readBack = JSON.parse(fs.readFileSync(outputPath, "utf8"));
assert(Array.isArray(readBack) && readBack.length === tour.length, "Lecture de contrôle de tour.json échouée");
console.log(JSON.stringify({ outputPath, steps: readBack.length, titles: readBack.map((step) => step.title), referencedNodes: seenNodeIds.size }, null, 2));
