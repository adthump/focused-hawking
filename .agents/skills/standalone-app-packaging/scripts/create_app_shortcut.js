/**
 * 범용 윈도우 무음 App Mode 바로가기 생성 유틸리티
 * 
 * Usage:
 *   node create_app_shortcut.js [HTML_FILE_PATH] [SHORTCUT_NAME] [ICON_INDEX]
 * 
 * Example:
 *   node create_app_shortcut.js ./index.html "우현이 일일 관찰 기록표"
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const targetHtml = process.argv[2] || './index.html';
const shortcutName = process.argv[3] || '내 웹 애플리케이션';

const fullHtmlPath = path.resolve(process.cwd(), targetHtml).replace(/\\/g, '/');
if (!fs.existsSync(fullHtmlPath)) {
  console.error(`❌ 오류: 대상 HTML 파일이 존재하지 않습니다: ${fullHtmlPath}`);
  process.exit(1);
}

const fileUrl = `file:///${fullHtmlPath}`;

// 브라우저 경로 자동 탐색 (Edge 또는 Chrome)
let browserExe = 'msedge.exe';
const progFiles86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';

const candidates = [
  path.join(progFiles86, 'Microsoft\\Edge\\Application\\msedge.exe'),
  path.join(progFiles, 'Microsoft\\Edge\\Application\\msedge.exe'),
  path.join(progFiles, 'Google\\Chrome\\Application\\chrome.exe'),
  path.join(progFiles86, 'Google\\Chrome\\Application\\chrome.exe')
];

for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    browserExe = cand;
    break;
  }
}

const psScript = `
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
if (-not (Test-Path $desktop)) {
    $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
$shortcutPath = Join-Path $desktop '${shortcutName}.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$s = $WshShell.CreateShortcut($shortcutPath)
$s.TargetPath = '${browserExe.replace(/\\/g, '\\\\')}'
$s.Arguments = '--app="${fileUrl}" --window-size=1280,860'
$s.WorkingDirectory = '${path.dirname(fullHtmlPath).replace(/\\/g, '\\\\')}'
$s.Description = '${shortcutName}'
$s.IconLocation = '${browserExe.replace(/\\/g, '\\\\')},0'
$s.Save()
Write-Output "SUCCESS: $shortcutPath"
`;

try {
  const base64Code = Buffer.from(psScript, 'utf16le').toString('base64');
  const out = execSync(`powershell.exe -NoProfile -EncodedCommand ${base64Code}`).toString().trim();
  console.log('✅ 바로가기 생성 성공:', out);
} catch (e) {
  console.error('❌ 바로가기 생성 실패:', e.message);
  process.exit(1);
}
