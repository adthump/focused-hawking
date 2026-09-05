---
name: standalone-app-packaging
description: >-
  서버/DB 없이 동작하는 단일 파일 웹 애플리케이션(SPA) 구축, LocalStorage 및 SheetJS 엑셀 연동, Chart.js 시각화,
  그리고 Windows 환경에서 한글 깨짐 및 터미널 창 없이 0초 만에 실행되는 브라우저 App Mode 바로가기 패키징을 수행할 때 사용하는 전문 스킬입니다.
---

# 🚀 단일 웹앱 개발 & 무음 데스크톱 패키징 스킬 (Standalone App Packaging)

이 스킬은 무설치 독립형 웹 애플리케이션 개발과 Windows 환경에서의 완벽한 데스크톱 앱 패키징을 실패 없이 한번에 성공시키기 위한 검증된 모범 사례와 자동화 도구를 제공합니다.

---

## 🛠️ 핵심 도구 및 스크립트

### 1. 범용 무음 App Mode 바로가기 생성기
터미널(CMD) 창이나 VBScript 인코딩 문제 없이, 브라우저를 독립 앱 창(`--app`)으로 실행하는 바로가기를 바탕화면에 자동 생성합니다.
- **실행 방법**:
  ```bash
  node .agents/skills/standalone-app-packaging/scripts/create_app_shortcut.js [HTML경로] [바로가기이름]
  ```
- **예시**:
  ```bash
  node .agents/skills/standalone-app-packaging/scripts/create_app_shortcut.js ./index.html "우현이 일일 관찰 기록표"
  ```

---

## 📚 검증된 성공 패턴 및 참조 문서

1. **[Windows 인코딩 & 바로가기 실패 방지 가이드](./references/windows-encoding-and-shortcuts.md)**:
   - VBScript `"종결되지 않은 문자열 상수"` 방지
   - 배치 파일(`cmd.exe`) UTF-8 한글 파싱 에러 방지
   - `D:\Desktop` 및 `OneDrive` 바탕화면 경로 동적 감지 공식
   - Base64 PowerShell WScript 호출 패턴
2. **[단일 파일 웹앱 아키텍처 가이드](./references/single-file-webapp-patterns.md)**:
   - Tailwind CSS + SheetJS + Chart.js + LocalStorage 통합 설계
   - 브라우저 내 엑셀(.xlsx) 원클릭 양방향 직렬화 패턴
   - 다중 항목 동적 추가 및 날짜별 자동 폼 바인딩 패턴

---

## 📋 표준 개발 및 배포 워크플로우

1. **단일 HTML 웹앱 작성**:
   - `index.html` 내부에 모든 UI/JS 로직을 완결형으로 구성 (외부 서버 의존성 배제).
2. **엑셀 & 로컬스토리지 연동**:
   - SheetJS(`XLSX.writeFile`)로 한글 헤더 엑셀 다운로드/업로드 구현.
3. **데스크톱 앱 패키징**:
   - `create_app_shortcut.js`를 실행하여 사용자의 바탕화면에 직접 브라우저 App Mode 바로가기 생성.
   - 배치 파일 사용 시 한글 메시지를 배제하거나 인코딩 오류가 없는 단순 커맨드로 작성.
