---
name: medication-titration-analyzer
description: >-
  우현이의 약물 종류 변경(메디키넷 단독 -> 아빌리파이 병용 등)이나 용량 증감(Titration) 시점을 기준으로, 변경 전과 변경 후의 학습 집중도, 정서/리바운드, 식사량, 부작용을 정량 비교 분석하는 전문 스킬입니다.
---

# 💊 약물 용량 조정(Titration) 전후 효과 비교 분석 스킬 (Medication Titration Analyzer)

소아청소년 성장 발달 및 집중력 조절 약물은 소량에서 시작하여 서서히 적정 용량을 찾아가는 **용량 적정(Titration)** 과정을 거칩니다.
이 스킬은 처방이나 용량이 변경된 시점을 기준으로 **"약물 변경 전 vs 변경 후"** 아이의 관찰 지표가 실제로 개선되었는지, 혹은 새로운 부작용이 발생했는지를 객관적인 통계 데이터로 대조 분석합니다.

---

## 🛠️ 제공 도구 및 실행 명령

### 1. 약물 변경 전후 비교 분석기
약물이 변경된 기준 날짜(기본값: 데이터 내 첫 번째 처방 변경일 자동 감지 또는 지정일)를 기준으로 변경 전과 변경 후의 모든 지표를 대조합니다.

- **약물 처방 변경점 자동 감지 비교**:
  ```bash
  node .agents/skills/medication-titration-analyzer/scripts/compare_titration.js
  ```
- **특정 기준일 직접 지정 비교**:
  ```bash
  node .agents/skills/medication-titration-analyzer/scripts/compare_titration.js --change-date=2026-08-31
  ```
- **전후 기간 일수 지정 (예: 전후 7일씩 비교)**:
  ```bash
  node .agents/skills/medication-titration-analyzer/scripts/compare_titration.js --change-date=2026-08-31 --window=7
  ```

---

## 📊 주요 비교 대조 지표

1. **학습 집중도**: 평균 지속 몰입 시간(분), 푼 문제 수, 과제 거부율 변화
2. **정서 및 리바운드**: 저녁 리바운드 발생 비율(%), 전반적 긍정 감정(밝음/평온) 비율
3. **식사량**: 점심 식욕 저하(70% 이하) 발생 일수 및 비율
4. **수면 및 부작용**: 입면 지연 빈도 및 주요 틱/신체 증상 건수

---

## 📚 참조 문서
- [약물 적정(Titration) 지표 해석 가이드](./references/titration_metrics.md): 용량 증감 시 집중도와 부작용의 균형을 평가하는 임상적 가이드
