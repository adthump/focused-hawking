#!/usr/bin/env node
/**
 * 🚀 우현이 일일 관찰 기록표 종합 자동 테스트 마스터 러너
 * - SWUT (소프트웨어 단위 시험)
 * - SWIT (REST API & 웹 서버 실동작 통합 시험)
 * - HTML & 클라이언트 JS 구문 및 DOM 무결성 검증
 * - woohyun-tracker 32개 지표 하네스
 * - observation-data-guardian 데이터 무결성 및 자동 스냅샷 백업
 * - hospital-consultation-report 전문의 진료 리포트 생성
 * - medication-titration-analyzer 처방 전후 비교 분석
 * - generate_excel.js 엑셀 템플릿 생성
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const BASE_DIR = path.resolve(__dirname, '../');

console.log('╔════════════════════════════════════════════════════════════════════╗');
console.log('║  🌟 [우현이 일일 관찰 기록표 시스템] 종합 동작 자동 테스트 러너   ║');
console.log('║     (SWUT 단위시험 + SWIT 통합시험 + 전 시스템 기능 전수 검증)      ║');
console.log('╚════════════════════════════════════════════════════════════════════╝\n');

const startTime = Date.now();
let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;
const suiteResults = [];

function runSuite(name, fn) {
  totalSuites++;
  console.log(`\n----------------------------------------------------------------------`);
  console.log(`▶ [SUITE ${totalSuites}] ${name}`);
  console.log(`----------------------------------------------------------------------`);
  const sStart = Date.now();
  try {
    fn();
    const elapsed = ((Date.now() - sStart) / 1000).toFixed(2);
    console.log(`  🎉 [성공] ${name} (${elapsed}초)`);
    passedSuites++;
    suiteResults.push({ name, status: 'PASS', elapsed });
  } catch (err) {
    const elapsed = ((Date.now() - sStart) / 1000).toFixed(2);
    console.error(`  ❌ [실패] ${name} (${elapsed}초)`);
    console.error(`     └─ 사유: ${err.message}`);
    failedSuites++;
    suiteResults.push({ name, status: 'FAIL', elapsed, error: err.message });
  }
}

// 1. SWUT (Software Unit Test)
runSuite('SWUT (Software Unit Test - 소프트웨어 단위 시험 19종)', () => {
  execSync('node test/unit/swut.test.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 2. SWIT (Software Integration Test)
runSuite('SWIT (Software Integration Test - REST API & 웹 서빙 실동작 11종)', () => {
  execSync('node test/integration/server_api.test.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 3. Frontend HTML & Inline JavaScript Syntax & DOM Integrity
runSuite('웹 애플리케이션 (index.html) 인라인 JS 문법 및 DOM 무결성 검증', () => {
  const htmlPath = path.join(BASE_DIR, 'index.html');
  if (!fs.existsSync(htmlPath)) throw new Error('index.html 파일이 존재하지 않습니다.');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // Extract inline scripts
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptCount = 0;
  while ((match = scriptRegex.exec(html)) !== null) {
    const code = match[1].trim();
    if (code.length > 0) {
      scriptCount++;
      try {
        new vm.Script(code);
      } catch (e) {
        throw new Error(`index.html 인라인 스크립트 #${scriptCount} 컴파일 오류: ${e.message}`);
      }
    }
  }
  console.log(`  ✅ [PASS] index.html 인라인 JavaScript ${scriptCount}개 블록 구문(Syntax) 무결성 확인 (오류 0건)`);

  // Check critical DOM element IDs
  const requiredIds = [
    'syncStatusBadge',
    'tab-record',
    'tab-dashboard',
    'tab-table',
    'tab-briefing',
    'section-briefing',
    'briefingContentArea',
    'recordDate',
    'dayOfWeekBadge',
    'medicineList',
    'mathProblemCount',
    'mathFocusDuration',
    'focusChart',
    'moodChart',
    'recordsTableBody',
    'mobileCardsContainer',
    'mobileQrModal'
  ];

  requiredIds.forEach(id => {
    if (!html.includes(`id="${id}"`)) {
      throw new Error(`필수 DOM ID 누락: #${id}`);
    }
  });
  console.log(`  ✅ [PASS] 필수 UI/DOM 컴포넌트 ${requiredIds.length}종 존재 확인 완료`);
});

// 4. SWVT (Software Visual & Layout Test)
runSuite('SWVT (Software Visual & Layout Test - 시각·반응형 레이아웃 5종 시험)', () => {
  execSync('node test/visual/swvt.test.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 5. Woohyun Tracker Harness
runSuite('woohyun-tracker 32개 핵심 지표 종합 하네스 검증', () => {
  execSync('node .agents/skills/woohyun-tracker/scripts/run_harness.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 6. Data Guardian Verification & Snapshot Backup
runSuite('observation-data-guardian 데이터 무결성 검증 및 안전 백업', () => {
  execSync('node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 7. Hospital Consultation Report
runSuite('hospital-consultation-report 전문의 진료 브리핑 리포트 자동 생성', () => {
  execSync('node .agents/skills/hospital-consultation-report/scripts/generate_doctor_report.js --days=7', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 8. Medication Titration Analyzer
runSuite('medication-titration-analyzer 처방 변경 전후 비교 분석', () => {
  execSync('node .agents/skills/medication-titration-analyzer/scripts/compare_titration.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 9. Excel Template Generator
runSuite('generate_excel.js 엑셀 템플릿 생성 및 정합성 검증', () => {
  execSync('node generate_excel.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// 10. All Agent Skills Integrity Check
runSuite('전체 에이전트 스킬 규격 및 프론트매터 종합 진단', () => {
  execSync('node .agents/scripts/validate_all_skills.js', { cwd: BASE_DIR, stdio: 'inherit' });
});

// Final Report
const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(2);
console.log('\n======================================================================');
console.log('📊 [종합 동작 자동 테스트 최종 결과 보고서]');
console.log('======================================================================');
console.log(`총 실행 시간: ${totalElapsed}초`);
console.log(`테스트 스위트: 총 ${totalSuites}개 중 [성공: ${passedSuites}개 / 실패: ${failedSuites}개]`);
console.log('----------------------------------------------------------------------');

suiteResults.forEach((s, idx) => {
  const icon = s.status === 'PASS' ? '✅' : '❌';
  console.log(`${icon} [${idx + 1}] ${s.name} (${s.elapsed}초)`);
  if (s.error) console.log(`   └─ 오류: ${s.error}`);
});

console.log('======================================================================');
if (failedSuites > 0) {
  console.log('❌ 일부 테스트가 실패했습니다. 위 오류 내용을 확인하세요.');
  process.exit(1);
} else {
  console.log('🎉 모든 계층(단위/통합/하네스/데이터/리포트)의 자동 테스트가 100% 성공했습니다!');
  process.exit(0);
}
