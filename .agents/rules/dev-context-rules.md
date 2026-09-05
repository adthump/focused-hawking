# 🧠 지속적 컨텍스트 참조 및 지식 자가 축적 규칙 (Dev-Context Rules)

이 규칙은 AI 에이전트가 사용자의 요청을 수행할 때 과거의 개발 배경과 도메인 지식을 계승하고, 새롭게 알게 된 지식을 누적하여 지속적으로 똑똑해지도록 강제하는 핵심 행동 규칙입니다.

---

## 1. 사전 지식 점검 의무 (Pre-Execution Retrieval)

모든 작업(개발, UI 수정, 병원 리포트 작성, 데이터 분석, 버그 수정 등) 착수 전, 에이전트는 다음 절차를 반드시 거쳐야 합니다:

1. **지식 베이스 색인 점검**:
   - `knowledge/README.md`를 통해 현재 요청과 관련된 과거 아키텍처, 코딩 패턴, 의료/관찰 지침이 존재하는지 확인합니다.
2. **타겟팅 컨텍스트 추출 (토큰 최적화)**:
   - 전체 파일을 한 번에 읽지 않고, 관련 파일의 해당 섹션만 타겟팅하거나 아래 CLI 헬퍼를 실행하여 필요한 컨텍스트만 추출합니다:
     ```bash
     node .agents/skills/context-learner/scripts/query_knowledge.js --keyword="[요청관련키워드]"
     ```
3. **기존 결정 사항(ADR) 준수**:
   - `knowledge/dev/architecture.md`에 정의된 4대 핵심 원칙(단일 파일 SPA, 듀얼 스토어 동기화, Dev-QA 분리, Windows 무설치 패키징)을 훼손하지 않아야 합니다.

---

## 2. 일관된 구현 및 품질 검증 원칙 (Consistent Implementation)

1. **코딩 패턴 계승**:
   - 새 폼 필드 추가 시 `knowledge/dev/coding_patterns.md`의 템플릿과 바인딩 패턴을 준수합니다.
   - 아빌리파이 등 약물 용량 처리 시 `0.25mg` 단위 소수점 부동소수점 정규화 로직을 반드시 적용합니다.
2. **Dev-QA 분리 검증**:
   - 코드 수정 완료 후 반드시 `woohyun-qa-guardian` 스킬 또는 `npm test`를 실행하여 SWUT 19종 + SWIT 11종 전체 합격을 검증합니다.

---

## 3. 사후 지식 자가 축적 의무 (Post-Execution Self-Learning)

작업이 완료된 후, 다음 사항에 해당할 경우 에이전트는 `knowledge/` 지식 저장소를 자가 갱신해야 합니다:

1. **새로운 아키텍처 결정 또는 라이브러리 추가 시**:
   - `knowledge/dev/architecture.md`에 신규 ADR 추가.
2. **새로운 버그 또는 엣지 케이스 해결 시**:
   - `knowledge/dev/troubleshooting.md`에 문제 증상, 원인, 해결책 요약 추가.
3. **병원 진료 소견 또는 약물 반응 피드백 접수 시**:
   - `knowledge/care/doctor_feedback.md` 또는 `medication_notes.md`에 내용 반영.
4. **모든 주요 작업 완료 시**:
   - `knowledge/tasks/task_log.md` 최상단에 날짜, 요청 내용, 결과, 도출된 교훈을 표준 서식으로 추가.
   - 또는 CLI 헬퍼 사용:
     ```bash
     node .agents/skills/context-learner/scripts/record_learning.js --category="tasks" --title="작업명" --content="요약..."
     ```
