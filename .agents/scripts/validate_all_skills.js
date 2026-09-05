#!/usr/bin/env node
/**
 * 우현이 관찰 시스템 전체 스킬 종합 무결성 & 피드백 루프 검증기
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BASE_DIR = path.resolve(__dirname, '../../');
const SKILLS_DIR = path.join(BASE_DIR, '.agents/skills');

console.log('======================================================================');
console.log('🧪 [전체 에이전트 스킬 종합 검증 & 자가 진단]');
console.log('======================================================================\n');

let totalTests = 0;
let passes = 0;
let failures = 0;
const failureDetails = [];

function pass(name) {
  console.log(`  ✅ [PASS] ${name}`);
  passes++;
  totalTests++;
}

function fail(name, reason) {
  console.error(`  ❌ [FAIL] ${name}`);
  if (reason) console.error(`     └─ 사유: ${reason}`);
  failures++;
  totalTests++;
  failureDetails.push({ name, reason });
}

// 1. Scan all skills
if (!fs.existsSync(SKILLS_DIR)) {
  fail('스킬 디렉토리 존재 확인', `.agents/skills 디렉토리가 없습니다.`);
  process.exit(1);
}

const skillFolders = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);

console.log(`🔍 등록된 스킬 폴더 목록 (${skillFolders.length}개):`);
skillFolders.forEach(name => console.log(`   - ${name}`));
console.log('');

// 2. Validate each skill's structure
skillFolders.forEach(skillName => {
  const skillDir = path.join(SKILLS_DIR, skillName);
  const skillMdPath = path.join(skillDir, 'SKILL.md');

  // Check SKILL.md
  if (!fs.existsSync(skillMdPath)) {
    fail(`[${skillName}] SKILL.md 파일 존재`, `SKILL.md 파일이 누락되었습니다.`);
  } else {
    const content = fs.readFileSync(skillMdPath, 'utf-8');
    if (!content.startsWith('---') || !content.includes('name:') || !content.includes('description:')) {
      fail(`[${skillName}] SKILL.md YAML Frontmatter 유효성`, `YAML 프론트매터(name, description)가 올바르지 않습니다.`);
    } else {
      pass(`[${skillName}] SKILL.md 규격 및 프론트매터 확인`);
    }
  }

  // Check scripts syntax
  const scriptsDir = path.join(skillDir, 'scripts');
  if (fs.existsSync(scriptsDir)) {
    const scripts = fs.readdirSync(scriptsDir).filter(f => f.endsWith('.js'));
    scripts.forEach(scriptFile => {
      const scriptPath = path.join(scriptsDir, scriptFile);
      try {
        execSync(`node -c "${scriptPath}"`);
        pass(`[${skillName}] 스크립트 문법 유효: ${scriptFile}`);
      } catch (err) {
        fail(`[${skillName}] 스크립트 문법 오류: ${scriptFile}`, err.message);
      }
    });
  }
});

// 3. Functional Dry-Run of Core Skills
console.log('\n🚀 핵심 스킬 실행 동작 검증 (Dry-Run):');

const testCommands = [
  {
    name: 'woohyun-tracker 종합 하네스 실행',
    cmd: 'node .agents/skills/woohyun-tracker/scripts/run_harness.js'
  },
  {
    name: 'hospital-consultation-report 진료 리포트 생성',
    cmd: 'node .agents/skills/hospital-consultation-report/scripts/generate_doctor_report.js --days=7'
  },
  {
    name: 'medication-titration-analyzer 처방 전후 비교 분석',
    cmd: 'node .agents/skills/medication-titration-analyzer/scripts/compare_titration.js'
  },
  {
    name: 'observation-data-guardian 데이터 무결성 검증 및 백업',
    cmd: 'node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js'
  },
  {
    name: 'local-wifi-mobile-sync 모바일 동기화 정적 검증',
    cmd: 'node .agents/skills/local-wifi-mobile-sync/scripts/test_mobile_sync.js'
  },
  {
    name: 'woohyun-qa-guardian SWUT 단위시험 실행',
    cmd: 'node .agents/skills/woohyun-qa-guardian/scripts/run_swut.js'
  },
  {
    name: 'context-learner 지식 검색 및 기록 dry-run',
    cmd: 'node .agents/skills/context-learner/scripts/record_learning.js --dry-run'
  }
];

testCommands.forEach(t => {
  try {
    execSync(t.cmd, { cwd: BASE_DIR, stdio: 'pipe' });
    pass(t.name);
  } catch (err) {
    fail(t.name, err.stderr ? err.stderr.toString() : err.message);
  }
});

// 4. Final Summary
console.log('\n======================================================================');
console.log(`🏁 종합 검증 결과: 총 ${totalTests}개 검증 중 [성공: ${passes}건 / 실패: ${failures}건]`);
console.log('======================================================================');

if (failures > 0) {
  console.log('\n⚠️ 오류 상세 내역:');
  failureDetails.forEach((f, idx) => {
    console.log(`${idx + 1}. ${f.name}`);
    console.log(`   └─ ${f.reason}`);
  });
  console.log('\n💡 스킬 수정 후 다시 `node .agents/scripts/validate_all_skills.js`를 실행하세요.');
  process.exit(1);
} else {
  console.log('🎉 모든 에이전트 스킬이 정상적으로 작동하며 데이터 정합성을 만족합니다!');
  console.log('💡 사용자가 스킬 관련 문제나 기능 개선을 요청할 때 즉시 수정하고 이 스크립트로 검증하세요.');
}
