#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = process.argv[2];
const uaDir = process.argv[3];
if (!projectRoot || !uaDir) throw new Error('Usage: ua-prepare-save.cjs <projectRoot> <uaDir>');

const assembledPath = path.join(uaDir, 'intermediate', 'assembled-graph.json');
const graph = JSON.parse(fs.readFileSync(assembledPath, 'utf8'));
const scan = JSON.parse(fs.readFileSync(path.join(uaDir, 'intermediate', 'scan-result.json'), 'utf8'));
const gitCommitHash = execFileSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();

fs.writeFileSync(path.join(uaDir, 'knowledge-graph.json'), JSON.stringify(graph, null, 2));
fs.writeFileSync(path.join(uaDir, 'intermediate', 'fingerprint-input.json'), JSON.stringify({
  projectRoot,
  filePaths: scan.files.map((file) => file.path),
  gitCommitHash,
}, null, 2));
process.stdout.write(`Prepared final graph and ${scan.files.length} fingerprint inputs at ${gitCommitHash}\n`);
