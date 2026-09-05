# 🛡️ 관찰 데이터 무결성 및 백업/복구 전략

로컬 파일 기반 환경에서 관찰 데이터의 영구성(Durability)과 무결성(Integrity)을 보장하기 위한 정책입니다.

---

## 1. 백업 보관 원칙 (3중 안전망)

1. **실시간 런타임 저장소**: 브라우저 `localStorage` (즉시 저장)
2. **영구 로컬 파일 저장소**: `data/records.json` (REST API 동기화)
3. **타임스탬프 스냅샷 저장소**: `data/backups/records_YYYYMMDD_HHMMSS.json` (가디언 스크립트 실행 시 자동 생성)

---

## 2. 안전 복구 (Rollback) 절차

데이터가 잘못 입력되었거나 파일 손상이 발생한 경우:
1. 백업 목록 확인:
   ```bash
   node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js --list-backups
   ```
2. 원하는 시점의 백업 파일명으로 복구 실행:
   ```bash
   node .agents/skills/observation-data-guardian/scripts/verify_and_backup.js --restore=records_YYYYMMDD_HHMMSS.json
   ```
3. 복구 시 현재 파일도 `data/backups/before_restore_*.json`으로 자동 사전 백업되므로 복구 실수에 대해서도 안전합니다.
