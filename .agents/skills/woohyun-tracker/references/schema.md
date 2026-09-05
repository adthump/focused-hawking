# 📄 우현이 일일 관찰 데이터 표준 스키마

## JSON 레코드 구조

```json
{
  "id": "2026-09-02",
  "date": "2026-09-02",
  "dayOfWeek": "수요일",
  "medicines": [
    { "name": "메디키넷", "dosage": "10mg" },
    { "name": "아빌리파이", "dosage": "1mg" }
  ],
  "medTimePeriod": "오전",
  "medTimeHour": "08",
  "medTimeMinute": "30",
  "medMealTiming": "식후 30분",
  "medNote": "물과 함께 복용",
  "wakePeriod": "오전",
  "wakeHour": "07",
  "wakeMinute": "30",
  "sleepPeriod": "오후",
  "sleepHour": "10",
  "sleepMinute": "30",
  "sleepLatency": "15분 이내 (원활)",
  "sleepWaking": "없음 (숙면)",
  "mealBreakfast": "정상",
  "mealLunch": "정상",
  "mealDinner": "정상",
  "taskStartReaction": "스스로 시작",
  "mathProblemCount": 25,
  "mathTotalDuration": 30,
  "mathFocusDuration": 28,
  "distractionLevel": "적음",
  "mathObservationMemo": "28분간 최고 집중 유지",
  "overallMood": "밝음",
  "irritationFreq": "적음",
  "reboundEffect": "없음",
  "angerTrigger": "",
  "symptoms": ["입 마름"],
  "specialMemo": "오늘 컨디션 최고. 동생과도 잘 지냄.",
  "updatedAt": "2026-09-02T22:00:00.000Z"
}
```

## 엑셀 컬럼 매핑 테이블

| JSON 필드명 | 엑셀 컬럼명 (헤더) | 타입 | 기본값 |
| :--- | :--- | :--- | :--- |
| `date` | `날짜` | String (YYYY-MM-DD) | 필수 |
| `dayOfWeek` | `요일` | String | 자동 계산 |
| `medicines` | `투약_약물및용량` | String | `메디키넷(10mg)` |
| `medTime` | `투약_시간` | String | `오전 08:30` |
| `medMealTiming` | `투약_조건` | String | `식후 30분` |
| `medNote` | `투약_메모` | String | 빈 문자열 |
| `wakeTime` | `수면_기상시간` | String | `오전 07:30` |
| `sleepTime` | `수면_취침시간` | String | `오후 10:30` |
| `sleepLatency` | `수면_입면소요시간` | String | `15분 이내 (원활)` |
| `sleepWaking` | `수면_야간깸여부` | String | `없음 (숙면)` |
| `mealBreakfast` | `식사_아침` | Enum (정상/70%/거의안먹음) | `정상` |
| `mealLunch` | `식사_점심` | Enum (정상/70%/거의안먹음) | `정상` |
| `mealDinner` | `식사_저녁` | Enum (정상/70%/거의안먹음) | `정상` |
| `taskStartReaction` | `오후4시테스트_과제반응` | Enum | `스스로 시작` |
| `mathProblemCount` | `오후4시테스트_푼문제수` | Number | 0 |
| `mathTotalDuration` | `오후4시테스트_소요시간(분)` | Number | 0 |
| `mathFocusDuration` | `오후4시테스트_지속집중시간(분)` | Number | 0 |
| `distractionLevel` | `오후4시테스트_주의분산` | Enum | `적음` |
| `mathObservationMemo` | `오후4시테스트_메모` | String | 빈 문자열 |
| `overallMood` | `감정_전반적기분` | Enum | `평온` |
| `irritationFreq` | `감정_짜증빈도` | Enum | `적음` |
| `angerTrigger` | `감정_분노유발상황` | String | 빈 문자열 |
| `reboundEffect` | `저녁약효_리바운드` | Enum | `없음` |
| `symptoms` | `신체증상` | String (콤마 구분) | 빈 문자열 |
| `specialMemo` | `특이사항및종합메모` | String | 빈 문자열 |
