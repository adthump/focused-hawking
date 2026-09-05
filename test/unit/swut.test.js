/**
 * 🧪 SWUT (Software Unit Test - 소프트웨어 단위 시험) 스위트
 * 우현이 일일 관찰 기록표 시스템 핵심 비즈니스 로직 및 개별 모듈 단위 시험
 */
const assert = require('assert');
const path = require('path');
const fs = require('fs');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failureList = [];

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     └─ 오류: ${err.message}`);
    failedTests++;
    failureList.push({ name, error: err.message });
  }
}

async function asyncTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     └─ 오류: ${err.message}`);
    failedTests++;
    failureList.push({ name, error: err.message });
  }
}

// ============================================================================
// CSU 1: Data Validation & Scoring Logic (데이터 유효성 검증 및 스코어링 단위)
// ============================================================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidIsoDate(dateStr) {
  if (!dateStr || !DATE_REGEX.test(dateStr)) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const [y, m, day] = dateStr.split('-').map(Number);
  return d.getUTCFullYear() === y && (d.getUTCMonth() + 1) === m && d.getUTCDate() === day;
}

const DAY_NAMES = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
function getDayOfWeek(dateStr) {
  const d = new Date(dateStr);
  return DAY_NAMES[d.getDay()];
}

const MOOD_SCORES = {
  '밝음': 4,
  '평온': 3,
  '불안': 2,
  '가라앉음': 1
};

const REBOUND_SCORES = {
  '없음': 1,
  '보통': 2,
  '짜증 심함': 3
};

const VALID_MEALS = ['정상', '평소의 70%', '거의 안 먹음'];

function validateMedicine(med) {
  if (!med || typeof med !== 'object') return false;
  if (!med.name || typeof med.name !== 'string' || med.name.trim() === '') return false;
  if (!med.dosage || typeof med.dosage !== 'string' || med.dosage.trim() === '') return false;
  // Format check: number (integer or decimal) followed by mg, g, 정, ml, etc. (e.g. 10mg, 0.5mg, 0.5정, 1정)
  const dosagePattern = /^(\d+(\.\d+)?(mg|g|정|ml)|[0-9]+(\.[0-9]+)?)$/i;
  return dosagePattern.test(med.dosage.trim());
}

function validateObservationRecord(record) {
  const errors = [];
  if (!record.date || !isValidIsoDate(record.date)) {
    errors.push('INVALID_DATE');
  }
  if (!Array.isArray(record.medicines) || record.medicines.length === 0) {
    errors.push('INVALID_MEDICINES');
  } else {
    for (let i = 0; i < record.medicines.length; i++) {
      if (!validateMedicine(record.medicines[i])) {
        errors.push(`INVALID_MEDICINE_ITEM_${i}`);
      }
    }
  }
  if (record.mathFocusDuration !== undefined && record.mathFocusDuration !== null && record.mathFocusDuration !== '') {
    const dur = Number(record.mathFocusDuration);
    if (isNaN(dur) || dur < 0 || dur > 180) errors.push('INVALID_MATH_DURATION');
  }
  if (record.overallMood && !MOOD_SCORES[record.overallMood]) {
    errors.push('INVALID_MOOD');
  }
  if (record.reboundEffect && !REBOUND_SCORES[record.reboundEffect]) {
    errors.push('INVALID_REBOUND');
  }
  ['mealBreakfast', 'mealLunch', 'mealDinner'].forEach(m => {
    if (record[m] && !VALID_MEALS.includes(record[m])) {
      errors.push(`INVALID_${m.toUpperCase()}`);
    }
  });
  return { valid: errors.length === 0, errors };
}

// ============================================================================
// CSU 2: Analytics & Calculation Engine (통계 분석 엔진 단위)
// ============================================================================

function calculateAverageFocus(records) {
  const validDurations = records
    .map(r => Number(r.mathFocusDuration))
    .filter(d => !isNaN(d) && d > 0);
  if (validDurations.length === 0) return 0;
  const sum = validDurations.reduce((a, b) => a + b, 0);
  return Math.round((sum / validDurations.length) * 10) / 10;
}

function calculateReboundRate(records) {
  if (!records || records.length === 0) return 0;
  const severe = records.filter(r => r.reboundEffect === '짜증 심함' || r.reboundEffect === '보통').length;
  return Math.round((severe / records.length) * 100);
}

function calculatePositiveMoodRatio(records) {
  if (!records || records.length === 0) return 0;
  const positive = records.filter(r => r.overallMood === '밝음' || r.overallMood === '평온').length;
  return Math.round((positive / records.length) * 100);
}

function calculateAppetiteSuppressionRate(records) {
  if (!records || records.length === 0) return 0;
  const suppressed = records.filter(r => r.mealLunch === '평소의 70%' || r.mealLunch === '거의 안 먹음').length;
  return Math.round((suppressed / records.length) * 100);
}

function calculateTitrationDelta(preMetrics, postMetrics) {
  return {
    focusDelta: Math.round((postMetrics.avgFocus - preMetrics.avgFocus) * 10) / 10,
    reboundDelta: postMetrics.reboundRate - preMetrics.reboundRate,
    moodDelta: postMetrics.positiveMoodRate - preMetrics.positiveMoodRate,
    appetiteDelta: postMetrics.appetiteRate - preMetrics.appetiteRate
  };
}

// ============================================================================
// CSU 3: Excel & Data Formatting (엑셀 및 데이터 직렬화 단위)
// ============================================================================

function formatMedicinesToString(medicines) {
  if (!Array.isArray(medicines)) return '';
  return medicines.map(m => `${m.name} ${m.dosage}`).join(', ');
}

function parseMedicinesFromString(str) {
  if (!str || typeof str !== 'string') return [];
  return str.split(',').map(item => {
    const parts = item.trim().split(/\s+/);
    return {
      name: parts[0] || '',
      dosage: parts.slice(1).join(' ') || ''
    };
  }).filter(m => m.name);
}

// ============================================================================
// SWUT 실행부
// ============================================================================

async function runSwut() {
  console.log('======================================================================');
  console.log('🧪 [SWUT] 우현이 관찰 시스템 소프트웨어 단위 시험 (Unit Tests)');
  console.log('======================================================================\n');

  console.log('📦 1. DataValidatorUnit (데이터 유효성 및 척도 검증 단위)');

  test('TC-UT-01: 올바른 ISO 8601 날짜 형식(YYYY-MM-DD) 검증', () => {
    assert.strictEqual(isValidIsoDate('2026-09-05'), true);
    assert.strictEqual(isValidIsoDate('2026-02-28'), true);
    assert.strictEqual(isValidIsoDate('2026-02-29'), false, '2026년은 평년이므로 2월 29일은 유효하지 않아야 함');
    assert.strictEqual(isValidIsoDate('2024-02-29'), true, '2024년은 윤년이므로 2월 29일은 유효해야 함');
    assert.strictEqual(isValidIsoDate('2026/09/05'), false);
    assert.strictEqual(isValidIsoDate('invalid-date'), false);
    assert.strictEqual(isValidIsoDate(''), false);
  });

  test('TC-UT-02: 날짜 요일 자동 계산 일치성 검증', () => {
    // 2026-09-05 is Saturday
    assert.strictEqual(getDayOfWeek('2026-09-05'), '토요일');
    // 2026-08-31 is Monday
    assert.strictEqual(getDayOfWeek('2026-08-31'), '월요일');
  });

  test('TC-UT-03: 약물 단위 및 소수점 용량(0.5mg, 10mg, 18mg, 0.5정) 검증', () => {
    assert.strictEqual(validateMedicine({ name: '메디키넷', dosage: '10mg' }), true);
    assert.strictEqual(validateMedicine({ name: '아빌리파이', dosage: '0.5mg' }), true);
    assert.strictEqual(validateMedicine({ name: '아빌리파이', dosage: '0.25mg' }), true);
    assert.strictEqual(validateMedicine({ name: '콘서타', dosage: '18mg' }), true);
    assert.strictEqual(validateMedicine({ name: '아빌리파이', dosage: '0.5정' }), true);
    assert.strictEqual(validateMedicine({ name: '', dosage: '10mg' }), false, '약물명 누락 시 실패');
    assert.strictEqual(validateMedicine({ name: '메디키넷', dosage: '' }), false, '용량 누락 시 실패');
    assert.strictEqual(validateMedicine(null), false, 'null 객체 방어');
  });

  test('TC-UT-04: 감정/기분 4단계 표준 척도 스코어링 매핑 검증', () => {
    assert.strictEqual(MOOD_SCORES['밝음'], 4);
    assert.strictEqual(MOOD_SCORES['평온'], 3);
    assert.strictEqual(MOOD_SCORES['불안'], 2);
    assert.strictEqual(MOOD_SCORES['가라앉음'], 1);
    assert.strictEqual(MOOD_SCORES['기타기분'], undefined);
  });

  test('TC-UT-05: 저녁 리바운드 3단계 표준 척도 스코어링 매핑 검증', () => {
    assert.strictEqual(REBOUND_SCORES['없음'], 1);
    assert.strictEqual(REBOUND_SCORES['보통'], 2);
    assert.strictEqual(REBOUND_SCORES['짜증 심함'], 3);
    assert.strictEqual(REBOUND_SCORES['극심'], undefined);
  });

  test('TC-UT-06: 4시 수학 집중도 지속 시간 경계값(0~180분) 및 음수/NaN 거부', () => {
    const validRec = {
      date: '2026-09-05',
      medicines: [{ name: '메디키넷', dosage: '10mg' }],
      mathFocusDuration: 25,
      overallMood: '평온',
      reboundEffect: '없음'
    };
    assert.strictEqual(validateObservationRecord(validRec).valid, true);

    const negativeRec = { ...validRec, mathFocusDuration: -5 };
    assert.strictEqual(validateObservationRecord(negativeRec).valid, false);

    const nanRec = { ...validRec, mathFocusDuration: 'twenty' };
    assert.strictEqual(validateObservationRecord(nanRec).valid, false);

    const overflowRec = { ...validRec, mathFocusDuration: 300 };
    assert.strictEqual(validateObservationRecord(overflowRec).valid, false);
  });

  test('TC-UT-07: 다중 투약(메디키넷 10mg + 아빌리파이 0.5mg 병용) 유효성 검증', () => {
    const multiMedRec = {
      date: '2026-09-05',
      medicines: [
        { name: '메디키넷', dosage: '10mg' },
        { name: '아빌리파이', dosage: '0.5mg' }
      ]
    };
    const res = validateObservationRecord(multiMedRec);
    assert.strictEqual(res.valid, true);
    assert.strictEqual(multiMedRec.medicines.length, 2);
  });

  test('TC-UT-08: 3끼니 식사량 척도 유효성 검사', () => {
    const rec = {
      date: '2026-09-05',
      medicines: [{ name: '메디키넷', dosage: '10mg' }],
      mealBreakfast: '정상',
      mealLunch: '평소의 70%',
      mealDinner: '거의 안 먹음'
    };
    assert.strictEqual(validateObservationRecord(rec).valid, true);

    const invalidMealRec = { ...rec, mealDinner: '과식' };
    assert.strictEqual(validateObservationRecord(invalidMealRec).valid, false);
  });

  console.log('\n📊 2. AnalyticsEngineUnit (통계 및 약물 분석 알고리즘 단위)');

  test('TC-UT-09: 평균 집중 시간 연산 및 빈 배열(0건) 0으로 나누기 방어', () => {
    const records = [
      { mathFocusDuration: 20 },
      { mathFocusDuration: 30 },
      { mathFocusDuration: 25 }
    ];
    assert.strictEqual(calculateAverageFocus(records), 25);
    assert.strictEqual(calculateAverageFocus([]), 0, '빈 배열은 0을 반환하여 에러 방지');
  });

  test('TC-UT-10: 저녁 리바운드 발생률(%) 연산 정확도', () => {
    const records = [
      { reboundEffect: '없음' },
      { reboundEffect: '없음' },
      { reboundEffect: '보통' },
      { reboundEffect: '짜증 심함' }
    ];
    // 2/4 = 50%
    assert.strictEqual(calculateReboundRate(records), 50);
    assert.strictEqual(calculateReboundRate([]), 0);
  });

  test('TC-UT-11: 긍정 정서 비율(%) 연산 정확도', () => {
    const records = [
      { overallMood: '밝음' },
      { overallMood: '평온' },
      { overallMood: '불안' },
      { overallMood: '가라앉음' }
    ];
    // 2/4 = 50%
    assert.strictEqual(calculatePositiveMoodRatio(records), 50);
  });

  test('TC-UT-12: 점심 식욕 부진율(%) 연산 정확도', () => {
    const records = [
      { mealLunch: '정상' },
      { mealLunch: '정상' },
      { mealLunch: '평소의 70%' }
    ];
    // 1/3 = 33%
    assert.strictEqual(calculateAppetiteSuppressionRate(records), 33);
  });

  test('TC-UT-13: 약물 적정(Titration) 전후 변화치(Delta) 연산', () => {
    const pre = { avgFocus: 16.5, reboundRate: 50, positiveMoodRate: 50, appetiteRate: 50 };
    const post = { avgFocus: 25.0, reboundRate: 0, positiveMoodRate: 100, appetiteRate: 33 };
    const delta = calculateTitrationDelta(pre, post);

    assert.strictEqual(delta.focusDelta, 8.5, '집중 시간 8.5분 상승');
    assert.strictEqual(delta.reboundDelta, -50, '리바운드 50%p 감소');
    assert.strictEqual(delta.moodDelta, 50, '긍정 정서 50%p 상승');
    assert.strictEqual(delta.appetiteDelta, -17, '식욕 부진 17%p 개선');
  });

  console.log('\n🖥️ 3. ServerUtilsUnit (서버 유틸리티 및 네트워크 감지 단위)');

  test('TC-UT-14: MIME 타입 사전 매핑 무결성', () => {
    const { MIME_TYPES } = require('../../server.js');
    assert.strictEqual(MIME_TYPES['.html'], 'text/html; charset=utf-8');
    assert.strictEqual(MIME_TYPES['.js'], 'text/javascript; charset=utf-8');
    assert.strictEqual(MIME_TYPES['.json'], 'application/json; charset=utf-8');
    assert.strictEqual(MIME_TYPES['.xlsx'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    assert.strictEqual(MIME_TYPES['.png'], 'image/png');
  });

  test('TC-UT-15: getLocalIpAddresses() 로컬 네트워크 감지 및 루프백(127.0.0.1) 제외 검증', () => {
    const { getLocalIpAddresses } = require('../../server.js');
    const ips = getLocalIpAddresses();
    assert(Array.isArray(ips), '배열 타입이어야 함');
    ips.forEach(item => {
      assert(item.ip, 'IP 주소 존재');
      assert.notStrictEqual(item.ip, '127.0.0.1', '루프백 주소는 제외되어야 함');
      assert(item.url.startsWith('http://'), 'URL 형식 검증');
    });
  });

  test('TC-UT-16: 기록 날짜 기준 오름차순(과거->최신) 정렬 단위 검증', () => {
    const unsorted = [
      { date: '2026-09-03' },
      { date: '2026-08-29' },
      { date: '2026-09-01' }
    ];
    unsorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    assert.strictEqual(unsorted[0].date, '2026-08-29');
    assert.strictEqual(unsorted[1].date, '2026-09-01');
    assert.strictEqual(unsorted[2].date, '2026-09-03');
  });

  console.log('\n📋 4. ExcelMappingUnit (엑셀 및 데이터 양방향 직렬화 단위)');

  test('TC-UT-17: 다중 약물 배열 -> 문자열 변환 정합성', () => {
    const meds = [
      { name: '메디키넷', dosage: '10mg' },
      { name: '아빌리파이', dosage: '0.5mg' }
    ];
    const str = formatMedicinesToString(meds);
    assert.strictEqual(str, '메디키넷 10mg, 아빌리파이 0.5mg');
  });

  test('TC-UT-18: 엑셀 문자열 -> 다중 약물 배열 역직렬화 정합성', () => {
    const str = '메디키넷 10mg, 아빌리파이 0.5mg';
    const parsed = parseMedicinesFromString(str);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].name, '메디키넷');
    assert.strictEqual(parsed[0].dosage, '10mg');
    assert.strictEqual(parsed[1].name, '아빌리파이');
    assert.strictEqual(parsed[1].dosage, '0.5mg');
  });

  test('TC-UT-19: 단독 약물 문자열 파싱 정합성', () => {
    const str = '콘서타 18mg';
    const parsed = parseMedicinesFromString(str);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, '콘서타');
    assert.strictEqual(parsed[0].dosage, '18mg');
  });

  console.log('\n======================================================================');
  console.log(`🏁 SWUT 검증 결과: 총 ${totalTests}개 단위 시험 중 [성공: ${passedTests}건 / 실패: ${failedTests}건]`);
  console.log('======================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runSwut();
}

module.exports = {
  runSwut,
  isValidIsoDate,
  getDayOfWeek,
  validateMedicine,
  validateObservationRecord,
  calculateAverageFocus,
  calculateReboundRate,
  calculatePositiveMoodRatio,
  calculateAppetiteSuppressionRate,
  calculateTitrationDelta,
  formatMedicinesToString,
  parseMedicinesFromString
};
