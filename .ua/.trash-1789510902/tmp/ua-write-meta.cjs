#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const projectRoot = process.argv[2];
const uaDir = process.argv[3];
if (!projectRoot || !uaDir) throw new Error('Usage: ua-write-meta.cjs <projectRoot> <uaDir>');
const scan = JSON.parse(fs.readFileSync(path.join(uaDir, 'intermediate', 'scan-result.json'), 'utf8'));
const gitCommitHash = execFileSync('git', ['-C', projectRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const meta = {
  lastAnalyzedAt: new Date().toISOString(),
  gitCommitHash,
  version: '1.0.0',
  analyzedFiles: scan.files.length,
};
fs.writeFileSync(path.join(uaDir, 'meta.json'), JSON.stringify(meta, null, 2));
process.stdout.write(`Metadata written for ${meta.analyzedFiles} files at ${gitCommitHash}\n`);
