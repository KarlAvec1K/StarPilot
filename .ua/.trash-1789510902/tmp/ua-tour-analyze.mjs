import fs from "node:fs";
import path from "node:path";

function fail(message) {
  console.error(`ua-tour-analyze: ${message}`);
  process.exit(1);
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) fail("usage: node ua-tour-analyze.mjs <input.json> <output.json>");

let input;
try {
  input = JSON.parse(fs.readFileSync(inputPath, "utf8"));
} catch (error) {
  fail(`lecture de l’entrée impossible: ${error.message}`);
}

const { nodes, edges, layers } = input;
if (!Array.isArray(nodes) || !Array.isArray(edges) || !Array.isArray(layers)) {
  fail("l’entrée doit contenir les tableaux nodes, edges et layers");
}

const nodeById = new Map();
for (const node of nodes) {
  if (!node?.id || nodeById.has(node.id)) fail(`ID de nœud absent ou dupliqué: ${node?.id}`);
  nodeById.set(node.id, node);
}

const fanIn = new Map(nodes.map((node) => [node.id, 0]));
const fanOut = new Map(nodes.map((node) => [node.id, 0]));
for (const edge of edges) {
  if (fanOut.has(edge.source)) fanOut.set(edge.source, fanOut.get(edge.source) + 1);
  if (fanIn.has(edge.target)) fanIn.set(edge.target, fanIn.get(edge.target) + 1);
}

function ranking(counts, key) {
  return nodes
    .map((node) => ({ id: node.id, [key]: counts.get(node.id) || 0, name: node.name }))
    .sort((left, right) => right[key] - left[key] || left.id.localeCompare(right.id))
    .slice(0, 20);
}

const fanInRanking = ranking(fanIn, "fanIn");
const fanOutRanking = ranking(fanOut, "fanOut");

const codeFiles = nodes.filter((node) => node.type === "file" && typeof node.filePath === "string");
const topFanOutCount = Math.max(1, Math.ceil(codeFiles.length * 0.10));
const lowFanInCount = Math.max(1, Math.ceil(codeFiles.length * 0.25));
const highFanOutIds = new Set([...codeFiles]
  .sort((left, right) => (fanOut.get(right.id) || 0) - (fanOut.get(left.id) || 0) || left.id.localeCompare(right.id))
  .slice(0, topFanOutCount)
  .map((node) => node.id));
const lowFanInIds = new Set([...codeFiles]
  .sort((left, right) => (fanIn.get(left.id) || 0) - (fanIn.get(right.id) || 0) || left.id.localeCompare(right.id))
  .slice(0, lowFanInCount)
  .map((node) => node.id));

const entryBasenames = new Set([
  "index.ts", "index.js", "main.ts", "main.js", "app.ts", "app.js", "server.ts", "server.js",
  "mod.rs", "main.go", "main.py", "main.rs", "manage.py", "app.py", "wsgi.py", "asgi.py", "run.py",
  "__main__.py", "Application.java", "Main.java", "Program.cs", "config.ru", "index.php", "App.swift",
  "Application.kt", "main.cpp", "main.c",
]);

const entryPointCandidates = [];
for (const node of nodes) {
  let score = 0;
  if (node.type === "file" && typeof node.filePath === "string") {
    const basename = path.posix.basename(node.filePath);
    if (entryBasenames.has(basename)) score += 3;
    if (node.filePath.split("/").length <= 2) score += 1;
    if (highFanOutIds.has(node.id)) score += 1;
    if (lowFanInIds.has(node.id)) score += 1;
    entryPointCandidates.push({ id: node.id, score, name: node.name, summary: node.summary || "" });
  } else if (node.type === "document" && typeof node.filePath === "string") {
    const rootLevel = !node.filePath.includes("/");
    if (rootLevel && node.filePath.toLowerCase() === "readme.md") score += 5;
    else if (rootLevel && node.filePath.toLowerCase().endsWith(".md")) score += 2;
    entryPointCandidates.push({ id: node.id, score, name: node.name, summary: node.summary || "" });
  }
}
entryPointCandidates.sort((left, right) => right.score - left.score || left.id.localeCompare(right.id));
entryPointCandidates.splice(5);

const topCodeEntry = entryPointCandidates.find((candidate) => nodeById.get(candidate.id)?.type === "file")
  || [...codeFiles]
    .sort((left, right) => (fanOut.get(right.id) || 0) - (fanOut.get(left.id) || 0) || left.id.localeCompare(right.id))[0];

const bfsTraversal = { startNode: topCodeEntry?.id || null, order: [], depthMap: {}, byDepth: {} };
if (topCodeEntry) {
  const adjacency = new Map();
  for (const edge of edges) {
    if (!["imports", "calls"].includes(edge.type) || edge.direction === "backward") continue;
    if (!adjacency.has(edge.source)) adjacency.set(edge.source, []);
    adjacency.get(edge.source).push(edge.target);
  }
  for (const targets of adjacency.values()) targets.sort((left, right) => left.localeCompare(right));

  const queue = [topCodeEntry.id];
  bfsTraversal.depthMap[topCodeEntry.id] = 0;
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    bfsTraversal.order.push(current);
    const depth = bfsTraversal.depthMap[current];
    if (!bfsTraversal.byDepth[String(depth)]) bfsTraversal.byDepth[String(depth)] = [];
    bfsTraversal.byDepth[String(depth)].push(current);
    for (const target of adjacency.get(current) || []) {
      if (!nodeById.has(target) || Object.hasOwn(bfsTraversal.depthMap, target)) continue;
      bfsTraversal.depthMap[target] = depth + 1;
      queue.push(target);
    }
  }
}

const inventoryNode = (node) => ({ id: node.id, name: node.name, type: node.type, summary: node.summary || "" });
const nonCodeFiles = {
  documentation: nodes.filter((node) => node.type === "document").map(inventoryNode),
  infrastructure: nodes.filter((node) => ["service", "pipeline", "resource"].includes(node.type)).map(inventoryNode),
  data: nodes.filter((node) => ["table", "schema", "endpoint"].includes(node.type)).map(inventoryNode),
  config: nodes.filter((node) => node.type === "config").map(inventoryNode),
};
for (const list of Object.values(nonCodeFiles)) list.sort((left, right) => left.id.localeCompare(right.id));

const eligibleEdges = edges.filter((edge) => ["imports", "calls"].includes(edge.type));
const directedPairs = new Set(eligibleEdges.map((edge) => `${edge.source}\u0000${edge.target}`));
const mutualPairs = [];
for (const edge of eligibleEdges) {
  if (edge.source.localeCompare(edge.target) >= 0) continue;
  if (directedPairs.has(`${edge.target}\u0000${edge.source}`)) mutualPairs.push([edge.source, edge.target]);
}

const undirected = new Map();
for (const edge of eligibleEdges) {
  if (!undirected.has(edge.source)) undirected.set(edge.source, new Set());
  if (!undirected.has(edge.target)) undirected.set(edge.target, new Set());
  undirected.get(edge.source).add(edge.target);
  undirected.get(edge.target).add(edge.source);
}

const clusterMap = new Map();
for (const pair of mutualPairs.sort((a, b) => a.join("\u0000").localeCompare(b.join("\u0000")))) {
  const cluster = new Set(pair);
  let changed = true;
  while (changed && cluster.size < 5) {
    changed = false;
    const candidates = [];
    for (const [candidate, neighbors] of undirected) {
      if (cluster.has(candidate)) continue;
      const links = [...cluster].filter((member) => neighbors.has(member)).length;
      if (links >= 2) candidates.push({ candidate, links });
    }
    candidates.sort((left, right) => right.links - left.links || left.candidate.localeCompare(right.candidate));
    for (const item of candidates) {
      if (cluster.size >= 5) break;
      cluster.add(item.candidate);
      changed = true;
    }
  }
  const members = [...cluster].sort((left, right) => left.localeCompare(right));
  const key = members.join("\u0000");
  if (clusterMap.has(key)) continue;
  const memberSet = new Set(members);
  const edgeCount = eligibleEdges.filter((edge) => memberSet.has(edge.source) && memberSet.has(edge.target)).length;
  clusterMap.set(key, { nodes: members, edgeCount });
}
const clusters = [...clusterMap.values()]
  .sort((left, right) => right.edgeCount - left.edgeCount || left.nodes.join("\u0000").localeCompare(right.nodes.join("\u0000")))
  .slice(0, 10);

const nodeSummaryIndex = {};
for (const node of [...nodes].sort((left, right) => left.id.localeCompare(right.id))) {
  nodeSummaryIndex[node.id] = { name: node.name, type: node.type, summary: node.summary || "" };
}

const result = {
  scriptCompleted: true,
  entryPointCandidates,
  fanInRanking,
  fanOutRanking,
  bfsTraversal,
  nonCodeFiles,
  clusters,
  layers: {
    count: layers.length,
    list: layers.map((layer) => ({ id: layer.id, name: layer.name, description: layer.description })),
  },
  nodeSummaryIndex,
  totalNodes: nodes.length,
  totalEdges: edges.length,
};

try {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
} catch (error) {
  fail(`écriture de la sortie impossible: ${error.message}`);
}
