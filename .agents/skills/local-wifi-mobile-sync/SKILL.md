---
name: local-wifi-mobile-sync
description: >-
  외부 클라우드나 DB 서버 없이 홈 Wi-Fi(로컬 네트워크) 환경에서 PC와 스마트폰/태블릿 간 실시간 양방향 동기화(Node.js 경량 REST API + LocalStorage 듀얼 스토어),
  로컬 IP 자동 감지 및 QR 코드 원클릭 연결, 모바일 전용 반응형 UI(Bottom Navigation, Mobile Card View, PWA)를 구현하고 검증하는 전문 스킬입니다.
---

# 📱 로컬 Wi-Fi 모바일 동기화 및 모바일 전용 뷰 지원 스킬 (Local Wi-Fi Mobile Sync)

이 스킬은 외부 인터넷 연결이나 외부 클라우드 DB 없이, 가정이나 진료실의 로컬 Wi-Fi 환경에서 스마트폰과 PC 간에 **데이터를 100% 안전하게 실시간 동기화**하고 **스마트폰 전용 반응형 뷰**를 완벽하게 제공하기 위한 표준 패턴과 검증 도구를 제공합니다.

---

## 🛠️ 제공 도구 및 검증 스크립트

### 1. 모바일 동기화 REST API 종합 검증 스크립트
서버의 `0.0.0.0` 바인딩, 로컬 IPv4 감지, 필수 REST API 엔드포인트(`GET /api/info`, `GET /api/records`, `POST /api/records`, `DELETE /api/records/:date`)의 동작을 자동 테스트합니다.
- **실행 명령**:
  ```bash
  node .agents/skills/local-wifi-mobile-sync/scripts/test_mobile_sync.js
  ```

### 2. 로컬 모바일 접속 IP & QR URL 확인기
현재 컴퓨터의 Wi-Fi 로컬 IP를 자동 감지하여 모바일 브라우저 직접 접속 URL을 터미널에 출력합니다.
- **실행 명령**:
  ```bash
  node .agents/skills/local-wifi-mobile-sync/scripts/get_mobile_qr.js
  ```

---

## 📚 표준 개발 패턴 및 가이드 문서

1. **[로컬 REST API & 스토리지 이중화 설계 가이드](./references/local-sync-patterns.md)**:
   - Node.js 내장 모듈 기반 `0.0.0.0` 바인딩 및 Wi-Fi IPv4 자동 감지
   - 로컬 영구 JSON 파일 스토리지(`data/records.json`) + `localStorage` 연동 듀얼 스토리지 패턴
   - 오프라인 단독 파일 실행(`file:///`) 환경 자동 감지 및 Fallback 처리
2. **[모바일 최적화 UI & UX 패턴](./references/mobile-ui-patterns.md)**:
   - 스마트폰 한 손 조작을 위한 하단 네비게이션 탭 바 (Bottom Navigation Bar)
   - 좁은 화면에 최적화된 날짜별 접이식 카드 뷰 (Mobile Card View)
   - 모바일 Safe Area(`env(safe-area-inset-bottom)`) 및 PWA 메타태그 설정

---

## 📋 표준 동기화 워크플로우

1. **서버 구동**:
   - `모바일_접속_서버_실행.bat` 실행 (Node.js 서버 구동 + 로컬 브라우저 자동 실행)
2. **모바일 접속**:
   - PC 상단의 `[📱 핸드폰 접속 QR]` 버튼 클릭 후 스마트폰 기본 카메라로 QR 스캔
3. **실시간 양방향 반영**:
   - 스마트폰에서 기록 저장 시 PC 데이터 파일(`data/records.json`) 즉시 갱신
   - PC에서 수정한 데이터도 스마트폰 새로고침/조회 시 즉각 반영
