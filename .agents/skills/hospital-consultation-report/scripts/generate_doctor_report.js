#!/usr/bin/env node
/**
 * 소아청소년정신과 전문의 진료 맞춤형 브리핑 리포트 자동 생성기
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../../../../');
const DATA_FILE = path.join(BASE_DIR, 'data/records.json');
const REPORTS_DIR = path.join(BASE_DIR, 'reports');

// Ensure reports directory
if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

// Parse CLI arguments
const args = process.argv.slice(2);
let daysOption = 14; // default 14 days
let startDate = null;
let endDate = null;

args.forEach(arg => {
  if (arg.startsWith('--days=')) {
    daysOption = parseInt(arg.replace('--days=', ''), 10) || 14;
  } else if (arg.startsWith('--start=')) {
    startDate = arg.replace('--start=', '').trim();
  } else if (arg.startsWith('--end=')) {
    endDate = arg.replace('--end=', '').trim();
  }
});

// Load records
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

if (!Array.isArray(records) || records.length === 0) {
  console.log('⚠️ 기록된 데이터가 없습니다.');
  process.exit(0);
}

// Sort records ascending by date
records.sort((a, b) => new Date(a.date) - new Date(b.date));

// Filter records by date range
let filtered = [];
if (startDate || endDate) {
  filtered = records.filter(r => {
    if (startDate && r.date < startDate) return false;
    if (endDate && r.date > endDate) return false;
    return true;
  });
} else {
  // Take last N days
  filtered = records.slice(-daysOption);
}

if (filtered.length === 0) {
  console.log('⚠️ 지정한 기간에 해당하는 관찰 기록이 없습니다.');
  process.exit(0);
}

const totalDays = filtered.length;
const periodStart = filtered[0].date;
const periodEnd = filtered[filtered.length - 1].date;

// 1. Medication compliance & current prescriptions
let medDays = 0;
const medSummaryMap = {};
filtered.forEach(r => {
  if (Array.isArray(r.medicines) && r.medicines.length > 0) {
    medDays++;
    const combo = r.medicines.map(m => `${m.name}(${m.dosage})`).join(' + ');
    medSummaryMap[combo] = (medSummaryMap[combo] || 0) + 1;
  }
});
const medCompliance = Math.round((medDays / totalDays) * 100);

// Latest prescription
const latestRecord = filtered[filtered.length - 1];
const latestMeds = (latestRecord.medicines || []).map(m => `${m.name} ${m.dosage}`).join(', ') || '투약 기록 없음';

// 2. 4 PM Math Focus Test
let mathTotalFocus = 0;
let mathTotalProblems = 0;
let mathTotalDuration = 0;
let mathDays = 0;
const reactionCounts = { '스스로 시작': 0, '가벼운 독려': 0, '심한 거부': 0 };
const distractionCounts = { '적음': 0, '보통': 0, '잦음': 0 };

filtered.forEach(r => {
  if (r.mathFocusDuration !== undefined && r.mathFocusDuration !== null && r.mathFocusDuration !== '') {
    mathDays++;
    mathTotalFocus += Number(r.mathFocusDuration) || 0;
    mathTotalProblems += Number(r.mathProblemCount) || 0;
    mathTotalDuration += Number(r.mathTotalDuration) || 0;
    if (r.taskStartReaction && reactionCounts[r.taskStartReaction] !== undefined) {
      reactionCounts[r.taskStartReaction]++;
    }
    if (r.distractionLevel && distractionCounts[r.distractionLevel] !== undefined) {
      distractionCounts[r.distractionLevel]++;
    }
  }
});

const avgFocus = mathDays > 0 ? Math.round(mathTotalFocus / mathDays) : 0;
const avgProblems = mathDays > 0 ? Math.round(mathTotalProblems / mathDays) : 0;
const avgDuration = mathDays > 0 ? Math.round(mathTotalDuration / mathDays) : 0;

// 3. Evening Rebound & Mood
const reboundCounts = { '없음': 0, '보통': 0, '짜증 심함': 0 };
const moodCounts = { '밝음': 0, '평온': 0, '불안': 0, '가라앉음': 0 };
let reboundOccurred = 0;
const angerTriggers = [];

filtered.forEach(r => {
  if (r.reboundEffect && reboundCounts[r.reboundEffect] !== undefined) {
    reboundCounts[r.reboundEffect]++;
    if (r.reboundEffect === '보통' || r.reboundEffect === '짜증 심함') {
      reboundOccurred++;
    }
  }
  if (r.overallMood && moodCounts[r.overallMood] !== undefined) {
    moodCounts[r.overallMood]++;
  }
  if (r.angerTrigger && r.angerTrigger.trim()) {
    angerTriggers.push(`- [${r.date}] ${r.angerTrigger.trim()}`);
  }
});
const reboundRate = Math.round((reboundOccurred / totalDays) * 100);

// 4. Physical Symptoms, Appetite, Sleep
const symptomCounts = {};
let appetiteDropDays = 0; // lunch 70% or almost none
let sleepIssues = 0;

filtered.forEach(r => {
  if (Array.isArray(r.symptoms)) {
    r.symptoms.forEach(s => {
      symptomCounts[s] = (symptomCounts[s] || 0) + 1;
    });
  }
  if (r.mealLunch === '평소의 70%' || r.mealLunch === '거의 안 먹음') {
    appetiteDropDays++;
  }
  if (r.sleepLatency && r.sleepLatency.includes('30분') || (r.sleepWaking && r.sleepWaking.includes('깸'))) {
    sleepIssues++;
  }
});

// Top symptoms
const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);

// 5. Generate Doctor Recommendations
const doctorQuestions = [];
if (reboundRate >= 30) {
  doctorQuestions.push(`저녁 약효 소진 시 리바운드 발생률이 ${reboundRate}%로 다소 빈번합니다. 복용 시간대 조정이나 완화 방안 검토 필요.`);
}
if (appetiteDropDays >= totalDays * 0.4) {
  doctorQuestions.push(`점심 식욕 저하(70% 이하)가 관찰 기간의 ${Math.round((appetiteDropDays/totalDays)*100)}%에서 발생했습니다. 체중 및 성장 모니터링 필요.`);
}
if (sortedSymptoms.length > 0) {
  doctorQuestions.push(`신체 증상 중 [${sortedSymptoms[0][0]}]이(가) ${sortedSymptoms[0][1]}회 관찰되었습니다. 약물 부작용 또는 일시 반응 여부 확인.`);
}
if (doctorQuestions.length === 0) {
  doctorQuestions.push('현재 약물 용량에서 집중도와 감정 상태가 비교적 안정적으로 유지되고 있습니다. 현재 처방 유지 권장.');
}

// Generate Markdown Report
const todayStr = new Date().toISOString().slice(0, 10);
const reportFileName = `doctor_report_${todayStr}.md`;
const reportFilePath = path.join(REPORTS_DIR, reportFileName);

const markdown = `# 🏥 우현이 소아청소년정신과 진료 브리핑 리포트

> **관찰 기간**: ${periodStart} ~ ${periodEnd} (총 ${totalDays}일간의 기록)  
> **리포트 작성일**: ${todayStr}  
> **환아명**: 우현 (남)  

---

## 📌 1. 핵심 요약 (Executive Summary)
- **현재 처방 및 투약**: ${latestMeds} (투약 순응도: **${medCompliance}%**, ${medDays}/${totalDays}일)
- **오후 4시 집중도**: 평균 지속 집중 시간 **${avgFocus}분** / 평균 푼 문제 수 **${avgProblems}문제**
- **저녁 리바운드**: 발생률 **${reboundRate}%** (없음: ${reboundCounts['없음']}일, 보통: ${reboundCounts['보통']}일, 심함: ${reboundCounts['짜증 심함']}일)
- **주요 신체/부작용 관찰**: ${sortedSymptoms.length > 0 ? sortedSymptoms.map(([k, v]) => `${k}(${v}회)`).join(', ') : '특이 신체 증상 없음'}

---

## 💊 2. 약물 복용 및 처방 내역
| 약물 조합 | 복용 일수 | 비율 |
| :--- | :---: | :---: |
${Object.entries(medSummaryMap).map(([combo, count]) => `| ${combo} | ${count}일 | ${Math.round((count/totalDays)*100)}% |`).join('\n')}

- **최근 복용 시간대**: ${latestRecord.medTimePeriod || '오전'} ${latestRecord.medTimeHour || '08'}:${latestRecord.medTimeMinute || '30'} (${latestRecord.medMealTiming || '식후 30분'})

---

## 🎯 3. 오후 4시 학습 집중도 테스트 분석
*매일 오후 4시경 수학 문제 풀이를 통한 약효 피크 지속도 측정*

- **평균 지속 몰입 시간**: **${avgFocus}분** (전체 풀이 소요시간: 평균 ${avgDuration}분)
- **평균 푼 문제 수**: **${avgProblems}문제**
- **과제 시작 태도**:
  - 스스로 시작: **${reactionCounts['스스로 시작']}일**
  - 가벼운 독려: **${reactionCounts['가벼운 독려']}일**
  - 심한 거부: **${reactionCounts['심한 거부']}일**
- **주의 분산(딴짓) 수준**: 적음 ${distractionCounts['적음']}일 / 보통 ${distractionCounts['보통']}일 / 잦음 ${distractionCounts['잦음']}일

---

## ⚡ 4. 정서 상태 및 저녁 리바운드 추이
- **전반적 기분 분포**: 밝음(${moodCounts['밝음']}일), 평온(${moodCounts['평온']}일), 불안(${moodCounts['불안']}일), 가라앉음(${moodCounts['가라앉음']}일)
- **저녁 약효 소진 시 리바운드 강도**:
  - 없음 (안정적): **${reboundCounts['없음']}일** (${Math.round((reboundCounts['없음']/totalDays)*100)}%)
  - 보통 (약간의 짜증/산만): **${reboundCounts['보통']}일** (${Math.round((reboundCounts['보통']/totalDays)*100)}%)
  - 짜증 심함 (격앙/분노): **${reboundCounts['짜증 심함']}일** (${Math.round((reboundCounts['짜증 심함']/totalDays)*100)}%)
${angerTriggers.length > 0 ? `\n### 📝 주요 분노/짜증 유발 상황 메모:\n${angerTriggers.join('\n')}` : ''}

---

## ⚠️ 5. 신체 증상, 수면 및 식사량 모니터링
- **신체 증상 빈도**:
${sortedSymptoms.length > 0 ? sortedSymptoms.map(([k, v]) => `  - **${k}**: 총 ${v}회 관찰`).join('\n') : '  - 관찰된 이상 신체 증상 없음'}
- **점심 식사량 (약효 피크 시간)**:
  - 정상: **${filtered.filter(r => r.mealLunch === '정상').length}일**
  - 평소의 70%: **${filtered.filter(r => r.mealLunch === '평소의 70%').length}일**
  - 거의 안 먹음: **${filtered.filter(r => r.mealLunch === '거의 안 먹음').length}일**
- **수면 상태**: 야간 깸 또는 입면 지연(30분 이상) 발생 **${sleepIssues}일**

---

## 🩺 6. 이번 진료 전문의 상담 추천 포인트
${doctorQuestions.map((q, idx) => `${idx + 1}. ${q}`).join('\n')}

---
*Generated by Woohyun Tracker System*
`;

fs.writeFileSync(reportFilePath, markdown, 'utf-8');

// Console Summary
console.log('====================================================');
console.log('🏥 [우현이 소아청소년정신과 진료 브리핑 리포트 생성 완료]');
console.log('====================================================');
console.log(`📅 분석 기간: ${periodStart} ~ ${periodEnd} (총 ${totalDays}일)`);
console.log(`💊 현재 처방: ${latestMeds} (복용 순응도: ${medCompliance}%)`);
console.log(`🎯 4시 집중도: 평균 ${avgFocus}분 지속 집중 / ${avgProblems}문제 풀이`);
console.log(`⚡ 저녁 리바운드: 발생률 ${reboundRate}% (심함 ${reboundCounts['짜증 심함']}회)`);
if (sortedSymptoms.length > 0) {
  console.log(`⚠️ 주요 신체 증상: ${sortedSymptoms.map(([k, v]) => `${k}(${v}회)`).join(', ')}`);
}
console.log('----------------------------------------------------');
console.log(`📄 리포트 파일 저장 위치:`);
console.log(`   ${reportFilePath}`);
console.log('====================================================');
