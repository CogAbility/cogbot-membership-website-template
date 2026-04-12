/**
 * Pre-publish gate: scans src/ for patterns that look like hardcoded secrets.
 * Runs automatically via `prepublishOnly` before every `npm publish`.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const PATTERNS = [
  { re: /VITE_[A-Z_]+\s*=\s*['"][^'"]+/, label: 'hardcoded env value' },
  { re: /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/, label: 'private key' },
  { re: /password\s*[:=]\s*['"][^'"]{8,}/i, label: 'possible password' },
  { re: /secret\s*[:=]\s*['"][^'"]{8,}/i, label: 'possible secret' },
  { re: /\bsk[-_]live[-_][a-zA-Z0-9]{20,}/, label: 'Stripe secret key' },
  { re: /\bghp_[a-zA-Z0-9]{36,}/, label: 'GitHub PAT' },
  { re: /\bnpm_[a-zA-Z0-9]{36,}/, label: 'npm token' },
];

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'scripts']);

function scan(dir) {
  let found = false;
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry) || entry.startsWith('.')) continue;
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      found = scan(fullPath) || found;
      continue;
    }
    if (!/\.(js|jsx|ts|tsx|json|mjs|cjs)$/.test(entry)) continue;
    const content = readFileSync(fullPath, 'utf8');
    for (const { re, label } of PATTERNS) {
      if (re.test(content)) {
        console.error(`  ⚠  ${fullPath}: ${label}`);
        found = true;
      }
    }
  }
  return found;
}

console.log('Scanning for secrets in publishable files...\n');
if (scan('src')) {
  console.error('\n❌ Potential secrets detected — aborting publish.');
  console.error('   Review the files above and remove any credentials.\n');
  process.exit(1);
} else {
  console.log('✅ No secrets detected. Safe to publish.\n');
}
