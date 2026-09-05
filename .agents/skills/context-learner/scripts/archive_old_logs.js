#!/usr/bin/env node
/**
 * archive_old_logs.js
 * 
 * task_log.md 파일이 비대해지지 않도록 최신 15~20건의 활성 작업만 유지하고,
 * 초과된 과거 로그를 knowledge/archive/ 로 자동 이전 분리하는 CLI 도구입니다.
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_ROOT = path.resolve(__dirname, '../../../../knowledge');
const TASK_LOG_PATH = path.join(KNOWLEDGE_ROOT, 'tasks', 'task_log.md');
const ARCHIVE_DIR = path.join(KNOWLEDGE_ROOT, 'archive');

const MAX_ACTIVE_ENTRIES = 15;

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes('--dry-run'),
    threshold: parseInt((args.find(a => a.startsWith('--limit=')) || '').split('=')[1], 10) || MAX_ACTIVE_ENTRIES
  };
}

function archive() {
  const { dryRun, threshold } = parseArgs();

  if (!fs.existsSync(TASK_LOG_PATH)) {
    console.log(`❌ task_log.md 파일이 존재하지 않습니다.`);
    return;
  }

  const content = fs.readFileSync(TASK_LOG_PATH, 'utf8');
  const delimiter = '### 📌 [';
  
  // 첫 번째 항목 이전(문서 헤더)과 각 작업 항목 분리
  const parts = content.split(delimiter);
  const header = parts[0];
  const entries = parts.slice(1).map(p => delimiter + p);

  console.log(`\n📦 [로그 비대화 점검 및 아카이빙]`);
  console.log(`   현재 활성 작업 로그 수: ${entries.length}개 (유지 기준: ${threshold}개)`);

  if (entries.length <= threshold) {
    console.log(`   ✅ 현재 항목 수가 유지 기준 이하이므로 아카이빙이 필요하지 않습니다.\n`);
    return;
  }

  const activeEntries = entries.slice(0, threshold);
  const archiveEntries = entries.slice(threshold);

  const now = new Date();
  const quarter = `Q${Math.floor(now.getMonth() / 3) + 1}`;
  const archiveFileName = `task_log_${now.getFullYear()}_${quarter}.md`;
  const archiveFilePath = path.join(ARCHIVE_DIR, archiveFileName);

  console.log(`   🚨 초과 항목 ${archiveEntries.length}개를 아카이브 파일로 이동합니다:`);
  console.log(`   대상: knowledge/archive/${archiveFileName}`);

  if (dryRun) {
    console.log(`   [Dry-Run] 파일은 실제로 수정되지 않았습니다.\n`);
    return;
  }

  // 아카이브 파일에 추가
  if (!fs.existsSync(ARCHIVE_DIR)) {
    fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  }

  let archiveContent = '';
  if (!fs.existsSync(archiveFilePath)) {
    archiveContent = `# 📦 작업 로그 아카이브 (${now.getFullYear()}년 ${quarter})\n\n이 문서는 task_log.md에서 이전된 과거 작업 기록입니다.\n\n---\n\n`;
  }
  archiveContent += archiveEntries.join('\n') + '\n';
  fs.appendFileSync(archiveFilePath, archiveContent, 'utf8');

  // 원본 task_log.md 업데이트 (헤더 + 최신 활성 항목만 남김)
  const updatedTaskLog = header + activeEntries.join('');
  fs.writeFileSync(TASK_LOG_PATH, updatedTaskLog, 'utf8');

  console.log(`   ✅ 아카이빙 완료! task_log.md 크기가 최적화되었습니다.\n`);
}

archive();
