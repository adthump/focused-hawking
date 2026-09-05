# 📦 단일 파일(Single-File) 인터랙티브 웹앱 성공 아키텍처

서버나 데이터베이스 설치 없이 HTML 파일 하나로 완전하게 작동하는 고성능 독립 웹앱을 만드는 성공 패턴입니다.

---

## 1. 핵심 기술 스택 구성

| 라이브러리 | CDN 스크립트 | 역할 |
| :--- | :--- | :--- |
| **Tailwind CSS** | `<script src="https://cdn.tailwindcss.com"></script>` | 무설치 반응형 현대적 UI 스타일링 |
| **SheetJS (xlsx)** | `<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>` | 브라우저 내 엑셀(.xlsx) 생성/다운로드 및 가져오기 |
| **Chart.js** | `<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>` | 다각도 시각화 대시보드 차트 (Combo, Stacked, Multi-axis) |
| **Lucide Icons** | `<script src="https://unpkg.com/lucide@latest"></script>` | 직관적인 고품질 아이콘 세트 |

---

## 2. 데이터 지속성 및 엑셀 연동 패턴

### LocalStorage + JSON Array
- 데이터의 Primary Key를 `date` (YYYY-MM-DD)로 관리하여 날짜별 조회, 수정(Upsert), 삭제를 0초 딜레이로 처리.
- 첫 실행 시 빈 화면 대신 풍부한 샘플 데이터(5일분)를 제공하여 사용자가 시스템을 즉시 체험할 수 있도록 유도.

### SheetJS 원클릭 양방향 엑셀 연동
```javascript
// 1. JSON -> Excel 내보내기
function exportToExcel(records, fileName) {
  const ws = XLSX.utils.json_to_sheet(records);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '데이터시트');
  // 컬럼 너비 자동 계산
  const colKeys = Object.keys(records[0]);
  ws['!cols'] = colKeys.map(k => ({ wch: Math.max(k.length * 2.5, 14) }));
  XLSX.writeFile(wb, fileName);
}

// 2. Excel -> JSON 불러오기
function importFromExcel(file, callback) {
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    const wb = XLSX.read(data, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws);
    callback(json);
  };
  reader.readAsArrayBuffer(file);
}
```

---

## 3. 동적 폼 UI 상태 관리 패턴
- **다중 항목 동적 추가**: `[+ 약 추가]`처럼 행을 자유롭게 추가/삭제할 수 있는 템플릿 생성기 함수 구현.
- **다중 선택 태그 뱃지**: 체크박스 대신 클릭형 태그 토글 버튼(클릭 시 `active` 클래스 추가)으로 모바일 및 PC 모두에서 직관적인 경험 제공.
- **날짜 변경 시 자동 폼 로드**: 달력 날짜 변경 이벤트 시 해당 날짜의 기존 기록을 즉시 조회하여 폼에 자동 채움 (신규/수정 모드 자동 감지).
