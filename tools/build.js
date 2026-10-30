#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT_DIR, 'dict', 'zh-CN.json');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'src', 'overlay.template.js');
const PATCH_SCRIPT_PATH = path.join(ROOT_DIR, 'bin', 'antigravity-zh-patch.js');

function build() {
  console.log('Starting Antigravity Chinese CDP build pipeline...');

  // 1. Read and validate dictionary
  if (!fs.existsSync(DICT_PATH)) {
    throw new Error(`Dictionary file not found at ${DICT_PATH}`);
  }
  const dictRaw = fs.readFileSync(DICT_PATH, 'utf8');
  const dict = JSON.parse(dictRaw);

  const exactKeys = Object.keys(dict.exact || {});
  const patternItems = dict.patterns || [];

  dict.exact_count = exactKeys.length;
  dict.patterns_count = patternItems.length;

  // Format and save dictionary
  fs.writeFileSync(DICT_PATH, JSON.stringify(dict, null, 2) + '\n', 'utf8');
  console.log(`[build] Dictionary synced: ${dict.exact_count} exact translations, ${dict.patterns_count} cascading patterns.`);

  // 2. Determine patch version
  if (!fs.existsSync(PATCH_SCRIPT_PATH)) {
    throw new Error(`Patch script not found at ${PATCH_SCRIPT_PATH}`);
  }
  let patchScript = fs.readFileSync(PATCH_SCRIPT_PATH, 'utf8');

  const versionMatch =
    patchScript.match(/TARGET_PATCH_VERSION\s*=\s*(\d+)/) ||
    patchScript.match(/CURRENT_PATCH_VERSION\s*=\s*(\d+)/);
  const currentVersion = versionMatch ? parseInt(versionMatch[1], 10) : 34;

  const shouldBump = !process.argv.includes('--no-bump');
  const newVersion = shouldBump ? currentVersion + 1 : currentVersion;
  console.log(`[build] Patch version: ${currentVersion} -> ${newVersion} (bump: ${shouldBump})`);

  // 3. Compile overlay script from template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    throw new Error(`Template not found at ${TEMPLATE_PATH}`);
  }
  const template = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // Use replacer functions for String.prototype.replace to prevent
  // special substitution patterns ($1, $&, $', etc.) from corrupting code
  const renderedOverlay = template
    .replace(/__PATCH_VERSION__/g, () => String(newVersion))
    .replace('__RAW_DICT__', () => JSON.stringify(dict.exact))
    .replace('__RAW_PATTERNS__', () => JSON.stringify(dict.patterns));

  const overlaySourceLiteral = JSON.stringify(renderedOverlay);

  // 4. Update bin/antigravity-zh-patch.js
  const overlayRegex = /const overlaySource = "(?:[^"\\]|\\.)*";/;
  if (!overlayRegex.test(patchScript)) {
    throw new Error('Could not find "const overlaySource = ...;" in bin/antigravity-zh-patch.js');
  }
  patchScript = patchScript.replace(overlayRegex, () => `const overlaySource = ${overlaySourceLiteral};`);

  // Update TARGET_PATCH_VERSION constant
  if (/const TARGET_PATCH_VERSION = \d+;/.test(patchScript)) {
    patchScript = patchScript.replace(
      /const TARGET_PATCH_VERSION = \d+;/,
      () => `const TARGET_PATCH_VERSION = ${newVersion};`
    );
  }

  fs.writeFileSync(PATCH_SCRIPT_PATH, patchScript, 'utf8');
  const sizeKb = (fs.statSync(PATCH_SCRIPT_PATH).size / 1024).toFixed(1);
  console.log(`[build] Generated ${PATCH_SCRIPT_PATH} (size: ${sizeKb} KB)`);

  // 5. Syntax validation
  try {
    execFileSync(process.execPath, ['-c', PATCH_SCRIPT_PATH]);
    console.log('[build] Syntax validation passed for bin/antigravity-zh-patch.js.');
  } catch (err) {
    throw new Error(`Syntax validation failed: ${err.message}`);
  }

  console.log(`[build] Build complete: Antigravity Chinese CDP (Patch v${newVersion}) ready.`);
}

if (require.main === module) {
  try {
    build();
  } catch (err) {
    console.error('[build] Error:', err.message);
    process.exit(1);
  }
}

module.exports = { build };
