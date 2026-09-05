#!/usr/bin/env node
/**
 * woohyun-qa-guardian: 종합 QA 테스트 러너
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const testScript = path.join(ROOT_DIR, 'test/run_automated_tests.js');

try {
  execSync(`node "${testScript}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
