/**
 * ?? Wi-Fi ??? ??? REST API ?? ?? ????
 */
const http = require('http');
const os = require('os');

const PORT = 5500;
let passes = 0;
let fails = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`  ? [PASS] ${name}`);
    passes++;
  } else {
    console.error(`  ? [FAIL] ${name}`);
    fails++;
  }
}

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(typeof data === 'string' ? data : JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('?? [?? Wi-Fi ??? ???] ?? ? API ?? ??');
  console.log('====================================================\n');

  try {
    // 1. GET /api/info
    console.log('?? 1. ?? ?? ? ?? Wi-Fi IP ?? ???:');
    const info = await request({ hostname: '127.0.0.1', port: PORT, path: '/api/info', method: 'GET' });
    assert(info.status === 200, 'GET /api/info ?? ?? 200 ??');
    assert(info.body.primaryIp !== undefined, `?? IP ?? ?? ??: ${info.body.primaryIp}`);
    assert(info.body.mobileUrl !== undefined, `???? ?? URL ??: ${info.body.mobileUrl}`);

    // 2. GET /api/records
    console.log('\n?? 2. ?? ?? ?? API ???:');
    const listRes = await request({ hostname: '127.0.0.1', port: PORT, path: '/api/records', method: 'GET' });
    assert(listRes.status === 200, 'GET /api/records ?? ?? 200 ??');
    assert(Array.isArray(listRes.body.records), `?? ?? ?? ?? (? ${listRes.body.count || 0}?)`);

    // 3. POST /api/records (?? ??? ??)
    console.log('\n?? 3. ??? ?? ? ??? ??? ???:');
    const testDate = '2099-12-31';
    const testRecord = {
      date: testDate,
      dayOfWeek: '???',
      medicines: [{ name: '????', dosage: '10mg' }],
      mathFocusDuration: 30,
      overallMood: '??',
      reboundEffect: '??'
    };
    const postRes = await request({
      hostname: '127.0.0.1',
      port: PORT,
      path: '/api/records',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, testRecord);
    assert(postRes.status === 200 && postRes.body.success, 'POST /api/records ?? ?? ??');

    // 4. DELETE /api/records/:date (??? ??? ??)
    console.log('\n??? 4. ??? ?? ???:');
    const delRes = await request({ hostname: '127.0.0.1', port: PORT, path: `/api/records/${testDate}`, method: 'DELETE' });
    assert(delRes.status === 200 && delRes.body.success, 'DELETE /api/records/:date ?? ?? ??');

    console.log('\n====================================================');
    console.log(`?? ??? ??? ?? ??: ?? ${passes}? / ?? ${fails}?`);
    console.log('====================================================');
    process.exit(fails > 0 ? 1 : 0);
  } catch (err) {
    console.error('\n? ??? ?? ??? ??? ??? ??????:', err.message);
    console.log('?? "node server.js" ?? "???_??_??_??.bat"? ??? ? ?? ?????.');
    process.exit(1);
  }
}

runTests();
