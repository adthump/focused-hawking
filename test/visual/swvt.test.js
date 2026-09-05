#!/usr/bin/env node
/**
 * 🎨 SWVT (Software Visual & Layout Test - 시각·반응형 레이아웃 자동 시험 5종)
 * 
 * [검증 매트릭스]
 * - TC-VT-01: 5대 관찰 폼 섹션 순서 무결성 (1.약물 -> 2.수면식사 -> 3.수학 -> 4.리바운드 -> 5.신체이상)
 * - TC-VT-02: 한국어 타이포그래피 무결성 (word-break: keep-all 적용 여부 및 단어 분절 방지)
 * - TC-VT-03: 모바일 390px 뷰포트 안정성 (overflow-x-hidden, 뷰포트 메타, 반응형 클래스)
 * - TC-VT-04: 아동 존중 비낙인 언어 지침 (UI 내 ADHD 등 특정 진단명 노출 0건)
 * - TC-VT-05: 모바일 4대 네비게이션 탭 및 17개 필수 DOM ID 무결성
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const HTML_PATH = path.resolve(__dirname, '../../index.html');
if (!fs.existsSync(HTML_PATH)) {
  console.error('❌ index.html 파일을 찾을 수 없습니다.');
  process.exit(1);
}

const html = fs.readFileSync(HTML_PATH, 'utf-8');

console.log('======================================================================');
console.log('🎨 [SWVT] Software Visual & Layout Test (시각·반응형 레이아웃 5종 시험)');
console.log('======================================================================\n');

let passCount = 0;
let failCount = 0;

function runTest(tcId, name, testFn) {
  try {
    testFn();
    console.log(`  ✅ [PASS] ${tcId}: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${tcId}: ${name}`);
    console.error(`     └─ 사유: ${err.message}`);
    failCount++;
  }
}

// -----------------------------------------------------------------------------
// TC-VT-01: 5대 관찰 폼 섹션 순서 무결성
// -----------------------------------------------------------------------------
runTest('TC-VT-01', '5대 관찰 폼 섹션 순서 무결성 (1.약물 -> 2.수면식사 -> 3.수학 -> 4.리바운드 -> 5.신체이상)', () => {
  const formStart = html.indexOf('<form id="observationForm"');
  const formEnd = html.indexOf('</form>', formStart);
  assert.ok(formStart !== -1 && formEnd !== -1, 'observationForm 태그가 존재해야 합니다.');
  const formHtml = html.substring(formStart, formEnd);

  // Find index of each card heading inside observationForm
  const idx1 = formHtml.indexOf('1. 💊 처방 약물');
  const idx2 = formHtml.indexOf('2. 🌙 수면 & 식사량');
  const idx3 = formHtml.indexOf('3. 🎯 약효 피크 평가: 오후 4시 수학 집중도');
  const idx4 = formHtml.indexOf('4. ⚡ 약효 소진기: 저녁 리바운드');
  const idx5 = formHtml.indexOf('5. 🩺 신체 이상 증상, 틱(Tic) 관찰');

  assert.ok(idx1 !== -1, '섹션 1(처방 약물) 제목이 존재해야 합니다.');
  assert.ok(idx2 !== -1, '섹션 2(수면 & 식사량) 제목이 존재해야 합니다.');
  assert.ok(idx3 !== -1, '섹션 3(오후 4시 수학 집중도) 제목이 존재해야 합니다.');
  assert.ok(idx4 !== -1, '섹션 4(저녁 리바운드) 제목이 존재해야 합니다.');
  assert.ok(idx5 !== -1, '섹션 5(신체 이상 증상) 제목이 존재해야 합니다.');

  assert.ok(idx1 < idx2, '섹션 1이 섹션 2보다 먼저 위치해야 합니다.');
  assert.ok(idx2 < idx3, '섹션 2가 섹션 3보다 먼저 위치해야 합니다.');
  assert.ok(idx3 < idx4, '섹션 3이 섹션 4보다 먼저 위치해야 합니다.');
  assert.ok(idx4 < idx5, '섹션 4가 섹션 5보다 먼저 위치해야 합니다.');
});

// -----------------------------------------------------------------------------
// TC-VT-02: 한국어 타이포그래피 무결성 (word-break: keep-all)
// -----------------------------------------------------------------------------
runTest('TC-VT-02', '한국어 타이포그래피 무결성 (전역 word-break: keep-all 적용 여부)', () => {
  assert.ok(
    html.includes('word-break: keep-all;') || html.includes('word-break:keep-all;'),
    '한국어 단어 분절(예: 리바운/드) 방지를 위해 word-break: keep-all;이 스타일에 적용되어 있어야 합니다.'
  );
});

// -----------------------------------------------------------------------------
// TC-VT-03: 모바일 390px 뷰포트 레이아웃 안정성
// -----------------------------------------------------------------------------
runTest('TC-VT-03', '모바일 390px 뷰포트 안정성 (뷰포트 메타, overflow-x-hidden, 반응형 클래스)', () => {
  // 1. Viewport meta tag
  assert.ok(html.includes('name="viewport"'), 'meta viewport 태그가 존재해야 합니다.');
  assert.ok(html.includes('width=device-width'), 'viewport 너비가 device-width로 설정되어야 합니다.');

  // 2. Horizontal overflow prevention
  assert.ok(html.includes('overflow-x-hidden'), '가로 스크롤 방지를 위해 overflow-x-hidden 클래스가 적용되어야 합니다.');

  // 3. Check medicine row has responsive flex wrapping
  assert.ok(html.includes('id="medicineList"'), 'medicineList 컨테이너가 존재해야 합니다.');

  // 4. Time inputs width should be compact for mobile
  assert.ok(
    html.includes('id="wakeHour"') && html.includes('id="sleepHour"'),
    '기상 및 취침 시간 선택 인풋이 존재해야 합니다.'
  );
});

// -----------------------------------------------------------------------------
// TC-VT-04: 아동 존중 비낙인 언어 지침 준수
// -----------------------------------------------------------------------------
runTest('TC-VT-04', '아동 존중 비낙인 언어 지침 (UI 내 ADHD 등 특정 진단명 노출 0건)', () => {
  // Check that ADHD is not exposed in UI headers or titles
  const userFacingMatches = html.match(/>[^<]*ADHD[^<]*</gi) || [];
  assert.strictEqual(
    userFacingMatches.length,
    0,
    `UI 화면 텍스트에 비낙인 언어 규칙 위반 발견: ${JSON.stringify(userFacingMatches)}`
  );
});

// -----------------------------------------------------------------------------
// TC-VT-05: 모바일 4대 네비게이션 탭 및 17개 필수 DOM ID 무결성
// -----------------------------------------------------------------------------
runTest('TC-VT-05', '모바일 4대 네비게이션 탭 및 17개 필수 DOM ID 무결성', () => {
  // Mobile bottom bar tabs
  const mobileTabs = ['mobile-tab-record', 'mobile-tab-dashboard', 'mobile-tab-briefing', 'mobile-tab-table'];
  mobileTabs.forEach(id => {
    assert.ok(html.includes(`id="${id}"`), `모바일 하단 탭 #${id}가 누락되었습니다.`);
  });

  // 17 core DOM IDs
  const coreIds = [
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
  coreIds.forEach(id => {
    assert.ok(html.includes(`id="${id}"`), `필수 핵심 DOM ID #${id}가 누락되었습니다.`);
  });
});

console.log('\n----------------------------------------------------------------------');
console.log(`🏁 SWVT 검증 결과: 총 5개 시험 중 [성공: ${passCount}건 / 실패: ${failCount}건]`);
console.log('----------------------------------------------------------------------\n');

if (failCount > 0) {
  process.exit(1);
} else {
  console.log('🎉 모든 시각·반응형 레이아웃 시험(SWVT)을 완벽히 통과했습니다!\n');
  process.exit(0);
}
