const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const htmlPath = path.join(__dirname, 'index.html').replace(/\\/g, '/');
const fileUrl = `file:///${htmlPath}`;

// Find Edge or Chrome path
let browserExe = 'msedge.exe';
const progFiles86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
const progFiles = process.env['ProgramFiles'] || 'C:\\Program Files';

const edge1 = path.join(progFiles86, 'Microsoft\\Edge\\Application\\msedge.exe');
const edge2 = path.join(progFiles, 'Microsoft\\Edge\\Application\\msedge.exe');
const chrome1 = path.join(progFiles, 'Google\\Chrome\\Application\\chrome.exe');
const chrome2 = path.join(progFiles86, 'Google\\Chrome\\Application\\chrome.exe');

if (fs.existsSync(edge1)) browserExe = edge1;
else if (fs.existsSync(edge2)) browserExe = edge2;
else if (fs.existsSync(chrome1)) browserExe = chrome1;
else if (fs.existsSync(chrome2)) browserExe = chrome2;

const psCode = `
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
if (-not (Test-Path $desktop)) {
    $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
$shortcutPath = Join-Path $desktop '우현이 일일 관찰 기록표.lnk'
$WshShell = New-Object -ComObject WScript.Shell
$s = $WshShell.CreateShortcut($shortcutPath)
$s.TargetPath = '${browserExe.replace(/\\/g, '\\\\')}'
$s.Arguments = '--app="${fileUrl}" --window-size=1280,860'
$s.WorkingDirectory = '${__dirname.replace(/\\/g, '\\\\')}'
$s.Description = '우현이 일일 관찰 기록표'
$s.IconLocation = '${browserExe.replace(/\\/g, '\\\\')},0'
$s.Save()
Write-Output "SUCCESS: Shortcut updated to launch directly without terminal window"
`;

try {
  const base64Code = Buffer.from(psCode, 'utf16le').toString('base64');
  const res = execSync(`powershell.exe -NoProfile -EncodedCommand ${base64Code}`).toString();
  console.log(res);
} catch (err) {
  console.error('Error updating shortcut:', err.message);
}
