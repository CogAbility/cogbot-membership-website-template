#!/usr/bin/env node
/**
 * Pre-publish secret scanner.
 * Scans all files in src/ for patterns that should never appear in a published npm package:
 * - Hardcoded secrets, tokens, or keys
 * - Literal App ID, CMG, or CAM credentials
 * - process.env references (kit must not read env vars directly — it accepts config props)
 *
 * Run automatically via the `prepublishOnly` npm script.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'src');

const PATTERNS = [
  { label: 'process.env reference', re: /process\.env\.\w+/g },
  { label: 'hardcoded Bearer token', re: /Bearer\s+[A-Za-z0-9\-_]{20,}/g },
  { label: 'hardcoded API key pattern', re: /(['"`])[A-Za-z0-9]{32,}\1/g },
  { label: 'IBM Cloud API key prefix', re: /ibm_api_key|ibmcloud|apikey/gi },
  { label: 'npm auth token', re: /\/\/registry\.npmjs\.org\/:_authToken/g },
  { label: '.env file reference', re: /require\(['"`]dotenv/g },
];

const IGNORE_EXTENSIONS = new Set(['.map', '.md']);

function walk(dir) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    const fullPath = join(dir, name);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      entries.push(...walk(fullPath));
    } else if (!IGNORE_EXTENSIONS.has(name.slice(name.lastIndexOf('.')))) {
      entries.push(fullPath);
    }
  }
  return entries;
}

let found = 0;

for (const filePath of walk(SRC_DIR)) {
  const rel = relative(join(__dirname, '..'), filePath);
  let content;
  try {
    content = readFileSync(filePath, 'utf8');
  } catch {
    continue;
  }

  for (const { label, re } of PATTERNS) {
    re.lastIndex = 0;
    const matches = content.match(re);
    if (matches) {
      console.error(`[check-secrets] ${label} found in ${rel}:`);
      for (const m of matches) {
        console.error(`  ${m}`);
      }
      found += matches.length;
    }
  }
}

if (found > 0) {
  console.error(`\n[check-secrets] FAILED: ${found} potential secret(s) detected. Review before publishing.`);
  process.exit(1);
} else {
  console.log('[check-secrets] OK — no secrets detected.');
}
