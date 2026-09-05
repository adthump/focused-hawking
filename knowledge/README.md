# 📚 우현이 관찰 시스템 지식 저장소 (Knowledge Base)

이 폴더는 우현이 일일 관찰 시스템의 **기술적 아키텍처, 컴포넌트 개발 패턴, 트러블슈팅 지식, 그리고 우현이의 건강/약물/병원 진료 인사이트와 작업 히스토리**를 영속적으로 보존하고 AI 에이전트와 사용자가 함께 공유하는 중앙 지식 베이스입니다.

---

## 🗺️ 전체 지식 맵 (Quick Index)

| 카테고리 | 폴더/파일명 | 핵심 내용 및 용도 |
| :--- | :--- | :--- |
| **개발 & 기술** | [`dev/architecture.md`](./dev/architecture.md) | 시스템 설계 결정(ADR): SPA 단일 파일 구조, 듀얼 스토어 동기화, Dev-QA 분리 원칙 |
| | [`dev/coding_patterns.md`](./dev/coding_patterns.md) | UI 폼 필드 추가, Chart.js 갱신, SheetJS 엑셀 매핑, REST API, SWUT/SWIT 작성 패턴 |
| | [`dev/troubleshooting.md`](./dev/troubleshooting.md) | 과거 버그 해결 사례, 아빌리파이 소수점 처리, 모바일 스크롤 및 인코딩 주의사항 |
| **돌봄 & 의료** | [`care/doctor_feedback.md`](./care/doctor_feedback.md) | 소아정신과 전문의 상담 소견, 진료 권고사항 및 다음 진료 추적 지표 |
| | [`care/medication_notes.md`](./care/medication_notes.md) | 메디키넷, 콘서타, 아빌리파이 작용 기전, 복용 타이밍(식후 즉시) 및 관찰 반응 |
| | [`care/observation_tips.md`](./care/observation_tips.md) | 오후 4시 집중도 테스트 측정 팁, 저녁 리바운드 완화 노하우, 식사량 평가 기준 |
| **작업 히스토리**| [`tasks/task_log.md`](./tasks/task_log.md) | 날짜별 사용자 요청, 처리 결과, 도출된 교훈 및 사용자 작업 선호도 (최신순) |
| **장기 아카이브**| [`archive/`](./archive/) | 비대화 방지를 위해 분기별로 이전된 과거 작업 로그 보관소 |

---

## 🔍 지식 검색 및 활용 방법 (CLI 헬퍼)

AI 에이전트 또는 터미널에서 필요한 컨텍스트를 빠르고 가볍게(토큰 절약) 검색할 수 있습니다:

```bash
# 1. 특정 키워드(예: 아빌리파이, 차트, 엑셀)로 지식 검색
node .agents/skills/context-learner/scripts/query_knowledge.js --keyword="아빌리파이"

# 2. 특정 카테고리(dev, care, tasks) 핵심 요약 보기
node .agents/skills/context-learner/scripts/query_knowledge.js --category="dev"

# 3. 최근 작업 히스토리 N개 조회
node .agents/skills/context-learner/scripts/query_knowledge.js --recent=5
```

---

## 📝 새로운 학습 내용 기록 방법

개발 작업 완료, 새로운 버그 해결, 병원 진료 피드백 접수 시 아래 도구로 표준 서식에 맞춰 즉시 기록할 수 있습니다:

```bash
# 개발 패턴/트러블슈팅 기록
node .agents/skills/context-learner/scripts/record_learning.js --category="dev" --title="신규 필드 추가 패턴" --content="내용..."

# 병원 진료 피드백 기록
node .agents/skills/context-learner/scripts/record_learning.js --category="care" --title="2026-09 진료 소견" --content="내용..."
```

---

## 🛡️ 비대화(Bloat) 방지 정책

1. **점진적 조회(Progressive Disclosure)**: 이 `README.md` 색인에서 필요한 파일 링크만 선별적으로 열람합니다.
2. **작업 로그 롤링 유지**: `tasks/task_log.md`는 최신 20건만 유지하며, 초과분은 `archive/` 폴더로 자동 분리합니다.
   - 실행: `node .agents/skills/context-learner/scripts/archive_old_logs.js`
3. **지식 압축(Distillation)**: 유사한 패턴이나 팁이 쌓이면 각 문서 상단의 '핵심 요약 치트시트'로 압축 정리합니다.
