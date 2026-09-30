import fs from "node:fs";
import path from "node:path";

const uaDir = "C:/Users/karlp/Documents/ChatGPT/StarPilot/.ua";
const scanPath = path.join(uaDir, "tmp", "ua-scan-files.json");
const importPath = path.join(uaDir, "tmp", "ua-import-map-output.json");
const outputPath = path.join(uaDir, "intermediate", "scan-result.json");

const scan = JSON.parse(fs.readFileSync(scanPath, "utf8"));
const imports = JSON.parse(fs.readFileSync(importPath, "utf8"));

if (scan.scriptCompleted !== true) {
  throw new Error("scan-project.mjs n'a pas confirmé son exécution");
}
if (imports.scriptCompleted !== true) {
  throw new Error("extract-import-map.mjs n'a pas confirmé son exécution");
}
if (scan.totalFiles !== scan.files.length) {
  throw new Error(`totalFiles (${scan.totalFiles}) ne correspond pas à files.length (${scan.files.length})`);
}

const filePaths = scan.files.map((file) => file.path);
const importPaths = Object.keys(imports.importMap);
if (importPaths.length !== filePaths.length || filePaths.some((filePath) => !Object.hasOwn(imports.importMap, filePath))) {
  throw new Error("L'import map ne contient pas exactement une entrée par fichier scanné");
}

const result = {
  name: "openpilot",
  description: "Fork personnalisé d’openpilot, StarPilot est un système open source d’aide à la conduite. Remarque : ce projet contient plus de 100 fichiers source ; envisagez de limiter l’analyse à un sous-répertoire pour obtenir des résultats plus rapides.",
  languages: Object.keys(scan.stats.byLanguage).sort((a, b) => a.localeCompare(b)),
  frameworks: ["aiohttp", "hypothesis", "pytest"],
  files: scan.files,
  totalFiles: scan.totalFiles,
  filteredByIgnore: scan.filteredByIgnore,
  estimatedComplexity: scan.estimatedComplexity,
  importMap: imports.importMap,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
