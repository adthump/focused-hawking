/**
 * 로컬 Wi-Fi IPv4 주소 감지 및 모바일 브라우저 접속 URL 출력 스크립트
 */
const os = require('os');
const PORT = 5500;

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push({
          name: name,
          ip: net.address,
          url: `http://${net.address}:${PORT}`
        });
      }
    }
  }
  return addresses;
}

const ips = getLocalIpAddresses();
const primary = ips.find(i => i.ip.startsWith('192.168.') || i.ip.startsWith('10.')) || ips[0] || { ip: '127.0.0.1', url: `http://localhost:${PORT}` };

console.log('====================================================');
console.log('📱 [로컬 Wi-Fi 모바일 접속 안내]');
console.log('====================================================');
console.log(`💻 로컬 PC 주소:     http://localhost:${PORT}`);
console.log(`📱 스마트폰 접속 주소: ${primary.url}`);
console.log('----------------------------------------------------');
console.log('💡 스마트폰 접속 팁:');
console.log('1. 스마트폰과 PC를 동일한 집 Wi-Fi에 연결합니다.');
console.log(`2. 스마트폰 브라우저 주소창에 ${primary.url} 을 입력하거나`);
console.log('3. PC 화면 상단의 [📱 핸드폰 접속 QR] 버튼을 카메라로 스캔하세요.');
console.log('====================================================');
