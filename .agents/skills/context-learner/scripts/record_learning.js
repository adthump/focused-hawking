#!/usr/bin/env node
/**
 * record_learning.js
 * 
 * 새로운 개발 패턴, 트러블슈팅 경험, 병원 진료 피드백, 작업 히스토리를
 * knowledge/ 지식 베이스에 표준 서식으로 자동 기록하는 CLI 도구입니다.
 */

const fs = require('fs');
const path = require('path');

const KNOWLEDGE_ROOT = path.resolve(__dirname, '../../../../knowledge');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    category: 'tasks', // dev, care, tasks
    file: '',          // 세부 파일 지정 (예: troubleshooting.md)
    title: '',
    content: '',
    dryRun: false,
    help: false
  };

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg.startsWith('--category=')) {
      options.category = arg.split('=')[1].toLowerCase();
    } else if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1];
    } else if (arg.startsWith('--title=')) {
      options.title = arg.split('=')[1].replace(/^["']|["']$/g, '');
    } else if (arg.startsWith('--content=')) {
      options.content = arg.split('=')[1].replace(/^["']|["']$/g, '');
    }
  }

  return options;
}

function printHelp() {
  console.log(`
📝 우현이 관찰 시스템 지식 기록 도구 (Record Learning CLI)

사용법:
  node record_learning.js [옵션]

옵션:
  --category=구분     기록할 카테고리 (dev, care, tasks - 기본값: tasks)
  --file=파일명       세부 파일명 (생략 시 기본 파일 자동 지정)
  --title="제목"      기록할 항목 제목
  --content="내용"    상세 내용 또는 교훈
  --dry-run          실제 파일 수정 없이 생성될 텍스트만 출력
  --help, -h          도움말 표시

예시:
  # 작업 히스토리 기록
  node record_learning.js --category=tasks --title="수면 패턴 차트 추가" --content="취침-기상 시간 추이 시각화 완료"

  # 트러블슈팅 기록
  node record_learning.js --category=dev --file=troubleshooting.md --title="사파리 뷰포트 높이 버그" --content="dvh 단위 적용하여 해결"
`);
}

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function record() {
  const options = parseArgs();

  if (options.help || (!options.title && !options.dryRun)) {
    printHelp();
    return;
  }

  const today = getTodayString();
  let targetFile = '';
  let entryText = '';

  if (options.category === 'tasks') {
    targetFile = path.join(KNOWLEDGE_ROOT, 'tasks', 'task_log.md');
    entryText = `\n### 📌 [${today}] ${options.title}\n- **요약**: ${options.content || '내용 없음'}\n- **기록일시**: ${new Date().toISOString()}\n`;
  } else if (options.category === 'dev') {
    const fileName = options.file || 'troubleshooting.md';
    targetFile = path.join(KNOWLEDGE_ROOT, 'dev', fileName);
    entryText = `\n### CASE [${today}]: ${options.title}\n- **내용 및 해결책**: ${options.content}\n`;
  } else if (options.category === 'care') {
    const fileName = options.file || 'doctor_feedback.md';
    targetFile = path.join(KNOWLEDGE_ROOT, 'care', fileName);
    entryText = `\n### [${today}] ${options.title}\n- **내용**: ${options.content}\n`;
  } else {
    console.error(`❌ 지원하지 않는 카테고리입니다: ${options.category}`);
    process.exit(1);
  }

  if (options.dryRun) {
    console.log(`\n🔍 [Dry-Run 시뮬레이션 모드]`);
    console.log(`대상 파일: ${targetFile}`);
    console.log(`추가될 내용:\n${entryText || '기본 테스트 엔트리'}`);
    console.log(`✅ Dry-run 정상 완료 (파일은 변경되지 않음)\n`);
    return;
  }

  if (!fs.existsSync(targetFile)) {
    console.error(`❌ 대상 파일이 존재하지 않습니다: ${targetFile}`);
    process.exit(1);
  }

  // 파일 상단(헤더 아래) 또는 섹션 뒤에 삽입
  const currentContent = fs.readFileSync(targetFile, 'utf8');
  
  if (options.category === 'tasks') {
    // ## 📋 활성 작업 로그 (최신순) 바로 아래에 삽입
    const marker = '## 📋 활성 작업 로그 (최신순)';
    if (currentContent.includes(marker)) {
      const parts = currentContent.split(marker);
      const newContent = parts[0] + marker + '\n' + entryText + parts[1];
      fs.writeFileSync(targetFile, newContent, 'utf8');
    } else {
      fs.appendFileSync(targetFile, entryText, 'utf8');
    }
  } else {
    fs.appendFileSync(targetFile, entryText, 'utf8');
  }

  console.log(`\n✅ 지식 기록 완료!`);
  console.log(`   파일: knowledge/${path.relative(KNOWLEDGE_ROOT, targetFile)}`);
  console.log(`   항목: [${today}] ${options.title}\n`);
}

record();
