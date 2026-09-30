const fs = require("node:fs");
const path = require("node:path");

const UA_DIR = "C:/Users/karlp/Documents/ChatGPT/StarPilot/.ua";
const INPUT_PATH = path.join(UA_DIR, "tmp", "ua-arch-input.json");
const RESULTS_PATH = path.join(UA_DIR, "tmp", "ua-arch-results.json");
const OUTPUT_PATH = path.join(UA_DIR, "intermediate", "layers.json");

const input = JSON.parse(fs.readFileSync(INPUT_PATH, "utf8"));
const structural = JSON.parse(fs.readFileSync(RESULTS_PATH, "utf8"));

if (!structural.scriptCompleted || structural.fileStats.totalFileNodes !== 167) {
  throw new Error("L’analyse structurelle n’est pas complète pour les 167 nœuds fichier.");
}

const definitions = [
  {
    id: "layer:project-support",
    name: "Documentation, configuration et outillage",
    description: "Réunit les guides StarPilot et Galaxy, la configuration Python, le catalogue déclaratif des réglages Galaxy et l’outil d’audit des Params.",
  },
  {
    id: "layer:shared-foundations",
    name: "Fondations partagées StarPilot",
    description: "Centralise le registre Params et les services communs de profils, modèles, cartes, téléchargements, sauvegardes, sécurité et état StarPilot.",
  },
  {
    id: "layer:vehicle-integration",
    name: "Intégration véhicule Subaru",
    description: "Regroupe les abstractions opendbc et l’intégration Subaru/Ascent pour l’identification, le décodage d’état, les commandes CAN, EyeSight et la sécurité véhicule.",
  },
  {
    id: "layer:driving-runtime",
    name: "Contrôle et exécution de conduite",
    description: "Exécute les boucles selfdrive, l’inférence du modèle et les contrôleurs StarPilot de vitesse, trajectoire, distance de suivi et événements de conduite.",
  },
  {
    id: "layer:platform-services",
    name: "Services système et daemons",
    description: "Assure le démarrage et la supervision des processus, les migrations Params, camerad, la vision latérale et des panneaux, ainsi que les commandes externes.",
  },
  {
    id: "layer:embedded-ui",
    name: "Interface embarquée",
    description: "Fournit les écrans de réglages, le HUD onroad et mici, les widgets, thèmes, panneaux de navigation et visualisations propres à StarPilot.",
  },
  {
    id: "layer:galaxy-portal",
    name: "Portail web Galaxy",
    description: "Implémente le backend et les frontends Galaxy pour administrer les Params, modèles, profils, tuning, diagnostics, mises à jour et fonctions véhicule.",
  },
  {
    id: "layer:tests",
    name: "Tests et validation",
    description: "Vérifie les contrats Galaxy, le catalogue de réglages, les profils, le frontend et les garde-fous transactionnels du mode longitudinal.",
  },
];

const byId = new Map(definitions.map(layer => [layer.id, {...layer, nodeIds: []}]));

function isTestPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const base = path.posix.basename(normalized);
  return normalized.includes("/tests/") || (base.startsWith("test_") && base.endsWith(".py"));
}

function assignLayer(node) {
  const filePath = node.filePath.replaceAll("\\", "/");
  if (node.type === "config" || node.type === "document" || filePath.startsWith("tools/")) return "layer:project-support";
  if (isTestPath(filePath)) return "layer:tests";
  if (filePath.startsWith("opendbc_repo/opendbc/car/")) return "layer:vehicle-integration";
  if (filePath.startsWith("selfdrive/ui/")) return "layer:embedded-ui";
  if (filePath.startsWith("starpilot/system/the_galaxy/")) return "layer:galaxy-portal";
  if (filePath.startsWith("system/") || filePath.startsWith("starpilot/system/")) return "layer:platform-services";
  if (filePath === "common/params_keys.h" || filePath.startsWith("starpilot/common/")) return "layer:shared-foundations";
  if (filePath.startsWith("selfdrive/car/")
      || filePath.startsWith("selfdrive/controls/")
      || filePath.startsWith("selfdrive/modeld/")
      || filePath.startsWith("selfdrive/selfdrived/")
      || filePath.startsWith("starpilot/controls/")) return "layer:driving-runtime";
  throw new Error(`Aucune couche sémantique pour ${node.id}`);
}

for (const node of input.fileNodes) {
  byId.get(assignLayer(node)).nodeIds.push(node.id);
}

const layers = definitions.map(definition => byId.get(definition.id));
for (const layer of layers) layer.nodeIds.sort();

function validate(candidate) {
  if (!Array.isArray(candidate) || candidate.length < 3 || candidate.length > 10) {
    throw new Error(`Nombre de couches invalide: ${candidate.length}`);
  }
  const realIds = new Set(input.fileNodes.map(node => node.id));
  const assigned = new Set();
  for (const layer of candidate) {
    if (!/^layer:[a-z0-9]+(?:-[a-z0-9]+)*$/.test(layer.id)) throw new Error(`ID de couche invalide: ${layer.id}`);
    if (!layer.name || !layer.description || !Array.isArray(layer.nodeIds) || layer.nodeIds.length === 0) {
      throw new Error(`Couche incomplète: ${layer.id}`);
    }
    for (const nodeId of layer.nodeIds) {
      if (!realIds.has(nodeId)) throw new Error(`Nœud inventé: ${nodeId}`);
      if (assigned.has(nodeId)) throw new Error(`Nœud assigné plusieurs fois: ${nodeId}`);
      assigned.add(nodeId);
    }
  }
  if (assigned.size !== realIds.size || assigned.size !== structural.fileStats.totalFileNodes) {
    const missing = [...realIds].filter(id => !assigned.has(id));
    throw new Error(`Couverture incomplète: ${assigned.size}/${realIds.size}; absents=${JSON.stringify(missing)}`);
  }
}

validate(layers);
fs.writeFileSync(OUTPUT_PATH, `${JSON.stringify(layers, null, 2)}\n`);
const reread = JSON.parse(fs.readFileSync(OUTPUT_PATH, "utf8"));
validate(reread);

console.log(JSON.stringify(reread.map(layer => ({id: layer.id, name: layer.name, files: layer.nodeIds.length})), null, 2));
