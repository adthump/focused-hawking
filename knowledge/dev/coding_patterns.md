# 🧩 핵심 컴포넌트별 구현 패턴 (Coding Patterns)

이 문서는 우현이 관찰 시스템의 UI, 차트, 엑셀, 서버 API, 테스트 케이스를 구현하거나 수정할 때 준수해야 하는 표준 코드 패턴을 정의합니다. 이후 유사 작업 시 이 패턴을 그대로 적용합니다.

---

## 1. UI 폼 입력 필드 추가 패턴 (`index.html`)

새로운 관찰 항목(예: '낮잠 시간', '학습 태도 등')을 폼에 추가할 때의 표준 패턴입니다.

### 템플릿
```html
<!-- 항목 컨테이너 -->
<div class="mb-4">
  <label class="block text-sm font-semibold text-slate-700 mb-1">
    <i class="fas fa-tag text-indigo-500 mr-1"></i>항목명
  </label>
  <div class="flex gap-2">
    <!-- 입력 요소: id는 반드시 카멜케이스 또는 하이픈 규칙 준수 -->
    <input type="text" id="fieldName" 
           class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:outline-none text-sm" 
           placeholder="입력 예시">
  </div>
</div>
```

### 상태 바인딩 (`loadRecordToForm` / `getFormData`)
- **불러오기**: `document.getElementById('fieldName').value = record.fieldName || '';`
- **저장하기**: `const fieldName = document.getElementById('fieldName').value.trim();`
- **숫자형 데이터**: `parseInt(...) || 0` 또는 `parseFloat(...) || 0`으로 변환하여 타입 무결성 보장.

---

## 2. 다중 약물 동적 행 추가 패턴 (`addMedicationRow`)

- 약물은 기본 1개 외에 사용자가 `[+ 약 추가]`를 눌러 N개를 등록할 수 있습니다.
- 약물 데이터 구조:
  ```json
  [
    { "name": "메디키넷", "dose": "10mg", "time": "08:30", "timing": "식후 즉시", "note": "" },
    { "name": "아빌리파이", "dose": "0.5mg", "time": "08:30", "timing": "식후 즉시", "note": "" }
  ]
  ```
- **아빌리파이 소수점 지원**: 용량 입력란 옆에 `0.25mg`, `0.5mg`, `0.75mg`, `1mg` 빠른 칩 및 `±0.25` 버튼이 제공되어야 합니다.

---

## 3. Chart.js 차트 데이터 시각화 패턴 (`updateCharts`)

차트 갱신 시 반드시 기존 인스턴스를 파괴(`destroy()`)한 후 재생성하거나, `chart.update()`를 호출하여 메모리 누수 및 잔상 버그를 방지합니다.

```javascript
// 기존 차트 파괴 패턴
if (window.myChartInstance) {
  window.myChartInstance.destroy();
}

const ctx = document.getElementById('myChartCanvas').getContext('2d');
window.myChartInstance = new Chart(ctx, {
  type: 'line', // 또는 'bar'
  data: {
    labels: sortedDates, // ['2026-09-01', '2026-09-02', ...]
    datasets: [{
      label: '지표명',
      data: metricValues,
      borderColor: '#4f46e5',
      backgroundColor: 'rgba(79, 70, 229, 0.1)',
      tension: 0.3,
      fill: true
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } }
  }
});
```

---

## 4. SheetJS 엑셀 한글 컬럼 매핑 패턴 (`exportToExcel`)

관찰 데이터 JSON을 엑셀로 변환할 때 사용자 친화적인 한글 헤더명을 엄격히 유지합니다.

```javascript
const excelRow = {
  '날짜': record.date,
  '요일': record.dayOfWeek,
  '복용약물': (record.medications || []).map(m => `${m.name}(${m.dose})`).join(', '),
  '투약시간': (record.medications || []).map(m => m.time).join(', '),
  '복용조건': (record.medications || []).map(m => m.timing).join(', '),
  '기상시간': record.wakeTime || '',
  '취침시간': record.bedTime || '',
  '수면지연(분)': record.sleepLatency || 0,
  '식사량_아침': record.mealMorning || '',
  '식사량_점심': record.mealLunch || '',
  '식사량_저녁': record.mealDinner || '',
  '오후4시_문제수': record.mathProblems || 0,
  '오후4시_집중시간(분)': record.focusDuration || 0,
  '전반적기분': record.moodScore || '',
  '저녁리바운드': record.reboundScore || '',
  '특이사항및메모': record.notes || ''
};
```

---

## 5. Node.js 백엔드 REST API 패턴 (`server.js`)

새로운 API 엔드포인트 추가 시 `try-catch`로 에러를 방어하고 표준 JSON 응답을 반환합니다.

```javascript
app.post('/api/example', (req, res) => {
  try {
    const data = req.body;
    // 유효성 검사
    if (!data || !data.date) {
      return res.status(400).json({ success: false, message: '날짜는 필수입니다.' });
    }
    // 데이터 저장/처리...
    res.json({ success: true, message: '저장 완료' });
  } catch (err) {
    console.error('API 에러:', err);
    res.status(500).json({ success: false, message: '서버 내부 오류' });
  }
});
```

---

## 6. 테스트 케이스 작성 패턴 (`test/unit.test.js` & `test/integration.test.js`)

새로운 로직을 개발하거나 필드를 확장했을 때, 반드시 상응하는 SWUT/SWIT 테스트 케이스를 추가하여 100% 합격을 유지합니다.
- **SWUT (단위)**: 입력값 정규화, 날짜 포맷 검증, 점수 매핑 계산 함수 검증
- **SWIT (통합)**: 듀얼 스토어 동기화 시나리오, 엑셀 내보내기/가져오기 데이터 일치 검증

---

## 7. 전문의 진료 브리핑 및 A4 1장 인쇄 최적화 패턴 (`renderDoctorBriefing` & `@media print`)

소아청소년정신과 진료 상담 준비용 화면을 렌더링하고 출력할 때 준수해야 하는 패턴입니다.

### 핵심 5대 임상 지표 집계 패턴
1. **복용 순응도(%)**: 유효 약물 투약 일수 / 전체 선택 기간 일수
2. **4시 약효 피크 집중도**: 지속 집중 시간(분), 푼 문제 수, 과제 시작 반응(스스로/독려/거부)
3. **저녁 리바운드**: 소진기 반동 발생률(%) 및 심함 빈도
4. **점심 식욕 부진**: 약효 피크 식사량 감소(70% 이하) 비율
5. **수면/틱 부작용**: 30분 이상 입면 지연 및 눈 깜빡임/음성 틱 발생 횟수

### 인쇄 최적화 CSS 규칙 (`@media print`)
- 인쇄 시에는 상단 헤더, 네비게이션 탭, 플로팅 독, 툴바 등 불필요한 UI를 완전히 숨김(`display: none !important;`).
- `#section-briefing`만 표시되도록 강제하며, 글자 크기(11px)와 컴팩트 마진(8mm~10mm)을 적용하여 **A4 1장 이내에 모든 핵심 브리핑이 완벽히 인쇄**되도록 구성.

---

## 8. 모바일 반응형 UX 및 메뉴 중복 방지 규칙

1. **상단 메뉴 단일화 원칙**: 동일한 기능(예: 진료 브리핑 등)의 버튼이 상단 탭과 우측 툴바에 중복 배치되지 않도록 탭 네비게이션으로 일원화합니다.
2. **모바일 폰 접속 시 QR 버튼 숨김**: 이미 스마트폰으로 접속 중인 화면에서는 QR 코드가 무의미하므로, 모바일 하단 탭 바에서 `[QR접속]` 버튼을 완전히 제외하고 **[일일기록, 변화분석, 진료브리핑, 기록목록]** 4대 핵심 탭을 4등분으로 균등 배치합니다.
3. **헤더의 `[핸드폰 접속]` 버튼은 PC 화면에서만 표시**: `hidden md:flex` 클래스를 부여하여 컴퓨터로 접속했을 때만 스마트폰 연결용 QR 버튼이 나타나도록 처리합니다.
