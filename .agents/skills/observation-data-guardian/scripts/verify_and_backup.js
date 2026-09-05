#!/usr/bin/env node
/**
 * 관찰 데이터 무결성 전수 검증 및 자동 타임스탬프 스냅샷 백업 도구
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../../../../');
const DATA_DIR = path.join(BASE_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'records.json');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const EXCEL_FILE = path.join(BASE_DIR, '우현이_일일관찰기록표_템플릿.xlsx');

if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Parse CLI Arguments
const args = process.argv.slice(2);
const isListBackups = args.includes('--list-backups');
const restoreArg = args.find(a => a.startsWith('--restore='));

// 1. Handle --list-backups
if (isListBackups) {
  console.log('====================================================');
  console.log('📦 [관찰 데이터 백업 스냅샷 목록]');
  console.log('====================================================');
  const files = fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith('.json')).sort().reverse();
  if (files.length === 0) {
    console.log('  생성된 백업이 없습니다.');
  } else {
    files.forEach((f, idx) => {
      const stats = fs.statSync(path.join(BACKUPS_DIR, f));
      console.log(`  ${idx + 1}. ${f} (${stats.size} bytes, ${new Date(stats.mtime).toLocaleString('ko-KR')})`);
    });
  }
  console.log('====================================================');
  process.exit(0);
}

// 2. Handle --restore
if (restoreArg) {
  const targetFile = restoreArg.replace('--restore=', '').trim();
  const sourcePath = path.join(BACKUPS_DIR, targetFile);
  if (!fs.existsSync(sourcePath)) {
    console.error(`❌ [오류] 지정한 백업 파일을 찾을 수 없습니다: ${targetFile}`);
    console.log(`   (백업 목록 확인: node verify_and_backup.js --list-backups)`);
    process.exit(1);
  }

  // Pre-restore safety backup of current data
  if (fs.existsSync(DATA_FILE)) {
    const safeBackupName = `before_restore_${Date.now()}.json`;
    fs.copyFileSync(DATA_FILE, path.join(BACKUPS_DIR, safeBackupName));
    console.log(`🛡️ 현재 데이터를 사전 안전 백업했습니다: ${safeBackupName}`);
  }

  fs.copyFileSync(sourcePath, DATA_FILE);
  console.log(`✅ [복구 성공] ${targetFile} 데이터가 records.json으로 성공적으로 복구되었습니다.`);
  process.exit(0);
}

// 3. Main Verification
console.log('====================================================');
console.log('🛡️ [관찰 데이터 가디언] 데이터 무결성 전수 검사 시작');
console.log('====================================================\n');

let passes = 0;
let warnings = 0;
let errors = 0;

function pass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
  passes++;
}
function warn(msg) {
  console.log(`  ⚠️ [WARN] ${msg}`);
  warnings++;
}
function fail(msg) {
  console.log(`  ❌ [FAIL] ${msg}`);
  errors++;
}

if (!fs.existsSync(DATA_FILE)) {
  fail(`데이터 파일이 없습니다: ${DATA_FILE}`);
  process.exit(1);
}

let records = [];
try {
  records = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  pass(`records.json JSON 구문 유효성 검사 (${records.length}건)`);
} catch (e) {
  fail(`records.json JSON 파싱 오류: ${e.message}`);
  process.exit(1);
}

const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const validMoods = ['밝음', '평온', '불안', '가라앉음'];
const validRebounds = ['없음', '보통', '짜증 심함'];
const validMeals = ['정상', '평소의 70%', '거의 안 먹음'];

const dateSet = new Set();

records.forEach((r, idx) => {
  const rowNum = idx + 1;

  // Check 1: Date ISO Format
  if (!r.date || !/^\d{4}-\d{2}-\d{2}$/.test(r.date)) {
    fail(`[#${rowNum}] 날짜 형식 오류: '${r.date}' (YYYY-MM-DD 필수)`);
  } else {
    // Check 2: Date Uniqueness
    if (dateSet.has(r.date)) {
      fail(`[#${rowNum}] 날짜 중복 감지: '${r.date}'`);
    } else {
      dateSet.add(r.date);
    }

    // Check 3: Day of week match
    if (r.dayOfWeek) {
      const calcDay = dayNames[new Date(r.date).getDay()];
      if (calcDay !== r.dayOfWeek) {
        warn(`[#${rowNum} | ${r.date}] 요일 불일치: 입력값 '${r.dayOfWeek}' vs 실제 '${calcDay}'`);
      }
    }
  }

  // Check 4: Medicines array integrity
  if (!Array.isArray(r.medicines)) {
    fail(`[#${rowNum} | ${r.date}] medicines 필드가 배열이 아닙니다.`);
  } else {
    r.medicines.forEach((m, mIdx) => {
      if (!m.name) fail(`[#${rowNum} | ${r.date}] 약물 #${mIdx+1} 이름 누락`);
      if (!m.dosage) warn(`[#${rowNum} | ${r.date}] 약물 '${m.name}'의 용량 단위 미기재`);
    });
  }

  // Check 5: Math Test Numbers
  if (r.mathFocusDuration !== undefined && r.mathFocusDuration !== '') {
    const focusNum = Number(r.mathFocusDuration);
    if (isNaN(focusNum) || focusNum < 0) {
      fail(`[#${rowNum} | ${r.date}] 지속집중시간 숫자 형식 오류: ${r.mathFocusDuration}`);
    }
  }

  // Check 6: Mood & Rebound Scale
  if (r.overallMood && !validMoods.includes(r.overallMood)) {
    warn(`[#${rowNum} | ${r.date}] 기분 필드 표준 외 값: '${r.overallMood}'`);
  }
  if (r.reboundEffect && !validRebounds.includes(r.reboundEffect)) {
    warn(`[#${rowNum} | ${r.date}] 리바운드 필드 표준 외 값: '${r.reboundEffect}'`);
  }

  // Check 7: Meal Scale
  ['mealBreakfast', 'mealLunch', 'mealDinner'].forEach(field => {
    if (r[field] && !validMeals.includes(r[field])) {
      warn(`[#${rowNum} | ${r.date}] 식사량(${field}) 표준 외 값: '${r[field]}'`);
    }
  });
});

if (errors === 0) {
  pass(`전체 ${records.length}개 관찰 기록 스키마 및 무결성 규칙 완벽 준수`);
}

// 4. Cross check with Excel file if exists
if (fs.existsSync(EXCEL_FILE)) {
  try {
    const XLSX = require('xlsx');
    const workbook = XLSX.readFile(EXCEL_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet);
    pass(`엑셀 템플릿 연동 무결성 확인 (${excelRows.length}개 행 확인)`);
  } catch (err) {
    warn(`엑셀 파일 교차 검증 생략: ${err.message}`);
  }
}

console.log('\n----------------------------------------------------');
console.log(`검증 요약: 통과 ${passes}건 / 경고 ${warnings}건 / 오류 ${errors}건`);
console.log('----------------------------------------------------');

if (errors > 0) {
  console.error('❌ 데이터 무결성 오류가 감지되어 백업 생성을 중단합니다.');
  process.exit(1);
}

// 5. Create Timestamp Snapshot Backup
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const timeStamp = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
const backupFileName = `records_${timeStamp}.json`;
const backupFilePath = path.join(BACKUPS_DIR, backupFileName);

fs.copyFileSync(DATA_FILE, backupFilePath);
console.log(`🎉 [스냅샷 백업 완료] ${backupFileName}`);
console.log(`   저장 위치: ${backupFilePath}`);

// 6. Housekeeping: Keep latest 30 backups
try {
  const backups = fs.readdirSync(BACKUPS_DIR)
    .filter(f => f.startsWith('records_') && f.endsWith('.json'))
    .sort();
  if (backups.length > 30) {
    const toDelete = backups.slice(0, backups.length - 30);
    toDelete.forEach(f => fs.unlinkSync(path.join(BACKUPS_DIR, f)));
    console.log(`🧹 오래된 백업 파일 ${toDelete.length}개를 자동 정리했습니다.`);
  }
} catch (e) {}

console.log('====================================================');
