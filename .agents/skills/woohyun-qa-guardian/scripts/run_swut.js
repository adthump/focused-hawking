#!/usr/bin/env node
/**
 * woohyun-qa-guardian: SWUT 단위 시험 실행기
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const testScript = path.join(ROOT_DIR, 'test/unit/swut.test.js');

try {
  execSync(`node "${testScript}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
