# 📱 스마트폰 최적화 UI & UX 반응형 설계 패턴

이 문서는 PC 중심의 복잡한 관찰 양식을 스마트폰 화면에서도 한 손으로 편안하게 조작하고 열람할 수 있도록 설계된 모바일 최적화 패턴을 설명합니다.

---

## 1. 하단 고정 네비게이션 바 (Bottom Navigation Bar)
- 스마트폰 엄지손가락 영역에 맞춘 3대 탭(`일일기록`, `변화분석`, `기록목록`) 고정 배치
- PC 뷰에서는 상단 헤더 탭을 노출하고 모바일 하단 탭은 자동 숨김 처리
- Tailwind 클래스 예시: `fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden`

---

## 2. 모바일 전용 접이식 카드 뷰 (Mobile Card View)
- 데스크톱의 넓은 데이터 테이블은 모바일 화면에서 가로 스크롤로 인해 가독성이 떨어집니다.
- 날짜별 주요 지표(약물, 집중 시간, 기분, 리바운드)를 핵심 배지 형태로 요약한 카드 뷰 제공
- 데스크톱에서는 테이블 활성화(`hidden md:block`), 모바일에서는 카드 뷰 활성화(`block md:hidden`)

---

## 3. PWA 메타태그 및 Safe Area 대응
- 최신 iOS/안드로이드 스마트폰의 하단 홈 제스처 바와 겹치지 않도록 여백 확보:
  ```css
  padding-bottom: env(safe-area-inset-bottom);
  ```
- 웹앱 전체화면 및 주소창 숨김 지원:
  ```html
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="theme-color" content="#2563eb" />
  ```
