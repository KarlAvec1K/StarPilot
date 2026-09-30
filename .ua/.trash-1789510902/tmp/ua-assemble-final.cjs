#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = process.argv[2];
const uaDir = process.argv[3];
if (!projectRoot || !uaDir) throw new Error('Usage: ua-assemble-final.cjs <projectRoot> <uaDir>');

const readJson = (relativePath) => JSON.parse(fs.readFileSync(path.join(uaDir, relativePath), 'utf8'));
const scan = readJson('intermediate/scan-result.json');
const candidate = readJson('intermediate/assembled-graph.json');
const layersRaw = readJson('intermediate/layers.json');
const tourRaw = readJson('intermediate/tour.json');
const layers = Array.isArray(layersRaw) ? layersRaw : layersRaw.layers;
const tour = Array.isArray(tourRaw) ? tourRaw : tourRaw.steps;
if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) throw new Error('Candidate graph lacks nodes or edges');
if (!Array.isArray(layers) || !Array.isArray(tour)) throw new Error('Layers or tour is not an array');

const nodeIds = new Set(candidate.nodes.map((node) => node.id));
for (const layer of layers) {
  if (!layer.id || !layer.name || !layer.description || !Array.isArray(layer.nodeIds)) throw new Error(`Invalid layer: ${JSON.stringify(layer)}`);
  layer.nodeIds = layer.nodeIds.filter((id) => nodeIds.has(id));
}
for (const step of tour) {
  if (!Number.isInteger(step.order) || !step.title || !step.description || !Array.isArray(step.nodeIds)) throw new Error(`Invalid tour step: ${JSON.stringify(step)}`);
  step.nodeIds = step.nodeIds.filter((id) => nodeIds.has(id));
}

const gitCommitHash = execFileSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const graph = {
  version: '1.0.0',
  project: {
    name: scan.name,
    languages: scan.languages,
    frameworks: scan.frameworks,
    description: scan.description,
    analyzedAt: new Date().toISOString(),
    gitCommitHash,
  },
  nodes: candidate.nodes,
  edges: candidate.edges,
  layers,
  tour,
};
fs.writeFileSync(path.join(uaDir, 'intermediate', 'assembled-graph.json'), JSON.stringify(graph, null, 2));
process.stdout.write(`Assembled graph: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${layers.length} layers, ${tour.length} tour steps\n`);
