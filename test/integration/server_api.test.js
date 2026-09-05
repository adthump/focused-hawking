/**
 * 📡 SWIT (Software Integration Test - 소프트웨어 통합 시험) 스위트
 * 로컬 Wi-Fi 동기화 REST API 서버 및 정적 서빙 실동작(Live HTTP) 검증
 */
const http = require('http');
const path = require('path');
const fs = require('fs');
const assert = require('assert');

const TEST_PORT = 5599;
const TEST_DATA_DIR = path.join(__dirname, '../../data');
const TEST_DATA_FILE = path.join(TEST_DATA_DIR, 'test_records_temp.json');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function httpRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = body ? JSON.parse(body) : {};
        } catch (e) {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsed
        });
      });
    });
    req.on('error', reject);
    if (data) {
      const payload = typeof data === 'string' ? data : JSON.stringify(data);
      req.setHeader('Content-Type', 'application/json');
      req.setHeader('Content-Length', Buffer.byteLength(payload));
      req.write(payload);
    }
    req.end();
  });
}

async function test(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     └─ 오류: ${err.message}`);
    failedTests++;
    failures.push({ name, error: err.message });
  }
}

async function runIntegrationTests() {
  console.log('======================================================================');
  console.log('📡 [SWIT] 로컬 Wi-Fi REST API 서버 및 웹 서빙 통합 시험 (Integration Tests)');
  console.log('======================================================================\n');

  // Initialize isolated test data store
  fs.writeFileSync(TEST_DATA_FILE, '[]', 'utf-8');
  process.env.PORT = String(TEST_PORT);
  process.env.DATA_FILE = TEST_DATA_FILE;

  const { startServer, server } = require('../../server.js');
  await startServer(TEST_PORT);

  try {
    console.log('🌐 1. 정적 웹 에셋 및 CORS 헤더 검증');

    await test('TC-IT-01: 루트 경로(GET /) 호출 시 index.html 정상 서빙 (HTTP 200)', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/',
        method: 'GET'
      });
      assert.strictEqual(res.statusCode, 200);
      assert(res.headers['content-type'].includes('text/html'));
      assert(typeof res.body === 'string' && res.body.includes('우현이'));
    });

    await test('TC-IT-02: 존재하지 않는 파일 요청 시 404 반환', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/non_existent_page_12345.html',
        method: 'GET'
      });
      assert.strictEqual(res.statusCode, 404);
    });

    await test('TC-IT-03: CORS 프리플라이트(OPTIONS /api/records) 응답 및 헤더 검증 (HTTP 204)', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'OPTIONS'
      });
      assert.strictEqual(res.statusCode, 204);
      assert.strictEqual(res.headers['access-control-allow-origin'], '*');
      assert(res.headers['access-control-allow-methods'].includes('GET'));
    });

    console.log('\n📱 2. REST API 엔드포인트 및 CRUD 사이클 검증');

    await test('TC-IT-04: 서버 상태 및 로컬 IP 조회 (GET /api/info -> HTTP 200)', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/info',
        method: 'GET'
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.status, 'ok');
      assert.strictEqual(res.body.port, TEST_PORT);
      assert(Boolean(res.body.primaryIp), 'primaryIp 필드 존재');
      assert(res.body.mobileUrl.includes(String(TEST_PORT)), 'mobileUrl에 포트 포함');
    });

    await test('TC-IT-05: 초기 기록 목록 조회 시 빈 배열 반환 (GET /api/records -> HTTP 200)', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'GET'
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.count, 0);
      assert(Array.isArray(res.body.records));
    });

    await test('TC-IT-06: 날짜 누락 비정상 데이터 저장 요청 시 400 Bad Request 거부', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'POST'
      }, {
        overallMood: '평온'
        // date 누락
      });
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
      assert(res.body.error.includes('날짜'));
    });

    await test('TC-IT-07: 신규 관찰 기록 등록 (POST /api/records -> HTTP 200)', async () => {
      const testRecord = {
        date: '2026-09-05',
        dayOfWeek: '토요일',
        medicines: [{ name: '메디키넷', dosage: '10mg' }],
        mathFocusDuration: 25,
        mathProblemCount: 20,
        overallMood: '평온',
        reboundEffect: '없음',
        mealLunch: '정상'
      };

      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'POST'
      }, testRecord);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);

      // Verify via GET
      const getRes = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'GET'
      });
      assert.strictEqual(getRes.statusCode, 200);
      assert.strictEqual(getRes.body.count, 1);
      assert.strictEqual(getRes.body.records[0].date, '2026-09-05');
      assert.strictEqual(getRes.body.records[0].mathFocusDuration, 25);
    });

    await test('TC-IT-08: 기존 날짜 기록 수정(Upsert) 검증', async () => {
      const updateRecord = {
        date: '2026-09-05',
        mathFocusDuration: 30,
        overallMood: '밝음'
      };

      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'POST'
      }, updateRecord);

      assert.strictEqual(res.statusCode, 200);

      const getRes = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'GET'
      });
      assert.strictEqual(getRes.body.count, 1, '동일 날짜는 행 추가가 아닌 업데이트여야 함');
      assert.strictEqual(getRes.body.records[0].mathFocusDuration, 30);
      assert.strictEqual(getRes.body.records[0].overallMood, '밝음');
    });

    await test('TC-IT-09: 일괄 가져오기 (POST /api/records/import -> HTTP 200)', async () => {
      const batchRecords = [
        { date: '2026-09-06', medicines: [{ name: '메디키넷', dosage: '10mg' }], mathFocusDuration: 22 },
        { date: '2026-09-07', medicines: [{ name: '메디키넷', dosage: '10mg' }], mathFocusDuration: 28 }
      ];

      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records/import',
        method: 'POST'
      }, batchRecords);

      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);

      const getRes = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'GET'
      });
      assert.strictEqual(getRes.body.count, 3, '기존 1건 + 신규 2건 = 총 3건');
    });

    await test('TC-IT-10: 특정 날짜 기록 삭제 (DELETE /api/records/:date -> HTTP 200)', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records/2026-09-05',
        method: 'DELETE'
      });
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);

      // Verify deletion
      const getRes = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records',
        method: 'GET'
      });
      assert.strictEqual(getRes.body.count, 2);
      assert(!getRes.body.records.some(r => r.date === '2026-09-05'));
    });

    await test('TC-IT-11: 존재하지 않는 날짜 삭제 요청 시 404 Not Found 반환', async () => {
      const res = await httpRequest({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/api/records/2099-01-01',
        method: 'DELETE'
      });
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.body.success, false);
    });

  } finally {
    // Teardown
    await new Promise((resolve) => server.close(resolve));
    if (fs.existsSync(TEST_DATA_FILE)) {
      fs.unlinkSync(TEST_DATA_FILE);
    }
  }

  console.log('\n======================================================================');
  console.log(`🏁 SWIT 검증 결과: 총 ${totalTests}개 통합 시험 중 [성공: ${passedTests}건 / 실패: ${failedTests}건]`);
  console.log('======================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runIntegrationTests();
}

module.exports = { runIntegrationTests };
