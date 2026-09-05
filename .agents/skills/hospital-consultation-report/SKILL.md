---
name: hospital-consultation-report
description: >-
  우현이의 관찰 데이터를 기반으로 소아청소년정신과/발달클리닉 정기 진료 시 전문의에게 제출 및 브리핑할 수 있는 핵심 5대 지표 맞춤형 상담 리포트(Markdown 및 인쇄용 뷰)를 자동 생성하는 전문 스킬입니다.
---

# 🏥 소아정신과 전문의 진료 브리핑 리포트 생성 스킬 (Hospital Consultation Report)

이 스킬은 누적된 일일 관찰 기록에서 최근 진료 주기(최근 1~4주) 데이터를 집계하여, 짧은 진료 시간(5~10분) 동안 의사가 가장 필요로 하는 **약물 순응도, 오후 4시 집중도, 저녁 리바운드 강도, 신체 부작용, 식사/수면 패턴**을 한눈에 파악할 수 있는 진료 맞춤형 브리핑 문서를 자동 생성합니다.

---

## 🛠️ 제공 도구 및 실행 명령

### 1. 진료 브리핑 리포트 자동 생성기
지정한 기간(기본: 최근 14일)의 데이터를 분석하여 `reports/` 폴더에 마크다운 리포트를 자동 저장하고 터미널에 요약 브리핑을 출력합니다.

- **최근 14일 기준 생성 (기본값)**:
  ```bash
  node .agents/skills/hospital-consultation-report/scripts/generate_doctor_report.js
  ```
- **최근 30일(1개월) 기준 생성**:
  ```bash
  node .agents/skills/hospital-consultation-report/scripts/generate_doctor_report.js --days=30
  ```
- **특정 날짜 범위 지정 생성**:
  ```bash
  node .agents/skills/hospital-consultation-report/scripts/generate_doctor_report.js --start=2026-08-20 --end=2026-09-05
  ```

---

## 📋 의사 상담 리포트 5대 핵심 지표

1. **💊 처방 약물 및 복용 순응도**: 복용 일관성(%), 현재 유지 용량(메디키넷/아빌리파이/콘서타), 투약 시간대 준수율
2. **🎯 오후 4시 집중도 성취율**: 수학 문제 풀이 시 평균 몰입 시간(분), 푼 문제 수, 과제 시작 거부율
3. **⚡ 저녁 약효 소진 시 리바운드**: 저녁 시간대 짜증/분노 빈도, 리바운드 발생 비율(%), 주요 촉발 요인
4. **⚠️ 신체 이상 증상 및 부작용**: 눈 깜빡임(틱), 두통, 복통 등 발생 일수 및 점심 식욕 부진 추이
5. **❓ 전문의 상담 체크포인트**: 보호자가 이번 진료에서 상의할 핵심 질문 자동 추천

---

## 📚 참조 문서
- [전문의 진료 상담 가이드](./references/consultation_guide.md): 소아청소년정신과 진료 시 의사와 효율적으로 소통하는 방법 및 질문 프레임워크
