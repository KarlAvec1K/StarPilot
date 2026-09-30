import fs from "node:fs";
import path from "node:path";

const projectRoot = "C:/Users/karlp/Documents/ChatGPT/StarPilot";
const uaDir = path.join(projectRoot, ".ua");
const tmpDir = path.join(uaDir, "tmp");
const outputDir = path.join(uaDir, "intermediate");
const batchIndexes = [9, 10, 11];

const meta = {
  "starpilot/common/connect_server.py": {
    summary: "Prépare les bascules entre le serveur stock et Konik en conservant, restaurant ou régénérant l’identifiant de l’appareil dans les Params actifs et leur cache.",
    tags: ["serveur", "identite-appareil", "parametres", "synchronisation"],
  },
  "starpilot/common/controller_actions.py": {
    summary: "Centralise le catalogue des actions assignables aux favoris et aux contrôleurs externes, ainsi que leurs compteurs et bornes de vitesse.",
    tags: ["actions", "controleur", "favoris", "configuration"],
  },
  "starpilot/common/cpu_throttle.py": {
    summary: "Évalue la charge des cœurs CPU en ligne et produit un facteur de ralentissement stable pour protéger les traitements d’arrière-plan.",
    tags: ["cpu", "performance", "limitation", "telemetrie"],
  },
  "starpilot/common/experimental_state.py": {
    summary: "Normalise, persiste et restaure les états manuels ou conditionnels des modes Experimental et Chill entre les Params persistants et mémoire.",
    tags: ["etat", "mode-experimental", "mode-chill", "parametres"],
  },
  "starpilot/common/favorite_slots.py": {
    summary: "Construit et valide les emplacements favoris, lit leurs valeurs de Params et exécute de façon contrôlée les réglages ou actions qui leur sont assignés.",
    tags: ["favoris", "parametres", "validation", "actions"],
  },
  "starpilot/common/gpu_model_ready_sound.py": {
    summary: "Suit le chargement du modèle GPU et expose une courte fenêtre de notification sonore sans supplanter les alertes de conduite.",
    tags: ["gpu", "notification", "modele", "etat"],
  },
  "starpilot/common/lateral_delay.py": {
    summary: "Calcule le délai latéral complet en ajoutant au délai du véhicule la latence logicielle fixe de la chaîne de contrôle.",
    tags: ["controle-lateral", "latence", "calcul"],
  },
  "starpilot/common/lateral_only_experimental.py": {
    summary: "Définit l’allowlist des véhicules pouvant exposer Experimental Mode pour le contrôle latéral tout en conservant l’ACC longitudinal stock.",
    tags: ["controle-lateral", "mode-experimental", "compatibilite", "securite"],
  },
  "starpilot/common/longitudinal_mode.py": {
    summary: "Fournit un verrou latéral et des lectures cohérentes des Params qui sélectionnent les modes longitudinaux concurrents.",
    tags: ["controle-longitudinal", "verrouillage", "parametres", "coherence"],
  },
  "starpilot/common/longitudinal_personality_profiles.py": {
    summary: "Définit le schéma versionné des personnalités longitudinales, leurs migrations et l’interpolation des courbes d’accélération, de freinage et de suivi.",
    tags: ["personnalites", "controle-longitudinal", "migration", "interpolation"],
  },
  "starpilot/common/maps_catalog.py": {
    summary: "Décrit le catalogue géographique et les cadences de téléchargement des cartes, puis transforme les sélections enregistrées en entrées affichables.",
    tags: ["cartographie", "catalogue", "telechargement", "configuration"],
  },
  "starpilot/common/maps_download_progress.py": {
    summary: "Estime la taille et la durée des téléchargements cartographiques et maintient un cache réconcilié de l’espace occupé par chaque sélection.",
    tags: ["cartographie", "progression", "cache", "stockage"],
  },
  "starpilot/common/maps_selection.py": {
    summary: "Normalise les sélections cartographiques actuelles et historiques vers des identifiants de pays ou d’États américains stables.",
    tags: ["cartographie", "normalisation", "compatibilite", "selection"],
  },
  "starpilot/common/model_lab.py": {
    summary: "Valide les paires de modèles latéral et longitudinal du Model Lab et fusionne leurs tenseurs de sortie en une prédiction hybride cohérente.",
    tags: ["model-lab", "modele", "validation", "fusion"],
  },
  "starpilot/common/model_versions.py": {
    summary: "Interprète les versions de modèles et choisit les formats et noms d’artefacts de conduite compatibles avec chaque génération.",
    tags: ["modele", "version", "artefact", "compatibilite"],
  },
  "starpilot/common/param_profiles.py": {
    summary: "Sauvegarde, valide et restaure des profils typés de Params dans des emplacements bornés, avec migration des anciennes clés.",
    tags: ["parametres", "profil", "serialisation", "migration"],
  },
  "starpilot/common/safe_mode.py": {
    summary: "Applique un ensemble prudent de réglages après sauvegarde des valeurs courantes, puis permet leur restauration contrôlée.",
    tags: ["mode-securise", "parametres", "sauvegarde", "restauration"],
  },
  "starpilot/common/starpilot_backups.py": {
    summary: "Crée et fait tourner les sauvegardes compressées de StarPilot et de ses réglages, avec contrôle de taille et état de résultat.",
    tags: ["sauvegarde", "compression", "rotation", "stockage"],
  },
  "starpilot/common/starpilot_download_utilities.py": {
    summary: "Gère les téléchargements HTTP reprenables des ressources StarPilot, leur progression, les limites GitHub et la vérification finale.",
    tags: ["telechargement", "http", "verification", "progression"],
  },
  "starpilot/common/starpilot_functions.py": {
    summary: "Orchestre les opérations de démarrage et d’installation StarPilot, l’enregistrement de l’appareil et les mises à jour des cartes ou du logiciel.",
    tags: ["demarrage", "installation", "mise-a-jour", "orchestration"],
  },
  "starpilot/common/starpilot_utilities.py": {
    summary: "Regroupe les utilitaires partagés de géométrie routière, fichiers, commandes système, diagnostic matériel et coordination de tâches.",
    tags: ["utility", "geometrie", "systeme", "orchestration"],
  },
  "starpilot/common/starpilot_variables.py": {
    summary: "Centralise les constantes, migrations et capacités StarPilot, puis construit l’état complet des réglages consommé par le runtime.",
    tags: ["configuration", "capacites", "parametres", "etat-runtime"],
  },
  "starpilot/common/testing_grounds.py": {
    summary: "Charge le schéma des Testing Grounds et expose une sélection expérimentale typée, mise en cache et accessible par espace de noms.",
    tags: ["experimentation", "configuration", "cache", "selection"],
  },
  "starpilot/common/theme_asset_names.py": {
    summary: "Canonicalise les noms d’assets de thème et retrouve le meilleur fichier correspondant malgré les variantes de ponctuation ou de signature.",
    tags: ["theme", "assets", "normalisation", "recherche"],
  },
  "starpilot/common/vision_bsm.py": {
    summary: "Lit l’état V-ASM du moniteur d’angle mort et rejette toute observation trop ancienne ou temporellement incohérente.",
    tags: ["vision", "angle-mort", "fraicheur", "securite"],
  },
  "starpilot/controls/lib/conditional_chill_mode.py": {
    summary: "Implémente la machine d’état du Conditional Chill Mode à partir de la vitesse, des véhicules voisins, des arrêts et des confirmations temporelles.",
    tags: ["mode-chill", "controle-longitudinal", "machine-etat", "detection"],
  },
  "starpilot/controls/lib/conditional_experimental_mode.py": {
    summary: "Active ou désactive conditionnellement Experimental Mode selon les courbes, véhicules lents, arrêts, intersections et choix manuels du conducteur.",
    tags: ["mode-experimental", "controle-longitudinal", "machine-etat", "detection"],
  },
  "starpilot/controls/lib/curve_speed_controller.py": {
    summary: "Apprend une courbe d’accélération latérale et calcule une vitesse cible de virage tout en gérant les dérogations manuelles.",
    tags: ["vitesse-virage", "apprentissage", "controle-longitudinal", "calibration"],
  },
  "starpilot/controls/lib/neural_network_feedforward.py": {
    summary: "Charge et évalue un réseau feedforward pour prédire la commande latérale, avec adaptation des paramètres de friction et de délai.",
    tags: ["reseau-neuronal", "feedforward", "controle-lateral", "modele"],
  },
  "starpilot/controls/lib/speed_limit_controller.py": {
    summary: "Fusionne les limites de vitesse cartographiques et visuelles, applique les décalages et gère les confirmations ainsi que les overrides du conducteur.",
    tags: ["limite-vitesse", "controle-longitudinal", "cartographie", "override"],
  },
  "starpilot/controls/lib/starpilot_acceleration.py": {
    summary: "Calcule les bornes d’accélération et de décélération selon les profils, le véhicule de tête, le SLC et les modes pulse-and-glide.",
    tags: ["acceleration", "controle-longitudinal", "profil", "interpolation"],
  },
  "starpilot/controls/lib/starpilot_events.py": {
    summary: "Produit les événements et alertes StarPilot à partir de l’état de conduite, des forces mesurées et des fonctions activées.",
    tags: ["evenement", "alerte", "conduite", "securite"],
  },
  "starpilot/controls/lib/starpilot_following.py": {
    summary: "Ajuste les distances de suivi et les marges de changement de voie selon la personnalité active, la vitesse et les véhicules de tête.",
    tags: ["distance-suivi", "controle-longitudinal", "personnalites", "changement-voie"],
  },
  "starpilot/controls/lib/starpilot_vcruise.py": {
    summary: "Détermine la vitesse de croisière StarPilot à partir des virages, de la navigation, des limites de vitesse et du contexte des véhicules de tête.",
    tags: ["vitesse-croisiere", "navigation", "limite-vitesse", "controle-longitudinal"],
  },
  "starpilot/controls/lib/weather_checker.py": {
    summary: "Interroge et met en cache les conditions météo proches afin de fournir des offsets exploitables par la logique de conduite.",
    tags: ["meteo", "cache", "geolocalisation", "api"],
  },
  "starpilot/controls/starpilot_card.py": {
    summary: "Intègre les boutons du véhicule, favoris et contrôleurs externes dans CarState pour piloter les modes et actions StarPilot.",
    tags: ["carstate", "boutons", "controleur", "actions"],
  },
  "starpilot/controls/starpilot_planner.py": {
    summary: "Coordonne les contrôleurs StarPilot, met à jour le plan longitudinal et publie les états et cibles calculés aux autres processus.",
    tags: ["planificateur", "controle-longitudinal", "publication", "orchestration"],
  },
  "starpilot/system/adj_spot_monitor_vision.py": {
    summary: "Exécute le daemon vision V-ASM qui analyse les caméras latérales pour publier l’état des zones adjacentes en respectant les limites CPU.",
    tags: ["vision", "angle-mort", "daemon", "camera"],
  },
  "starpilot/system/speed_limit_filler.py": {
    summary: "Enrichit un jeu de données de limites de vitesse à partir du GPS et d’Overpass, avec cache spatial, quotas et validation des segments.",
    tags: ["limite-vitesse", "overpass", "geolocalisation", "jeu-donnees"],
  },
  "starpilot/system/speed_limit_vision.py": {
    summary: "Pilote la détection visuelle des panneaux de vitesse par modèle, OCR et suivi optique, puis publie les résultats et captures de diagnostic.",
    tags: ["limite-vitesse", "vision", "ocr", "daemon", "diagnostic"],
    languageNotes: "Le module combine OpenCV, suivi temporel, classification et plusieurs stratégies de repli autour d’un daemon Python long-lived.",
  },
  "starpilot/system/the_galaxy/README.md": {
    summary: "Présente l’architecture de The Galaxy, son API Flask, son frontend Arrow.js sans build et les procédures d’installation, d’exécution et de contribution.",
    tags: ["documentation", "galaxy", "api", "frontend"],
  },
  "starpilot/system/the_galaxy/assets/components/settings.js": {
    summary: "Construit la vue de navigation des réglages Galaxy et délègue l’ouverture des sections au routeur global sans créer de second module.",
    tags: ["galaxy", "frontend", "navigation", "component"],
    languageNotes: "Composant ES module fondé sur Arrow.js et chargé directement par le navigateur.",
  },
  "starpilot/system/the_galaxy/assets/components/tools/device_settings.js": {
    summary: "Implémente l’interface classique complète des réglages Galaxy : layout dynamique, Params, favoris, valeurs numériques et profils de personnalité.",
    tags: ["galaxy", "frontend", "parametres", "favoris", "personnalites"],
    languageNotes: "Grand composant Arrow.js réactif, découpé en fonctions de synchronisation, validation et rendu sans étape de build.",
  },
  "starpilot/system/the_galaxy/assets/components/tools/speed_limits.js": {
    summary: "Affiche l’état du traitement des limites de vitesse dans Galaxy et permet de déclencher immédiatement une passe de traitement.",
    tags: ["galaxy", "frontend", "limite-vitesse", "api"],
  },
  "starpilot/system/the_galaxy/assets/components/tools/tuning.js": {
    summary: "Fournit l’interface Galaxy du FLM pour sélectionner des routes, lancer l’analyse, comparer des profils, commenter les résultats et gérer les tunes sauvegardés.",
    tags: ["galaxy", "frontend", "flm", "tuning", "visualisation"],
  },
  "starpilot/system/the_galaxy/assets/components/tools/vehicle_features.js": {
    summary: "Présente les outils véhicule Galaxy et vérifie à la demande la disponibilité des commandes de portes et du gestionnaire TSK.",
    tags: ["galaxy", "frontend", "vehicule", "outils"],
  },
  "starpilot/system/the_galaxy/assets/components/tools/wheel_controls.js": {
    summary: "Gère l’interface Galaxy de découverte, apprentissage, test et assignation des commandes au volant ou contrôleurs externes.",
    tags: ["galaxy", "frontend", "controleur", "mapping", "test"],
  },
  "starpilot/system/the_galaxy/assets/mobile/js/components/FeatureHelp.js": {
    summary: "Crée une boîte de dialogue d’aide accessible et injecte ses styles pour afficher les explications détaillées des fonctions Galaxy.",
    tags: ["galaxy", "frontend", "aide", "dialogue"],
  },
  "starpilot/system/the_galaxy/flm_workspace.py": {
    summary: "Gère l’espace de travail FLM : analyse de routes, diagnostic du comportement latéral, recommandations, profils d’essai, feedback et tunes persistants.",
    tags: ["flm", "tuning", "analyse-route", "profil", "workspace"],
  },
  "starpilot/system/the_galaxy/longitudinal_mode.py": {
    summary: "Expose un adaptateur transactionnel pour lire et modifier les modes longitudinaux Galaxy sous verrou, avec détection des conflits et snapshots cohérents.",
    tags: ["galaxy", "controle-longitudinal", "api", "verrouillage"],
  },
  "starpilot/system/the_galaxy/tests/test_device_settings_frontend.py": {
    summary: "Vérifie statiquement que l’interface Device Settings affiche les réglages avancés, respecte le contexte véhicule et conserve les contrôles numériques attendus.",
    tags: ["test", "galaxy", "frontend", "parametres"],
  },
  "starpilot/system/the_galaxy/tests/test_device_settings_layout.py": {
    summary: "Valide le layout JSON des réglages Galaxy contre le registre Params, les valeurs par défaut, les groupes et les contraintes de visibilité.",
    tags: ["test", "galaxy", "schema", "parametres", "validation"],
  },
  "starpilot/system/the_galaxy/tests/test_following_preset_defaults_api.py": {
    summary: "Teste l’API des presets de suivi afin de garantir leur concordance avec les courbes de référence et leur conversion en valeurs personnalisées.",
    tags: ["test", "api", "personnalites", "distance-suivi"],
  },
  "starpilot/system/the_galaxy/tests/test_personality_profiles_api.py": {
    summary: "Couvre l’API Galaxy des profils de personnalité, notamment les migrations, validations, presets, courbes personnalisées et écritures Params.",
    tags: ["test", "api", "personnalites", "migration", "validation"],
  },
  "starpilot/system/the_galaxy/tests/test_ui_vue_frontend.py": {
    summary: "Vérifie la structure et les contrats du frontend mobile Galaxy, dont le shell, le routeur, le store, les vues, les assets hors ligne et plusieurs flux Node.",
    tags: ["test", "galaxy", "frontend", "routeur", "hors-ligne"],
  },
  "starpilot/system/the_galaxy/the_galaxy.py": {
    summary: "Implémente le serveur Flask principal de The Galaxy et ses endpoints pour les Params, réglages, modèles, logs, cartes, outils système et opérations appareil.",
    tags: ["galaxy", "api", "flask", "parametres", "service"],
  },
  "starpilot/system/the_galaxy/utilities.py": {
    summary: "Regroupe les services opérationnels de Galaxy pour les processus, fichiers, réseau, authentification, uploads, diagnostics et commandes de l’appareil.",
    tags: ["galaxy", "utility", "systeme", "securite", "reseau"],
  },
  "starpilot/system/wheel_controls/wheel_controlsd.py": {
    summary: "Découvre les périphériques d’entrée, apprend et teste leurs événements, applique les mappings et publie l’état du daemon Wheel Controls.",
    tags: ["controleur", "daemon", "mapping", "evenement", "entree"],
  },
  "system/camerad/main.cc": {
    summary: "Démarre camerad avec l’affinité CPU prévue, tolère certains échecs hors production et désactive la caméra grand-angle selon le Param dédié.",
    tags: ["camera", "point-entree", "affinite-cpu", "parametres"],
  },
  "system/manager/launch_param_migrations.py": {
    summary: "Applique des migrations idempotentes aux Params StarPilot au démarrage, notamment pour les réglages UI, vision, direction et valeurs héritées.",
    tags: ["migration", "parametres", "demarrage", "compatibilite"],
  },
  "system/manager/manager.py": {
    summary: "Orchestre le cycle de vie principal d’openpilot et StarPilot : préparation, migrations, lancement, supervision et nettoyage des processus.",
    tags: ["manager", "demarrage", "processus", "supervision", "orchestration"],
  },
  "tools/StarPilot/derive_feasible_params.py": {
    summary: "Analyse le registre Params et les références UI afin de produire la liste de réglages que Galaxy peut modifier en toute sécurité.",
    tags: ["outil", "parametres", "analyse-statique", "securite"],
  },
};

const nodeTypes = new Set(["file", "function", "class", "config", "document", "service", "table", "endpoint", "pipeline", "schema", "resource"]);
const edgeWeights = {
  contains: 1.0,
  imports: 0.7,
  calls: 0.8,
  inherits: 0.9,
  implements: 0.9,
  exports: 0.8,
  depends_on: 0.6,
  tested_by: 0.5,
  configures: 0.6,
  documents: 0.5,
  deploys: 0.7,
  migrates: 0.7,
  triggers: 0.6,
  defines_schema: 0.8,
  serves: 0.7,
  provisions: 0.7,
  routes: 0.6,
  related: 0.5,
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function complexity(lineCount) {
  if (lineCount < 50) return "simple";
  if (lineCount <= 200) return "moderate";
  return "complex";
}

function fileNodeType(file) {
  if (file.fileCategory === "code" || file.fileCategory === "script" || file.fileCategory === "markup") return "file";
  if (file.fileCategory === "config") return "config";
  if (file.fileCategory === "docs") return "document";
  if (file.fileCategory === "infra") return "service";
  if (file.fileCategory === "data") return "schema";
  throw new Error(`Catégorie inconnue pour ${file.path}: ${file.fileCategory}`);
}

function fileNodeId(file) {
  return `${fileNodeType(file)}:${file.path}`;
}

function uniqueTags(tags) {
  const values = [...new Set(tags.map((tag) => tag.toLowerCase()))].slice(0, 5);
  while (values.length < 3) values.push(["starpilot", "analyse", "composant"][values.length]);
  return [...new Set(values)].slice(0, 5);
}

function actionKind(name) {
  const raw = name.replace(/^_+/, "");
  const lower = raw.toLowerCase();
  if (lower.startsWith("test_")) return ["Vérifie le scénario couvert par", "test"];
  if (lower === "main") return ["Lance le point d’entrée représenté par", "point-entree"];
  if (/^(is|has|can|should|uses|contains|matches|available|enabled|supported|known|eligible|equal)/.test(lower)) return ["Évalue la condition portée par", "condition"];
  if (/^(get|read|load|fetch|resolve|find|list|selected|active|current|snapshot|profile_status)/.test(lower)) return ["Récupère ou résout les données de", "lecture"];
  if (/^(set|write|save|put|persist|record|mark|register|publish|emit)/.test(lower)) return ["Enregistre ou publie l’état produit par", "ecriture"];
  if (/^(update|sync|refresh|reconcile|process|flush|hydrate|populate)/.test(lower)) return ["Met à jour l’état géré par", "synchronisation"];
  if (/^(normalize|sanitize|coerce|validate|check|verify|canonicalize|filter|prune|vet|enforce)/.test(lower)) return ["Normalise ou valide les données de", "validation"];
  if (/^(build|compose|create|derive|generate|collect|default|seed|merge|group|enqueue)/.test(lower)) return ["Construit la représentation produite par", "construction"];
  if (/^(calculate|compute|estimate|interpolate|interp|scale|clamp|round|sample|weighted|similarity|sign|distance|bearing)/.test(lower)) return ["Calcule la valeur retournée par", "calcul"];
  if (/^(parse|decode|encode|serialize|deserialize|format|slugify|escape|clean)/.test(lower)) return ["Convertit ou formate les données de", "conversion"];
  if (/^(render|draw|installstyle|open.*dialog)/.test(lower) || /^[A-Z]/.test(raw)) return ["Construit le rendu ou composant fourni par", "rendu"];
  if (/^(api|endpoint|route)/.test(lower)) return ["Traite la requête associée à", "api"];
  if (/^(apply|execute|trigger|run|start|stop|cancel|terminate|handle|request|prepare|install|uninstall|flash|backup|cleanup|delete|remove|restore|revert|clear|reset|migrate|accept|submit|rename|toggle|activate|deactivate|cycle|wait)/.test(lower)) return ["Exécute le flux piloté par", "execution"];
  return ["Implémente l’opération", "logique-metier"];
}

function functionSummary(filePath, fn) {
  const base = path.basename(filePath);
  const [verb] = actionKind(fn.name);
  if (fn.name.startsWith("test_")) return `${verb} \`${fn.name}\` dans la suite \`${base}\`.`;
  return `${verb} \`${fn.name}\` dans le module \`${base}\` de StarPilot.`;
}

function classSummary(filePath, cls) {
  const base = path.basename(filePath);
  if (/(Error|Cancelled|Timeout)$/.test(cls.name)) return `Représente l’erreur spécialisée \`${cls.name}\` utilisée par le module \`${base}\` pour interrompre ou signaler proprement son flux.`;
  if (/(Detection|Proposal|Track|HistoryEntry|RouteSource|Sample|InputSource)$/.test(cls.name)) return `Structure les données \`${cls.name}\` manipulées par le module \`${base}\` pendant son traitement.`;
  if (/Middleware$/.test(cls.name)) return `Intercepte les requêtes avec \`${cls.name}\` afin d’appliquer la politique de routage du module \`${base}\`.`;
  return `Regroupe l’état et le comportement de \`${cls.name}\` dans le module \`${base}\`, avec ${(cls.methods || []).length} méthode(s) structurantes.`;
}

function symbolTags(filePath, symbolName, kind) {
  const domainTags = meta[filePath].tags.slice(0, 2);
  if (kind === "class") {
    const classKind = /(Error|Cancelled|Timeout)$/.test(symbolName) ? "gestion-erreur" : /Daemon$/.test(symbolName) ? "daemon" : "etat";
    return uniqueTags(["classe", classKind, ...domainTags]);
  }
  const [, actionTag] = actionKind(symbolName);
  return uniqueTags([symbolName.startsWith("test_") ? "test" : "fonction", actionTag, ...domainTags]);
}

function significantFunctions(result) {
  const exports = new Set((result.exports || []).map((item) => item.name));
  return (result.functions || []).filter((fn) => (fn.endLine - fn.startLine + 1) >= 10 || exports.has(fn.name));
}

function significantClasses(result) {
  const exports = new Set((result.exports || []).map((item) => item.name));
  return (result.classes || []).filter((cls) => (cls.endLine - cls.startLine + 1) >= 20 || (cls.methods || []).length >= 2 || exports.has(cls.name));
}

function validateNode(node) {
  assert(typeof node.id === "string" && node.id.length > 0, "Nœud sans id");
  assert(nodeTypes.has(node.type), `Type de nœud invalide: ${node.type}`);
  assert(typeof node.name === "string" && node.name.length > 0, `Nom vide pour ${node.id}`);
  assert(typeof node.summary === "string" && node.summary.length > 0, `Résumé vide pour ${node.id}`);
  assert(Array.isArray(node.tags) && node.tags.length >= 3 && node.tags.length <= 5, `Tags invalides pour ${node.id}`);
  for (const tag of node.tags) assert(/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tag), `Tag invalide ${tag} pour ${node.id}`);
  assert(["simple", "moderate", "complex"].includes(node.complexity), `Complexité invalide pour ${node.id}`);
  if (["file", "config", "document", "service", "pipeline", "schema", "resource"].includes(node.type)) {
    assert(typeof node.filePath === "string", `filePath absent pour ${node.id}`);
  }
  if (["function", "class"].includes(node.type)) {
    assert(Array.isArray(node.lineRange) && node.lineRange.length === 2, `lineRange absent pour ${node.id}`);
  }
}

function validateEdge(edge) {
  assert(typeof edge.source === "string" && typeof edge.target === "string", "Arête sans extrémités");
  assert(edge.source !== edge.target, `Auto-référence interdite: ${edge.source}`);
  assert(Object.hasOwn(edgeWeights, edge.type), `Type d’arête invalide: ${edge.type}`);
  assert(edge.direction === "forward", `Direction invalide pour ${edge.source}`);
  assert(edge.weight === edgeWeights[edge.type], `Poids invalide pour ${edge.type}`);
}

function collectNeighborSymbols(neighborMap) {
  const allowed = new Set();
  for (const value of Object.values(neighborMap || {})) {
    const neighbors = Array.isArray(value) ? value : [];
    for (const neighbor of neighbors) {
      if (!neighbor || typeof neighbor.path !== "string") continue;
      for (const symbol of neighbor.symbols || []) {
        const name = typeof symbol === "string" ? symbol : symbol?.name;
        const kind = typeof symbol === "object" ? symbol?.kind : undefined;
        if (!name) continue;
        if (kind === "class") allowed.add(`class:${neighbor.path}:${name}`);
        else if (kind === "function") allowed.add(`function:${neighbor.path}:${name}`);
        else {
          allowed.add(`function:${neighbor.path}:${name}`);
          allowed.add(`class:${neighbor.path}:${name}`);
        }
      }
    }
  }
  return allowed;
}

function buildBatch(batchIndex) {
  const contextPath = path.join(tmpDir, `ua-file-analyzer-context-${batchIndex}.json`);
  const extractionPath = path.join(tmpDir, `ua-file-extract-results-${batchIndex}.json`);
  const context = JSON.parse(fs.readFileSync(contextPath, "utf8"));
  const extraction = JSON.parse(fs.readFileSync(extractionPath, "utf8"));

  assert(context.batchIndex === batchIndex, `Indice incohérent dans ${contextPath}`);
  assert(extraction.scriptCompleted === true, `Extraction incomplète pour le lot ${batchIndex}`);
  assert((extraction.filesUnreadable || []).length === 0, `Fichiers illisibles dans le lot ${batchIndex}`);
  assert((extraction.filesSkipped || []).length === 0, `Fichiers ignorés dans le lot ${batchIndex}`);

  const files = [...context.files].sort((left, right) => left.path.localeCompare(right.path));
  const resultByPath = new Map(extraction.results.map((result) => [result.path, result]));
  assert(resultByPath.size === files.length, `Nombre de résultats incohérent pour le lot ${batchIndex}`);

  const nodes = [];
  const edges = [];

  for (const file of files) {
    const result = resultByPath.get(file.path);
    assert(result, `Résultat absent pour ${file.path}`);
    assert(meta[file.path], `Métadonnées sémantiques absentes pour ${file.path}`);

    const fileMeta = meta[file.path];
    const parentId = fileNodeId(file);
    const fileNode = {
      id: parentId,
      type: fileNodeType(file),
      name: path.basename(file.path),
      filePath: file.path,
      summary: fileMeta.summary,
      tags: uniqueTags(fileMeta.tags),
      complexity: complexity(result.nonEmptyLines),
    };
    if (fileMeta.languageNotes) fileNode.languageNotes = fileMeta.languageNotes;
    nodes.push(fileNode);

    const exportNames = new Set((result.exports || []).map((item) => item.name));
    for (const fn of significantFunctions(result)) {
      const id = `function:${file.path}:${fn.name}`;
      nodes.push({
        id,
        type: "function",
        name: fn.name,
        filePath: file.path,
        lineRange: [fn.startLine, fn.endLine],
        summary: functionSummary(file.path, fn),
        tags: symbolTags(file.path, fn.name, "function"),
        complexity: complexity(fn.endLine - fn.startLine + 1),
      });
      edges.push({ source: parentId, target: id, type: "contains", direction: "forward", weight: 1.0 });
      if (exportNames.has(fn.name)) edges.push({ source: parentId, target: id, type: "exports", direction: "forward", weight: 0.8 });
    }

    for (const cls of significantClasses(result)) {
      const id = `class:${file.path}:${cls.name}`;
      nodes.push({
        id,
        type: "class",
        name: cls.name,
        filePath: file.path,
        lineRange: [cls.startLine, cls.endLine],
        summary: classSummary(file.path, cls),
        tags: symbolTags(file.path, cls.name, "class"),
        complexity: complexity(cls.endLine - cls.startLine + 1),
      });
      edges.push({ source: parentId, target: id, type: "contains", direction: "forward", weight: 1.0 });
      if (exportNames.has(cls.name)) edges.push({ source: parentId, target: id, type: "exports", direction: "forward", weight: 0.8 });
    }

    if (file.fileCategory === "code") {
      const imports = context.batchImportData[file.path];
      assert(Array.isArray(imports), `batchImportData absent pour ${file.path}`);
      for (const targetPath of imports) {
        edges.push({ source: parentId, target: `file:${targetPath}`, type: "imports", direction: "forward", weight: 0.7 });
      }
    }
  }

  const nodeIds = new Set();
  for (const node of nodes) {
    validateNode(node);
    assert(!nodeIds.has(node.id), `ID de nœud dupliqué: ${node.id}`);
    nodeIds.add(node.id);
  }
  for (const edge of edges) validateEdge(edge);

  for (const file of files) {
    if (file.fileCategory !== "code") continue;
    const source = fileNodeId(file);
    const expected = context.batchImportData[file.path].length;
    const actual = edges.filter((edge) => edge.type === "imports" && edge.source === source).length;
    assert(actual === expected, `Imports non 1:1 pour ${file.path}: ${actual}/${expected}`);
  }

  const expectedImportCount = files
    .filter((file) => file.fileCategory === "code")
    .reduce((total, file) => total + context.batchImportData[file.path].length, 0);
  const actualImportCount = edges.filter((edge) => edge.type === "imports").length;
  assert(actualImportCount === expectedImportCount, `Total imports incorrect pour le lot ${batchIndex}: ${actualImportCount}/${expectedImportCount}`);

  const fragments = [];
  if (nodes.length <= 60 && edges.length <= 120) {
    fragments.push({ fileName: `batch-${batchIndex}.json`, nodes, edges, filePaths: files.map((file) => file.path) });
  } else {
    const desiredParts = Math.ceil(Math.max(nodes.length / 60, edges.length / 120));
    const groupSize = Math.ceil(files.length / desiredParts);
    const fileGroups = [];
    for (let start = 0; start < files.length; start += groupSize) fileGroups.push(files.slice(start, start + groupSize));
    for (let partIndex = 0; partIndex < fileGroups.length; partIndex += 1) {
      const filePaths = new Set(fileGroups[partIndex].map((file) => file.path));
      const partNodes = nodes.filter((node) => filePaths.has(node.filePath));
      const partNodeIds = new Set(partNodes.map((node) => node.id));
      const partEdges = edges.filter((edge) => partNodeIds.has(edge.source));
      fragments.push({
        fileName: `batch-${batchIndex}-part-${partIndex + 1}.json`,
        nodes: partNodes,
        edges: partEdges,
        filePaths: [...filePaths],
      });
    }
  }

  const importTargets = new Set(Object.values(context.batchImportData).flat());
  const neighborPaths = new Set();
  for (const [sourcePath, neighbors] of Object.entries(context.neighborMap || {})) {
    neighborPaths.add(sourcePath);
    if (Array.isArray(neighbors)) for (const neighbor of neighbors) if (neighbor?.path) neighborPaths.add(neighbor.path);
  }
  const neighborSymbols = collectNeighborSymbols(context.neighborMap);

  for (const fragment of fragments) {
    const localIds = new Set(fragment.nodes.map((node) => node.id));
    for (const edge of fragment.edges) {
      assert(localIds.has(edge.source), `${fragment.fileName}: source absente ${edge.source}`);
      const externalFile = edge.target.startsWith("file:") && (importTargets.has(edge.target.slice(5)) || neighborPaths.has(edge.target.slice(5)));
      const externalSymbol = neighborSymbols.has(edge.target);
      assert(localIds.has(edge.target) || externalFile || externalSymbol, `${fragment.fileName}: cible invalide ${edge.target}`);
    }
  }

  return { batchIndex, nodes, edges, expectedImportCount, fragments };
}

fs.mkdirSync(outputDir, { recursive: true });
for (const existing of fs.readdirSync(outputDir)) {
  if (/^batch-(9|10|11)(?:-part-\d+)?\.json$/.test(existing)) fs.unlinkSync(path.join(outputDir, existing));
}

const summaries = [];
for (const batchIndex of batchIndexes) {
  const built = buildBatch(batchIndex);
  for (const fragment of built.fragments) {
    const outputPath = path.join(outputDir, fragment.fileName);
    fs.writeFileSync(outputPath, `${JSON.stringify({ nodes: fragment.nodes, edges: fragment.edges }, null, 2)}\n`, "utf8");
    const readBack = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    assert(Array.isArray(readBack.nodes) && Array.isArray(readBack.edges), `JSON invalide dans ${fragment.fileName}`);
    assert(readBack.nodes.length === fragment.nodes.length && readBack.edges.length === fragment.edges.length, `Écriture tronquée dans ${fragment.fileName}`);
  }
  summaries.push({
    batchIndex,
    parts: built.fragments.map((fragment) => ({ file: fragment.fileName, nodes: fragment.nodes.length, edges: fragment.edges.length })),
    totalNodes: built.nodes.length,
    totalEdges: built.edges.length,
    importEdges: built.edges.filter((edge) => edge.type === "imports").length,
    expectedImportEdges: built.expectedImportCount,
  });
}

fs.writeFileSync(path.join(tmpDir, "ua-file-analyzer-build-summary-9-11.json"), `${JSON.stringify(summaries, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summaries, null, 2));
