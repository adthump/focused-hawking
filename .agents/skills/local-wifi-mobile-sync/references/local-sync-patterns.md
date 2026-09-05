# 🌐 로컬 REST API & 스토리지 이중화 설계 패턴

이 문서는 외부 인터넷 연결이나 클라우드 데이터베이스 없이, 가정이나 진료실의 로컬 Wi-Fi 네트워크에서 PC와 스마트폰 간에 데이터를 100% 안전하게 실시간 동기화하기 위한 아키텍처 패턴을 설명합니다.

---

## 1. 0.0.0.0 바인딩 및 로컬 IPv4 자동 감지

Node.js의 기본 `localhost`(`127.0.0.1`) 바인딩은 동일 컴퓨터 내부에서만 접근 가능합니다.
스마트폰에서 접속할 수 있도록 `0.0.0.0`으로 바인딩하고, 로컬 Wi-Fi 사설 IP(`192.168.x.x` 또는 `10.x.x.x`)를 동적으로 추출합니다.

```javascript
const os = require('os');
const http = require('http');
const PORT = 5500;

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address; // 192.168.x.x
      }
    }
  }
  return '127.0.0.1';
}

// 0.0.0.0으로 바인딩하여 동일 네트워크 장치 접근 허용
server.listen(PORT, '0.0.0.0', () => {
  console.log(`모바일 접속 주소: http://${getLocalIp()}:${PORT}`);
});
```

---

## 2. 서버 파일 스토리지 + 브라우저 LocalStorage 이중화 패턴

1. **데이터 로드 시**:
   - `/api/records` 요청 -> 서버 데이터 수신 후 즉시 브라우저 `localStorage`에 미러링 캐싱
   - 서버 오프라인 또는 파일 직접 열기(`file:///`) 환경 시 -> `localStorage`에서 즉시 데이터 로드
2. **데이터 저장/삭제 시**:
   - `localStorage`에 즉시 반영 (0초 응답)
   - 서버가 온라인 상태이면 백그라운드로 `POST /api/records` 또는 `DELETE /api/records/:date`를 호출하여 영구 파일(`data/records.json`) 동기화
3. **이점**:
   - 오프라인 상태나 단독 HTML 실행에서도 100% 정상 작동 (SPA 독립성 보장)
   - 모바일 Wi-Fi 연결 시 PC와 완벽한 양방향 실시간 동기화 지원
