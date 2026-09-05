# 🪟 Windows 환경 한글 인코딩 및 바로가기 생성 실패 방지 가이드

Windows 환경에서 스크립트 실행기 및 바로가기를 생성할 때 빈번하게 발생하는 실패 원인과 100% 성공 보장 패턴을 정리합니다.

---

## 🚫 흔한 3대 실패 원인 및 증상

### 1. VBScript 한글 인코딩 깨짐 (컴파일 에러)
- **증상**: `.vbs` 파일 더블클릭 시 `"종결되지 않은 문자열 상수입니다." (Unterminated string constant)` 에러 발생.
- **원인**: Windows의 `wscript.exe`는 ANSI(CP949)를 기본으로 읽으므로, UTF-8(BOM 없음)로 저장된 파일 내의 한글 바이트가 따옴표(`"`)를 깨뜨림.

### 2. 배치 파일(`.bat`) 한글 파싱 오류
- **증상**: 배치 파일 실행 시 `"'?깃났?곸쑝濡?...'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는 배치 파일이 아닙니다."` 에러 발생.
- **원인**: `cmd.exe`가 UTF-8로 작성된 한글 `echo`나 주석을 잘못 파싱하여 명령어로 실행 시도함.

### 3. 바탕화면 경로 하드코딩 (`DirectoryNotFoundException`)
- **증상**: `C:\Users\username\Desktop` 경로를 찾을 수 없음.
- **원인**: 한국어 윈도우, D 드라이브 사용자(예: `D:\Desktop`), 또는 OneDrive 동기화 사용자(`C:\Users\username\OneDrive\바탕 화면`)의 경우 하드코딩된 경로는 반드시 실패함.

---

## ✅ 100% 성공 보장 패턴 (Golden Rules)

### 1. 브라우저 App Mode 직접 바로가기 생성 (터미널 창 완전 제거)
배치 파일(`.bat`)이나 VBScript를 거치지 않고, 브라우저(Edge/Chrome)의 `--app` 모드를 바로가기의 직접 대상으로 지정합니다.

- **장점**:
  - 검은색 터미널 창(CMD)이 아예 뜨지 않음 (0초 즉시 로딩).
  - 브라우저 주소창/탭바가 제거된 깔끔한 전용 윈도우 데스크톱 프로그램 창으로 실행.
  - 인코딩 오류가 발생할 여지가 원천 차단됨.

### 2. SpecialFolder 동적 감지
PowerShell의 `[System.Environment+SpecialFolder]::Desktop`을 사용하여 사용자의 실제 바탕화면 경로를 런타임에 동적으로 획득합니다.

```powershell
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
if (-not (Test-Path $desktop)) {
    $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
```

### 3. Base64 EncodedCommand 기법 (Node.js -> PowerShell)
스크립트 내 한글이나 특수문자가 쉘 인자 전달 과정에서 깨지지 않도록 PowerShell 코드를 `utf16le` -> `base64`로 변환하여 실행합니다.

```javascript
const psCode = `
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$WshShell = New-Object -ComObject WScript.Shell
$s = $WshShell.CreateShortcut(Join-Path $desktop "앱이름.lnk")
$s.TargetPath = "msedge.exe"
$s.Arguments = '--app="file:///${htmlPath}" --window-size=1280,860'
$s.Save()
`;

const base64Code = Buffer.from(psCode, 'utf16le').toString('base64');
execSync(`powershell.exe -NoProfile -EncodedCommand ${base64Code}`);
```
