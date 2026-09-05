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

---

## 4. 초소형 모바일 뷰포트 (iPhone 390px) 오버플로우 및 겹침 방지 패턴

스마트폰 뷰포트가 390px 이하인 환경에서 가로 스크롤이나 컴포넌트 겹침(Overlap)이 발생하지 않도록 다음 4대 패턴을 엄격히 적용합니다:

1. **가로 스크롤 원천 차단 (`overflow-x-hidden`)**:
   - `body` 및 `main` 컨테이너에 `overflow-x-hidden`을 선언하여 의도치 않은 자식 요소의 확장으로 인한 레이아웃 깨짐을 방지합니다.
2. **복합 인풋 행의 반응형 2단 분할 (약물 행 패턴)**:
   - 데스크톱에서는 `[약물 셀렉트] [용량] [삭제]`를 1행으로 표시하지만, 390px 모바일 화면에서는:
     - 1행: `[약물 셀렉트] + [삭제 아이콘]`
     - 2행: `[-] [용량 인풋] [+]`
     - 로 자연스럽게 감싸지도록 flex-wrap을 구성합니다.
3. **타임피커 컴팩트 너비 보장**:
   - 기상/취침 시간 선택 인풋(시, 분)은 데스크톱 너비 그대로 유지할 경우 2개 컬럼이 겹치므로, `w-8 sm:w-10 px-0.5`로 모바일 전용 컴팩트 너비를 적용합니다.
4. **한글 줄바꿈 어절 단위 보존 (`word-break: keep-all;`)**:
   - 모바일 좁은 화면에서 `"리바운 / 드"`, `"피크 / 지표"`처럼 단어 음절이 분절되어 가독성을 해치지 않도록 `word-break: keep-all;`을 전역 적용합니다.
5. **하단 고정 탭 바와 본문 여백 (`pb-24`)**:
   - 화면 하단에 고정된 플로팅 네비게이션 바로 인해 마지막 저장 버튼이나 메모 영역이 가려지지 않도록 본문 하단에 충분한 패딩(`pb-24 md:pb-12`)을 부여합니다.

