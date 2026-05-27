#!/usr/bin/env node
/**
 * Speculon design-token guard.
 * Flags Tailwind palette utilities and raw color literals in JSX.
 * Tokens themselves live in app/globals.css; this script blocks drift.
 *
 * Usage:
 *   node scripts/check-design-tokens.cjs              # check everything
 *   node scripts/check-design-tokens.cjs --strict     # also fail on app/admin
 *   node scripts/check-design-tokens.cjs --json       # machine-readable
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SCAN_DIRS = ['app', 'components', 'contexts'];
const SKIP = new Set(['node_modules', '.next', '.git', 'dist', 'build']);

// app/admin is opted out until Phase 2 of the design-tightening plan lands.
const PHASE2_PENDING = ['app/admin', 'components/UserManagementModal.js'];

const PALETTES = [
  'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal',
  'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink',
  'rose', 'gray', 'zinc', 'neutral', 'stone', 'slate'
];

const RULES = [
  {
    name: 'tailwind-palette',
    regex: new RegExp(
      `(?:bg|text|border|from|to|via|ring|shadow|fill|stroke|placeholder|outline|divide|caret|accent|decoration)-(?:${PALETTES.join('|')})(?:-\\d{2,3})?(?:/\\d+)?\\b`,
      'g'
    ),
    message: 'Raw Tailwind palette color — use a token (text-[var(--text)], bg-[var(--card)], etc.)'
  },
  {
    name: 'hex-color',
    regex: /#[0-9a-fA-F]{3,8}\b/g,
    message: 'Hardcoded hex — use a CSS variable from globals.css'
  },
  {
    name: 'rgb-literal',
    regex: /\brgba?\s*\(/g,
    message: 'Raw rgb()/rgba() — use var(--overlay) or another token'
  }
];

const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const JSON_OUT = args.includes('--json');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

function isPhase2Pending(rel) {
  return PHASE2_PENDING.some(p => rel === p || rel.startsWith(p + '/') || rel.startsWith(p));
}

function scan(file) {
  const content = fs.readFileSync(file, 'utf-8');
  const violations = [];
  content.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;
    for (const rule of RULES) {
      rule.regex.lastIndex = 0;
      let m;
      while ((m = rule.regex.exec(line))) {
        violations.push({ rule: rule.name, line: i + 1, value: m[0], msg: rule.message });
      }
    }
  });
  return violations;
}

const files = SCAN_DIRS
  .map(d => path.join(ROOT, d))
  .filter(d => fs.existsSync(d))
  .flatMap(d => walk(d));

const report = [];
let blockingCount = 0;
let deferredCount = 0;

for (const file of files) {
  const rel = path.relative(ROOT, file);
  const violations = scan(file);
  if (!violations.length) continue;
  const deferred = !STRICT && isPhase2Pending(rel);
  if (deferred) deferredCount += violations.length;
  else blockingCount += violations.length;
  report.push({ file: rel, deferred, count: violations.length, violations });
}

if (JSON_OUT) {
  console.log(JSON.stringify({ blockingCount, deferredCount, report }, null, 2));
  process.exit(blockingCount > 0 ? 1 : 0);
}

if (!report.length) {
  console.log('✓ No design-token violations.');
  process.exit(0);
}

const blocking = report.filter(r => !r.deferred);
const deferred = report.filter(r => r.deferred);

if (blocking.length) {
  console.log(`\n✗ ${blockingCount} violation(s) in ${blocking.length} file(s) [blocking]:\n`);
  for (const r of blocking) {
    console.log(`  ${r.file}  (${r.count})`);
    for (const v of r.violations.slice(0, 5)) {
      console.log(`    L${v.line}  ${v.rule.padEnd(18)} ${v.value}`);
    }
    if (r.violations.length > 5) console.log(`    … +${r.violations.length - 5} more`);
  }
}

if (deferred.length) {
  console.log(`\n⏸ ${deferredCount} violation(s) in ${deferred.length} file(s) [deferred — Phase 2 admin rebrand]:`);
  for (const r of deferred) console.log(`    ${r.file}  (${r.count})`);
  console.log('  (Run with --strict to surface these too.)');
}

console.log('');
process.exit(blockingCount > 0 ? 1 : 0);
