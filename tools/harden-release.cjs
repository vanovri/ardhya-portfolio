'use strict';

const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const pubDir = path.join(root, 'public');
const dist = path.join(root, 'dist-hardened');

// Large UI bundles hardened at balanced intensity to avoid 30x-50x string-split bloat while keeping AST decoys
const BALANCED_UI_FILES = [
  'assets/career-test-arena.js',
  'blog/10-ai-systems-4gb-vram/ai-systems.js',
  'blog/teardown-maganghub-kemnaker-nextjs-seo/teardown.js',
  'labs/aegis/assets/index-vJ-nFjwD.js',
  'labs/dst-kv/assets/index-B7urcxGD.js',
  'labs/kronos/assets/index-I9Cmz5Bz.js',
  'labs/novaserve/assets/index-N7gODk1_.js',
  'labs/spectre/assets/index-BoZVv5MJ.js',
  'labs/vectradb/assets/index-DvZRmr96.js'
];

function runBla(args) {
  const isWin = process.platform === 'win32';
  const cmd = isWin ? 'cmd.exe' : 'npx';
  const fullArgs = isWin
    ? ['/d', '/c', 'npx', '--yes', 'bla-agents@latest', ...args]
    : ['--yes', 'bla-agents@latest', ...args];
  return spawnSync(cmd, fullArgs, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
}

console.log('Staging Portfolio public/ to dist-hardened/ ...');
fs.rmSync(dist, { recursive: true, force: true });
fs.cpSync(pubDir, dist, { recursive: true });

// Pass 1: maximum intensity for all 6 WASM modules, WASM glue/workers, and core JS/MJS
const maxExclude = [
  '**/*.html',
  '**/*.json',
  'js/search-index.js',
  'blog/*/theme-init.js',
  ...BALANCED_UI_FILES
].join(',');

const res = runBla(['harden', dist, '--intensity', 'maximum', '--exclude', maxExclude, '--json']);
if (res.status !== 0) {
  throw new Error('bla-agents harden failed (' + res.status + '): ' + (res.stderr || res.stdout));
}
const report = JSON.parse(res.stdout);
if (!report.overallSuccess || report.failedCount > 0 || report.truncated) {
  throw new Error('bla-agents harden incomplete/failed: ' + JSON.stringify({ overallSuccess: report.overallSuccess, failedCount: report.failedCount, truncated: report.truncated }));
}

const stageDir = path.join(dist, '.bla-hardened');
if (!fs.existsSync(stageDir)) throw new Error('Missing stage output: ' + stageDir);
function walkOverlay(src, dst) {
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dst, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(d, { recursive: true });
      walkOverlay(s, d);
    } else if (entry.isFile()) {
      fs.copyFileSync(s, d);
    }
  }
}
walkOverlay(stageDir, dist);
fs.rmSync(stageDir, { recursive: true, force: true });
fs.rmSync(path.join(dist, 'bla-harden-summary.json'), { force: true });

let totalIn = 0;
let totalOut = 0;
let jsMaxCount = 0;
let jsBalCount = 0;
let wasmCount = 0;

console.log('\nTier 1 — Maximum intensity (' + report.artifacts.length + ' core JS/MJS + WASM):');
for (const a of report.artifacts) {
  const actualPath = path.join(dist, a.relativePath);
  assert.ok(fs.existsSync(actualPath), 'Missing hardened artifact: ' + actualPath);
  if (a.format === 'wasm') {
    const bytes = fs.readFileSync(actualPath);
    assert.equal(WebAssembly.validate(bytes), true, 'WebAssembly.validate failed: ' + a.relativePath);
    wasmCount++;
  } else {
    const chk = spawnSync(process.execPath, ['--check', actualPath], { encoding: 'utf8' });
    if (chk.status !== 0) {
      throw new Error('Syntax check failed for ' + a.relativePath + ': ' + chk.stderr);
    }
    jsMaxCount++;
  }
  totalIn += a.inputBytes || 0;
  totalOut += a.outputBytes || 0;
  const ratio = a.inputBytes > 0 ? (a.outputBytes / a.inputBytes).toFixed(1) : '0';
  const preserved = a.wasmExportsAutoPreserved ? ' [auto-preserved ' + a.wasmExportsAutoPreserved.length + ' exports]' : '';
  console.log('  MAX ' + a.relativePath.padEnd(48) + String(a.inputBytes).padStart(7) + ' B -> ' + String(a.outputBytes).padStart(8) + ' B (' + ratio + 'x, score ' + a.defenseScore + ')' + preserved);
}

// Pass 2: balanced intensity for large UI JS bundles (keeps size fast for browser loads)
console.log('\nTier 2 — Balanced intensity (' + BALANCED_UI_FILES.length + ' UI bundles):');
for (const rel of BALANCED_UI_FILES) {
  const target = path.join(dist, rel);
  if (!fs.existsSync(target)) continue;
  const inBytes = fs.statSync(target).size;
  const tmpOut = target.replace(/\.js$/, '.bla.js');
  const p = runBla(['protect', target, '-o', tmpOut, '--intensity', 'balanced', '--json']);
  if (p.status !== 0) {
    throw new Error('bla-agents protect failed for ' + rel + ': ' + (p.stderr || p.stdout));
  }
  fs.renameSync(tmpOut, target);
  const outBytes = fs.statSync(target).size;
  const chk = spawnSync(process.execPath, ['--check', target], { encoding: 'utf8' });
  if (chk.status !== 0) {
    throw new Error('Syntax check failed for ' + rel + ': ' + chk.stderr);
  }
  jsBalCount++;
  totalIn += inBytes;
  totalOut += outBytes;
  console.log('  BAL ' + rel.padEnd(48) + String(inBytes).padStart(7) + ' B -> ' + String(outBytes).padStart(8) + ' B (' + (outBytes / inBytes).toFixed(1) + 'x)');
}

// Verify excluded search-index.js remains valid JSON list
const searchText = fs.readFileSync(path.join(dist, 'js', 'search-index.js'), 'utf8').trim().replace(/^export default /, '').replace(/;$/, '');
const parsedIndex = JSON.parse(searchText);
assert.ok(Array.isArray(parsedIndex) && parsedIndex.length > 0, 'search-index.js must remain a non-empty JSON list');

console.log('\nTotals: ' + jsMaxCount + ' max JS/MJS + ' + jsBalCount + ' balanced UI JS + ' + wasmCount + ' max WASM (' + (totalIn / 1024).toFixed(1) + ' KB -> ' + (totalOut / 1024).toFixed(1) + ' KB); search-index.js & theme-init.js excluded.');
console.log('PASS: Portfolio dist-hardened/ built and verified.');
