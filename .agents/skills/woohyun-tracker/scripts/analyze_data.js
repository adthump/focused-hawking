/**
 * 우현이 관찰 데이터 통계 및 리포트 자동 생성기
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../../');
const excelPath = path.join(ROOT_DIR, '우현이_일일관찰기록표_템플릿.xlsx');

try {
  const XLSX = require('xlsx');
  const wb = XLSX.readFile(excelPath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const records = XLSX.utils.sheet_to_json(sheet);

  console.log('====================================================');
  console.log(`📊 [우현이 관찰 일지 통계 분석 리포트] (총 ${records.length}일분 기록)`);
  console.log('====================================================\n');

  if (records.length === 0) {
    console.log('기록된 데이터가 없습니다.');
    process.exit(0);
  }

  // 1. Focus duration statistics
  const focusList = records.map(r => Number(r['오후4시테스트_지속집중시간(분)']) || 0);
  const problemList = records.map(r => Number(r['오후4시테스트_푼문제수']) || 0);
  const avgFocus = (focusList.reduce((a, b) => a + b, 0) / focusList.length).toFixed(1);
  const maxFocus = Math.max(...focusList);
  const minFocus = Math.min(...focusList);
  const avgProblems = (problemList.reduce((a, b) => a + b, 0) / problemList.length).toFixed(1);

  console.log('🎯 [학습 집중도 분석]');
  console.log(`- 평균 지속 집중 시간: ${avgFocus}분 (최소: ${minFocus}분 ~ 최대: ${maxFocus}분)`);
  console.log(`- 평균 푼 문제 수: ${avgProblems}문제`);

  // 2. Medication group analysis
  const medMap = {};
  records.forEach(r => {
    const med = r['투약_약물및용량'] || '미기록';
    if (!medMap[med]) medMap[med] = { count: 0, totalFocus: 0 };
    medMap[med].count++;
    medMap[med].totalFocus += Number(r['오후4시테스트_지속집중시간(분)']) || 0;
  });

  console.log('\n💊 [약물 조합별 평균 집중 시간 비교]');
  Object.keys(medMap).forEach(med => {
    const avg = (medMap[med].totalFocus / medMap[med].count).toFixed(1);
    console.log(`- ${med} (총 ${medMap[med].count}회): 평균 ${avg}분 집중`);
  });

  // 3. Emotional & Rebound Summary
  const reboundSevere = records.filter(r => (r['저녁약효_리바운드'] || '').includes('심함')).length;
  const reboundModerate = records.filter(r => (r['저녁약효_리바운드'] || '').includes('보통')).length;
  const noRebound = records.length - reboundSevere - reboundModerate;

  console.log('\n🧠 [정서 및 저녁 리바운드 현황]');
  console.log(`- 안정적 (리바운드 없음): ${noRebound}일 (${Math.round(noRebound/records.length*100)}%)`);
  console.log(`- 경미한 칭얼댐 (보통): ${reboundModerate}일`);
  console.log(`- 감정 기복/짜증 심함: ${reboundSevere}일`);

  // 4. Meals & Appetite Summary
  const lunchAppetiteLoss = records.filter(r => (r['식사_점심'] || '') !== '정상').length;
  console.log('\n🍽️ [식사량 및 식욕 관찰]');
  console.log(`- 점심 시간 식욕 저하 발생일: ${lunchAppetiteLoss}일 / ${records.length}일 (${Math.round(lunchAppetiteLoss/records.length*100)}%)`);

  console.log('\n====================================================');
  console.log('💡 의사 상담 시 참고 소견:');
  if (reboundSevere > 0) {
    console.log(`- 저녁 시간대 리바운드가 ${reboundSevere}회 관찰되었으므로 투약 용량 및 타이밍 상담 권장`);
  } else {
    console.log('- 전반적으로 저녁 리바운드 없이 안정적인 일과를 보이고 있습니다.');
  }
  console.log('====================================================');

} catch (e) {
  console.error('분석 오류:', e.message);
}
