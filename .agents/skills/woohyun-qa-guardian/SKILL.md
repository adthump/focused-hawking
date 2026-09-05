---
name: woohyun-qa-guardian
description: >-
  우현이 관찰 시스템의 소프트웨어 품질 보증(QA), SWUT 단위 시험(19종), SWIT 실동작 통합 시험(11종), 회귀 검증 및 결함 보고를 전담하는 독립 품질보증 스킬입니다.
  기능 개발 및 코드 수정 후 전수 검증, '동작 테스트', '버그 점검', '자가 치유 검증' 요청 시 반드시 사용합니다.
---

# 🛡️ 우현이 관찰 시스템 품질보증(QA) 스킬 (Woohyun QA Guardian)

이 스킬은 우현이의 일일 관찰 기록표 시스템의 전 계층에 대한 **독립적이고 엄격한 소프트웨어 시험(SWUT/SWIT) 및 품질 보증(QA)**을 수행합니다. 개발(Dev) 에이전트의 자기 확증 편향을 방지하고, 소아 헬스케어 데이터의 무결성과 시스템 안정성을 100% 보증합니다.

---

## 🛠️ 제공 도구 및 헬퍼 스크립트

### 1. 전 계층 종합 동작 자동 테스트 (Master QA Suite)
SWUT 단위 시험, SWIT 통합 시험, 클라이언트 구문 무결성, 32개 하네스 지표, 데이터 가디언 등 9대 영역을 1.3초 만에 전수 검증합니다.
- **실행 명령**:
  ```bash
  npm test
  # 또는
  node .agents/skills/woohyun-qa-guardian/scripts/run_full_qa.js
  ```

### 2. SWUT (Software Unit Test) 전용 실행기
데이터 유효성, 경계값(음수/NaN/윤년), 스코어링 수식, 0으로 나누기 방어 등 19개 단위 시험을 검증합니다.
- **실행 명령**:
  ```bash
  npm run test:unit
  # 또는
  node .agents/skills/woohyun-qa-guardian/scripts/run_swut.js
  ```

### 3. SWIT (Software Integration Test) 전용 실행기
격리 포트 및 임시 스토어에서 실동작 HTTP 서버를 구동하여 REST API 11종(CRUD, CORS, 정적 서빙, 404)을 검증합니다.
- **실행 명령**:
  ```bash
  npm run test:integration
  # 또는
  node .agents/skills/woohyun-qa-guardian/scripts/run_swit.js
  ```

---

## 📚 참조 문서
- [QA 검증 체크리스트 및 시험 매트릭스](./references/qa_checklist.md): SWUT 19종 / SWIT 11종 세부 테스트 케이스 및 판정 기준

---

## 🔄 개발-검증 자율 피드백 루프 (Actor-Critic Workflow & 언어 무결성)

1. **개발 완료 직후**:
   - `woohyun-tracker` 또는 다른 개발 스킬이 코드 수정을 마치면, 즉시 `woohyun-qa-guardian`을 호출하여 `run_full_qa.js`를 실행합니다.
2. **비낙인 언어 및 DOM 무결성 검증**:
   - `index.html` 내 UI 컴포넌트, 뱃지, 리포트 타이틀에 아이에게 낙인이 될 수 있는 **병명/진단명(ADHD 등)이 직접 노출되지 않았는지** 함께 전수 검사합니다.
3. **채점 및 결함 분석**:
   - 9개 스위트 중 단 하나라도 FAIL이 발생하면 즉시 실패 상세(사유, 라인 번호)를 확인하고 개발 스킬로 피드백합니다.
4. **최종 승인(Sign-off)**:
   - 전 항목 100% PASS 시에만 사용자에게 기능 완성 및 안전 배포 가능 상태를 보고합니다.
