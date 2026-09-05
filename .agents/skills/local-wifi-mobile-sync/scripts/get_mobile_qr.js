/**
 * ?? PC? Wi-Fi IP ?? ? ???? ?? ?? ?? ??
 */
const os = require('os');

const PORT = 5500;
const interfaces = os.networkInterfaces();
const addresses = [];

for (const name of Object.keys(interfaces)) {
  for (const net of interfaces[name]) {
    if (net.family === 'IPv4' && !net.internal) {
      addresses.push({ interface: name, ip: net.address, url: `http://${net.address}:${PORT}` });
    }
  }
}

const primary = addresses.find(a => a.ip.startsWith('192.168.') || a.ip.startsWith('10.')) || addresses[0] || { ip: '127.0.0.1', url: `http://localhost:${PORT}` };

console.log('===============================================================');
console.log('?? [???? Wi-Fi ?? ??]');
console.log('===============================================================');
console.log(`  ?? ???? ?? URL: ${primary.url}`);
console.log(`  ?? PC ?? ?? URL:  http://localhost:${PORT}`);
console.log('---------------------------------------------------------------');
console.log('  1. ???? ???? ?? ? Wi-Fi? ?????.');
console.log(`  2. ??? ? ???? ???? ${primary.url} ??!`);
console.log('  3. ?? PC ?? ??? [?? ??? ?? QR] ??? ???? ?????.');
console.log('===============================================================');
