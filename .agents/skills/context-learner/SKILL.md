---
name: context-learner
description: >-
  우현이 관찰 시스템의 과거 개발 컨텍스트, 아키텍처 결정(ADR), 컴포넌트별 구현 패턴, 트러블슈팅 사례 및 병원 진료·약물 인사이트를
  조회하고 새로운 지식을 축적하는 지속적 지식 학습(Continuous Learning & Memory) 전담 스킬입니다.
  새로운 기능 개발, 유사 작업 요청, 과거 결정 확인, 진료 피드백 기록, 지식 베이스 질의 시 반드시 사용합니다.
---

# 🧠 우현이 관찰 시스템 지속적 컨텍스트 학습 스킬 (Context Learner)

이 스킬은 프로젝트 루트의 **`knowledge/`** 지식 베이스와 연동되어, 과거의 개발 배경과 도메인 지식을 타겟팅 조회하고, 작업 완료 후 새로운 학습 내용을 자가 축적(Self-Learning)하는 전담 지식 관리 스킬입니다.

---

## 🛠️ 제공 도구 및 실행 명령어

### 1. 지식 스마트 검색기 (토큰 최적화)
전체 긴 문서를 통째로 읽지 않고, 키워드나 카테고리별로 핵심 컨텍스트 20~30줄만 정확히 추출합니다.
```bash
# 특정 키워드로 검색 (예: 아빌리파이, 차트, 동기화, 엑셀, 테스트)
node .agents/skills/context-learner/scripts/query_knowledge.js --keyword="아빌리파이"

# 특정 카테고리 요약 (dev: 개발패턴, care: 의료/돌봄, tasks: 작업이력)
node .agents/skills/context-learner/scripts/query_knowledge.js --category="dev"

# 최근 N개 작업 히스토리 조회
node .agents/skills/context-learner/scripts/query_knowledge.js --recent=3
```

### 2. 신규 지식 자가 축적기 (Self-Learning Recorder)
새로운 개발 패턴, 트러블슈팅 해결책, 병원 진료 피드백을 지식 베이스에 표준 서식으로 자동 기록합니다.
```bash
# 작업 완료 히스토리 기록
node .agents/skills/context-learner/scripts/record_learning.js --category=tasks --title="수면 패턴 차트 추가" --content="취침-기상 시간 추이 시각화 및 SWUT 테스트 추가 완료"

# 트러블슈팅 사례 기록
node .agents/skills/context-learner/scripts/record_learning.js --category=dev --file=troubleshooting.md --title="사파리 뷰포트 버그" --content="dvh 단위 적용으로 모바일 스크롤 해결"

# 병원 진료 피드백 기록
node .agents/skills/context-learner/scripts/record_learning.js --category=care --file=doctor_feedback.md --title="9월 정기 진료" --content="아침 식후 30분 메디키넷 복용 유지 권고"
```

### 3. 작업 로그 비대화 방지 롤링 아카이버 (Archiver)
`task_log.md`가 15~20건을 초과하면 과거 로그를 `knowledge/archive/`로 안전하게 이전하여 컨텍스트 비대화를 원천 차단합니다.
```bash
node .agents/skills/context-learner/scripts/archive_old_logs.js
```

---

## 🔄 표준 학습 루프 워크플로우

1. **사전 지식 조회**:
   - 사용자 요청 접수 시 `query_knowledge.js --keyword="..."`로 과거 유사 사례 및 코딩 패턴 확인.
2. **패턴 준수 구현**:
   - `knowledge/dev/coding_patterns.md`의 표준 템플릿과 상태 바인딩 규칙을 준수하여 코드 작성.
3. **독립 QA 검증**:
   - 개발 완료 후 `woohyun-qa-guardian` 스킬 또는 `npm test`를 실행하여 100% 무결성 확인.
4. **자가 학습 축적**:
   - 작업 완료 후 `record_learning.js`를 실행하여 `knowledge/tasks/task_log.md`에 변경 사항과 교훈을 기록.
