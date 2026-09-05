---
name: woohyun-tracker
description: >-
  우현이 일일 관찰 기록표 웹 애플리케이션(index.html) UI 컴포넌트, 폼 입력 필드, Chart.js 시각화, 로컬 서버(server.js) REST API 및 엑셀 변환 로직 개발을 전담하는 핵심 개발(Dev) 스킬입니다.
  새로운 기능 추가, UI/레이아웃 변경, 관찰 항목 확장 등 개발 작업 시 사용합니다. (품질 검증 및 테스트는 woohyun-qa-guardian 스킬 전담)
---

# 💻 우현이 관찰 시스템 핵심 개발 스킬 (Woohyun Tracker Dev)

이 스킬은 우현이의 일일 관찰 기록표 웹 애플리케이션의 사용자 인터페이스(UI), 데이터 수집 폼, 시각화 대시보드, 로컬 서버 REST API를 개발하고 유지보수하는 전담 개발(Dev) 스킬입니다.

---

## 🛠️ 제공 도구 및 개발 가이드

### 1. 관찰 데이터 통계 및 트렌드 분석기
누적된 관찰 기록 데이터를 바탕으로 평균 집중 시간, 약물 조합별 효과, 리바운드 발생률, 식욕 저하 패턴을 분석합니다.
- **실행 명령**:
  ```bash
  node .agents/skills/woohyun-tracker/scripts/analyze_data.js
  ```

### 2. 엑셀 템플릿 생성기
SheetJS 기반 엑셀 연동 템플릿(`.xlsx`)을 자동 빌드합니다.
- **실행 명령**:
  ```bash
  node generate_excel.js
  ```

---

## 📚 참조 문서
- [데이터 표준 스키마](./references/schema.md): 관찰 일지 JSON 및 Excel 컬럼 정의
- [약물별 관찰 가이드](./references/medication.md): 메디키넷, 콘서타, 아빌리파이 작용 기전 및 체크포인트

---

## 🔄 개발 및 검증 워크플로우 (Dev-QA 분리)

1. **기능 개발 및 UI 수정**:
   - `index.html` 또는 `server.js`에서 기능 개발 및 버그 수정을 진행합니다.
2. **독립 QA 검증 위임 (woohyun-qa-guardian)**:
   - 개발 완료 후 즉시 **`woohyun-qa-guardian`** 스킬을 호출하여 `npm test` (SWUT 19종 + SWIT 11종) 전수 시험을 실행하고 합격 여부를 판정받습니다.
3. **회귀 방지 확인**:
   - QA 스킬에서 불합격된 항목이 발견되면 에러 로그를 기반으로 수정 후 재검증을 의뢰합니다.
