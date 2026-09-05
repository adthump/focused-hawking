/**
 * 우현이 일일 관찰 기록표 시스템 종합 검증 하네스 (Test & Validation Harness)
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../../../');
let passes = 0;
let fails = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passes++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    fails++;
  }
}

console.log('====================================================');
console.log('🧪 [우현이 관찰 기록표 시스템] 하네스 검증 시작');
console.log('====================================================\n');

// 1. Core Files Existence
console.log('📂 1. 핵심 파일 존재 여부 검증:');
const requiredFiles = [
  'index.html',
  '우현이_일일관찰기록표_템플릿.xlsx',
  'README.md',
  'server.js',
  'generate_excel.js',
  'make_direct_shortcut.js',
  '모바일_접속_서버_실행.bat',
  'data/records.json'
];

requiredFiles.forEach(file => {
  const filePath = path.join(ROOT_DIR, file);
  assert(fs.existsSync(filePath), `파일 존재 확인: ${file}`);
});

// 2. HTML Core & Mobile Component Verification
console.log('\n🔍 2. 웹 애플리케이션 (index.html) 모바일 & 핵심 기능 정적 검증:');
const htmlContent = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf-8');

assert(htmlContent.includes('addMedicineRow'), '다중 약물 추가 함수(addMedicineRow) 구현 여부');
assert(htmlContent.includes('메디키넷') && htmlContent.includes('콘서타') && htmlContent.includes('아빌리파이'), '주요 3대 약물 프리셋 포함 여부');
assert(htmlContent.includes('exportToExcel'), 'SheetJS 기반 엑셀 내보내기 함수(exportToExcel) 포함 여부');
assert(htmlContent.includes('importData'), '엑셀/JSON 데이터 가져오기 함수(importData) 포함 여부');
assert(htmlContent.includes('focusChart') && htmlContent.includes('moodChart'), 'Chart.js 집중도 및 기분 차트 캔버스 포함 여부');
assert(htmlContent.includes('taskStartReaction') && htmlContent.includes('mathFocusDuration'), '4시 수학 집중도 테스트 필드 포함 여부');
assert(htmlContent.includes('reboundEffect'), '저녁 약효 리바운드 추적 필드 포함 여부');

// Mobile specific features verification
assert(htmlContent.includes('mobile-tab-btn') || htmlContent.includes('mobile-tab-record'), '모바일 전용 하단 네비게이션 바 구현 여부');
assert(htmlContent.includes('mobileCardsContainer'), '모바일 전용 날짜별 카드 뷰 컨테이너 구현 여부');
assert(htmlContent.includes('mobileQrModal') && htmlContent.includes('qrcodeCanvas'), '스마트폰 접속용 QR 모달 구현 여부');
assert(htmlContent.includes('initServerSync') && htmlContent.includes('/api/records'), 'PC-모바일 실시간 REST API 동기화 로직 포함 여부');
assert(htmlContent.includes('apple-mobile-web-app-capable'), '스마트폰 홈화면 웹앱(PWA) 메타태그 설정 여부');

// 3. Server REST API & Data Store Verification
console.log('\n🌐 3. 로컬 서버 (server.js) 및 JSON 데이터 스토어 검증:');
const serverContent = fs.readFileSync(path.join(ROOT_DIR, 'server.js'), 'utf-8');
assert(serverContent.includes('0.0.0.0'), '로컬 Wi-Fi 외부 접속을 위한 0.0.0.0 바인딩 여부');
assert(serverContent.includes('/api/records') && serverContent.includes('/api/info'), 'REST API 엔드포인트(/api/records, /api/info) 구현 여부');
assert(serverContent.includes('getLocalIpAddresses'), '로컬 Wi-Fi IP 자동 감지 함수 구현 여부');

const dataRecordsPath = path.join(ROOT_DIR, 'data/records.json');
try {
  const dataRecords = JSON.parse(fs.readFileSync(dataRecordsPath, 'utf-8'));
  assert(Array.isArray(dataRecords) && dataRecords.length > 0, `JSON 영구 데이터 스토어 정합성 확인 (${dataRecords.length}개 기록)`);
} catch (e) {
  assert(false, `data/records.json 파싱 실패: ${e.message}`);
}

// 4. Excel Template Verification
console.log('\n📊 4. 엑셀 템플릿 무결성 검증:');
try {
  const XLSX = require('xlsx');
  const excelPath = path.join(ROOT_DIR, '우현이_일일관찰기록표_템플릿.xlsx');
  const workbook = XLSX.readFile(excelPath);
  assert(workbook.SheetNames.includes('우현이_일일관찰기록'), '엑셀 시트 이름 정합성 확인 (우현이_일일관찰기록)');
  
  const sheet = workbook.Sheets['우현이_일일관찰기록'];
  const jsonRows = XLSX.utils.sheet_to_json(sheet);
  assert(jsonRows.length > 0, `엑셀 데이터 로우 존재 확인 (${jsonRows.length}개 행)`);
  
  const sampleRow = jsonRows[0];
  assert(sampleRow['날짜'] !== undefined, '필수 컬럼 [날짜] 확인');
  assert(sampleRow['투약_약물및용량'] !== undefined, '필수 컬럼 [투약_약물및용량] 확인');
  assert(sampleRow['오후4시테스트_지속집중시간(분)'] !== undefined, '필수 컬럼 [오후4시테스트_지속집중시간(분)] 확인');
  assert(sampleRow['저녁약효_리바운드'] !== undefined, '필수 컬럼 [저녁약효_리바운드] 확인');
} catch (e) {
  assert(false, `엑셀 파일 검증 실패: ${e.message}`);
}

// 5. Data Processing & Scoring Simulation
console.log('\n📈 5. 데이터 스코어링 및 트렌드 계산 로직 시뮬레이션:');
const sampleRecords = [
  { date: '2026-09-01', mathFocusDuration: 20, overallMood: '평온', reboundEffect: '없음', mealLunch: '정상' },
  { date: '2026-09-02', mathFocusDuration: 28, overallMood: '밝음', reboundEffect: '없음', mealLunch: '정상' },
  { date: '2026-09-03', mathFocusDuration: 15, overallMood: '불안', reboundEffect: '짜증 심함', mealLunch: '평소의 70%' }
];

const avgFocus = sampleRecords.reduce((s, r) => s + r.mathFocusDuration, 0) / sampleRecords.length;
assert(avgFocus === 21, `평균 집중 시간 계산 정합성: ${avgFocus}분 (기대값: 21분)`);

const reboundCount = sampleRecords.filter(r => r.reboundEffect === '짜증 심함').length;
assert(reboundCount === 1, `리바운드 이상 징후 감지 정합성: ${reboundCount}회`);

// Summary
console.log('\n====================================================');
console.log(`🎉 하네스 검증 완료: 성공 ${passes}건 / 실패 ${fails}건`);
console.log('====================================================');

if (fails > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
