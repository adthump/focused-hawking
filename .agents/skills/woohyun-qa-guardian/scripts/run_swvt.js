#!/usr/bin/env node
/**
 * woohyun-qa-guardian: SWVT 시각·반응형 레이아웃 시험 실행기
 */
const { execSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const testScript = path.join(ROOT_DIR, 'test/visual/swvt.test.js');

try {
  execSync(`node "${testScript}"`, { cwd: ROOT_DIR, stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
