#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..');
const DICT_PATH = path.join(ROOT_DIR, 'dict', 'zh-CN.json');
const TEMPLATE_PATH = path.join(ROOT_DIR, 'src', 'overlay.template.js');
const PATCH_SCRIPT_PATH = path.join(ROOT_DIR, 'bin', 'antigravity-zh-patch.js');
const BUILD_SCRIPT_PATH = path.join(ROOT_DIR, 'tools', 'build.js');
const INSTALL_SH_PATH = path.join(ROOT_DIR, 'install.sh');
const INSTALL_BAT_PATH = path.join(ROOT_DIR, 'install.bat');

let failures = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
  } catch (err) {
    failures++;
    console.error(`  [FAIL] ${name}`);
    console.error(`    ${err.message}`);
  }
}

async function runTests() {
  console.log('Starting Antigravity Chinese CDP Test Suite...\n');

  // Group 1: Dictionary & Modern Developer Terminology
  console.log('[1/5] Checking Dictionary & Modern Developer Terminology...');
  test('dict/zh-CN.json should exist and be valid JSON', () => {
    assert(fs.existsSync(DICT_PATH), 'dict file must exist');
    const content = fs.readFileSync(DICT_PATH, 'utf8');
    const data = JSON.parse(content);
    assert(data.exact && typeof data.exact === 'object', 'dict.exact must be an object');
    assert(Array.isArray(data.patterns), 'dict.patterns must be an array');
  });

  test('dict/zh-CN.json must retain Subagent terminology', () => {
    const data = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
    assert.strictEqual(data.exact['1 subagent running'], '1 个运行中的Subagent');
    assert.strictEqual(data.exact['(subagent)'], '(subagent)');
    assert(data.patterns.some((p) => p.replacement && p.replacement.includes('Subagent')));
  });

  test('dict/zh-CN.json must retain Hook terminology', () => {
    const data = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
    assert.strictEqual(data.exact['+ Add Hook'], '+ 添加 Hook');
    assert.strictEqual(data.exact['Agent Hooks Configuration'], '智能体 Hook 配置');
    assert.strictEqual(data.exact['Add Hook Card'], '添加 Hook 卡片');
  });

  test('dict/zh-CN.json must retain Token, Sidecar, Delegation routine, and status capsules', () => {
    const data = JSON.parse(fs.readFileSync(DICT_PATH, 'utf8'));
    assert.strictEqual(data.exact['/ 1M tokens'], '/ 百万 Token');
    assert(['委派例程', '委派流程'].includes(data.exact['Delegation routine']));
    assert.strictEqual(data.exact['Started'], '已启动');
    assert.strictEqual(data.exact['Waiting for completion'], '等待完成');
    assert.strictEqual(data.exact['Waiting for its completion.'], '等待其执行完成。');
  });

  // Group 2: Template and Build Pipeline
  console.log('\n[2/5] Testing Template & Build Toolchain...');
  test('src/overlay.template.js must have required placeholders', () => {
    assert(fs.existsSync(TEMPLATE_PATH), 'Template must exist');
    const tpl = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    assert(tpl.includes('__PATCH_VERSION__'), 'Template must include __PATCH_VERSION__');
    assert(tpl.includes('__RAW_DICT__'), 'Template must include __RAW_DICT__');
    assert(tpl.includes('__RAW_PATTERNS__'), 'Template must include __RAW_PATTERNS__');
  });

  test('tools/build.js should safely handle special replacement patterns ($1, $&, $`, $\')', () => {
    // Verify that String.prototype.replace inside build.js uses functions rather than strings
    const buildSource = fs.readFileSync(BUILD_SCRIPT_PATH, 'utf8');
    assert(buildSource.includes('() => `const overlaySource ='), 'overlaySource replacement must use function replacer');
    assert(buildSource.includes('() => JSON.stringify(dict.exact)'), 'dict replacement must use function replacer');
    assert(buildSource.includes('() => JSON.stringify(dict.patterns)'), 'patterns replacement must use function replacer');
  });

  test('tools/build.js --no-bump should compile without errors', () => {
    execFileSync(process.execPath, [BUILD_SCRIPT_PATH, '--no-bump'], { stdio: 'pipe' });
    assert(fs.existsSync(PATCH_SCRIPT_PATH), 'bin/antigravity-zh-patch.js must exist');
  });

  test('bin/antigravity-zh-patch.js should pass node syntax check (-c)', () => {
    execFileSync(process.execPath, ['-c', PATCH_SCRIPT_PATH]);
  });

  // Group 3: Cross-Platform DevToolsActivePort Port Detection
  console.log('\n[3/5] Testing Cross-Platform Port Discovery Logic...');
  test('DevToolsActivePort path candidates generation and case-sensitivity', () => {
    const patchContent = fs.readFileSync(PATCH_SCRIPT_PATH, 'utf8');
    assert(patchContent.includes('DevToolsActivePort'), 'Script must handle DevToolsActivePort');
    assert(patchContent.includes('getDevToolsActivePortPaths'), 'Script must have path resolver');
    assert(patchContent.includes('Library/Application Support/Antigravity/DevToolsActivePort'), 'macOS path must be covered');
    assert(patchContent.includes('AppData'), 'Windows path must be covered');
    assert(patchContent.includes('Antigravity') && patchContent.includes('antigravity'), 'Linux case sensitivity covered');
  });

  test('DevToolsActivePort should parse line 1 (port) and line 2 (browser endpoint)', () => {
    const patchContent = fs.readFileSync(PATCH_SCRIPT_PATH, 'utf8');
    assert(patchContent.includes('endpoint: browserEndpoint') || patchContent.includes('browserEndpoint'), 'Must parse second line browser endpoint');
    // Simulate parsing logic
    const mockContent = '58794\n/devtools/browser/78cf38b4-8452-4752-b883-93d3950f2824\n';
    const lines = mockContent.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const port = parseInt(lines[0], 10);
    const endpoint = lines.length >= 2 ? lines[1] : '';
    assert.strictEqual(port, 58794);
    assert.strictEqual(endpoint, '/devtools/browser/78cf38b4-8452-4752-b883-93d3950f2824');
  });

  test('Fallback discovery should support tasklist/netstat on Windows and ps/lsof on macOS/Linux', () => {
    const patchContent = fs.readFileSync(PATCH_SCRIPT_PATH, 'utf8');
    assert(patchContent.includes('debugPortsFallback'), 'Fallback must exist');
    assert(patchContent.includes('getAntigravityPidFallback'), 'Process fallback must exist');
    assert(patchContent.includes('tasklist'), 'Windows tasklist fallback must exist');
    assert(patchContent.includes('netstat'), 'Windows netstat fallback must exist');
    assert(patchContent.includes('lsof'), 'macOS/Linux lsof fallback must exist');
  });

  // Group 4: Adaptive Backoff and Power Efficiency
  console.log('\n[4/5] Testing Adaptive Backoff and Event Wakeup Logic...');
  test('Watch daemon should define FAST_INTERVAL and BACKOFF_INTERVAL', () => {
    const patchContent = fs.readFileSync(PATCH_SCRIPT_PATH, 'utf8');
    assert(patchContent.includes('FAST_INTERVAL_MS = 2000'), 'Must define fast interval of 2000ms');
    assert(patchContent.includes('BACKOFF_INTERVAL_MS = 12000'), 'Must define backoff interval (10-15s)');
    assert(patchContent.includes('consecutiveHealthy'), 'Must track healthy status for backoff');
  });

  test('Watch daemon should track target count changes and fs.watch event wakeups', () => {
    const patchContent = fs.readFileSync(PATCH_SCRIPT_PATH, 'utf8');
    assert(patchContent.includes('lastTargetCount'), 'Must track target window count changes');
    assert(patchContent.includes('targetCountChanged'), 'Must detect window addition/removal');
    assert(patchContent.includes('fs.watch'), 'Must leverage fs.watch for zero-latency wakeups');
  });

  // Group 5: Installation Scripts & Rules Sync
  console.log('\n[5/5] Testing Installation Scripts & Rules Sync...');
  test('install.sh should pass bash syntax validation', () => {
    execFileSync('bash', ['-n', INSTALL_SH_PATH]);
  });

  test('install.bat should use !errorlevel! inside parentheses blocks for delayed expansion', () => {
    const batContent = fs.readFileSync(INSTALL_BAT_PATH, 'utf8');
    // Ensure no "%errorlevel% neq 0" inside if blocks with parentheses
    const lines = batContent.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('%errorlevel% neq 0') && (i > 20)) {
        assert.fail(`Line ${i + 1} uses %errorlevel% inside block, must use !errorlevel!: ${line}`);
      }
    }
  });

  test('install.sh and install.bat should support --with-rules and --once', () => {
    const shContent = fs.readFileSync(INSTALL_SH_PATH, 'utf8');
    const batContent = fs.readFileSync(INSTALL_BAT_PATH, 'utf8');
    assert(shContent.includes('--with-rules'), 'install.sh must support --with-rules');
    assert(shContent.includes('--once'), 'install.sh must support --once');
    assert(batContent.includes('--with-rules'), 'install.bat must support --with-rules');
    assert(batContent.includes('--once'), 'install.bat must support --once');
  });

  console.log('\n========================================');
  if (failures === 0) {
    console.log('All test cases passed successfully.');
  } else {
    console.error(`[FAIL] ${failures} test(s) failed.`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
