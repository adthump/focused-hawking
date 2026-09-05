/**
 * Antigravity Lifecycle Hook Handler for Woohyun Tracker System
 */
const fs = require('fs');
const path = require('path');

let inputData = '';

process.stdin.on('data', chunk => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const payload = inputData ? JSON.parse(inputData) : {};
    
    // Check if we need to return specific responses based on hook event
    const response = {};
    
    // If it is PreInvocation, we can inject a friendly reminder
    if (payload.invocationNum !== undefined) {
      response.injectSteps = [
        {
          ephemeralMessage: "[Woohyun Tracker System] 약물 용량 및 다중 선택, 집중도 측정 지표가 스키마 규칙을 준수하는지 확인하세요."
        }
      ];
    }

    console.log(JSON.stringify(response));
  } catch (e) {
    console.log(JSON.stringify({}));
  }
});
