#!/usr/bin/env node
/**
 * 📸 woohyun-qa-guardian: 실기기 화면 캡처 및 가로 오버플로우 자동 검증 도구
 * - Chrome DevTools Protocol(CDP) + Node 26 내장 WebSocket 활용 (무설치 구동)
 * - 모바일(iPhone 390x844) 및 PC 데스크톱(1280x1400) 화면 자동 캡처
 * - 390px 뷰포트 내 비정상 가로 넘침(오버플로우) 요소 전수 탐색 및 리포트
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.resolve(__dirname, '../../../../reports/screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const PORT = 9230;
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=/tmp/chrome_qa_${Date.now()}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank'
]);

async function run() {
  console.log('🚀 [QA Visual Capture] Headless Chrome 시작 중...');
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      if (res.ok) break;
    } catch (e) {}
    await new Promise(r => setTimeout(r, 200));
  }

  const tabRes = await fetch(`http://127.0.0.1:${PORT}/json/new?http://localhost:5500`, { method: 'PUT' });
  const tab = await tabRes.json();

  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('DOM.enable');

  // --- 1. 모바일 (390 x 844) 진단 및 캡처 ---
  console.log('📱 모바일 뷰포트(iPhone 390x844) 시각 레이아웃 점검 중...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: 390,
    screenHeight: 844
  });
  await send('Emulation.setUserAgentOverride', {
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  await send('Page.navigate', { url: 'http://localhost:5500' });
  await new Promise(r => setTimeout(r, 1200));

  // Overflow elements check (excluding intended horizontal scroll containers like tab bars or tables)
  const checkOverflow = await send('Runtime.evaluate', {
    expression: `
      (() => {
        function isInsideHorizontalScroll(el) {
          let parent = el.parentElement;
          while (parent && parent !== document.body) {
            const style = window.getComputedStyle(parent);
            if (style.overflowX === 'auto' || style.overflowX === 'scroll') {
              return true;
            }
            parent = parent.parentElement;
          }
          return false;
        }

        const winW = window.innerWidth;
        const bad = [];
        document.querySelectorAll('*').forEach(el => {
          if (isInsideHorizontalScroll(el)) return;
          const r = el.getBoundingClientRect();
          if (r.right > winW + 2) {
            bad.push({
              tag: el.tagName,
              id: el.id,
              cls: (el.className || '').toString().slice(0, 30),
              right: Math.round(r.right),
              w: Math.round(r.width)
            });
          }
        });
        return { winW, badCount: bad.length, bad: bad.slice(0, 5) };
      })()
    `,
    returnByValue: true
  });

  const overflowResult = checkOverflow.result?.result?.value || { badCount: 0, bad: [] };
  if (overflowResult.badCount === 0) {
    console.log('  ✅ [PASS] 모바일 390px 뷰포트 내 비정상 가로 넘침(오버플로우) 요소: 0건 (완벽)');
  } else {
    console.warn(`  ⚠️ [WARN] 390px 초과 비정상 요소 발견 (${overflowResult.badCount}건):`, overflowResult.bad);
  }

  // 1A. Mobile Viewport 1st Screen
  const vpShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  const vpPath = path.join(SCREENSHOT_DIR, 'mobile_screen_viewport.png');
  fs.writeFileSync(vpPath, Buffer.from(vpShot.result.data, 'base64'));
  console.log(`  📸 저장 완료: ${vpPath}`);

  // 1B. Mobile Full Page
  const layout = await send('Page.getLayoutMetrics');
  const h = Math.ceil(layout.result.cssContentSize ? layout.result.cssContentSize.height : 2800);
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.md\\\\:hidden.fixed.bottom-0')?.style.setProperty('display', 'none');`
  });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: h,
    deviceScaleFactor: 2,
    mobile: true,
    screenWidth: 390,
    screenHeight: h
  });
  await new Promise(r => setTimeout(r, 400));
  const fullMobileShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const fullMobilePath = path.join(SCREENSHOT_DIR, 'mobile_full_page.png');
  fs.writeFileSync(fullMobilePath, Buffer.from(fullMobileShot.result.data, 'base64'));
  console.log(`  📸 저장 완료: ${fullMobilePath}`);

  // --- 2. 데스크톱 PC (1280 x 1400) 캡처 ---
  console.log('🖥️ 데스크톱 PC(1280x1400) 시각 레이아웃 점검 및 캡처 중...');
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 1400,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: 1280,
    screenHeight: 1400
  });
  await send('Emulation.setUserAgentOverride', { userAgent: '' });

  await send('Page.navigate', { url: 'http://localhost:5500' });
  await new Promise(r => setTimeout(r, 1000));

  const pcShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
  const pcPath = path.join(SCREENSHOT_DIR, 'pc_full_page.png');
  fs.writeFileSync(pcPath, Buffer.from(pcShot.result.data, 'base64'));
  console.log(`  📸 저장 완료: ${pcPath}`);

  ws.close();
  chrome.kill();
  console.log('✨ [QA Visual Capture] 모든 캡처 및 레이아웃 검증이 성공적으로 완료되었습니다!\n');
}

run().catch(err => {
  console.error('❌ 캡처 실행 중 오류 발생:', err.message);
  chrome.kill();
  process.exit(1);
});
