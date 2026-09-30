const fs = require("node:fs");
const path = require("node:path");

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function sortedObjectOfArrays(map) {
  return Object.fromEntries([...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, values]) => [key, [...values].sort()]));
}

function pathSegments(filePath) {
  return filePath.replaceAll("\\", "/").split("/").filter(Boolean);
}

function commonDirectoryPrefix(fileNodes) {
  if (!fileNodes.length) return [];
  const directories = fileNodes.map(node => pathSegments(node.filePath).slice(0, -1));
  const prefix = [];
  const max = Math.min(...directories.map(parts => parts.length));
  for (let index = 0; index < max; index += 1) {
    const candidate = directories[0][index];
    if (!directories.every(parts => parts[index] === candidate)) break;
    prefix.push(candidate);
  }
  return prefix;
}

function classifyFilePattern(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  const base = path.posix.basename(normalized);
  if (/(^|\/)(?:__tests__|tests?|specs?)(\/|$)/i.test(normalized)
      || /(?:^test_.*\.py$|\.test\.|\.spec\.|_test\.go$|Test\.java$|_spec\.rb$|Test\.php$|Tests\.cs$)/i.test(base)) return "test";
  if (/\.d\.ts$/i.test(base)) return "types";
  if (/^(?:index\.(?:ts|js)|__init__\.py)$/i.test(base)) return "entry";
  if (/^manage\.py$/i.test(base)) return "entry";
  if (/^(?:wsgi|asgi)\.py$/i.test(base)) return "config";
  if (/^(?:Application\.java|Program\.cs|config\.ru)$/i.test(base)) return "entry";
  if (/^(?:Cargo\.toml|go\.mod|Gemfile|pom\.xml|build\.gradle|composer\.json|pyproject\.toml)$/i.test(base)) return "config";
  if (/^(?:Dockerfile(?:\..*)?|docker-compose\..*)$/i.test(base) || /\.tf(?:vars)?$/i.test(base)) return "infrastructure";
  if (/^\.github\/workflows\//i.test(normalized) || /(?:\.gitlab-ci\.yml|Jenkinsfile)$/i.test(base)) return "ci-cd";
  if (/\.sql$/i.test(base)) return "data";
  if (/\.(?:graphql|gql|proto)$/i.test(base)) return "types";
  if (/\.(?:md|rst)$/i.test(base)) return "documentation";
  if (/^Makefile$/i.test(base)) return "infrastructure";
  return null;
}

const DIRECTORY_PATTERNS = new Map([
  ["routes", "api"], ["api", "api"], ["controllers", "api"], ["controller", "api"], ["endpoints", "api"],
  ["handlers", "api"], ["routers", "api"], ["serializers", "api"], ["blueprints", "api"],
  ["services", "service"], ["core", "service"], ["lib", "service"], ["domain", "service"], ["logic", "service"],
  ["internal", "service"], ["signals", "service"], ["mailers", "service"], ["jobs", "service"], ["channels", "service"],
  ["models", "data"], ["db", "data"], ["data", "data"], ["persistence", "data"], ["repository", "data"],
  ["entities", "data"], ["entity", "data"], ["migrations", "data"], ["sql", "data"], ["database", "data"], ["schema", "data"],
  ["components", "ui"], ["views", "ui"], ["pages", "ui"], ["ui", "ui"], ["layouts", "ui"], ["screens", "ui"],
  ["middleware", "middleware"], ["plugins", "middleware"], ["interceptors", "middleware"], ["guards", "middleware"],
  ["utils", "utility"], ["helpers", "utility"], ["common", "utility"], ["shared", "utility"], ["tools", "utility"], ["pkg", "utility"],
  ["config", "config"], ["constants", "config"], ["env", "config"], ["settings", "config"], ["management", "config"], ["commands", "config"],
  ["__tests__", "test"], ["test", "test"], ["tests", "test"], ["spec", "test"], ["specs", "test"],
  ["types", "types"], ["interfaces", "types"], ["schemas", "types"], ["contracts", "types"], ["dtos", "types"],
  ["dto", "types"], ["request", "types"], ["response", "types"], ["hooks", "hooks"],
  ["store", "state"], ["state", "state"], ["reducers", "state"], ["actions", "state"], ["slices", "state"],
  ["assets", "assets"], ["static", "assets"], ["public", "assets"], ["cmd", "entry"], ["bin", "entry"],
  ["docs", "documentation"], ["documentation", "documentation"], ["wiki", "documentation"],
  ["deploy", "infrastructure"], ["deployment", "infrastructure"], ["infra", "infrastructure"], ["infrastructure", "infrastructure"],
  ["k8s", "infrastructure"], ["kubernetes", "infrastructure"], ["helm", "infrastructure"], ["charts", "infrastructure"],
  ["terraform", "infrastructure"], ["tf", "infrastructure"], ["docker", "infrastructure"],
  [".github", "ci-cd"], [".gitlab", "ci-cd"], [".circleci", "ci-cd"], ["templatetags", "utility"],
]);

function main() {
  const [, , inputPath, outputPath] = process.argv;
  if (!inputPath || !outputPath) fail("Usage: node ua-arch-analyze.js <input.json> <output.json>");

  let input;
  try {
    input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  } catch (error) {
    fail(`Impossible de lire l’entrée: ${error.message}`);
  }

  const {fileNodes, importEdges, allEdges} = input;
  if (!Array.isArray(fileNodes) || !Array.isArray(importEdges) || !Array.isArray(allEdges)) {
    fail("L’entrée doit contenir fileNodes, importEdges et allEdges sous forme de tableaux.");
  }
  if (!input["Language Context"] || Object.keys(input["Language Context"]).length !== 5) {
    fail("La section Language Context complète est absente.");
  }

  const fileById = new Map();
  for (const node of fileNodes) {
    if (!node.id || !node.filePath || !node.type) fail(`Nœud fichier invalide: ${JSON.stringify(node)}`);
    if (fileById.has(node.id)) fail(`Nœud fichier dupliqué: ${node.id}`);
    fileById.set(node.id, node);
  }
  for (const edge of importEdges) {
    if (!fileById.has(edge.source) || !fileById.has(edge.target)) fail(`Import hors nœuds fichier: ${edge.source} -> ${edge.target}`);
  }
  for (const edge of allEdges) {
    if (!fileById.has(edge.source) || !fileById.has(edge.target)) fail(`Arête hors nœuds fichier: ${edge.source} -> ${edge.target}`);
  }

  const commonPrefixSegments = commonDirectoryPrefix(fileNodes);
  const filePatternMatches = {};
  const directoryGroups = new Map();
  let flat = true;
  for (const node of fileNodes) {
    const segments = pathSegments(node.filePath);
    const remaining = segments.slice(commonPrefixSegments.length);
    if (remaining.length > 1) flat = false;
    const group = remaining.length > 1 ? remaining[0] : "root";
    if (!directoryGroups.has(group)) directoryGroups.set(group, new Set());
    directoryGroups.get(group).add(node.id);
    const match = classifyFilePattern(node.filePath);
    if (match) filePatternMatches[node.id] = match;
  }

  if (flat) {
    directoryGroups.clear();
    for (const node of fileNodes) {
      const group = classifyFilePattern(node.filePath) || path.posix.extname(node.filePath).slice(1) || "other";
      if (!directoryGroups.has(group)) directoryGroups.set(group, new Set());
      directoryGroups.get(group).add(node.id);
    }
  }

  const groupById = new Map();
  for (const [group, ids] of directoryGroups) for (const id of ids) groupById.set(id, group);

  const nodeTypeGroups = new Map();
  for (const node of fileNodes) {
    if (!nodeTypeGroups.has(node.type)) nodeTypeGroups.set(node.type, new Set());
    nodeTypeGroups.get(node.type).add(node.id);
  }

  const fanIn = Object.fromEntries(fileNodes.map(node => [node.id, 0]));
  const fanOut = Object.fromEntries(fileNodes.map(node => [node.id, 0]));
  const adjacency = Object.fromEntries(fileNodes.map(node => [node.id, []]));
  const importedBy = Object.fromEntries(fileNodes.map(node => [node.id, []]));
  const groupRelations = Object.fromEntries([...directoryGroups.keys()].sort().map(group => [group, {importsFrom: [], importedBy: []}]));
  const importsFromSets = new Map([...directoryGroups.keys()].map(group => [group, new Set()]));
  const importedBySets = new Map([...directoryGroups.keys()].map(group => [group, new Set()]));
  const pairCounts = new Map();
  const internalCounts = new Map([...directoryGroups.keys()].map(group => [group, 0]));
  const involvingCounts = new Map([...directoryGroups.keys()].map(group => [group, 0]));

  for (const edge of importEdges) {
    fanOut[edge.source] += 1;
    fanIn[edge.target] += 1;
    adjacency[edge.source].push(edge.target);
    importedBy[edge.target].push(edge.source);
    const from = groupById.get(edge.source);
    const to = groupById.get(edge.target);
    involvingCounts.set(from, involvingCounts.get(from) + 1);
    if (to !== from) involvingCounts.set(to, involvingCounts.get(to) + 1);
    if (from === to) {
      internalCounts.set(from, internalCounts.get(from) + 1);
    } else {
      importsFromSets.get(from).add(to);
      importedBySets.get(to).add(from);
      const key = `${from}\u0000${to}`;
      pairCounts.set(key, (pairCounts.get(key) || 0) + 1);
    }
  }
  for (const id of Object.keys(adjacency)) adjacency[id].sort();
  for (const id of Object.keys(importedBy)) importedBy[id].sort();
  for (const group of Object.keys(groupRelations)) {
    groupRelations[group].importsFrom = [...importsFromSets.get(group)].sort();
    groupRelations[group].importedBy = [...importedBySets.get(group)].sort();
  }

  const crossCategoryMap = new Map();
  for (const edge of allEdges) {
    const fromType = fileById.get(edge.source).type;
    const toType = fileById.get(edge.target).type;
    const key = `${fromType}\u0000${toType}\u0000${edge.type}`;
    crossCategoryMap.set(key, (crossCategoryMap.get(key) || 0) + 1);
  }
  const crossCategoryEdges = [...crossCategoryMap.entries()].map(([key, count]) => {
    const [fromType, toType, edgeType] = key.split("\u0000");
    return {fromType, toType, edgeType, count};
  }).sort((a, b) => a.fromType.localeCompare(b.fromType) || a.toType.localeCompare(b.toType) || a.edgeType.localeCompare(b.edgeType));

  const interGroupImports = [...pairCounts.entries()].map(([key, count]) => {
    const [from, to] = key.split("\u0000");
    return {from, to, count};
  }).sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));

  const intraGroupDensity = {};
  for (const group of [...directoryGroups.keys()].sort()) {
    const internalEdges = internalCounts.get(group);
    const totalEdges = involvingCounts.get(group);
    intraGroupDensity[group] = {internalEdges, totalEdges, density: totalEdges ? internalEdges / totalEdges : 0};
  }

  const patternMatches = {};
  for (const group of [...directoryGroups.keys()].sort()) {
    const direct = DIRECTORY_PATTERNS.get(group.toLowerCase());
    if (direct) {
      patternMatches[group] = direct;
      continue;
    }
    const labels = new Map();
    for (const id of directoryGroups.get(group)) {
      const segments = pathSegments(fileById.get(id).filePath).map(segment => segment.toLowerCase());
      for (const segment of segments) {
        const label = DIRECTORY_PATTERNS.get(segment);
        if (label) labels.set(label, (labels.get(label) || 0) + 1);
      }
      const fileLabel = filePatternMatches[id];
      if (fileLabel) labels.set(fileLabel, (labels.get(fileLabel) || 0) + 1);
    }
    if (labels.size) patternMatches[group] = [...labels.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  }

  const normalizedPaths = fileNodes.map(node => node.filePath.replaceAll("\\", "/"));
  const infraFiles = fileNodes.filter(node => node.type === "service" || node.type === "resource" || node.type === "pipeline"
    || classifyFilePattern(node.filePath) === "infrastructure" || classifyFilePattern(node.filePath) === "ci-cd").map(node => node.filePath).sort();
  const deploymentTopology = {
    hasDockerfile: normalizedPaths.some(value => /(^|\/)Dockerfile(?:\.|$)/i.test(value)),
    hasCompose: normalizedPaths.some(value => /(^|\/)docker-compose\./i.test(value)),
    hasK8s: normalizedPaths.some(value => /(^|\/)(?:k8s|kubernetes|helm|charts)(\/|$)/i.test(value)),
    hasTerraform: normalizedPaths.some(value => /\.tf(?:vars)?$/i.test(value)),
    hasCI: normalizedPaths.some(value => /(^|\/)(?:\.github\/workflows|\.circleci|\.gitlab)(\/|$)|(?:\.gitlab-ci\.yml|Jenkinsfile)$/i.test(value)),
    infraFiles,
  };

  const dataPipeline = {
    schemaFiles: fileNodes.filter(node => ["schema", "table", "endpoint"].includes(node.type) || /\.(?:sql|graphql|gql|proto|prisma)$/i.test(node.filePath)).map(node => node.filePath).sort(),
    migrationFiles: fileNodes.filter(node => /(^|\/)migrations?(\/|$)|\.sql$/i.test(node.filePath)).map(node => node.filePath).sort(),
    dataModelFiles: fileNodes.filter(node => /(^|\/)(?:models?|entities|repository)(\/|$)/i.test(node.filePath) || (node.tags || []).includes("data-model")).map(node => node.filePath).sort(),
    apiHandlerFiles: fileNodes.filter(node => /(^|\/)(?:routes?|api|controllers?|handlers?)(\/|$)/i.test(node.filePath) || (node.tags || []).includes("api-handler")).map(node => node.filePath).sort(),
  };

  const groupsWithDocsSet = new Set();
  for (const node of fileNodes) if (node.type === "document") groupsWithDocsSet.add(groupById.get(node.id));
  for (const edge of allEdges) {
    if (edge.type === "documents" && fileById.get(edge.source)?.type === "document") groupsWithDocsSet.add(groupById.get(edge.target));
  }
  const allGroups = [...directoryGroups.keys()].sort();
  const docCoverage = {
    groupsWithDocs: groupsWithDocsSet.size,
    totalGroups: allGroups.length,
    coverageRatio: allGroups.length ? groupsWithDocsSet.size / allGroups.length : 0,
    undocumentedGroups: allGroups.filter(group => !groupsWithDocsSet.has(group)),
  };

  const directionalPairs = new Map();
  for (const {from, to, count} of interGroupImports) {
    const ordered = [from, to].sort();
    const key = ordered.join("\u0000");
    if (!directionalPairs.has(key)) directionalPairs.set(key, new Map());
    directionalPairs.get(key).set(`${from}\u0000${to}`, count);
  }
  const dependencyDirection = [];
  for (const [pairKey, directions] of directionalPairs) {
    const [a, b] = pairKey.split("\u0000");
    const ab = directions.get(`${a}\u0000${b}`) || 0;
    const ba = directions.get(`${b}\u0000${a}`) || 0;
    if (ab === ba) {
      dependencyDirection.push({dependent: a, dependsOn: b, count: ab, reverseCount: ba, balanced: true});
    } else if (ab > ba) {
      dependencyDirection.push({dependent: a, dependsOn: b, count: ab, reverseCount: ba});
    } else {
      dependencyDirection.push({dependent: b, dependsOn: a, count: ba, reverseCount: ab});
    }
  }
  dependencyDirection.sort((a, b) => a.dependent.localeCompare(b.dependent) || a.dependsOn.localeCompare(b.dependsOn));

  const output = {
    scriptCompleted: true,
    commonPathPrefix: commonPrefixSegments.length ? `${commonPrefixSegments.join("/")}/` : "",
    directoryGroups: sortedObjectOfArrays(directoryGroups),
    nodeTypeGroups: sortedObjectOfArrays(nodeTypeGroups),
    importAdjacency: adjacency,
    importedBy,
    directoryGroupRelations: groupRelations,
    crossCategoryEdges,
    interGroupImports,
    intraGroupDensity,
    patternMatches,
    filePatternMatches,
    deploymentTopology,
    dataPipeline,
    docCoverage,
    dependencyDirection,
    fileStats: {
      totalFileNodes: fileNodes.length,
      filesPerGroup: Object.fromEntries([...directoryGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([group, ids]) => [group, ids.size])),
      nodeTypeCounts: Object.fromEntries([...nodeTypeGroups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([type, ids]) => [type, ids.size])),
    },
    fileFanIn: fanIn,
    fileFanOut: fanOut,
  };

  try {
    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`);
  } catch (error) {
    fail(`Impossible d’écrire les résultats: ${error.message}`);
  }
}

try {
  main();
} catch (error) {
  fail(error.stack || error.message);
}
