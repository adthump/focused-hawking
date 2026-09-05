const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = 5500;
const BASE_DIR = __dirname;
const DATA_DIR = path.join(BASE_DIR, 'data');
const DATA_FILE = path.join(DATA_DIR, 'records.json');

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

// Helper to get local IPv4 addresses (Wi-Fi / Ethernet)
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      // IPv4 and non-internal (127.0.0.1)
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          interface: name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`
        });
      }
    }
  }
  return addresses;
}

// Helper to read data safely
function readRecords() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error('[Server] Failed to read records.json:', err);
    return [];
  }
}

// Helper to write data safely
function writeRecords(records) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Server] Failed to write records.json:', err);
    return false;
  }
}

// Helper to read request JSON body
function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      // Safeguard max body size (10MB)
      if (body.length > 1e7) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        const parsed = body ? JSON.parse(body) : {};
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Headers for seamless local network access
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = decodeURI(parsedUrl.pathname);

  // ==========================================
  // REST API Endpoints for PC-Mobile Sync
  // ==========================================

  // 1. GET /api/info - Network IP & Server status
  if (reqPath === '/api/info' && req.method === 'GET') {
    const localIps = getLocalIpAddresses();
    const primaryIp = localIps.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.')) || localIps[0] || { ip: '127.0.0.1', url: `http://localhost:${PORT}` };
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({
      status: 'ok',
      port: PORT,
      primaryIp: primaryIp.ip,
      mobileUrl: primaryIp.url,
      allIps: localIps,
      serverTime: new Date().toISOString()
    }));
    return;
  }

  // 2. GET /api/records - Get all records
  if (reqPath === '/api/records' && req.method === 'GET') {
    const records = readRecords();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ success: true, count: records.length, records: records }));
    return;
  }

  // 3. POST /api/records - Save/Upsert single record
  if (reqPath === '/api/records' && req.method === 'POST') {
    try {
      const record = await parseJsonBody(req);
      if (!record || !record.date) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '날짜(date) 필드는 필수입니다.' }));
        return;
      }

      const records = readRecords();
      const existingIdx = records.findIndex(r => r.date === record.date);
      if (existingIdx >= 0) {
        records[existingIdx] = { ...records[existingIdx], ...record, updatedAt: new Date().toISOString() };
      } else {
        records.push({ ...record, id: record.date, updatedAt: new Date().toISOString() });
      }

      // Sort by date ascending
      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      writeRecords(records);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: '저장 완료', record: record }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 4. DELETE /api/records/:date - Delete record by date
  if (reqPath.startsWith('/api/records/') && req.method === 'DELETE') {
    const dateVal = reqPath.replace('/api/records/', '').trim();
    if (!dateVal) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: '삭제할 날짜가 지정되지 않았습니다.' }));
      return;
    }

    let records = readRecords();
    const initialLen = records.length;
    records = records.filter(r => r.date !== dateVal);

    if (records.length < initialLen) {
      writeRecords(records);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, message: `[${dateVal}] 기록이 삭제되었습니다.` }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: '해당 날짜의 기록을 찾을 수 없습니다.' }));
    }
    return;
  }

  // 5. POST /api/records/import - Batch merge/import records
  if (reqPath === '/api/records/import' && req.method === 'POST') {
    try {
      const payload = await parseJsonBody(req);
      const incomingList = Array.isArray(payload) ? payload : (payload.records || []);

      if (!incomingList || incomingList.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: false, error: '가져올 데이터가 비어 있습니다.' }));
        return;
      }

      const records = readRecords();
      let importedCount = 0;

      incomingList.forEach(item => {
        if (!item.date) return;
        const idx = records.findIndex(r => r.date === item.date);
        if (idx >= 0) {
          records[idx] = { ...records[idx], ...item };
        } else {
          records.push(item);
        }
        importedCount++;
      });

      records.sort((a, b) => new Date(a.date) - new Date(b.date));
      writeRecords(records);

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: true, importedCount: importedCount, total: records.length }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // ==========================================
  // Static File Serving
  // ==========================================
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const filePath = path.join(BASE_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
});

// Bind to 0.0.0.0 for Local Wi-Fi Network Access
server.listen(PORT, '0.0.0.0', () => {
  const localIps = getLocalIpAddresses();
  const primary = localIps.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.')) || localIps[0] || { ip: '127.0.0.1', url: `http://localhost:${PORT}` };

  console.log('===============================================================');
  console.log('🌟 [우현이 일일 관찰 기록표] 모바일 Wi-Fi 동기화 서버 시작!');
  console.log('===============================================================');
  console.log(`💻 PC 로컬 접속 주소:  http://localhost:${PORT}`);
  console.log(`📱 스마트폰 접속 주소: ${primary.url}`);
  console.log('---------------------------------------------------------------');
  console.log('💡 [스마트폰 접속 방법]');
  console.log('1. 스마트폰을 PC와 같은 집 Wi-Fi에 연결합니다.');
  console.log(`2. 스마트폰 웹 브라우저(사파리, 크롬 등) 주소창에 ${primary.url} 입력!`);
  console.log('3. 또는 PC 화면 상단의 [📱 핸드폰 접속 QR] 버튼을 카메라로 스캔하세요.');
  console.log('===============================================================');
});

