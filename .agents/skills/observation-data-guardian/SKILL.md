---
name: observation-data-guardian
description: >-
  우현이 관찰 데이터(JSON/Excel)의 무결성 전수 검사, observation-rules 규칙 준수 여부 검증, 타임스탬프 기반 자동 스냅샷 백업 및 안전 복구를 전담하는 데이터 수호자 스킬입니다.
---

# 🛡️ 관찰 데이터 무결성 검증 및 백업 가디언 스킬 (Observation Data Guardian)

우현이의 관찰 일지는 장기간 축적되어야 하는 의료·발달 분석의 핵심 기초 자료입니다.
이 스킬은 데이터 수정/삭제/동기화 시 발생할 수 있는 데이터 손실, 날짜 중복, 스키마 변형, 한글 깨짐 등을 사전에 차단하고, 안전한 타임스탬프 스냅샷 백업 및 복구 체계를 제공합니다.

---

## 🛠️ 제공 도구 및 실행 명령

### 1. 데이터 무결성 전수 검사 및 자동 스냅샷 백업
`data/records.json`의 모든 레코드를 [observation-rules.md](../../rules/observation-rules.md) 규약에 따라 정밀 검사하고, 통과 시 `data/backups/`에 타임스탬프 백업을 즉시 생성합니다.

- **기본 실행 (검증 + 백업 생성)**:
  ```bash
  node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js
  ```
- **백업 목록 조회**:
  ```bash
  node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js --list-backups
  ```
- **지정된 백업 시점으로 안전 복구 (Rollback)**:
  ```bash
  node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js --restore=records_20260905_110000.json
  ```

---

## 📋 검증하는 핵심 무결성 규칙

1. **날짜 키 무결성**: `YYYY-MM-DD` ISO 포맷 여부, 중복 날짜 존재 여부, 요일 정합성
2. **약물 데이터 규격**: `medicines` 배열 형태 유지, 개별 약물명 및 용량 단위(`mg`, `정` 등) 명시 여부
3. **학습 집중도 지표**: 푼 문제 수, 소요 시간, 지속 집중 시간이 유효한 숫자(Number) 타입인지 여부
4. **표준 스코어링 척도**: 기분 4단계, 리바운드 3단계, 식사량 3단계 표준 텍스트 준수 여부
5. **엑셀-JSON 교차 일관성**: 엑셀 템플릿과 JSON 레코드 간 날짜 일치 여부

---

## 📚 참조 문서
- [데이터 무결성 및 백업 전략](./references/backup_strategy.md): 로컬 파일 기반 무손실 백업 아키텍처 및 복구 지침
