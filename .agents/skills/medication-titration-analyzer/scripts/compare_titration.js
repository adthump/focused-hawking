#!/usr/bin/env node
/**
 * 약물 변경/증량(Titration) 전후 효과 및 부작용 대조 분석기
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../../../../');
const DATA_FILE = path.join(BASE_DIR, 'data/records.json');
const REPORTS_DIR = path.join(BASE_DIR, 'reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Parse CLI Arguments
const args = process.argv.slice(2);
let changeDate = null;
let windowDays = null;

args.forEach(arg => {
  if (arg.startsWith('--change-date=')) {
    changeDate = arg.replace('--change-date=', '').trim();
  } else if (arg.startsWith('--window=')) {
    windowDays = parseInt(arg.replace('--window=', ''), 10) || null;
  }
});

// Load Records
if (!fs.existsSync(DATA_FILE)) {
  console.error(`❌ [오류] 데이터 파일이 존재하지 않습니다: ${DATA_FILE}`);
  process.exit(1);
}

let records = [];
try {
  records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
} catch (e) {
  console.error(`❌ [오류] records.json 파싱 실패:`, e.message);
  process.exit(1);
}

if (!Array.isArray(records) || records.length < 2) {
  console.log('⚠️ 비교 분석을 위해서는 최소 2일 이상의 관찰 기록이 필요합니다.');
  process.exit(0);
}

// Sort by date ascending
records.sort((a, b) => new Date(a.date) - new Date(b.date));

// Helper: Format Med String
function formatMeds(medicines) {
  if (!Array.isArray(medicines) || medicines.length === 0) return '미복용';
  return medicines.map(m => `${m.name}(${m.dosage})`).join(' + ');
}

// Auto-detect change date if not provided
if (!changeDate) {
  let prevMed = formatMeds(records[0].medicines);
  for (let i = 1; i < records.length; i++) {
    const currentMed = formatMeds(records[i].medicines);
    if (currentMed !== prevMed) {
      changeDate = records[i].date;
      break;
    }
  }
  if (!changeDate) {
    // If no prescription change, use median date
    const midIdx = Math.floor(records.length / 2);
    changeDate = records[midIdx].date;
  }
}

// Split into Before and After
let beforeRecords = records.filter(r => r.date < changeDate);
let afterRecords = records.filter(r => r.date >= changeDate);

if (windowDays) {
  beforeRecords = beforeRecords.slice(-windowDays);
  afterRecords = afterRecords.slice(0, windowDays);
}

if (beforeRecords.length === 0 || afterRecords.length === 0) {
  console.log(`⚠️ 기준일(${changeDate}) 전후로 비교할 데이터가 충분하지 않습니다.`);
  console.log(`- 기준일 이전 데이터: ${beforeRecords.length}일`);
  console.log(`- 기준일 이후 데이터: ${afterRecords.length}일`);
  process.exit(0);
}

// Analytics Function for a cohort
function analyzeCohort(cohort) {
  const count = cohort.length;
  let totalFocus = 0;
  let totalProblems = 0;
  let focusDays = 0;
  let reboundCount = 0;
  let positiveMoodCount = 0;
  let appetiteLossCount = 0;
  let symptomCount = 0;

  cohort.forEach(r => {
    if (r.mathFocusDuration !== undefined && r.mathFocusDuration !== null && r.mathFocusDuration !== '') {
      focusDays++;
      totalFocus += Number(r.mathFocusDuration) || 0;
      totalProblems += Number(r.mathProblemCount) || 0;
    }
    if (r.reboundEffect === '보통' || r.reboundEffect === '짜증 심함') {
      reboundCount++;
    }
    if (r.overallMood === '밝음' || r.overallMood === '평온') {
      positiveMoodCount++;
    }
    if (r.mealLunch === '평소의 70%' || r.mealLunch === '거의 안 먹음') {
      appetiteLossCount++;
    }
    if (Array.isArray(r.symptoms)) {
      symptomCount += r.symptoms.length;
    }
  });

  const medsSet = new Set(cohort.map(r => formatMeds(r.medicines)));

  return {
    days: count,
    startDate: cohort[0].date,
    endDate: cohort[cohort.length - 1].date,
    medications: Array.from(medsSet).join(', '),
    avgFocus: focusDays > 0 ? (totalFocus / focusDays).toFixed(1) : '0',
    avgProblems: focusDays > 0 ? (totalProblems / focusDays).toFixed(1) : '0',
    reboundRate: Math.round((reboundCount / count) * 100),
    positiveMoodRate: Math.round((positiveMoodCount / count) * 100),
    appetiteLossRate: Math.round((appetiteLossCount / count) * 100),
    symptomCount: symptomCount
  };
}

const beforeStats = analyzeCohort(beforeRecords);
const afterStats = analyzeCohort(afterRecords);

// Calculate Diffs
const focusDiff = (parseFloat(afterStats.avgFocus) - parseFloat(beforeStats.avgFocus)).toFixed(1);
const problemDiff = (parseFloat(afterStats.avgProblems) - parseFloat(beforeStats.avgProblems)).toFixed(1);
const reboundDiff = afterStats.reboundRate - beforeStats.reboundRate;
const moodDiff = afterStats.positiveMoodRate - beforeStats.positiveMoodRate;
const appetiteDiff = afterStats.appetiteLossRate - beforeStats.appetiteLossRate;

function fmtDiff(val, unit = '', invertColor = false) {
  const num = parseFloat(val);
  const sign = num > 0 ? `+${num}` : `${num}`;
  let symbol = '➖';
  if (num > 0) symbol = invertColor ? '🔺 (증가)' : '📈 (상승)';
  if (num < 0) symbol = invertColor ? '📉 (감소)' : '🔻 (하락)';
  return `${sign}${unit} ${symbol}`;
}

// Generate Output Markdown
const todayStr = new Date().toISOString().slice(0, 10);
const reportFileName = `titration_comparison_${changeDate}.md`;
const reportFilePath = path.join(REPORTS_DIR, reportFileName);

const markdown = `# 💊 우현이 약물 변경/용량 적정(Titration) 전후 비교 리포트

> **분석 기준일 (처방 변경일)**: **${changeDate}**  
> **보고서 작성일**: ${todayStr}  

---

## 📋 처방 비교 요약
- **변경 전 기간**: ${beforeStats.startDate} ~ ${beforeStats.endDate} (${beforeStats.days}일간)
  - 처방 내용: **${beforeStats.medications}**
- **변경 후 기간**: ${afterStats.startDate} ~ ${afterStats.endDate} (${afterStats.days}일간)
  - 처방 내용: **${afterStats.medications}**

---

## 📊 핵심 지표 비교표

| 관찰 지표 | 변경 전 (${beforeStats.days}일) | 변경 후 (${afterStats.days}일) | 변화량 (Δ) | 임상적 의미 |
| :--- | :---: | :---: | :---: | :--- |
| **4시 지속 집중시간** | **${beforeStats.avgFocus}분** | **${afterStats.avgFocus}분** | **${fmtDiff(focusDiff, '분')}** | ${focusDiff > 0 ? '집중 유지력 향상' : '집중도 유지/소폭 감소'} |
| **4시 푼 수학 문제 수** | **${beforeStats.avgProblems}개** | **${afterStats.avgProblems}개** | **${fmtDiff(problemDiff, '개')}** | ${problemDiff > 0 ? '학습 성취 속도 향상' : '비슷한 풀이 수준'} |
| **저녁 리바운드 발생률** | **${beforeStats.reboundRate}%** | **${afterStats.reboundRate}%** | **${fmtDiff(reboundDiff, '%', true)}** | ${reboundDiff <= 0 ? '저녁 감정 안정세' : '약효 소진 시 감정 관리 필요'} |
| **정서 긍정률 (밝음/평온)** | **${beforeStats.positiveMoodRate}%** | **${afterStats.positiveMoodRate}%** | **${fmtDiff(moodDiff, '%')}** | ${moodDiff >= 0 ? '전반적 감정 안정적' : '기분 가라앉음 주의'} |
| **점심 식욕 부진율** | **${beforeStats.appetiteLossRate}%** | **${afterStats.appetiteLossRate}%** | **${fmtDiff(appetiteDiff, '%', true)}** | ${appetiteDiff > 0 ? '식욕 저하 모니터링 필요' : '식사량 안정적'} |
| **이상 신체 증상 건수** | **${beforeStats.symptomCount}건** | **${afterStats.symptomCount}건** | **${afterStats.symptomCount - beforeStats.symptomCount >= 0 ? '+' : ''}${afterStats.symptomCount - beforeStats.symptomCount}건** | ${afterStats.symptomCount > beforeStats.symptomCount ? '새로운 틱/신체 증상 출현 주의' : '신체 반응 안정적'} |

---

## 🩺 종합 평가 및 처방 검토 의견
${focusDiff > 0 && reboundDiff <= 0 ? `
✅ **긍정적 반응 관찰**:
- 집중 시간이 ${beforeStats.avgFocus}분에서 ${afterStats.avgFocus}분으로 증가하였으며, 저녁 리바운드 발생률도 ${afterStats.reboundRate}%로 안정적으로 조절되고 있습니다.
- 현재 처방 조합(${afterStats.medications})이 효과적으로 작용하고 있는 것으로 판단됩니다.
` : `
ℹ️ **경과 관찰 지속 필요**:
- 지표의 변화가 미세하거나 부작용 모니터링이 추가로 필요합니다.
- 점심 식사량과 이상 신체 증상의 추이를 1~2주간 더 관찰 후 증량 여부를 결정하는 것이 권장됩니다.
`}

---
*Generated by Woohyun Tracker - Medication Titration Analyzer*
`;

fs.writeFileSync(reportFilePath, markdown, 'utf-8');

// Terminal Print
console.log('======================================================================');
console.log(`💊 [우현이 약물 변경/증량 전후 비교 분석] 기준일: ${changeDate}`);
console.log('======================================================================');
console.log(`[변경 전] (${beforeStats.startDate} ~ ${beforeStats.endDate}, ${beforeStats.days}일): ${beforeStats.medications}`);
console.log(`[변경 후] (${afterStats.startDate} ~ ${afterStats.endDate}, ${afterStats.days}일): ${afterStats.medications}`);
console.log('----------------------------------------------------------------------');
console.log(`🎯 4시 지속 집중 시간:  ${beforeStats.avgFocus}분  👉  ${afterStats.avgFocus}분  (${fmtDiff(focusDiff, '분')})`);
console.log(`📚 4시 푼 문제 수:      ${beforeStats.avgProblems}개  👉  ${afterStats.avgProblems}개  (${fmtDiff(problemDiff, '개')})`);
console.log(`⚡ 저녁 리바운드 발생률: ${beforeStats.reboundRate}%  👉  ${afterStats.reboundRate}%  (${fmtDiff(reboundDiff, '%', true)})`);
console.log(`😊 긍정 정서 비율:      ${beforeStats.positiveMoodRate}%  👉  ${afterStats.positiveMoodRate}%  (${fmtDiff(moodDiff, '%')})`);
console.log(`🍱 점심 식욕 부진율:    ${beforeStats.appetiteLossRate}%  👉  ${afterStats.appetiteLossRate}%  (${fmtDiff(appetiteDiff, '%', true)})`);
console.log(`⚠️ 신체 증상 발생 건수: ${beforeStats.symptomCount}건  👉  ${afterStats.symptomCount}건`);
console.log('----------------------------------------------------------------------');
console.log(`📄 리포트 파일 저장 위치: ${reportFilePath}`);
console.log('======================================================================');
